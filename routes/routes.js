module.exports = function(express, app, config, junk,connection,csvParser){
    var router = express.Router();
    var dateFormat = require('dateformat');

    var importCsv = require('../import/importCsv.js');

    // *** index.html
    router.get('/', function(req, res, next){
        res.render('index', {});
    })


    function fileListCtrl(req, res){
        
    }
    // *** List files and upload
    router.get('/filelist', function(req, res, next){        
        res.render('filelist', {files:listDirectory(config.uploadDir)});
    })


    // *** List transactions
    router.get('/transactionlist', function(req, res, next){
        res.render('transactionlist', {});
    })

    // *** Upload files
    router.post('/upload', function(req, res, next){
        console.log('upload start');
        if (!req.files.uppFile) {
            console.log('file not found');
            
            res.render('filelist', {error:'No file selected', files:listDirectory(config.uploadDir)});            
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
        
        //om filer finns
        var files_ = listDirectory(config.uploadDir);        
        if(files_.length > 0){
            files_.forEach(function(file){                        
                importCsv(file, function(err){
                    console.log('[ROUTES] callback')
                    if(err){
                        console.log('[ROUTES] Error during import');
                        res.render('filelist', {error:"There was a problem with import", files:listDirectory(config.uploadDir)});                                    
                    }else{
                        console.log('[ROUTES] Import success');
                        res.render('filelist', {status:"Import OK", files:listDirectory(config.uploadDir)});            
                    }
                });
            //annars 
                //returnera med error om fil saknas
            });
        }else{     
            console.log("found no files to import " + Object.prototype.toString.call(files_));       
            res.render('filelist', {error:"There are no files to import", files:listDirectory(config.uploadDir)});
        }
    })

   app.use('/', router);
}

function listDirectory(path){
    var files_ = fs.readdirSync(path);
    files_.filter(junk.not);
    return files_;
}