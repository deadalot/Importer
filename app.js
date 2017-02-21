var express = require('express'),
    app = express()
    config = require('./config.json'),
    path = require('path'),
    fs = require('fs'),
    fileUpload = require('express-fileupload'),
    mysql      = require('mysql'),
    junk = require('junk'),
    csvParser = require('csv-parse');


var connection = mysql.createConnection(config.db);

connection.connect(function(err) {
  if(err){
      console.log('[APP] Error connecting to Database:', err);
  }else{
      console.log('[APP] Connected to Database');
  }
});


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');
app.use(fileUpload());

init(config, fs);

require('./routes/routes.js')(express, app, config, junk, connection, csvParser);

app.listen(config.port, function(){
console.log('[APP] Server running on Port', config.port);

})

function init(config, fs){

    console.log("[INIT] Check if import folders exist");
    
    if (!fs.existsSync(__dirname + config.importFolder)) {
        fs.mkdir(__dirname + config.importFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] ImportFolder successfully created");
        })
    }  


    if (!fs.existsSync(__dirname + config.importFolder + config.uploadFolder)) {
        fs.mkdir(__dirname + config.importFolder + config.uploadFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] uploadFolder successfully created");
        })
    }    
    if (!fs.existsSync(__dirname + config.importFolder + config.processingFolder)) {
        fs.mkdir(__dirname + config.importFolder + config.processingFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] processingFolder successfully created");
        })
    }  
    if (!fs.existsSync(__dirname + config.importFolder + config.historyFolder)) {
        fs.mkdir(__dirname + config.importFolder + config.historyFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] historyFolder successfully created");
        })
    }  

}