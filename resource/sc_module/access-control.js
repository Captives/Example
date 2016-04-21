/**
 * Created by Administrator on 2016/4/11.
 */
module.exports.attach = function (scServer) {
    //访问控制设置socketcluster中间件
    scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, function (req, next) {
        var events = ["create", "read", "update", "delete"];
        if(events.indexOf(req.event) != -1){
            //如果socket有一个有效的身份验证令牌，然后允许发出 CRUD 事件
            if(req.socket.getAuthToken()){
                next();
            }else{
                next('Cannot %s data without being logged in - Params: %s',req.event, JSON.stringify(req.data));
                req.socket.emit("logout");
            }
        }else{
            //其他事件不需要socket进行身份验证
            next();
        }
    });

    //如果socket有一个有效的身份验证令牌，然后允许发布到任何通道
    scServer.addMiddleware(scServer.MIDDLEWARE_PUBLISH_IN, function (req, next) {
        if(req.socket.getAuthToken()){
            next();
        }else{
            next('Cannot publish to %s channel without being logged in - Params: %s', req.channel, JSON.stringify(req.data));
            req.socket.emit('logout');//登出
        }
    });

    //如果socket有一个有效的身份验证令牌，然后允许订阅任何通道信息
    scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, function (req, next) {
        if(req.socket.getAuthToken()){
            next();
        }else{
            next('Cannot subscribe to %s channel without being logged in', req.channel);
            req.socket.emit("logout");
        }
    });
};