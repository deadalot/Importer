module.exports = function(express, app, config, junk,connection,csvParser){
    var router = express.Router();
    var dateFormat = require('dateformat');

    // *** index.html
    router.get('/', function(req, res, next){
        res.render('index', {});
    })


    // *** List files and upload
    router.get('/filelist', function(req, res, next){        
        var files_ = fs.readdirSync(config.uploadDir);
        //var files_ = ['test1.txt', 'test2.cvs'];
        //console.log();             
        res.render('filelist', {files:files_.filter(junk.not)});
    })


    // *** List transactions
    router.get('/transactionlist', function(req, res, next){
        res.render('transactionlist', {});
    })

    // *** Upload files
    router.post('/upload', function(req, res, next){
        if (!req.files.uppFile) {
            var files_ = fs.readdirSync(config.uploadDir);
            res.render('filelist', {fileError:'No file selected', files:files_});            
            return;
        }
        var file = req.files.uppFile;
        file.mv(config.uploadDir + file.name, function(err) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.redirect('/filelist');
            }
        })
        
    })
    
    // *** Import csv
    router.get('/import', function(req, res, next){

        var importDate;
        var newFileName;
        var files_ = fs.readdirSync(config.uploadDir);
        files_ = files_.filter(junk.not);
        
        files_.forEach(function(file){
            importDate = new Date();
            newFileName = file + "_" +dateFormat(importDate, 'yyyymmdd_HHMMss');
            console.log('[IMPORT] Processing file ' + file + ' at ' + importDate);
            
            //** Move file to processing folder.
            fs.rename(config.uploadDir + file, config.processDir + newFileName, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log('[IMPORT] File ' + newFileName + ' renamed and moved to Processing');
                }
            });

            //** Read CSV file
            fs.readFile(config.processDir + newFileName, {
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
                        //saveFile(connection, newFileName, 0, 0);
                        var post  = {Filename: newFileName, TotalNumberOfRows: 0, RowsWithErrors:0};
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
        
            console.log('Import of file ' + newFileName + ' is complete');
            

            //** Move file to history folder.
            fs.rename(config.processDir + newFileName, config.historyDir + newFileName, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log('[IMPORT] File ' + newFileName + ' moved to History. Import Done');
                }
            });
            
        });
    
//TODO for each file
 /*
    var fileName = 'test1.csv';
    fs.readFile(__dirname + '/..' + config.importFolder + config.uploadFolder + '/' + fileName, {
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
            console.log(data);

            

            }
        });
    });
*/
        //Spara i DB
        /*
        var post  = {Filename: "testfile1.txt", TotalNumberOfRows: 10, RowsWithErrors:5};
        var query = connection.query('INSERT INTO file SET ?', post, function(err, result) {
            if(err){
                res.send(err);
            }else{
                res.send("import complete");
            }
        });
*/
        //flytta filer till history
    })

   app.use('/', router);
}



function saveFile(connection, fileName, nrRows, nrError){
    

}

function saveTransaction(){

}

function saveTransactionDescription(){

}