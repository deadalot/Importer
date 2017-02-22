'use strict';
var dateFormat = require('dateformat');
var csvParser = require('csv-parse');

var importCsv = function importCsv(file, callback){
    
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
    try{
        setMsg(statusMsg, 'Moving and renaming ' + file + ' to: ' + config.processDir + importFile);    
        fs.renameSync(config.uploadDir + file, config.processDir + importFile);     
    } catch (err){
            errorMsg.push('ERROR: Failed to move file to processing folder.'); 
            return callback(errorMsg,statusMsg);             
    }
    

    //** Read CSV file
    var csvData;
    try{        
        csvData = fs.readFile(config.processDir + importFile, {encoding: 'utf-8'});
    } catch (err){        
        console.log('[IMPORT] Error reading CSV' + err);
        errorMsg.push('ERROR: Reading file.'); 
        return callback(errorMsg,statusMsg);   
    }

    csvParser(csvData, {delimiter: ','}, function(err, data) {
        console.log('************* INNE I PARSER');
        if (err) {
            errorMsg.push('ERROR: parsing CSV: ' + err);
            errorMsg.push('File not imported');
            console.log('[IMPORT] Error parsing CSV' + err);
        } else {
            console.log('[IMPORT] CSV data: ' + data);
            
            var post  = {Filename: importFile, TotalNumberOfRows: 0, RowsWithErrors:0};
            var query = connection.query('INSERT INTO File SET ?', post, function(err, result) {
                if(err){
                    console.log('[IMPORT] Error querry: ' + data);
                }else{
                    console.log('[IMPORT] Querry OK: ' + data);
                }
            });//end of querry cb
            
        }
    });//end of cvsParser cb

    

    //** Move file to history folder.
    try{
        setMsg(statusMsg, 'Moving ' + importFile + ' to: ' + config.historyDir);    
        fs.renameSync(config.processDir + importFile, config.historyDir + importFile);   
    } catch (err){
            errorMsg.push('ERROR: Failed to move file to history folder.'); 
            return callback(errorMsg,statusMsg);
                
    } 
       
    
    //all is well
    console.log('[IMPORT] Import DONE of file ' + importFile);    
    setMsg(statusMsg, (errorMsg.length > 0) ? 'Import finished with the following error(s): ' : "Import finished without exceptions");
    callback(errorMsg, statusMsg);
   


}

function getTime(start){
    return dateFormat(start - new Date(), 'yyyymmdd HH:MM:ss:l').toString();
}

function setMsg(msgArr, msgStr){
    return msgArr.push('[' + dateFormat(new Date(), 'yyyy/mm/dd HH:MM:ss:l').toString() + '] ' + msgStr);
}

module.exports = importCsv;

