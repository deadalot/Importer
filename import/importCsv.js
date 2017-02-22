'use strict';
var dateFormat = require('dateformat');
var csvParser = require('csv-parse');

var importCsv = function importCsv(file, callback){
    
    var errorMsg = ['Something went wrong during import.'];
    var statusMsg = [];
    var importStart = Date();
    var importStop;

    console.log("[IMPORT] Starting import of file " + file + " at: " + importStart);


    //statusMsg = statusMsg.concat('[IMPORT] Starting import of file ' + file + ' at: ' + importStart);
    //errorMsg = errorMsg.concat('Error on row 3: Sometying');
    //callback(errorMsg, statusMsg);
    
    var importFile  = file + "_" +dateFormat(importStart, 'yyyymmdd_HHMMss');
    console.log('[IMPORT] Processing file ' + file + ' at ' + importStart);
    
    //** Move file to processing folder.
    try{
        fs.renameSync(config.uploadDir + file, config.processDir + importFile);
    } catch (err){           
            errorMsg.push('Error moving file to processing folder.'); 
            callback(errorMsg,null);       
    }
    

    //** Read CSV file
    fs.readFileSync(config.processDir + importFile, {
        encoding: 'utf-8'
        }, function(err, csvData) {
        if (err) {
            console.log(err);
        }

        csvParser(csvData, {
                delimiter: ','
            }, function(err, data) {
                if (err) {
                console.log(err);
            } else {
                //Verify data    
                console.log(data);
                //saveFile(connection, importFile, 0, 0);
                var post  = {Filename: importFile, TotalNumberOfRows: 0, RowsWithErrors:0};
                var query = connection.query('INSERT INTO File SET ?', post, function(err, result) {
                    if(err){
                        res.send(err);
                    }else{
                        res.send("[DB] File: Update complete");
                    }
                });
                //Save to DB
            }
        });
    });

    console.log('Import of file ' + importFile + ' is complete');
    

    //** Move file to history folder.
    try{
        fs.renameSync(config.processDir + importFile, config.historyDir + importFile);
    } catch (err){           
        errorMsg.push('Could not move file to history folder.'); 
        callback(errorMsg,null);       
    }
   
    
    
    








}

module.exports = importCsv;