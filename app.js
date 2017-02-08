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
      console.log('error connecting to DB:', err);
  }else{
      console.log('connected to DB');
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
console.log('Server running on Port', config.port);

})

function init(config, fs){

    console.log("Check if import folders exist");
    
    if (!fs.existsSync(__dirname + config.importFolder)) {
        fs.mkdir(__dirname + config.importFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("ImportFolder successfully created");
        })
    }  


    if (!fs.existsSync(__dirname + config.importFolder + config.uploadFolder)) {
        fs.mkdir(__dirname + config.importFolder + config.uploadFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("uploadFolder successfully created");
        })
    }    
    if (!fs.existsSync(__dirname + config.importFolder + config.processingFolder)) {
        fs.mkdir(__dirname + config.importFolder + config.processingFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("processingFolder successfully created");
        })
    }  
    if (!fs.existsSync(__dirname + config.importFolder + config.historyFolder)) {
        fs.mkdir(__dirname + config.importFolder + config.historyFolder, function(err){
            if(err){
                return console.error(err);
            }
            console.log("historyFolder successfully created");
        })
    }  

}