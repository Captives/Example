var phpResource = require('./../resource/phpResource');
var Logger = require('./../resource/LoggerResource');
function Monitor(app, _webServer){
    var webServer = _webServer;
    var logger = new Logger();

    app.get('/action', phpResource.getAction);
    app.post('/action', phpResource.postAction);

    app.post("/list", function(req,rsp){
        "use strict";
        console.log("list",req.body);
        rsp.writeHead(200);
        var data = webServer.getServer();
        rsp.end(data);
    });

    app.post("/list/offline", function(req,rsp){
        "use strict";
        console.log("offline",req.body);
        var data = req.body;
        rsp.writeHead(200);
        rsp.end(JSON.stringify({time:webServer.kickoff(data.id)}));
    });

    //记录控制台信息
    app.post("/console", function(req,rsp){
        "use strict";
        //console.log("console",req.body);
        var data = JSON.parse(JSON.stringify(req.body));
        var date = new Date();
        logger.path = "logs/console/" + date.getFullYear() + "_" + (date.getMonth()+ 1) + "_" + date.getDate();
        if(data.room){
            logger.fileName = data.room + ".log";
            var text = "\r\n\r\n" +
                "************************ --BEGIN-- ************************************";
            text += "\r\n \t"+"userType=" +data.userType + "\tuserName="+data.userName + "\tuserId="+data.userId;
            text += "\r\n " + data.text;
            text += "\r\n************************* --END-- ************************************";
            text += "\r\n" + date.toLocaleDateString()+ " " + date.toLocaleTimeString();
            logger.trace(text);
        }
        console.log("日志写入成功",logger.path+"/"+logger.fileName);
        rsp.writeHead(200);
        rsp.end(JSON.stringify({result:'success'}));
    });

    ////部分状态日志
    webServer.on("new_connect",function(id){
        console.log("新连接：", id);
    });

    webServer.on("socket_close",function(id){
        console.log(id, " socket 已经断开");
    });

    webServer.on("socket_error",function(error,id){
        console.log(id," Error = ",error);
    });

    webServer.on("sdp_offer", function(fromUser,toUser,sdp){
        console.log("offer", JSON.stringify(fromUser),"向",JSON.stringify(toUser),sdp);
    });

    webServer.on("sdp_answer", function(fromUser,toUser,sdp){
        console.log("answer", JSON.stringify(toUser),"响应",JSON.stringify(fromUser),sdp);
    });

    webServer.on("iceCandidate", function(fromUser,toUser,label,candidate){
        console.log("iceCandidate", JSON.stringify(fromUser),"向",JSON.stringify(toUser),label,candidate);
    });
};

Monitor.prototype.list = function(that){
    return function(req,rsp){
        "use strict";
        console.log("list",req.body);
        rsp.writeHead(200);
        var data = that.webServer.getServer();
        rsp.end(data);
    };
};

module.exports.listen = function(app,server){
    return new Monitor(app,server);
};