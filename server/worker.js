var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var SocketClusterWebServer = require("./../server/SocketClusterWebServer");
var SingleResource = require('./../resource/SingleRoomResource');
//********************************************************************************
//
//  日志服务
//
//********************************************************************************
var log4js = require('log4js');
log4js.configure({
    appenders: [
        {type: 'console', "category": "console"},
        {
            type: 'dateFile',
            filename: 'logs/server_log_',
            pattern: "yyMMdd_hh.log",//_hh_mm_ss
            alwaysIncludePattern: true
        }],
    replaceConsole: true
});
logger = log4js.getLogger();

/**
 * Created by Administrator on 2016/4/7.
 */
module.exports.run = function (worker) {
    var app = express();
    app.use(log4js.connectLogger(logger, {level: log4js.levels.INFO}));

    console.log(" >> Worker PID:", process.pid);
    var httpServer = worker.httpServer;
    var scServer = worker.scServer;
    var options = {
        key: fs.readFileSync('./keys/server.key'),
        cert: fs.readFileSync('./keys/server.crt')
    };

    httpServer.on('request', app);
    //app.use(serveStatic(__dirname + '/public'));
    app.use(serveStatic(path.resolve(__dirname, 'public')));
    app.use(serveStatic(path.resolve(__dirname, 'node_modules/socketcluster-client')));
    app.set("socketcluster", path.join(__dirname, '/blic/socketcluster'));

    var webServer = SocketClusterWebServer.attach(scServer);
    SingleResource.listen(app, webServer);
};