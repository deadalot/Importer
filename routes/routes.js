module.exports = function(express, app, config, junk,connection,csvParser){
    var router = express.Router();
    var dateFormat = require('dateformat');
    var importCsv = require('../import/importCsv.js');

    // *** index.html
    router.get('/', function(req, res, next){
        res.render('index', {});
    })


    // *** List files and upload
    router.get('/filelist', function(req, res){
        var context = app.locals.context; 
        console.log('[ROUTER] context: ' + JSON.stringify(context));       
        if(!context){
            console.log('CONTEXT EMPTY');
            context = {files:listDirectory(config.uploadDir)};
        }
        app.locals.context = null;
        res.render('filelist', context);
    });



    // *** Upload files
    router.post('/upload', function(req, res){
        console.log('[ROUTER] Uploading file');
        if (!req.files.uppFile) {
            console.log('[ROUTER] ...File not found');            
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
    
    // *** Import csv
    router.get('/import', function(req, res, next){
        
        var errorMsg = [];
        var statusMsg = [];

        var files_ = listDirectory(config.uploadDir);        
        if(files_.length > 0){
            files_.forEach(function(file){                        
                importCsv(file, function(err, status){
                    console.log('[ROUTES] callback')
                    if(err){
                        console.log('[ROUTES] Error during import');                        
                        errorMsg.push(err);                        
                        //app.locals.context =  {error: errorMsg, files:listDirectory(config.uploadDir)};       
                        //res.redirect(303, '/filelist');
                        

                    }if(status){
                        console.log('[ROUTES] Import success');
                        statusMsg = statusMsg.concat(status);                        
                    }
                });            
            });

            
        }else{     
            console.log("found no files to import " + Object.prototype.toString.call(files_));       
            app.locals.context =  {error: ['There are no files to import'], files:listDirectory(config.uploadDir)};       
            res.redirect(303, '/filelist');    
            return;            
        }
        
        
        app.locals.context =  {error: errorMsg, status:statusMsg, files:listDirectory(config.uploadDir)};   
        res.redirect(303, '/filelist');      
    })



    
    // *** List transactions
    router.get('/transactionlist', function(req, res, next){
        res.render('transactionlist', {});
    })


   app.use('/', router);
}

function listDirectory(path){
    var files_ = fs.readdirSync(path);
    files_.filter(junk.not);
    return files_;
}