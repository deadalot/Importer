module.exports = function(express, app, config){
    var router = express.Router();

    // index.html
    router.get('/', function(req, res, next){
        res.render('index', {});
    })

    // List files and upload
    router.get('/filelist', function(req, res, next){
        res.render('filelist', {});
    })

     // List transactions
    router.get('/transactionlist', function(req, res, next){
        res.render('transactionlist', {});
    })

   app.use('/', router);
}