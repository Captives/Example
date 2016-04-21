var singleRoom = new SingleRoom();
/**************************************************************
 *  主动触发部分
 *************************************************************/
function load(){
    if(sessionStorage.userdata){
        var user = JSON.parse(sessionStorage.userdata);
        if(user != undefined && user.room !=undefined){
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
    singleRoom.emit("logout", text);
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

/**************************************************************/
////清除涂鸦
document.querySelector(".btn-eraser button").onclick = function(event){
    swal({
        title:"Clear Complete",
        text:"Sketchpad cleanup is complete!",
        type:"success",
        timer:1500,
        showConfirmButton: false
    });
    singleRoom.clearCourse();
};

document.querySelector("#preButton").onclick = function(event){
    singleRoom.sendPage(-1);
};

document.querySelector("#nextButton").onclick = function(event){
    singleRoom.sendPage(1);
};

//私聊
document.querySelector("#prvTChatDiv .sendButton").onclick = function (event) {
    var input = document.querySelector("#prvTChatDiv .fl");
    if (input.value.length !== 0) {
        singleRoom.sendPrvChat([UserType.TEACHER,UserType.MANAGER],input.value);
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
document.querySelector("#prvTChatDiv .fl").onkeyup = function (event) {
    if (event.keyCode === 13) {
        document.querySelector("#prvTChatDiv .sendButton").click(new MouseEvent("onclick"));
    }
};

//私聊
document.querySelector("#prvSChatDiv .sendButton").onclick = function (event) {
    var input = document.querySelector("#prvSChatDiv .fl");
    if (input.value.length !== 0) {
        singleRoom.sendPrvChat([UserType.STUDENT,UserType.MANAGER],input.value);
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
document.querySelector("#prvSChatDiv .fl").onkeyup = function (event) {
    if (event.keyCode === 13) {
        document.querySelector("#prvSChatDiv .sendButton").click(new MouseEvent("onclick"));
    }
};

document.querySelector("#tea-camera .chatBtn").onclick = function(event){
    $("#prvTChatDiv").addClass('animated bounceInDown');
    $("#prvTChatDiv").fadeIn(200);
    movePanel($("#prvTChatDiv"));
};

document.querySelector("#stu-camera .chatBtn").onclick = function(event){
    $("#prvSChatDiv").addClass('animated bounceInDown');
    $("#prvSChatDiv").fadeIn(200);
    movePanel($("#prvSChatDiv"));
};

$('#prvTChatDiv > .modal-header >.close').click(
    function(){
        $("#prvTChatDiv").fadeOut(200);
        $("#prvTChatDiv").removeClass('animated');
        $("#prvTChatDiv").removeClass('bounceInDown');
    }
);

$('#prvSChatDiv > .modal-header >.close').click(
    function(){
        $("#prvSChatDiv").fadeOut(200);
        $("#prvSChatDiv").removeClass('animated');
        $("#prvSChatDiv").removeClass('bounceInDown');
    }
);

$("[name='clarity']").on("change",function(event){
    singleRoom.getServerList($(event.target).val(), $(event.target).attr("userId"), $(event.target).attr("sid"));
});

document.querySelector("#tea-camera .refPageBtn").onclick = function (event) {
    singleRoom.sendRefresh(true, SingleDatasets.teacherId);
};

document.querySelector("#tea-camera .refSrvBtn").onclick = function (event) {
    singleRoom.sendRefresh(false, SingleDatasets.teacherId);
};

document.querySelector("#stu-camera .refPageBtn").onclick = function (event) {
    singleRoom.sendRefresh(true,SingleDatasets.studentId);
};

document.querySelector("#stu-camera .refSrvBtn").onclick = function (event) {
    singleRoom.sendRefresh(false,SingleDatasets.studentId);
};

document.querySelector("#faqBtn").onclick = function(e){
    singleRoom.getfaq(function(data){

    });
};

/**************************************************************
 *  被调用部分
 *************************************************************/
singleRoom.on("offline",function(data){
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
    singleRoom.initCourse(parent,cursor);

    console.log("浏览器当前缩放状态=",detectZoom());
    document.querySelector("#stu-camera .webcam-name").innerText = result.sName;
    document.querySelector("#tea-camera .webcam-name").innerText = result.tName;
    document.querySelector(".node #stu").setAttribute("userId",result.sid);
    document.querySelector(".node #tea").setAttribute("userId",result.tid);
    document.querySelector(".node #stu").setAttribute("sid",null);
    document.querySelector(".node #tea").setAttribute("sid",null);
});

singleRoom.on("user_auth_error", function(result){
    gohome("身份验证失败或课程已经结束！");
});

singleRoom.on("clock_change", function (time, text) {
    //时钟
    document.querySelector('.total-time .icon_time').innerHTML = text;
});

singleRoom.on("login",function(data){
    var div = document.querySelector(".wrapper");
    div.setAttribute("style", " -webkit-filter:grayscale(0);");
});

singleRoom.on("logout",function(text){
    var div = document.querySelector(".wrapper");
    div.setAttribute("style", " -webkit-filter:grayscale(90%);");
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

singleRoom.on("msg",function(name,userType, text, photo){
    var d = document.querySelector(".mod-msg");
    var dv = createChatItem(name, photo, text, userType == UserType.TEACHER);
    d.appendChild(dv);
    d.scrollTop = d.scrollHeight;
});

singleRoom.on("star",function(num){
    for (i = 1; i <= num; i++) {
        $("#starsList > .star" + i).addClass("on");
    }
});

singleRoom.on("add_user",function(user,id){
    if(user.userType == UserType.STUDENT){
        var audio = new Audio();
        audio.url = "assets/medias/stuin.mp3";
        audio.play();
    }else if(user.userType == UserType.TEACHER){
        var audio = new Audio();
        audio.url = "assets/medias/teain.mp3";
        audio.play();
    }
});

singleRoom.on("remove_user", function(userId,id){

});

singleRoom.on("page", function(page, total){
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

singleRoom.on("t_mouse_move",function(x,y){
    document.querySelector("#teaPoint").innerText = "T("+x+","+y+")";
});

singleRoom.on("s_mouse_move",function(x,y){
    document.querySelector("#stuPoint").innerText = "S("+x+","+y+")";
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

singleRoom.on("server_id",function(user,id){
    if(user.userType == UserType.TEACHER){
        document.querySelector(".node #tea").setAttribute("sid",id);
    }else if(user.userType == UserType.STUDENT){
        document.querySelector(".node #stu").setAttribute("sid",id);
    }
});

singleRoom.on("server_list",function(list, userType, id){
    var oldServer = null;
    var div = document.querySelector(".server");
    div.removeChild(div.children[1]);
    var select = document.createElement("select");
    select.addEventListener("change",function(event){
        var newServer = list[event.target.value];
        var title = "设定服务器";
        var text = "确认要设定老师/学生"+"教室的节点服务器吗?"+
            "\n\n设定为：" + newServer.label + "|" + newServer.domain +":"+ newServer.port+
            "\n\n确定设定后，老师/学生进入后即可使用";
        if(oldServer != null){
            title = "切换服务器";
            text = "确认要切换当前老师/学生教室的节点服务器吗?"+
                "\n\n现使用：" + oldServer.label + "|" + oldServer.domain +":"+ oldServer.port +
                "\n\n更改为：" + newServer.label + "|" + newServer.domain +":"+ newServer.port +
                "\n\n确定更换后，将断开服务端现有连接，重新接入新的服务器节点";
        }
        swal({
                title:title,
                text:text,
                type:"warning",
                showCancelButton: true,
                closeOnConfirm: false,
                confirmButtonColor: '#f44e51',
                confirmButtonText: '确认设置',
                cancelButtonText: "取消设置"
            },
            function (isConfirm) {
                if(isConfirm) {
                    singleRoom.changeServer(newServer,userType);
                    swal("服务器已更改","设置已经生效","success");
                }else{
                    console.log(list, oldServer.id);
                    singleRoom.emit("server_list",userType,list,oldServer.id);
                }
            });
    });
    div.appendChild(select);
    for(var key in list){
        var sev = list[key];
        var op = document.createElement("option");
        op.setAttribute("value",sev.id);
        op.innerText = sev.label;
        select.appendChild(op);
        if(id == sev.id){
            oldServer = sev;
            op.selected = true;
        }else if(sev.enabled){
            op.innerText = sev.label+"(默认)";
        }
        console.log(key,sev);
    }
});

//处理私有聊天消息
singleRoom.on("private_chat",function (user, text, photo, toType, popup) {
    if(user.userType == UserType.MANAGER){
        if(user.userId != singleRoom.userId){
            popup = false;
        }
    }

    if(toType.indexOf(UserType.TEACHER) !=-1 || user.userType == UserType.TEACHER){
        if(popup){
            $("#prvTChatDiv").addClass('animated bounceInDown');
            $("#prvTChatDiv").fadeIn(200);
        }

        document.querySelector("#prvTChatDiv .modal-title").innerText = "私聊  "+ user.userName;
        var d = document.querySelector("#prvTChatDiv .mod-msg");
        var dv = createChatItem(user.userName, photo, text, user.userType != UserType.TEACHER);
        d.appendChild(dv);
        d.scrollTop = d.scrollHeight;
    }

    if(toType.indexOf(UserType.STUDENT) !=-1 || user.userType == UserType.STUDENT){
        if(popup){
            $("#prvSChatDiv").addClass('animated bounceInDown');
            $("#prvSChatDiv").fadeIn(200);
        }

        document.querySelector("#prvSChatDiv .modal-title").innerText = "私聊  "+ user.userName;
        var d = document.querySelector("#prvSChatDiv .mod-msg");
        var dv = createChatItem(user.userName, photo, text, user.userType != UserType.STUDENT);
        d.appendChild(dv);
        d.scrollTop = d.scrollHeight;
    }
});

singleRoom.on("error",function(text,title,callback){
    swal({
        title:title,
        text:text,
        type:"error",
        showConfirmButton: callback !== null
    },callback);
});