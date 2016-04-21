document.write('<script language = "javascript" src = "skincr/js/lib/ua-parser.min.js "> <\/script>');
/**
 * Created by vincent on 15/12/22.
 */
//教室框体尺寸自适应

$(document).ready(function () {
    $(window).resize();
});

$(window).resize(function () {
    //整体
    var docWidth = $(".wrapper").width();                                   // 文档宽度
    var docHeight = $(document.body).height();                              // 文档高度
    var sideWidth = $(".frame-side").width() + 10;                          // 侧栏宽度+左边距
    var headerHeight = $(".header").height();                               // 头部高度
    var docpadding = parseInt($(".wrapper").css("padding-left")) * 2;       // 页面内边距
    var mainWidth = docWidth;                                               // 有效宽度
    var mainHeight = docHeight - docpadding;                                // 有效高度

    var ratio = 1;
    //课件区域的最小宽高
    var minWidth = 800;
    var minHeight = 500;
    //课件容器的宽高
    var contentWidth = 800;//新宽度
    var contentHeight = 500;//新高度
    var contentPadding = 10;

    var tipHeight = $(".courseware-tips").height();
    var toolHeight = parseInt($(".operation-panel").css("height"));
    var warnHeight = $(".mod-warning").height() || 0;

    contentWidth = mainWidth - sideWidth;
    contentHeight = mainHeight - headerHeight - tipHeight - toolHeight;

    $(".courseware").css("width", contentWidth);
    $(".courseware").css("height", contentHeight);
    $(".main").css("width", contentWidth);
    $(".main").css("height", contentHeight + tipHeight + toolHeight);
    $(".frame-side").css("height", contentHeight + tipHeight + toolHeight);
    $(".mod-msg").css("height", $(".frame-side").height() - $(".mod-webcam").height() - warnHeight - $(".msg_input").height());

    var width = 0;
    var height = 0;
    //if(contentWidth > minWidth){
        ratio = contentWidth/minWidth;
        width = contentWidth;
        height = minHeight * ratio;
        if(height > contentHeight){
            ratio = contentHeight/minHeight;
            height = contentHeight;
            width = minWidth * ratio;
        }
    //}else{
    //    ratio = 1;
    //    width = minWidth;
    //    height = minHeight;
    //}

    document.querySelector("#contentGroup").style.zoom = ratio;
    //缩放后的绝对坐标
    var offetX = $(".main").offset().left + (contentWidth - width)/2;
    var offsetY = $(".main").offset().top +  (contentHeight - height)/2;
    singleRoom.setRatio(ratio,offetX,offsetY);
});

// modal单页多内容显示,对旧数据做清除
$('#modalDetail').on('hidden.bs.modal', function () {
    $(this).removeData();
});

// 笔刷尺寸&颜色选择
//$(function () {
$(".pen_size > .size, .pen_color > .color").click(function () {
    $(this).addClass('active').siblings().removeClass('active');
});

$(".pen_size > .size").click(function () {
    singleRoom.setDraw($(this).attr("pen-size"),null);
});

$(".pen_color > .color").click(function () {
    singleRoom.setDraw(null,$(this).attr("pen-color"));
});

$(".logo > img").click(function () {
    window.location.href = "http://"+window.location.hostname+":"+window.location.port;
});

$(".total-time > .icon_time").click(function () {
    reLog(log);
});
/***********************************************************
 *
 * 初始代码
 *
 ***********************************************************/
var url = parseURL(decodeURIComponent(window.location.href));
var obj = JSON.stringify(url.params);
sessionStorage.userdata = obj;
console.log("url params",url.params);

var log = "";
//console.log = function(){
//    var text ="\r\n" +  trace("[LOG]", arguments);
//    log += text;
//    return text;
//};

console.error = function(){
    var text ="\r\n" +  trace("[LOG]", arguments);
    log += text;
    return text;
};

console.warn = function(){
    var text ="\r\n" +  trace("[LOG]", arguments);
    log += text;
    return text;
};

window.onload = function(event){
    var ua = new UAParser();
    SingleDatasets.device = JSON.stringify({
        device: ua.getDevice(),
        browser: ua.getBrowser(),
        os: ua.getOS()
    });
    SingleDatasets.ios = (ua.getOS().name =="iOS");
    load();
};

window.onbeforeunload = function() {
    unload();
};

function reLog(log){
    var baseAction = new BaseAction();
    var data = {
        'room' : Number(url.params.room),
        'userId' : Number(url.params.id),
        'userType' : Number(url.params.type),
        'userName' : "",
        "text" : log
    };
    baseAction.sendAction("console", data);
    baseAction.on(baseAction.COMPLETE,function(data){
        alert("运行日志记录完成\n"+ JSON.stringify(data));
    });
}