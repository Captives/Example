var EventEmitter = require('events').EventEmitter;
var auth = require('./../resource/sc_module/AuthResource');
function WebServer(sc) {
    this.scServer = sc;
    this.count = 0;
}

WebServer.prototype = new EventEmitter();

WebServer.prototype.init = function (ws) {
    var that = this;
    console.log("socket connected pid:",process.pid);
    ws.emit('success', {pid:process.pid});
    ws.on("open", function () {
        console.log(ws.id,"--open");
    });

    ws.on("sampleClientEvent", function (data) {
        that.count++;
        console.log('Handled sampleClientEvent', data);
        that.scServer.exchange.publish('sample', that.count);
    });

    var interval = setInterval(function () {
        ws.emit('time', {time:Date.now()});
    }, 1000);

    ws.on("disconnect", function () {
        clearInterval(interval);
        console.log(ws.id,"-- disconnect");
    });
};

module.exports.attach = function (sc) {
    sc.webServer = new WebServer(sc);
    sc.on('connection', function (ws) {
        var pass = auth.attach(sc, ws);
        if(pass){
            this.webServer.init(ws);
        }
    });
    return sc.webServer;
};