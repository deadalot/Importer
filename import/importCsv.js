'use strict';
var dateFormat = require('dateformat');
var Converter = require("csvtojson").Converter;
var async = require("async");

var importCsv = function importCsv(file, connection, callback){
    
    var errorMsg = [];
    var statusMsg = [];
    var importStart = Date();    

    console.log("[IMPORT] Starting import of file " + file + " at: " + dateFormat(importStart, 'yyyymmdd_HHMMss'));    
    logMsg(statusMsg, 'INFO', 'Starting import of file ' + file);
    
    var importFile  = file + "_" + dateFormat(importStart, 'yyyymmdd_HHMMss');

    var csvConverter=new Converter({});
    
    csvConverter.on('error', function(err){
        console.log('[IMPORT] Error parsing CSV file');
    });

    csvConverter.on('end_parsed', function(data){     
        var id;
        var date;
        var description;
        var amount;           
        var errorCount = 0;
        var rowCount = 0;

        var post  = {
            Filename: importFile, 
            TotalNumberOfRows:data.length, 
            StartDate: dateFormat(importStart, 'yyyy-mm-dd HH:MM:ss')
        };
        var query = connection.query('INSERT INTO File SET ?', post, function(err, result) {
            if(err){
                console.log('[IMPORT] ERROR inserting file: ' + err);
            }
        });

        //for (var i = 0; i < data.length; i++) {     
        
        async.forEach(data, function(row, callback){
            rowCount++;             
            
            if((Object.keys(row).length) != 4){
               console.log('[IMPORT] Error on row ' + rowCount);
               logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': Incorrect number of fields');
               errorCount++;
               return callback();    
            }

            id = row.ID;            
            var parts = row.Date.split('/');            
            date = new Date('20'+parts[0], parts[1]-1, parts[2]);            
            description = row.Description;
            amount = row.Amount;

            if(!id || isNaN(Number(id))){
                console.log('[IMPORT] Error in ID on row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': ID field is empty or not a number');
                errorCount++;
               return callback();
            }            
            if(!date || !isValidDate(date)){
                console.log('[IMPORT] Error in date on row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': date field is empty or not a date');
                errorCount++;
                return callback();
            }
            if(!description || 0 === description.length){
                console.log('[IMPORT] Error in descriptionid on row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': description field is empty');
                errorCount++;
                return callback();
            }
            if(!amount ||isNaN(Number(amount))){
                console.log('[IMPORT] Error in amounton row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': amount field is empty or not a number');
                errorCount++;
                return callback();
            }

            insertTransactionDetails(id, date,  description, amount, rowCount, function(err){
                if(err){
                    logMsg(errorMsg, 'ERROR', err);
                    errorCount++;
                }
                callback();
            });


        }, function(err){
            connection.query('UPDATE File SET EndDate=?, RowsWithErrors=? WHERE Filename = ?', [dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),errorCount, importFile], function (err, result) {
                if (err) {
                    console.log('[IMPORT] ERROR updating file table: ' + err);
                }else{
                    // Move file to history folder.                                
                    logMsg(statusMsg, 'INFO', 'Moving ' + importFile + ' to: ' + config.historyDir);    
                    fs.rename(config.processDir + importFile, config.historyDir + importFile, function(err){
                        if(err){
                            errorMsg.push('ERROR: Failed to move file to history folder.'); 
                            return callback(errorMsg,statusMsg);
                        }else{                            
                            logMsg(statusMsg, 'INFO', (errorMsg.length > 0) ? 'Import finished with the following error(s): ' : "Import finished without exceptions");
                            console.log('[IMPORT] Import done for file ' + importFile); 
                            return callback(errorMsg, statusMsg);
                        }
                    });
                }
            });
        });   
    });

    //** Move file to processing folder and start csv parse
    logMsg(statusMsg, 'INFO', 'Moving and renaming ' + file + ' to: ' + config.processDir + importFile);    
    fs.rename(config.uploadDir + file, config.processDir + importFile, function(err){
        if(err){
            errorMsg.push('ERROR: Failed to move file to processing folder.'); 
            return callback(errorMsg,statusMsg);
        }else{            
            var fileStream = fs.createReadStream(config.processDir + importFile).pipe(csvConverter);
        }
    }); 

//the end


    function insertTransactionDetails(id, date,  description, amount, rowCount, callback){
        var description;
        var post  = {Description: description};
        var query = connection.query('INSERT INTO TransactionDescription SET ?', post, function(err, result) {
            if(err){
                if(err.code === 'ER_DUP_ENTRY'){
                    //Description already exists. Use that one. 
                    console.log('[IMPORT] WARNING: Duplicate description ' + JSON.stringify(err));
                    var sql = 'SELECT TransactionDescriptionPK FROM TransactionDescription WHERE description = ?';
                    connection.query(sql, [description], function (err, results, fields) {                        
                        insertTransaction(id, date,  description, amount, results[0].TransactionDescriptionPK, rowCount,function(err){
                            if(err) {
                                return callback('Row ' + rowCount + ': ' + err);
                            }else{
                                callback(null);
                            }
                        });
                    });
                }else{
                    //Something wrong happened
                    callback(err);
                }
            }else{
                console.log('[IMPORT] Added description ' + JSON.stringify(result));
                insertTransaction(id, date,  description, amount, result.insertId, rowCount, function (err){
                    if(err){
                        return callback('Row ' + rowCount + ': ' + err);
                    }else{
                        return callback(null);
                    }
                });          
            }
        });
    }

    function insertTransaction(id, date,  description, amount, descriptionID, rowCount, callback){
        console.log('[IMPORT] INSERT: ' + id + ' , ' + date + ' , ' + description + ' , ' + amount + ' , ' + descriptionID );
        //logMsg(statusMsg, 'INFO',  'Inserting row: ' + rowCount + ' [' + id + ' , ' + dateFormat(date, 'yyyy-mm-dd') + ' , ' + description + ' , ' + amount + ' , ' + descriptionID + ']');
        var post  = {
            TransactionID: id, 
            TransactionDate: date,
            Amount:amount,
            CreationDate: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            TransactionDescriptionPK:descriptionID,
            FilePK:importFile
        };

        var query = connection.query('INSERT INTO Transaction SET ?', post, function(err, result) {
            if(err){
                console.log('[IMPORT] ERROR inserting transaction ' + err);                                              
                return callback(err);
            }else{
                console.log('[IMPORT] Added transaction!!');
                return callback(null);
            }
        });
    }


}




function isValidDate(value) {
    var dateWrapper = new Date(value);
    return !isNaN(dateWrapper.getDate());
}

function logMsg(msgArr, mode, msgStr){
    if(mode === 'ERROR' ){ 
        return msgArr.push(msgStr);
    }else{
        return msgArr.push('[' + dateFormat(new Date(), 'yyyy/mm/dd HH:MM:ss:l').toString() + '] ' + msgStr);
    }
}

module.exports = importCsv;