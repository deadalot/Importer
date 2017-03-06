# Importer
Simple project to import csv files to a MySQL database

## Setup
Start by cloning the procjet from github
```git clone https://github.com/deadalot/Importer.git````
This will create a folder /Importer that contain all project files. 

Download and install MySQL by following the instructions on https://www.mysql.com/downloads/

Create a user in MySQL and run the scripts found in file `importer.sql` to create database and tables needed

Edit file `config.json` and change database settings to match your MySQL installation

In /Importer folder, install node_modules by running: 
```bash
npm install
````

Start application:
```bash
node app.js
```

Server will be started att http://localhost:8081/

