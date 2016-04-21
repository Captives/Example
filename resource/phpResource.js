var http = require("http");
var UUID = require('uuid');
var ShareEvent = require("./../public/js/ShareEvent");
var Logger = require('./../resource/LoggerResource');
var config = require("./../conf/config.js");

exports.getAction = function (request, response){
    "use strict";
    //console.log("get/aciton");
    var data = request.query;
    sendActionData(data,response);
};

exports.postAction = function (request, response){
    "use strict";
    //console.log("post/aciton");
    var data = request.body;
    sendActionData(data,response);
};

function sendActionData(data, response){
    var uid = UUID.v4();
    uid = uid.replace(new RegExp("-","g"),"");

    var logger = new Logger();
    var date = new Date();
    logger.includeTime = true;
    logger.record = config.log.phpLog;
    logger.path = "logs/php_log";
    logger.fileName = date.getFullYear() + "_" + (date.getMonth()+ 1) + "_" + date.getDate()+ "_" + date.getHours() + ".log";
    logger.info(uid,"request", JSON.stringify(data));

    data = require('querystring').stringify(data);
    var options = {
        method: "POST",
        host: config.api.host,
        port : config.api.port,
        path : config.api.path,
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": data.length
        }
    };

    var req = http.request(options, function(serverback){
        logger.info(uid, "statusCode", serverback.statusCode);
        if(serverback.statusCode === 200){
            var body = "";
            serverback.on('data',function(data){
                body += data
            });
            serverback.on('end', function(){
                logger.info(uid, "response", JSON.stringify(JSON.parse(body)));
                if(response){
                    response.send(200,body.toString());
                }
            });
            serverback.on('error',function(e){
                logger.error(uid, e.message);
                return "Error:" + e.message;
            });
        }else{
            logger.error(uid, "error:"+ serverback.statusCode);
            if(response){
                response.send(500,"error:"+ serverback.statusCode);
            }
            //response.send(500,JSON.stringify({error:500}));
        }
    });
    req.write(data);
    req.end();

    //req.on('response',function(data){
    //    console.log(uid, 'response');
    //});
    //
    //req.on('connect',function(){
    //    console.log(uid, 'connect');
    //});
    //
    //req.on('socket',function(){
    //    console.log(uid, 'socket');
    //});
    //
    //req.on('upgrade',function(){
    //    console.log(uid, 'upgrade');
    //});
    //req.on('continue',function(){
    //    console.log(uid, 'continue');
    //});
}

//服务器运行时监控的共享命令,保存指定信息到状态表
exports.statusAction = function(room,user, toUser, data, time){
    //if(data.action !== ShareEvent.CURSOR_POSITION){
    //    console.log(room,JSON.stringify(user),"状态事件",JSON.stringify(data),time);
    //}

    var logData ={
        actionType:null,
        userId : null,
        userType : null,
        userName:null,
        content:data.content
    };


    //广播消息,部分用户
    if(toUser !== null){
        logData.userId = toUser.userId;
        logData.userType = toUser.userType;
        logData.userName = toUser.userName;
    }else{
        logData.userId = user.userId;
        logData.userType = user.userType;
        logData.userName = user.userName;
    }

    //记录下列事件的课程状态信息
    switch (data.action){
        case ShareEvent.COURSE_GRAFFITI_CLEAR://清除绘图板
        case ShareEvent.COURSE_GRAFFITI_SWITCH://涂鸦开关
        case ShareEvent.GIVESTAR://奖励
        case ShareEvent.COURSE_TURNPAGE://页码发生更改
        case ShareEvent.COURSE_CHANGE://课件发生更改
        case ShareEvent.HELP://呼叫帮助
        case ShareEvent.VIDEO_CAMERA://摄像头发生更换
        case ShareEvent.VIDEO_MICROPHONE://麦克风发生更换
        case ShareEvent.VIDEO_CAMERA_QUALITY:// 摄像头质量发生更改
        case ShareEvent.VIDEO_MICROPHONE_VOLUME:// 麦克风增益发生更改
        case ShareEvent.VIDEO_ROTATION:// 视频旋转
        case ShareEvent.SERVER_CHANGE:// 服务器发生更改
            logData.actionType = data.action;
            break;
        case ShareEvent.FAQ_COUNT://罐头信息次数
            logData.content = 1;
            logData.actionType = data.action;
            break;
    }

    if(logData.actionType !== null){
        var sad = {
            action:"actionStatus",
            roomId:room,
            userId:user.userId,
            userType:user.userType,
            toActionType:logData.actionType,
            toUserId:logData.userId,
            toUserType:logData.userType,
            toUserName:logData.userName,
            toContent:logData.content
        };

        //console.error("statusAction",JSON.stringify(sad));
        sendActionData(sad);
    }
};

//服务器运行时监控的共享命令,保存指定信息到状态表
exports.logAction = function(room, user, toUser, actionType, text, time){
    console.log(room,JSON.stringify(user),"日志事件",text, time);
    var logData ={
        actionType:actionType,
        userId:null,
        userType:null,
        userName:null,
        content:text
    };

    //广播消息,部分用户
    if(toUser !== null){
        logData.userId = toUser.userId;
        logData.userType = toUser.userType;
        logData.userName = toUser.userName;
    }else{
        logData.userId = user.userId;
        logData.userType = user.userType;
        logData.userName = user.userName;
    }

    if(logData.actionType !== null){
        var sad = {
            action:"actionLog",
            roomId:room,
            userId:user.userId,
            userType:user.userType,
            userName:user.userName,
            toActionType:logData.actionType,
            toUserId : logData.userId,
            toUserType : logData.userType,
            toUserName: logData.userName,
            toContent: logData.content
        };
        //console.error("logAction",JSON.stringify(sad));
        sendActionData(sad);
    }
};

/**
function sendShareAction(_data){
    var uid = "PHP_STATUS[" + _data.action + "]" ;
    var data = function (){
        var arr = [];
        for(var k in _data){
            if(typeof(_data[k]) == 'object'){
                _data[k] = encodeURIComponent(JSON.stringify(_data[k]));
            }
            arr.push(k + '=' + _data[k]);
        }
        return arr.join('&');
    }();
    console.log(uid,"send", data);
    console.error(uid,"send Text",decodeURIComponent(data));
    var options = {
        method: "POST",
        host: config.api.host,
        port : config.api.port,
        path : config.api.path,
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": data.length
        }
    };

    var req = http.request(options, function(serverback){
        console.error(options);
        console.warn(data);
        if(serverback.statusCode === 200){
            var body = "";
            serverback.on('data',function(data){
                body += data
            });
            serverback.on('end', function(){
                console.log(uid,"返回2",JSON.stringify(JSON.parse(body)));
            });
            serverback.on('error',function(e){
                console.log(uid, e.message, e);
                return "Error:" + e.message;
            });
        }else{
            console.log(uid, "500 Error:",serverback.statusCode);
        }
    });
    req.write(data);
    req.end();
}
 **/