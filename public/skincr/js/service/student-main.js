var singleRoom = new SingleRoom();
/**************************************************************
 *  主动触发部分
 *************************************************************/
function load(){
    if(sessionStorage.userdata){
        var user = JSON.parse(sessionStorage.userdata);
        if(user != undefined && user.room != undefined){
            singleRoom.userVerification(user.room,user.id,user.type);
        }else{
            gohome("登入数据无效，请重新登陆！");
        }
    }else{
        gohome("登入会话超时，请重新登陆！");
    }
};

function reload(){
    unload(function(){
        window.location.reload();
    });
};

function unload(callback){
    var lv = document.querySelector("#localvideo");
    if(lv){
        lv.parentNode.removeChild(lv);
    }

    var rv = document.querySelector("#remotevideo");
    if(rv){
        rv.parentNode.removeChild(rv);
    }
    singleRoom.dispose();
    if(callback){
        callback();
    }
};

function gohome(text,url){
    singleRoom.emit("logout",text);
    swal({
            title:"拒绝登入",
            text:text,
            type:"error",
            confirmButtonColor: '#f44e51',
            confirmButtonText: '重新登入',
        },function(){
            window.location.href = url || "/";
     });
}


$('#prvChatDiv > .modal-header >.close').click(
    function(){
        $("#prvChatDiv").fadeOut(200);
        $("#prvChatDiv").removeClass('animated');
        $("#prvChatDiv").removeClass('bounceInDown');
    }
);

/**************************************************************/
//发送聊天信息
document.querySelector("#sendButton").onclick = function(event){
    var input = document.querySelector(".msg_input .fl");
    if(input.value.length !==0){
        singleRoom.sendMSN(input.value);
        input.value = "";
    }else{
        swal({
            title: "发送消息不能为空!",
            text:"请输入你要说的话",
            type: "warning",
            timer: 2000,
            showConfirmButton: false
        });
        input.focus();
    }
};

//回车发送消息
document.querySelector(".msg_input .fl").onkeyup = function(event) {
    if (event.keyCode === 13) {
        document.querySelector("#sendButton").click(new MouseEvent("onclick"));
    }
};

//私聊
document.querySelector("#prvChatDiv .sendButton").onclick = function (event) {
    var input = document.querySelector("#prvChatDiv .fl");
    if (input.value.length !== 0) {
        singleRoom.sendPrvChat([UserType.MANAGER],input.value);
        input.value = "";
    } else {
        swal({
            title: "发送消息不能为空!",
            text: "请输入你要说的话",
            type: "warning",
            timer: 2000,
            showConfirmButton: false
        });
        input.focus();
    }
};

//私聊回车发送消息
document.querySelector("#prvChatDiv .fl").onkeyup = function (event) {
    if (event.keyCode === 13) {
        document.querySelector("#prvChatDiv .sendButton").click(new MouseEvent("onclick"));
    }
};

document.querySelector("#preButton").onclick = function(event){
    singleRoom.sendPage(-1);
};

document.querySelector("#nextButton").onclick = function(event){
    singleRoom.sendPage(1);
};

//重进教室
document.querySelector('.btn-refresh button').onclick = function () {
    swal({
            title: "确定要刷新教室?",
            text: "刷新教室将会重新加载当前教室！",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            confirmButtonText: '确定',
            cancelButtonText: "取消",
            closeOnConfirm: false
        },
        function () {
            reload();
        });
};

//我要下课
document.querySelector('.btn-classover button').onclick = function () {
    swal({
            title: "结束课程",
            text: "您确认要结束课程并退出教室吗？",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            confirmButtonText: '确定下课',
            cancelButtonText: "取消下课",
            closeOnConfirm: false,
            closeOnCancel: false
        },
        function (isConfirm) {
            if (isConfirm) {
                //  singleRoom.finishClass();
                swal({
                    title: "已下课",
                    text: "Your imaginary file has been deleted!",
                    type: "success",
                    timer:800,
                    showConfirmButton: false
                });
                setTimeout(function(){
                    $("#StudentComments").trigger("click");
                },800);
            } else {
                swal("已取消", "Your imaginary file is safe :)", "error");
            }
        });
};
/**************************************************************
 *  被调用部分
 *************************************************************/
singleRoom.on("offline", function (data) {
    var text = "您的账号"
        + getFormatDate(data.time)
        + "已在" + devInfo(data.type)+"上成功登陆！"  + "\n登陆ID"+ data.id;
    singleRoom.emit("error",text,"下线通知");
});

singleRoom.on("repeat_online", function(data){
    var text ="" ;"您已在下列客户端登陆:";
    for(var i in data){
        text += getFormatDate(data[i].time)
            + "在" + devInfo(data[i].type) + "上登录，登陆ID:" + data[i].id+"\n";
    }
    text +="\n如果强制登入，则会断开其他客户端！";
    swal({
            title: "重复登陆",
            text:text,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            confirmButtonText: '确定登陆',
            cancelButtonText: "取消登陆",
            animation: "slide-from-top",
        },
        function (isConfirm) {
            if (isConfirm) {
                singleRoom.offline(data);
            }else{
                singleRoom.dispose();
            }
        });
});

singleRoom.on("user_auth_pass", function(result){
    var parent = document.querySelector("#contentGroup");
    var cursor = document.querySelector("#cursorGroup");
    console.log("浏览器当前缩放状态=",detectZoom());
    document.querySelector("#stu-camera .webcam-name").innerText = result.sName;
    document.querySelector("#tea-camera .webcam-name").innerText = result.tName;

    var lv = document.querySelector("#liveVideo");
    lv.autoplay = true;
    lv.width = 320;
    lv.height = 240;
    lv.volume = 0;
    singleRoom.createStream(lv);
    singleRoom.initCourse(parent,cursor);
});

singleRoom.on("user_auth_error", function(result){
    var text = "您没有权限进入当前房间,如需帮助请致电:021 3158-6855";
    gohome("身份验证失败或课程已经结束！",SingleDatasets.url + "student/index");
});

var helpCount = 0;
var helpStart = false;
singleRoom.on("clock_change", function (time, text) {
    //时钟
    document.querySelector('.total-time .icon_time').innerHTML = text;
    // 帮助禁用倒计时
    if(helpStart){
        helpCount --;//
        document.querySelector("#helpButton").disabled = true;
        document.querySelector("#helpButton").setAttribute("href","javascript:void(0);");
        document.querySelector("#helpButton .icon_message").innerText ="呼叫技术(" + helpCount +")";
        document.querySelector("#helpButton").setAttribute("data-hint","已经呼叫技术, 请等待 "+helpCount +"秒");
    }

    if(helpCount <= 0 && helpStart === true){
        helpStart = false;
        document.querySelector("#helpButton").disabled = false;
        document.querySelector("#helpButton").setAttribute("href","skincr/module/helpStu.html");
        document.querySelector("#helpButton .icon_message").innerText ="呼叫技术";
        document.querySelector("#helpButton").setAttribute("data-hint","遇到问题可以寻求技术支持");
    }

    //上课5分钟之前的所有时间段中，每隔5分钟，检测一下麦克风是否活动过,如果未活动过，则发送消息通知
    //业务未完成
    if(time < 0){ //未上课
        //if(this.micCount == 5 * 60){
        //    this.checkMicrophoneAvtivity(5);
        //    this.micCount = 0;
        //}
    }else{
        //if(this.micCount == 3 * 60){
        //    this.checkMicrophoneAvtivity(3);
        //    this.micCount = 0;
        //}
    }
});

//接入服务器成功
singleRoom.on("login",function(data){
    var html = document.getElementsByTagName("html");
    html[0].setAttribute("style", " -webkit-filter:grayscale(0);");
});

singleRoom.on("add_stream", function (stream, wid, user) {
    var rv = document.querySelector("#playVideo");
    rv.autoplay = true;
    rv.width = 320;
    rv.height = 240;
    singleRoom.viewStream(stream, rv);
});

singleRoom.on("logout",function(text){
    var html = document.getElementsByTagName("html");
    html[0].setAttribute("style", " -webkit-filter:grayscale(90%);");
});

//管理员对学生的提示
singleRoom.on("class_tip",function(remind){
    console.log("class_tip", remind);
    if(remind != null && remind != ""){
        swal({
            title:"留言" ,
            text: remind ,
            type:"success",
            timer:3000,
            showConfirmButton: false
        });
    }
});

singleRoom.on("helpme",function(type){
    swal({
        title:"老师呼叫帮助",
        text:"老师已经呼叫帮助，请稍等...",
        type:"success",
        timer:2000,
        showConfirmButton: false
    });
});

//涂鸦开关
singleRoom.on("drawing",function(selected){
    if(selected){
        swal({
            title:"涂鸦打开",
            text:"涂鸦已经开启，现在可以和老师一起画画吧",
            type:"success",
            timer:1500,
            showConfirmButton: false
        });
        $("#student-drowbord").removeClass("off");
    }else{
        swal({
            title:"涂鸦关闭",
            text:"涂鸦已经关闭，耐心听老师讲课哦~",
            type:"error",
            timer:1500,
            showConfirmButton: false
        });
        $("#student-drowbord").addClass("off");
    }
});

singleRoom.on("msg",function(name,userType,text,photo){
    var d = document.querySelector(".mod-msg");
    var dir = userType == singleRoom.userType;
    var dv = createChatItem(name, photo, text, dir);
    d.appendChild(dv);
    d.scrollTop = d.scrollHeight;
});

singleRoom.on("star",function(num){
    for (i = 1; i <= num; i++) {
       $("#starsList > .star" + i).addClass("on");
    }
});

singleRoom.on("add_user", function (user, id) {
    if (user.userType == UserType.TEACHER) {
        var audio = new Audio();
        audio.url = "assets/medias/teain.mp3";
        audio.play();
        document.querySelector(".fl .pages").style.display = "none";
    }
});

singleRoom.on("remove_user", function (user, id) {
    if (user.userType == UserType.TEACHER) {
        document.querySelector(".fl .pages").style.display = "block";
    }
});

//指定页课件加载完成
singleRoom.on("page", function(page, total){
    //var audio = new Audio();
    //audio.url = "assets/medias/loadingEnd.mp3";
    //audio.play();
    console.log("页码更新至" + page, total);
});

//指定页数据请求完成
singleRoom.on("course_Complete", function(page,value){
    var div = document.querySelector(".pages-number");
    div.removeChild(div.children[0]);
    var select = document.createElement("select");
    select.addEventListener("change",function(event){
        singleRoom.goPage(parseInt(event.target.value));
    });
    div.appendChild(select);
    for (var i = 1; i<= value; i++ ){
        var op = document.createElement("option");
        op.setAttribute("value",i);
        op.innerText = i;
        select.appendChild(op);
        if(page === i){
            op.selected = true;
            op.innerText = i + "/" + value;
        }
    }
});

singleRoom.on("mouse_move", function(x, y){
    document.querySelector("#teaPoint").innerText = "T("+x+","+y+")";
});

singleRoom.on("clear_rect", function(){
    swal({
        title:"清除完成",
        text:"画板已经清除干净！",
        type:"success",
        timer:1500,
        showConfirmButton: false
    });
});

singleRoom.on("error", function (text, title, callback) {
    var visiabled = callback != null && callback != undefined;
    swal({
        title: title,
        text: text,
        type: "error",
        showConfirmButton: visiabled
    }, callback);
});

singleRoom.on("private_chat",function (name, userType, text, photo,popup) {
    if(popup){
        $("#prvChatDiv").addClass('animated bounceInDown');
        $("#prvChatDiv").fadeIn(200);
        movePanel($("#prvChatDiv"));
    }

    document.querySelector("#prvChatDiv .modal-title").innerText = "私聊 "+ name;
    var d = document.querySelector("#prvChatDiv .mod-msg");
    var dv = createChatItem(name, photo, text, userType == singleRoom.userType);
    d.appendChild(dv);
    d.scrollTop = d.scrollHeight;
});

//刷新页面
singleRoom.on("refresh_page",function(){
    reload();
});

singleRoom.on("reward_page",function(path){
    unload(function(){
        window.location.href = SingleDatasets.url + path;
    });
});

/***********************************************************
 *
 * 自有业务处理方法
 *
 ************************************************************/
function helpSupport(){
    var items= document.getElementsByName("help");
    var value = -1;
    for(var i=0; i<items.length; i++){
        if(items[i].checked){
            value = items[i].value;
        }
    }

    if(value != -1){
        document.querySelector(".bg-red").setAttribute("data-dismiss","modal");
        swal({
            title :"呼叫请求",
            text:"呼叫请求已经发送",
            type:"success",
            timer:1000
        });
        helpCount = 60;
        helpStart = true;
        singleRoom.helpMe(value);
    }else{
        swal({
            title :"警告",
            text:"请选择呼叫类型",
            type:"warning",
            timer:2000
        });
    }
}

function classOver(level,text){
    singleRoom.finishClass(level,text);
    alert(level+"/"+text);
};

document.querySelector(".color.red").onclick = function(event){
    var parent = document.querySelector("#tea-camera .alertbox");
    popTip("General tips","info"+Date.now(),"info",parent,true);
    popTip("The warning","error"+Date.now(),"error",parent,true,3000);
    popTip("Error message","warning"+Date.now(),"warning",parent,false,5000);
    popTip("Teacher webcam has been closed","success"+Date.now(),"success",parent,true);
};

document.querySelector(".color.yellow").onclick = function(event){
    var parent = document.querySelector("#stu-camera .alertbox");
    popTip("General tips","info"+Date.now(),"info",parent,true);
    popTip("The warning","error"+Date.now(),"error",parent,true,3000);
    popTip("Error message","warning"+Date.now(),"warning",parent,false,5000);
    popTip("Teacher webcam has been closed","success"+Date.now(),"success",parent,true);
};
