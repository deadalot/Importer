module.exports = function(express, app, config){
    var router = express.Router();

    // index.html
    router.get('/', function(req, res, next){
        res.render('index', {});
    })

    // List files and upload
    router.get('/filelist', function(req, res, next){
        var files_ = fs.readdirSync(__dirname + '/..' + config.importFolder + config.uploadFolder);
       //var files_ = ['test1.txt', 'test2.cvs'];
        console.log(files_);
        
        
        res.render('filelist', {files:files_});
    })

     // List transactions
    router.get('/transactionlist', function(req, res, next){
        res.render('transactionlist', {});
    })

    router.post('/upload', function(req, res, next){
        if (!req.files.uppFile) {
            res.render('filelist', {fileError:'No file selected'});
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
    

   app.use('/', router);
}