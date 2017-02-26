'use strict';
var dateFormat = require('dateformat');
var Converter = require("csvtojson").Converter;
var async = require("async");

var importCsv = function importCsv(file, connection, callback){
    
    
    
    var errorMsg = [];
    var statusMsg = [];
    var importStart = Date();    

    console.log("[IMPORT] Starting import of file " + file + " at: " + importStart);    
    logMsg(statusMsg, 'INFO', 'Starting import of file ' + file);
    
    var importFile  = file + "_" +dateFormat(importStart, 'yyyymmdd_HHMMss');
    console.log('[IMPORT] Processing file ' + file + ' at ' + importStart);
        

    // ********
    // Events
    // ********
    var csvConverter=new Converter({});
    
    csvConverter.on('end_parsed', function(data){
        console.log('***************CVS IS IMPORTED');
        
        var id;
        var date;
        var description;
        var amount;           
        var errorCount = 0;
        var rowCount = 0;

        var post  = {Filename: importFile, TotalNumberOfRows:data.length, StartDate: dateFormat(importStart, 'yyyy-mm-dd HH:MM:ss')};
        var query = connection.query('INSERT INTO File SET ?', post, function(err, result) {
            if(err){
                console.log('INSERT FILE ERROR: ' + err);
            }
        });

        //for (var i = 0; i < data.length; i++) {     
        
        async.forEach(data, function(row, callback){
            rowCount++; 
            console.log('Checking row: ' + rowCount);
            
            id = row.ID;
            //date = row.Date;
            var parts = row.Date.split('/');            
            date = new Date('20'+parts[0], parts[1]-1, parts[2]);            
            description = row.Description;
            amount = row.Amount;

            if(!id || isNaN(Number(id))){
                console.log('Error in ID on row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': ID field is empty or not a number');
                errorCount++;
               return callback();
            }            
            if(!date || !isValidDate(date)){
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': date field is empty or not a date');
                errorCount++;
                console.log('Error in date on row ' + rowCount);
                return callback();
            }
            if(!description){
                console.log('Error in descriptionid on row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': description field is empty');
                errorCount++;
                return callback();
            }
            if(!amount ||isNaN(Number(amount))){
                console.log('Error in amounton row ' + rowCount);
                logMsg(errorMsg, 'ERROR', 'Row ' + rowCount + ': amount field is empty or not a number');
                errorCount++;
                return callback();
            }

            console.log('Insert TransactionDescription: ' + description);
            insertTransactionDetails(id, date,  description, amount, rowCount, function(err){
                console.log('Row ' + rowCount + ' received callback.');
                if(err){
                    logMsg(errorMsg, 'ERROR', err);
                    errorCount++;
                }
                callback();
            });


        }, function(err){
            console.log('all tasks done. continue');

            connection.query('UPDATE File SET EndDate=?, RowsWithErrors=? WHERE Filename = ?', [dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),errorCount, importFile], function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    //** Move file to history folder.                                
                    logMsg(statusMsg, 'INFO', 'Moving ' + importFile + ' to: ' + config.historyDir);    
                    fs.rename(config.processDir + importFile, config.historyDir + importFile, function(err){
                        if(err){
                            errorMsg.push('ERROR: Failed to move file to history folder.'); 
                            return callback(errorMsg,statusMsg);
                        }else{
                            //all is well                                            
                            logMsg(statusMsg, 'INFO', (errorMsg.length > 0) ? 'Import finished with the following error(s): ' : "Import finished without exceptions");
                            console.log('[IMPORT] Import DONE of file ' + importFile); 
                            //console.log('[IMPORT] message: ' + JSON.stringify(statusMsg));    
                            return callback(errorMsg, statusMsg);
                        }
                    });//rename history  
                }
            });

           
        });   
            

        //}//for

        

    });
    csvConverter.on('error', function(err){
        console.log('***************CVS IS ERRROR');
    });


    //** Move file to processing folder and start csv parse
    logMsg(statusMsg, 'INFO', 'Moving and renaming ' + file + ' to: ' + config.processDir + importFile);    
    fs.rename(config.uploadDir + file, config.processDir + importFile, function(err){
        if(err){
            errorMsg.push('ERROR: Failed to move file to processing folder.'); 
            return callback(errorMsg,statusMsg);
        }else{
            console.log('*********** CONVERTING CSV')
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

                
                //errorMsg.push('WARN Duplicate Description');
                //return callback(errorMsg,statusMsg);
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
        console.log('INSERT: ' + id + ' , ' + date + ' , ' + description + ' , ' + amount + ' , ' + descriptionID );
        logMsg(statusMsg, 'INFO',  'Inserting row: ' + rowCount + ' [' + id + ' , ' + dateFormat(date, 'yyyy-mm-dd') + ' , ' + description + ' , ' + amount + ' , ' + descriptionID + ']');
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












 //** Read CSV file
            /*
            fs.readFile(config.processDir + importFile, {encoding: 'utf-8'}, function(err, csvData){
                if(err){
                    console.log('[IMPORT] Error reading CSV' + err);
                    errorMsg.push('ERROR: Reading file.'); 
                    return callback(errorMsg,statusMsg);   
                }else{
                    csvParser(csvData, {delimiter: ','}, function(err, data) {  
                        console.log('************* INNE I PARSER');
                        if (err) {
                            errorMsg.push('ERROR: parsing CSV: ' + err);
                            errorMsg.push('File not imported');
                            console.log('[IMPORT] Error parsing CSV' + err);
                            return callback(errorMsg,statusMsg);   
                        } else {
                            console.log('[IMPORT] CSV data: ' + JSON.stringify(data));                           
                            
                            var post  = {Filename: importFile};
                            var query = connection.query('INSERT INTO File SET ?', post, function(err, result) {
                                if(err){
                                    console.log('[IMPORT] Error querry: ' + err);
                                    errorMsg.push('ERROR File already imported');
                                    return callback(errorMsg,statusMsg);
                                }else{
                                    console.log('[IMPORT] Querry OK: ' + JSON.stringify(result));
                                    var id;
                                    var date;
                                    var description;
                                    var amount;                                    
                                    var nrErrors = [];

                                    for(var i = 1; i < data.length; i++){
                                        
                                        id = data[i][0];
                                        date = data[i][1];
                                        description = data[i][2];
                                        amount = data[i][3];

                                        //VERIFY

                                        var post  = {
                                            Description: description, 
                                            CreationDate: '2015-11-11'
                                        };
                                        var query = connection.query('INSERT INTO TransactionDescription SET ?', post, function(err, result) {
                                            if(err){
                                                console.log('[IMPORT] Duplicate description! ' + err);
                                                errorMsg.push('WARN Duplicate Description');
                                                //return callback(errorMsg,statusMsg);
                                            }else{
                                                console.log('[IMPORT] Added description');
                                            }
                                        });
                                        
                                        var query = connection.query('SELECT  TransactionDescriptionPK FROM TransactionDescription WHERE Description = ?', [description], function(err, result) {
                                            if(err){
                                            }else{
                                              console.log('TransactionDescriptionID = ' + results[0].TransactionDescriptionPK );
                                                var post  = {
                                                TransactionID: id, 
                                                TransactionDate: date,
                                                Amount:amount,
                                                CreationDate: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
                                                TransactionDescriptionPK:results[0].TransactionDescriptionPK,
                                                FilePK:importFile
                                            };

                                            var query = connection.query('INSERT INTO Transaction SET ?', post, function(err, result) {
                                                if(err){
                                                    console.log('[IMPORT] ERROR inserting transaction ' + err);
                                                    errorMsg.push('Error transaction1!');
                                                    //return callback(errorMsg,statusMsg);
                                                }else{
                                                    console.log('[IMPORT] Added description');
                                                }
                                            });
                                        }

                                        });

                                    }//for every row



                                    //** Move file to history folder.                                
                                    logMsg(statusMsg, 'Moving ' + importFile + ' to: ' + config.historyDir);    
                                    fs.rename(config.processDir + importFile, config.historyDir + importFile, function(err){
                                        if(err){
                                            errorMsg.push('ERROR: Failed to move file to history folder.'); 
                                            return callback(errorMsg,statusMsg);
                                        }else{
                                            //all is well                                            
                                            logMsg(statusMsg, (errorMsg.length > 0) ? 'Import finished with the following error(s): ' : "Import finished without exceptions");
                                            console.log('[IMPORT] Import DONE of file ' + importFile); 
                                            //console.log('[IMPORT] message: ' + JSON.stringify(statusMsg));    
                                            return callback(errorMsg, statusMsg);
                                        }
                                    });//rename history                           
                                }
                            });//querry   
                        }
                    });//cvsParser
                }
            });//readFile  
            */ 