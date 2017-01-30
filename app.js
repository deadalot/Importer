var express = require('express'),
    app = express()
    config = require('./config.json'),
    path = require('path'),
    fs = require("fs")


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');


init(config, fs);

require('./routes/routes.js')(express, app, config);

app.listen(config.port, function(){
console.log('Server running on Port', config.port);

})

function init(config, fs){

    console.log("Check if import folders exist");
    
    if (!fs.existsSync(__dirname + '/import' + config.uploadFolder)) {
        fs.mkdir(__dirname + '/import' + config.uploadFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("uploadFolder successfully created");
        })
    }    
    if (!fs.existsSync(__dirname + '/import' + config.processingFolder)) {
        fs.mkdir(__dirname + '/import' + config.processingFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("processingFolder successfully created");
        })
    }  
    if (!fs.existsSync(__dirname + '/import' + config.historyFolder)) {
        fs.mkdir(__dirname + '/import' + config.historyFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("historyFolder successfully created");
        })
    }  

}