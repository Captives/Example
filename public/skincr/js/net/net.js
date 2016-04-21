function NetTestServer(){
    this.list = [];
    /**ping服务器的总数**/
    this.count = 5;
    // 队列模式下的服务测试索引或者并发模式下，已经完成的服务器数量
    this.index = 0;
    this.data = [];
    this.server = null;
}
NetTestServer.prototype = new EventEmitter();

NetTestServer.prototype.start = function(){
    this.pingServer(this.index);
};

NetTestServer.prototype.pingServer = function(index){
    var ser = this.list[index];
    var that = this;
    var server = new NetServer(ser.url);
    server.maxCount = this.count;

    server.on("change",changeHandler);
    server.on("complete",completedHandler);

    function changeHandler(i,times){
        that.emit("progress",i + (that.index * server.maxCount), that.list.length * server.maxCount);
    }

    function completedHandler (times, status, url){
        ser.timeArray = times;
        that.data.push({id:ser.id, label:ser.label, time:times});
        server.off("change",changeHandler);
        server.off("complete",completedHandler);
        server = null;
        that.pingNext();
    }

    server.ping();
};

NetTestServer.prototype.pingNext = function(){
    this.index++;
    if(this.index < this.list.length){
        this.pingServer(this.index);
    }else{
        this.emit("complete",this.data);
    }
};

/***********************************************************
*
*  网络测试模块
*
************************************************************/

/**
 * 网络测试
 * @param url
 * @constructor
 */
function NetServer(url){
    this.startTime = Date.now();
    this.url = url;
    this.ws = null;
    this.times = [];
    this.beginTime = 0;
    this.backTime = 0;
    this.index = 1;
    this.maxCount = 20;
}

NetServer.prototype = new EventEmitter();

NetServer.prototype.ping = function(){
    var ws = this.ws = new WebSocket(this.url);
    var that = this;
    ws.onopen = function(){
        that.times.push(Date.now() - that.startTime);//连接耗时
        that.start(that.index);
    };

    ws.onmessage = function(message){
        var json = JSON.parse(message.data);
        that.response(json);
    };

    ws.onclose = function(){
        console.log(that.url,"连接关闭",Date.now());
        that.disponse(1);
    };

    ws.onerror = function(error){
        that.times.push(-1);
        that.emit("change",that.maxCount);
        console.log(that.url,"ERROR");
        that.disponse(2);
    };
};

NetServer.prototype.start = function(index){
    var text = "网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试网速测试";
    this.ws.send(JSON.stringify({
        eventName:"ping",
        data:{
            index: index,
            text:text
        }
    }));
    this.beginTime = Date.now();
    console.log(index, "开始时间", this.beginTime,"文本长度", text.length);
};

NetServer.prototype.response = function(json){
    this.backTime = Date.now();
    this.times.push(this.backTime - this.beginTime);
    console.log(json.data.index,"测试完成",this.beginTime,this.backTime,"耗时:", this.backTime - this.beginTime);
    this.emit("change",this.index,this.backTime - this.beginTime,this.beginTime,this.backTime);

    this.index ++;
    if(this.index <= this.maxCount){
        this.start(this.index);
    }else{
        this.disponse(3);
    }
};

NetServer.prototype.disponse = function(status){
    this.times.push(Date.now() - this.startTime);//测网耗时
    console.log(this.url,"测试结束", this.times.join(","));
    this.emit("complete",this.times,status,this.url);

    this.times = [];
    if(this.ws){
       this.ws.close();
       this.ws = null;
    }
    this.url = null;
};