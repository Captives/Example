var express = require('express');
var http = require("http");
var path = require("path");
var app = express();
app.use(express.static(path.join(__dirname, 'files')));

http.createServer(app).listen(80, "120.26.42.35");
console.log("files server startup Success");
console.log("file server url:http://120.26.42.35/");
