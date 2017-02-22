'use strict';
var dateFormat = require('dateformat');
var csvParser = require('csv-parse');

var importCsv = function importCsv(file, connection, callback){
    
    var errorMsg = [];
    var statusMsg = [];
    var importStart = Date();
    var importStop;

    //setMsg(statusMsg,'');

    console.log("[IMPORT] Starting import of file " + file + " at: " + importStart);
    //statusMsg.push('[' + getTime(importStart) + '] Starting import of file ' + file);
    setMsg(statusMsg, 'Starting import of file ' + file);
    
    var importFile  = file + "_" +dateFormat(importStart, 'yyyymmdd_HHMMss');
    console.log('[IMPORT] Processing file ' + file + ' at ' + importStart);
    


    //** Move file to processing folder.
    setMsg(statusMsg, 'Moving and renaming ' + file + ' to: ' + config.processDir + importFile);    
    fs.rename(config.uploadDir + file, config.processDir + importFile, function(err){
        if(err){
            errorMsg.push('ERROR: Failed to move file to processing folder.'); 
            return callback(errorMsg,statusMsg);
        }else{
            //** Read CSV file
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
        }
    }); //rename processing    
}

function setMsg(msgArr, msgStr){
    return msgArr.push('[' + dateFormat(new Date(), 'yyyy/mm/dd HH:MM:ss:l').toString() + '] ' + msgStr);
}

module.exports = importCsv;

