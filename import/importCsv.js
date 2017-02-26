'use strict';
var dateFormat = require('dateformat');
var csvParser = require('csv-parse');
var Converter = require("csvtojson").Converter;
var async = require("async");

var importCsv = function importCsv(file, connection, callback){
    
    
    
    var errorMsg = [];
    var statusMsg = [];
    var importStart = Date();
    var importStop;

    console.log("[IMPORT] Starting import of file " + file + " at: " + importStart);    
    setMsg(statusMsg, 'Starting import of file ' + file);
    
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

        var post  = {Filename: importFile};
        var query = connection.query('INSERT INTO File SET ?', post, function(err, result) {
            //TODO kolla att file inte finns innan insert
        });

        for (var i = 0; i < data.length; i++) {          
            console.log('Checking row: ' + i);
            
            id = data[i].ID;
            date = data[i].Date;
            description = data[i].Description;
            amount = data[i].Amount;

            if(!id || isNaN(Number(id))){
                console.log('Error in ID on row ' + i);
                continue;
            }            
            if(!date || !isValidDate(date)){
                console.log('Error in date on row ' + i);
                continue;
            }
            if(!description){
                console.log('Error in descriptionid on row ' + i);
                continue;
            }
            if(!amount ||isNaN(Number(id))){
                console.log('Error in amounton row ' + i);
                continue;
            }

            console.log('Insert TransactionDescription: ' + description);
            
            

            insertTransactionDetails(id, date,  description, amount);

        }//for

        //** Move file to history folder.                                
        setMsg(statusMsg, 'Moving ' + importFile + ' to: ' + config.historyDir);    
        fs.rename(config.processDir + importFile, config.historyDir + importFile, function(err){
            if(err){
                errorMsg.push('ERROR: Failed to move file to history folder.'); 
                return callback(errorMsg,statusMsg);
            }else{
                //all is well                                            
                setMsg(statusMsg, (errorMsg.length > 0) ? 'Import finished with the following error(s): ' : "Import finished without exceptions");
                console.log('[IMPORT] Import DONE of file ' + importFile); 
                //console.log('[IMPORT] message: ' + JSON.stringify(statusMsg));    
                return callback(errorMsg, statusMsg);
            }
        });//rename history  

    });
    csvConverter.on('error', function(err){
        console.log('***************CVS IS ERRROR');
    });


    //** Move file to processing folder and start csv parse
    setMsg(statusMsg, 'Moving and renaming ' + file + ' to: ' + config.processDir + importFile);    
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


    function insertTransactionDetails(id, date,  description, amount){
        var description;
        var post  = {
            Description: description, 
            CreationDate: '2015-11-11'
        };
        var query = connection.query('INSERT INTO TransactionDescription SET ?', post, function(err, result) {
            if(err){
                
                console.log('[IMPORT] Duplicate description! ' + JSON.stringify(err) + ' RESULT: ' +  JSON.stringify(result));
                var sql = 'SELECT TransactionDescriptionPK FROM TransactionDescription WHERE description = ?';
                connection.query(sql, [description], function (error, results, fields) {
                    console.log('[IMPORT] Duplicate description ' + description + ' result: ' + results[0].TransactionDescriptionPK);
                    insertTransaction(id, date,  description, amount, results[0].TransactionDescriptionPK);
                });

                
                //errorMsg.push('WARN Duplicate Description');
                //return callback(errorMsg,statusMsg);
            }else{
                console.log('[IMPORT] Added description ' + JSON.stringify(result));
                insertTransaction(id, date,  description, amount, result.insertId);          

            }
        });
    }

    function insertTransaction(id, date,  description, amount, descriptionID){
        console.log('INSERT: ' + id + ' , ' + date + ' , ' + description + ' , ' + amount + ' , ' + descriptionID );
        setMsg(statusMsg, 'Inserting: ' + id + ' , ' + date + ' , ' + description + ' , ' + amount + ' , ' + descriptionID );
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
                errorMsg.push('Error transaction1!');
                //return callback(errorMsg,statusMsg);
            }else{
                console.log('[IMPORT] Added transaction!!');
            }
        });
    }


}




function isValidDate(value) {
    var dateWrapper = new Date(value);
    return !isNaN(dateWrapper.getDate());
}

function setMsg(msgArr, msgStr){
    return msgArr.push('[' + dateFormat(new Date(), 'yyyy/mm/dd HH:MM:ss:l').toString() + '] ' + msgStr);
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
                                    setMsg(statusMsg, 'Moving ' + importFile + ' to: ' + config.historyDir);    
                                    fs.rename(config.processDir + importFile, config.historyDir + importFile, function(err){
                                        if(err){
                                            errorMsg.push('ERROR: Failed to move file to history folder.'); 
                                            return callback(errorMsg,statusMsg);
                                        }else{
                                            //all is well                                            
                                            setMsg(statusMsg, (errorMsg.length > 0) ? 'Import finished with the following error(s): ' : "Import finished without exceptions");
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