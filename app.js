var express = require('express'),
    app = express()
    config = require('./config.json'),
    path = require('path'),
    fs = require('fs'),
    fileUpload = require('express-fileupload'),
    mysql      = require('mysql'),
    junk = require('junk')

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

require('./routes/routes.js')(express, app, config, junk, connection);

app.listen(config.port, function(){
console.log('[APP] Server running on Port', config.port);

})

function init(config, fs){

    console.log("[INIT] Check if import folders exist");   
    if (!fs.existsSync(config.importDir)) {
        fs.mkdir(config.importDir, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] ImportFolder successfully created");
        })
    }  


    if (!fs.existsSync(config.uploadDir)) {
        fs.mkdir(config.uploadDir, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] uploadFolder successfully created");
        })
    }    
    if (!fs.existsSync(config.processDir)) {
        fs.mkdir(config.processDir, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] processingFolder successfully created");
        })
    }  
    if (!fs.existsSync(config.historyDir)) {
        fs.mkdir(config.historyDir, function(err){
            if(err){
                return console.error(err);
            }
            console.log("[INIT] historyFolder successfully created");
        })
    }  

}