module.exports = function(express, app, config, junk,connection){
    var router = express.Router();

    // index.html
    router.get('/', function(req, res, next){
        res.render('index', {});
    })

    // List files and upload
    router.get('/filelist', function(req, res, next){
        
        var files_ = fs.readdirSync(__dirname + '/..' + config.importFolder + config.uploadFolder);
       //var files_ = ['test1.txt', 'test2.cvs'];
        console.log();
        
        
        res.render('filelist', {files:files_.filter(junk.not)});
    })

     // List transactions
    router.get('/transactionlist', function(req, res, next){
        res.render('transactionlist', {});
    })

    router.post('/upload', function(req, res, next){
        if (!req.files.uppFile) {
            var files_ = fs.readdirSync(__dirname + '/..' + config.importFolder + config.uploadFolder);
            res.render('filelist', {fileError:'No file selected', files:files_});
            
            return;
        }
        var file = req.files.uppFile;
        file.mv(__dirname + '/..' + config.importFolder + config.uploadFolder + '/' + file.name, function(err) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.redirect('/filelist');
            }
        })
        
    })
    
    router.get('/import', function(req, res, next){

        //flytta filer till processing

        //Verifiera CSV

        //Spara i DB
        var post  = {Filename: "testfile1.txt", TotalNumberOfRows: 10, RowsWithErrors:5};
        var query = connection.query('INSERT INTO file SET ?', post, function(err, result) {
            if(err){
                res.send(err);
            }else{
                res.send("import complete");
            }
        });

        //flytta filer till history
    })

   app.use('/', router);
}