var express = require('express');
var fs      = require('fs');
var mongo   = require('mongodb');
var Grid    = require('gridfs-stream');
var XLS = require('xlsjs');
var XLSX = require('xlsx');

var db      = new mongo.Db('files', new mongo.Server("127.0.0.1", 27018), { safe : false });

db.open(function (err) {
  if (err) {
    throw err;
  }
  var gfs = Grid(db, mongo);
  var app = express();

  app.use(express.bodyParser());
  app.post('/upload', function(req, res) {
    console.log("Uploading...");
    var tempfile    = req.files.datafile.path;
    var origname    = req.files.datafile.name;
	
	if(req.files.datafile.name != '') {
	console.log(origname);
    var writestream = gfs.createWriteStream({ filename: origname });
    // open a stream to the temporary file created by Express...
    fs.createReadStream(tempfile)
      .on('end', function() {
        res.send('OK');
      })
      .on('error', function() {
        res.send('ERR');
      })
      // and pipe it to gfs
      .pipe(writestream);
	  console.log("Uploaded...");
	  }else{
		console.log("Empty Name");
	  }
  });
  
  app.post('/csv', function(req, res) {
    console.log("Uploading...");
    var tempfile    = req.files.datafile.path;
    var origname    = req.files.datafile.name;
	console.log(origname);
	console.log("File...");
	var workbook = XLSX.readFile(req.files.datafile.path);
	console.log(workbook);
	console.log("conversion");
	var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[0]);
	console.log(csv);
	if(req.files.datafile.name != '') {
	console.log(origname);
    var writestream = gfs.createWriteStream({ filename: origname });
    // open a stream to the temporary file created by Express...
    fs.createReadStream(csv)
      .on('end', function() {
        res.send('OK');
      })
      .on('error', function() {
        res.send('ERR');
      })
      // and pipe it to gfs
      .pipe(writestream);
	  console.log("Uploaded...");
	  }else{
		console.log("Empty Name");
	  }
  });

  app.get('/items', function(req, res){	
		var items = db.collection("fs.files").find().toArray(function(err, items) {
			res.send(items);
        });
  });
  
  app.get('/itemsExcel', function(req, res){	
        var excelItems = [];
		var items = db.collection("fs.files").find().toArray(function(err, items) {					
				for(var i=0; i<items.length; i++){
					if(items[i].filename.indexOf(".xls", items[i].filename.length - 4 ) !== -1) excelItems.push(items[i].filename); 
				}
				res.send(excelItems);		
        });
  });
  
  app.get('/items/:filename', function(req, res){
		var fileName = req.param('filename');
		res.setHeader('Content-disposition', 'attachment; filename' + fileName);
		gfs.createReadStream({ filename: req.param('filename') }).pipe(res);
  });
  
  app.get('/items/parse/:filename', function(req, res){
		var fileName = req.param('filename');
		gfs.createReadStream({ filename: req.param('filename') }).pipe(res);
  });

  app.listen(3012);
  console.log("listening on Port 3012");
});