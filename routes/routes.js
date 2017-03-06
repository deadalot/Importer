module.exports = function(express, app, config, junk,connection){
    var router = express.Router();
    var dateFormat = require('dateformat');
    var importCsv = require('../import/importCsv.js');
    var async = require("async");

    router.get('/', function(req, res, next){
        //res.render('index', {});
        res.redirect(303, '/filelist');
    });


    router.get('/filelist', function(req, res){
        var context = app.locals.context; 
        if(!context){            
            context = {files:listDirectory(config.uploadDir)};
        }
        app.locals.context = null;
        res.render('filelist', context);
    });


    router.post('/upload', function(req, res){
        if (!req.files.uppFile) {          
            app.locals.context =  {error: ['No file selected'], files:listDirectory(config.uploadDir)};                                  
            res.redirect(303, '/filelist');
            return;      
        }
        var file = req.files.uppFile;
        file.mv(config.uploadDir + file.name, function(err) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                app.locals.context = {status: ['File ' + file.name + ' uploaded'], files:listDirectory(config.uploadDir)};
                res.redirect(303, '/filelist');      
            }
        })      
    });
    
   
    router.get('/import', function(req, res, next){
        
        var errorMsg = [];
        var statusMsg = [];
        var files_ = listDirectory(config.uploadDir);        
        
        if(files_.length > 0){
            async.forEach(files_, function(file, callback){
                console.log('[ROUTES] Import file ' + file);                   
                importCsv(file, connection, function(err, status){                    
                    errorMsg = errorMsg.concat(err);
                    statusMsg = statusMsg.concat(status);
                    statusMsg = statusMsg.concat([' ']);;
                    callback();    
                });                    
                
            }, function(err){                
                app.locals.context =  {error: errorMsg, status:statusMsg, files:listDirectory(config.uploadDir)};       
                res.redirect(303, '/filelist');          
            });
            
        }else{
            app.locals.context =  {error: ['There are no files to import'], files:listDirectory(config.uploadDir)};       
            res.redirect(303, '/filelist');                
        }        
    });


    router.get('/transactionlist', function(req, res, next){
        var sql =   'SELECT t.TransactionID, DATE_FORMAT(t.TransactionDate, "%Y-%m-%d") as TransactionDate, t.Amount, td.Description, DATE_FORMAT(f.StartDate, "%Y-%m-%d %H:%i:%s") as StartDate, DATE_FORMAT(f.EndDate, "%Y-%m-%d %H:%i:%s") as EndDate, f.Filename ' +
                    'FROM File f, TransactionDescription td, Transaction t ' +
                    'WHERE t.TransactionDescriptionPK = td.TransactionDescriptionPK ' +
                    'AND t.FilePK = f.Filename ORDER BY t.TransactionID';
        connection.query(sql, function (err, result, fields) {    
            if(err){
                console.log('[ROUTES] Error selectiong transactions: ' + err);
            }else{                
                res.render('transactionlist', {transactions: result});        
            }
        });        
    });


   app.use('/', router);
}

function listDirectory(path){
    var files_ = fs.readdirSync(path);
    files_.filter(junk.not); //filter junk like .DS_Store
    return files_;
}