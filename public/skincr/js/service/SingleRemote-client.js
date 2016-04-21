//向服务器请求的事件
var ServerEvent = {
    JOIN: "join",                //登入
    SHARE: "share",              //共享事件
    OFFLINE: "offline"           //下线
};
//服务器响应的事件
var RemoteEvent = {
    ES: "enterSuccess",          //登入成功
    ER: "enterReject",          //拒绝登入
    OFFLINE: "offline",          //下线
    RP: "repEnter",              //重复登陆
    UE: "userEnter",             //用户进入
    UQ: "userQuit",              //用户退出
    SHARE: "share"               //共享事件
};

function RemoteClient(server) {
    if (!window.WebSocket) {
        console.warn("This browser does not support WebSocket.");
        return;
    }

    var that = this;
    this.connected = true;
    //this.ws = new WebSocket(server);
    this.count = 10;
    this.ws = new ReconnectingWebSocket(server,null,{
        automaticOpen:true,                            //是否自动打开,默认为true
        maxReconnectAttempts:this.count,               //最大尝试连接数,null为永远连接
        reconnectInterval:1000,                        //重新连接间隔,默认1秒
        maxReconnectInterval:30000,                    //最大连接时间间隔,默认30秒
        timeoutInterval:2000,                          //等待一个连接成功之前，关闭后重试最大的毫秒时间,默认2秒
    });

    console.log('ReconnectingWebSocket', server);
    this.refresh = function () {
        that.ws.refresh();
    };

    this.recount = function () {
        return that.ws.reconnectAttempts;
    };

    this.ws.onopen = function () {
        console.log('connected success',that.ws);
        that.connected = true;
        that.emit("status", "socket_open", that.ws);
    };

    this.ws.onmessage = function (message) {
        var json = JSON.parse(message.data);
        if (json.eventName) {
            that.emit("message", json.eventName, json.data);
        } else {
            that.emit("message", "invalid_message", json);
        }
    };

    this.ws.onclose = function () {
        that.connected = false;
        that.emit("status", "socket_close");
    };

    this.ws.onerror = function (error) {
        that.connected = false;
        that.emit("status", "socket_error", error);
    };
};

RemoteClient.prototype = new EventEmitter();

RemoteClient.prototype.join = function (options) {
    var data = {
        eventName: ServerEvent.JOIN,
        data: options
    };

    this.call(data);
};

RemoteClient.prototype.sending = function (type, data, toId, toType, back) {
    toId = toId || "";
    toType = toType || "";
    back = back || false;

    var data = {
        eventName: ServerEvent.SHARE,
        data: {
            action: type,
            content: data,
            toId: toId,
            toType: toType,
            back: back
        }
    };

    this.call(data);
};

RemoteClient.prototype.offline = function (list) {
    var data = {
        eventName: ServerEvent.OFFLINE,
        data: list
    };
    this.call(data);
};

RemoteClient.prototype.sendIceCandidate = function (wid, sdpMLineIndex, candidate) {
    var data = {
        eventName: "icecandidate",
        data: {
            wid: wid,
            label: sdpMLineIndex,
            candidate: candidate
        }
    };
    this.call(data);
};

RemoteClient.prototype.sendOfferSdp = function (wid, sdp) {
    var data = {
        eventName: "offer",
        data: {
            wid: wid,
            sdp: sdp
        }
    };

    console.log("##############sendOfferSdp", JSON.stringify(data));
    this.call(data);
};

RemoteClient.prototype.sendAnswerSdp = function (wid, sdp) {
    var data = {
        eventName: "answer",
        data: {
            wid: wid,
            sdp: sdp
        }
    };
    this.call(data);
};


RemoteClient.prototype.call = function (data) {
    if (this.connected) {
        this.ws.send(JSON.stringify(data));
    } else {
        console.error("WebSocket not opened");
        //Alert.show(
        //    '1、无效登陆，请先登陆\n' +
        //    '2、无法登陆，请检查网络连接\n' +
        //    '3、依然无法登陆，请尝试Chrome\n\n','消息未发送');
    }
};

/**
 * 关闭远程消息传送
 */
RemoteClient.prototype.close = function () {
    if(this.ws){
        this.ws.automaticOpen = false;
        this.ws.close();
        this.ws = null;
    }
};