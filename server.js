var express = require('express');
var https = require('https');
var http = require("http");
var path = require("path");
var bodyParser = require('body-parser');
var fs = require("fs");
var app = express();
//****************************************
//  日志服务
//****************************************
var log4js = require('log4js');
log4js.configure({
    appenders:[
        {type:'console',"category":"console"},
        {
            type:'dateFile',
            filename:'logs/server_log_',
            pattern: "yyMMdd_hh.log",//_hh_mm_ss
            alwaysIncludePattern: true
        }],
    replaceConsole : true
});

logger = log4js.getLogger();
app.use(log4js.connectLogger(logger, {level:log4js.levels.INFO}));
//****************************************
//  数据服务
//****************************************
var config = require('./conf/config');
var SingleWebServer = require("./server/SingleWebServer");
var NetWorkServer = require("./server/NetWorkServer");
var SingleResource = require('./resource/SingleRoomResource');


var options = {
    key: fs.readFileSync('./keys/server.key'),
    cert:fs.readFileSync('./keys/server.crt')
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

var httpSrv = http.createServer(app).listen(config.server.httpPort, config.server.httpHost);
var httpsSrv = https.createServer(options,app).listen(config.server.httpsPort, config.server.httpsHost);
console.warn('HTTP Server listening on http://%s:%s/', config.server.httpHost, config.server.httpPort);
console.warn('HTTPS Server listening on https://%s:%s/', config.server.httpsHost, config.server.httpsPort);
console.log("API Address listening on http://%s:%s%s",config.api.host,config.api.port,config.api.path);

var webServer = SingleWebServer.start(httpSrv,config.path.single,config.server.httpHost,config.server.httpPort);
var netServer = NetWorkServer.start(httpSrv,config.path.testNet,config.server.httpHost,config.server.httpPort);

//****************************************
//  数据服务
//****************************************
SingleResource.listen(app,webServer);
