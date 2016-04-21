var socketClusterServer = require("socketcluster-server");
var WebSocketServer = require('ws').Server;
var EventEmitter = require('events').EventEmitter;

function WebServer(){
    this.on("ping",function(ws, data){
        ws.send(JSON.stringify({
            eventName : "success",
            data: data
        }));
    });
}

WebServer.prototype = new EventEmitter();

WebServer.prototype.init = function(ws){
    var that = this;
    ws.on('message',function(message){
        var json = JSON.parse(message);
        if(json.eventName){
            that.emit(json.eventName, ws, json.data);
        }else{
            that.emit("message", ws, json);
        }
    });

    ws.on('close', function(){

    });

    ws.on('error',function(error){

    });
};

module.exports.start = function(options,path,host,port){
    var ws = new WebSocketServer({
        server:options,
        path:path
    },function(data){
        console.log("WebSocket Server ", data);
    });

    console.warn('WebSocket Server instance ws://' + host + ":" + port + ws.path);
    //创建一个新的实例用来服务
    ws.webServer = new WebServer();
    ws.on('connection', function(ws){
        this.webServer.init(ws);
    });

    return ws.webServer;
};


/**
 * 使用WebSocketCluster服务
 * @param server
 * @returns {webServer|WebServer|*}
 */
module.exports.listen = function (server, path, host, port) {
    var wcs = socketClusterServer.attach(server);
    console.warn('SocketCluster Server instance ws://' + host + ":" + port + path);
    //创建一个新的实例用来服务
    wcs.webServer = new WebServer();
    wcs.on('connection', function (ws) {
        this.webServer.init(ws);
    });

    return wcs.webServer;
};