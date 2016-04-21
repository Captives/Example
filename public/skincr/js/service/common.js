/**
 * 浏览器缩放检测
 * @returns {number}
 */
function detectZoom (){
    var ratio = 0,
        screen = window.screen,
        ua = navigator.userAgent.toLowerCase();

    if (window.devicePixelRatio !== undefined) {
        ratio = window.devicePixelRatio;
    }
    else if (~ua.indexOf('msie')) {
        if (screen.deviceXDPI && screen.logicalXDPI) {
            ratio = screen.deviceXDPI / screen.logicalXDPI;
        }
    }
    else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
        ratio = window.outerWidth / window.innerWidth;
    }

    if (ratio){
        ratio = Math.round(ratio * 100);
    }

    return ratio;
};

function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function () {
            var ret = {},
                seg = a.search.replace(/^\?/, '').split('&'),
                len = seg.length, i = 0, s;
            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
        segments: a.pathname.replace(/^\//, '').split('/')
    };
}

function devInfo(info){
    if(info =="" || info == undefined || info == null){
        return "unknown device";
    }

    console.log("info",info);
    info = JSON.parse(info);
    var dev = info.device;
    var bw = info.browser;
    var os = info.os;
    var text = "";
    if(dev.type){
        if(dev.vendor){
            text = dev.vendor + " " + dev.model;
        }else{//山寨产品
            text = os.name + " " + dev.type;
        }
    }else{//桌面设备
        if(os.version){
            text = os.name + " " + subVersion(os.version);
        }else{
            text = os.name;
        }
    }

    function subVersion(version){
        var text = "";
        var index = version.indexOf(".");
        if(index == -1){
            text = version;
        }else{
            text = version.substring(0,index);
        }
        return text;
    }
    console.log("设备信息",info,text);
    return [text,bw.name +" " + subVersion(bw.version)];
}

/********************************************************
 *
 *      时间
 *
*********************************************************/

//获取当前的时间
function getDate(){
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();

    if(m<10){
        m = "0" + m;
    }

    var s = d.getSeconds();
    if(s<10){
        s = "0" + s;
    }

    return h + ":" + m + ":" + s;
}

//用时间戳返回格式化时间时分秒，
function getFormatDate(timeStamp){
    var d = new Date(timeStamp);
    var h = d.getHours();
    var m = d.getMinutes();

    if(m<10){
        m = "0" + m;
    }

    var s = d.getSeconds();
    if(s<10){
        s = "0" + s;
    }

    return h + ":" + m + ":" + s;
}

/**
 * 格式化时间
 * */
function formatTimes(value){
    var result = (value % 60) +"";
    if(result.length == 1){
        result = Math.floor(value / 60) + ":0" + result;
    }else{
        result = Math.floor(value / 60) + ":" + result;
    }
    return result;
}


//根据时间戳，时钟
function Clock(){
    this.EVENT_CHANGE = "change";
    this.EVENT_ERROR = "error";
    this.EVENT_COMPLETE = "complete";
    this.timeId = 0;
    this._start_value = 0;
    this._start_time = 0;
    this._counter = 0;
    this._time = 0;
    Object.defineProperties(this,{
        "time":{
            get:function(){
                return this._time;
            }
        }
    });
}

Clock.prototype = new EventEmitter();

Clock.prototype.start = function(value){
    var that = this;
    this._start_value = value;
    this._start_time = Date.now();
    this._time = this._start_value + this._counter;
    this.timeId = window.setInterval(function(){
        that.timerHandler();
    },1000);
};

Clock.prototype.timerHandler = function(){
    this._counter = this._counter +1;
    var t = Math.round(Date.now()/1000 - this._start_time/1000);
    //document.querySelector(".cont p").innerText = "计数:" + this._counter + "  时间计数:" + t + "误差:" + (t-this._counter);
    if(t > this._counter){//误差
        this._counter = t;
        //if(t - this._counter <= 5){ //误差5秒之内
        //    this._counter = t;
        //}else{//大于指定的误差，报错
        //    //alert("定时器错误");
        //    this.emit(this.EVENT_ERROR,"error:" + (t-this._counter));
        //}
    }
    this._time = this._start_value + this._counter;
    this.emit(this.EVENT_CHANGE,this.time,this.text());
};

Clock.prototype.stop = function(){
    this.emit(this.EVENT_COMPLETE,this.time,this.text(),this._counter);
    window.clearInterval(this.timeId);
};

Clock.prototype.text = function(){
    var text = "";
    if(this.time < 0){
        text = "-" + formatTimes(-this.time);
    }else{
        text = formatTimes(this.time);
    }
    return text;
}

/********************************************************
 *
 *      日志
 *
*********************************************************/
/*
console.log = function(){
    trace("[LOG]", arguments);
};

console.info = function(){
    trace("[INFO]", arguments);
};

console.error = function(){
    trace("[ERROR]", arguments);
};

console.warn = function(){
    trace("[WARN]", arguments);
};
**/
// This function is used for logging.
function trace(type,args) {
    var arr = Array.prototype.slice.call(args);
    arr.unshift(type);
    arr.unshift(getDate());
    var text = arr.join(" ");
    var item = document.createElement('li');
    item.innerHTML = text;
    var debug = document.getElementById("debug");
    if(debug){
        debug.appendChild(item);
        debug.scrollTop = debug.scrollHeight;
    }
    return text;
}

/********************************************************
 *
 *      绘图
 *
 *********************************************************/
function Draw(){
    this.startX = 0;//记录鼠标移动时的X坐标
    this.startY = 0;//记录鼠标移动时的Y坐标
    this.sync = false;  //是否同步鼠标
    this.ratio = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.lineWidth = 3;
    this.lineColor = '#FF0000';

    var startTime = 0;
    var line = {
        width:this.lineWidth,
        color:this.lineColor,
        point:[]
    };

    var _canvas = null;
    var _context = null;
    //是否是手持设备
    var _touch = false;
    var _mouseDown = false;
    var _enabled = false;

    var that = this;
    Object.defineProperties(this,{
        "canvas":{
            set : function(can){
                _canvas = can;
                _context = _canvas.getContext("2d");
                 addEvent();
                _touch = ('createTouch' in document);
            },
            get : function(){
                return _canvas;
            }
        },
        "context":{
            get : function(){
                return _context;
            }
        },
        "touch" : {
            get: function(){
                _touch = ('createTouch' in document);
                return _touch;
            }
        },
        "mouseDown" : {
            get : function() {
                return _mouseDown;
            }
        },
        "drawing" : {
            set : function(enabled){
                _enabled = enabled;
            },
            get : function(){
                return _enabled;
            }
        }
    });

    //支持触摸设备使用相应事件代替
    var startEvent = this.touch?'touchstart':'mousedown';
    var moveEvent = this.touch?'touchmove':'mousemove';
    var endEvent = this.touch?'touchend':'mouseup';
    function addEvent(){
        if(_canvas){
            _canvas.parentNode.addEventListener(startEvent, beginEventHandler, false);
            _canvas.parentNode.addEventListener(moveEvent, moveEventHandler, false);
            _canvas.parentNode.addEventListener(endEvent, endEventHandler, false);
            document.addEventListener("mouseup", endEventHandler, false);
        }
    }

    function removeEvent(){
        if(_canvas){
            _canvas.parentNode.removeEventListener(startEvent, beginEventHandler, false);
            _canvas.parentNode.removeEventListener(moveEvent, moveEventHandler, false);
            _canvas.parentNode.removeEventListener(endEvent, endEventHandler, false);
            document.removeEventListener("mouseup", endEventHandler,false);
        }
    }

    function beginEventHandler(event){
        event.preventDefault();
        var x,y;
        if(_touch){
            //如果是多点触摸使用第一个触摸点,event.touches[0].pageX指的是触摸点在触摸屏上的坐标点
            var currentTarget = event.touches[0];
            x = currentTarget.pageX - that.offsetX;
            y = currentTarget.pageY - that.offsetY;
        }else{
            x = event.offsetX / that.ratio;
            y = event.offsetY / that.ratio;
        }

        that.startX = x;
        that.startY = y;

        if(that.drawing){
            _mouseDown = true;
            line.width = that.lineWidth;
            line.color = that.lineColor;
            line.point = [];
            startTime = Date.now();
            line.point.push([x,y,0]);
            that.startLine(x, y, that.lineWidth, that.lineColor);
        }

        x = Number(x.toFixed(1));
        y = Number(y.toFixed(1));
        if(that.sync){
           that.emit("startMove", x, y, _mouseDown, that.lineWidth,that.lineColor);
        }
        return false;
    }

    function moveEventHandler(event){
        event.preventDefault();
        var x,y;
        if(_touch){
            //如果是多点触摸使用第一个触摸点,event.touches[0].pageX指的是触摸点在触摸屏上的坐标点
            var currentTarget = event.touches[0];
            x = currentTarget.pageX - that.offsetX;
            y = currentTarget.pageY - that.offsetY;
        }else{
            x = event.offsetX / that.ratio;
            y = event.offsetY / that.ratio;
        }

        x = Number(x.toFixed(1));
        y = Number(y.toFixed(1));

        if(_mouseDown && that.drawing){
            that.drawLine(x,y);
            line.point.push([x,y,(Date.now() - startTime)]);
        }

        //事件派发
        if(that.sync){
            that.emit("mouseMove", x, y, _mouseDown && that.drawing);
        }
        return false;
    }

    function endEventHandler(event){
        event.preventDefault();
        if(_mouseDown && that.drawing){
            that.endLine();
            that.emit("endMove",line);
        }
        _mouseDown = false;
        return false;
    }
};

Draw.prototype = new EventEmitter();

Draw.prototype.startLine = function(pointX,pointY,width,color){
    this.endLine();
    this.startX = pointX;
    this.startY = pointY;
    //指定两条线段的连接方式
    this.context.lineJoin = 'round';
    this.context.lineWidth = width;
    this.context.strokeStyle = color;
    this.context.shadowOffsetX = 1;
    this.context.shadowOffsetY = 1;
    this.context.shadowBlur = 1;
    this.context.shadowColor= color;
    this.context.beginPath();
};

Draw.prototype.drawLine = function(pointX,pointY){
    this.context.moveTo(this.startX, this.startY);
    this.context.lineTo(pointX,pointY);
    this.context.stroke();
    this.context.closePath();
    this.startX = pointX;
    this.startY = pointY;
};

Draw.prototype.endLine = function(){
    this.startX = 0;
    this.startY = 0;
    this.context.closePath();
};

Draw.prototype.restoreRect = function(){
    this.context.restore();
};

//清空画布343465
Draw.prototype.clearRect = function(){
    this.endLine();
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
};

/********************************************************
 *
 *      课件
 *
 *********************************************************/
function Courseware(){
    this.EVENT_OPEN = "OPEN";
    this.EVENT_ERROR = "error";
    this.EVENT_CHANGE = "change";
    this.EVENT_COMPLETE = "complete";
    this.requestCount = 0;

    this.url = null;
    this.preUrl = null;
    this.nextUrl = null;
    this.currentPage = 1;
    this.totalPage = 1;
    this.id = 1;
    this.label = null;
    this.cover = null;
    var _canvas = null;
    var _context = null;
    var _width = 0;
    var _height = 0;
    Object.defineProperties(this,{
        "canvas":{
            set : function(can){
                _canvas = can;
                _context = _canvas.getContext("2d");
            },
            get : function(){
                return _canvas;
            }
        },
        "context":{
            get : function(){
                return _context;
            }
        },
        "width":{
            get : function(){
                return _width;
            }
        },
        "height":{
            get : function () {
                return _height;
            }
        }
    });

    this.on(this.EVENT_COMPLETE,function(url,img){
        _width = img.width;
        _height = img.height;
    });
}

Courseware.prototype = new EventEmitter();

Courseware.prototype.loadCourse = function (url){
    if(url===null || this.canvas===null || this.context === null){
        console.error("Couse#loadCourse",url,this.canvas,this.context);
        return;
    }
    var that = this;
    this.requestCount ++;
    var img = new Image();
    img.src = url;
    this.url = url;
    this.emit(this.EVENT_OPEN, url);
    if(img.complete){
        loadComplete(img);
    }else{
        img.onload = function(){
            loadComplete(img);
        };
        img.onerror = function(error){
            that.emit(that.EVENT_ERROR,"Course load Error:" + error);
            console.log("Course load Error:\n page:" + that.currentPage + "\n source:" + img.src, "错误");
        };
    }

    function loadComplete(img){
        that.context.clearRect(0,0,that.canvas.width,that.canvas.height);
        that.context.drawImage(img,0,0);
        that.requestCount = 0;
        that.emit(that.EVENT_COMPLETE, that.url,img);
        that.emit(that.EVENT_CHANGE, that.currentPage, that.totalPage);
        console.log(that.currentPage,"url:",that.url,img.width,img.height,"next:",that.nextUrl);
        that.preLoadCourse(that.nextUrl);
    }
};

Courseware.prototype.preLoadCourse = function(url,completeHandler,errorHandler){
    if(url===null){
        console.error("Couse#preLoadCourse",url);
        return;
    }
    var img = new Image();
    img.src = url;
    if(img.complete){
        if(completeHandler){
            completeHandler();
        }
    }else{
        img.onload = completeHandler;
        img.onerror = errorHandler;
    }
};

Courseware.prototype.load = function(page){
    this.currentPage = page;
    if(this.currentPage < 1){
        this.currentPage = 1;
    }

    if(this.currentPage >= this.totalPage){
        this.currentPage = this.totalPage;
    }
};

Courseware.prototype.dataProvider = function(data){
    this.id = data.id;
    this.label = data.label;
    this.cover = data.cover;
    this.url = data.page.current;
    this.preUrl = data.page.prev;
    this.nextUrl = data.page.next;
    this.totalPage = data.totalPage;

    this.loadCourse(this.url);
};

Courseware.prototype.reload = function(){
    this.loadCourse(this.url);
};

Courseware.prototype.nextPage = function(){
    this.load(this.currentPage +1);
    return this.currentPage;
};

Courseware.prototype.prevPage = function(){
    this.load(this.currentPage -1);
    return this.currentPage;
};

Courseware.prototype.initPage = function(){
    this.load(this.currentPage);
    return this.currentPage;
};

/********************************************************
 *
 *      媒体
 *
*********************************************************/

function Audio(){
    this.audio = null;
    this.url = null;
    Object.defineProperties(this,{
        duration:{
            get:function (){
                if(audio){
                    return audio.duration;
                }else{
                    return 0;
                }
            }
        }
    });
};

Audio.prototype.play = function(){
    if(this.url){
        this.audio = document.createElement("audio");
        this.audio.src = this.url;
        this.audio.play();
    }else{
        console.warn("无效的音频地址",this.url);
    }
};

Audio.prototype.pause = function(){
    if(this.audio){
        this.audio.pause();
    }
};

Audio.prototype.time = function(){
    if(this.audio){
        return this.audio.currentTime;
    }
    return 0;
};

Audio.prototype.muted = function(_muted){
    if(this.audio){
        this.audio.muted = _muted;
    }
}
/********************************************************
 *
 *      服务器
 *
*********************************************************/
var ServerType = {
    /**http协议***/
    HTTP:"http://",
    /**https安全协议**/
    HTTPS:"https://",
    /**流媒体协议**/
    RTMP:"rtmp://",
    //WebSocket
    WS:"ws://"
};

function Server(){
    /**该服务器对应数据库ID**/
    this.id = 0;
    this.protocol = ServerType.WS;
    this.domain = "localhost";
    this.port = 80;
    this.label = "localhost";
    this.instance = "example";
    this.enabled = false;
    this.timeArray =[];
    this.time = 0;
    /**强制使用,自动测网可以忽略,后台监控可以强制使用**/
    this.forced = false;

    var that = this;
    Object.defineProperties(this,{
        url:{
            get:function(){
                return that.protocol + that.domain + ":" + that.port + that.instance;
            }
        },
        data:{
            set:function(obj){//{"id":"6","url":"red5qd.dadaabc.com","port":"1937","label":"青岛阿里云节点","forced":true,"default":false}
                that.id = obj.id;
                that.domain = obj.url;
                that.port = obj.port;
                that.label = obj.label;
                that.enabled = obj.def;
                that.forced = obj.forced;
                that.protocol = ServerType.WS;
            }
        }
    });
}

/**
 * 带类型的消息提示
 * @param text      文本
 * @param cId       文本容器的id
 * @param type      info,error,success,warning
 * @param parent    被添加的父容器
 * @param showClose 是否显示关闭按钮
 * @param timer     是否定时关闭
 */
function popTip(text,cId,type,parent,showClose,timer,callback){
    parent = parent || document.querySelector(".camera-view .alertbox");
    var art = document.createElement("article");
    art.setAttribute("class","alert fade in");
    switch (type){
        case "warning":
            art.setAttribute("class","alert alert-warning fade in");
            break;
        case "error":
            art.setAttribute("class","alert alert-error fade in");
            break;
        case "success":
            art.setAttribute("class","alert alert-success fade in");
            break;
        case "info":
        default :
            art.setAttribute("class","alert alert-info fade in");
            break;
    }
    var p = document.createElement("p");
    p.innerText = text;
    p.setAttribute("id",cId);
    art.appendChild(p);
    if(showClose){
        var cbt = document.createElement("button");
        cbt.setAttribute("type","button");
        cbt.setAttribute("class","close");
        cbt.setAttribute("data-dismiss","alert");
        cbt.setAttribute("aria-label","Close");

        var sp = document.createElement("span");
        sp.setAttribute("aria-hidden", true);
        sp.innerText = "×";
        sp.addEventListener("click", callback);
        cbt.appendChild(sp);
        art.appendChild(cbt);
    }

    parent.appendChild(art);
    if(parseInt(timer) > 0){
        setTimeout(function(){
            parent.removeChild(document.getElementById(cId).parentNode);
        },parseInt(timer));
    }
};


var Alert = {
    show:function(text,type,timer){
        timer = timer || 2000;
        var parent = document.querySelector("body");
        var item = document.createElement("div");
        var id = "tips" + Date.now();
        item.setAttribute("id", id);
        item.setAttribute("style","padding-top:30px; padding-bottom:60px");
        item.setAttribute("class", "tips tipsbox animated bounceIn");

        if(type == "error"){
            //失败
            item.innerHTML = "<div class='sa-icon sa-error animate'><span class='sa-x-mark animateXMark'><span class='sa-line sa-left'></span><span class='sa-line sa-right'></span></span></div>"
                + "<br/><h1 style='font-size: 25px'>" + text + "</h1>";
        }else{
            //成功
            item.innerHTML = "<div class='sa-icon sa-success animate'><span class='sa-line sa-tip animateSuccessTip'></span><span class='sa-line sa-long animateSuccessLong'></span><div class='sa-placeholder'></div><div class='sa-fix'></div></div>"
                + "<br/><h1 style='font-size: 25px'>" + text + "</h1>";
        }
        $("#" + id).fadeIn(1200);
        parent.appendChild(item);
        $("#" + id).fadeIn(1200);
        setTimeout(function () {
            parent.removeChild(item);
        }, timer);
    },
    swal:function(text, title, type, timer){
        if(timer == 0){
            swal({
                title: title || "title",
                text: text || "",
                type: type || "success",
                showConfirmButton: false
            });
        }else{
            swal({
                title: title || "title",
                text: text || "",
                type: type || "success",
                timer:(timer || 2000),
                showConfirmButton: false
            });
        }
    }
};
/****************************************************************************/
function createChatItem(name, photo, text, direct){
    var dv = document.createElement("div");
    if (name) {
        var img = document.createElement("img");
        img.src = photo;
        img.alt = name;
        img.setAttribute("title", name);
        img.setAttribute("class", "photo");

        var cv = document.createElement("div");
        cv.innerText = text;
        cv.setAttribute("class", "info");

        if(direct){
            dv.setAttribute("class","message msg-right");
        }else{
            dv.setAttribute("class","message msg-left");
        }
        dv.appendChild(img);
        dv.appendChild(cv);
    } else {
        var p = document.createElement("p");
        p.setAttribute("class", "system_time");
        var sp = document.createElement("span");
        sp.innerText = text;
        p.appendChild(sp);
        dv.appendChild(p);
    }
    return dv;
}

function movePanel(target) {

    //定义各个DOM元素及按钮，obj是整个窗口，objcurs窗口的导航，guan是窗口关闭按钮，xiao是缩小到任务栏按钮，max是最大化窗口按钮
    var obj = target;
    var objcur = target.children('.modal-header');
    //定义所有变量，tuo为鼠标是否在导航上按下
    var tuo = false;
    //记录窗口最小最大前的位置及宽高
    var lefts, tops, widths, heights;
    //这里获取窗口元素的宽高，用于窗口最小最大后还原窗口，因为窗口在真正的项目中是可以拉大拉小的，而我这里没有开发此功能
    widths = obj.width();
    heights = obj.height();

    var X, Y;
    objcur.mousedown(function (e) {
        X = e.pageX - obj.offset().left;
        Y = e.pageY - obj.offset().top;
        tuo = true;
    })

    $(document).ready(function (e) {
        obj.css({
            left: e.pageX - X,
            top: e.pageY - Y
        })
        lefts = obj.offset().left;
        tops = obj.offset().top;
    })

    $(document).mousemove(function (e) {
        //如果当前窗口为100%则不允许拖动
        if (obj.width() == $(document).width()) {
            tuo = false;
        }
        if (tuo) {
            obj.css({
                left: e.pageX - X,
                top: e.pageY - Y
            })
            lefts = obj.offset().left;
            tops = obj.offset().top;
        }
    }).mouseup(function () {
        tuo = false;
    })
}