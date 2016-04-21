var WebSocketServer = require('ws').Server;
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function WebServer(){

}
util.inherits(WebServer, EventEmitter);

WebServer.prototype.init = function(socket){

};

module.exports.start = function(options,path,host,port){
    var ws = new WebSocketServer({
        server:options,
        path:path
    },function(data){
        console.log("WebSocket Server ", data);
    });

    console.warn('WebSocket Server instance ws://'+ host + ":" + port + ws.path);
    //创建一个新的实例用来服务
    ws.webServer = new WebServer();
  //  errorCb = errorCb(ws.webServer);
    ws.on('connection', function(ws){
        this.webServer.init(ws);
    });
};