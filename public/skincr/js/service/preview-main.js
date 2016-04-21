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
    singleRoom.clearCourse();
};

document.querySelector("#preButton").onclick = function(event){
    singleRoom.sendPage(-1);
};

document.querySelector("#nextButton").onclick = function(event){
    singleRoom.sendPage(1);
};

/**************************************************************
 *  被调用部分
 *************************************************************/
singleRoom.on("offline",function(data){
    var text = "您的账号"
        + getFormatDate(data.time)
        + "已在" + devInfo(data.type)+"上成功登陆！";
    singleRoom.emit("error",text,"下线通知");
});

singleRoom.on("reject_online",function(data){
    var text = "连接数已达上限，无法进入教室，请稍后重试！";
    singleRoom.emit("error",text,"提示");
});

singleRoom.on("repeat_online", function(data){
    var text ="" ;"您已在下列客户端登陆:";
    for(var i in data){
        text += getFormatDate(data[i].time)
            + "在" + devInfo(data[i].type) + "上登录\n";
    }
    text +="\n如果确认登入，则会断开其他客户端！";
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
});

singleRoom.on("user_auth_error", function(result){
    gohome("身份验证失败或课程已经结束！");
});

singleRoom.on("clock_change", function (time, text) {
    //时钟
    document.querySelector('.total-time .icon_time').innerHTML = text;
});

//接入服务器成功
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
        Alert.show("涂鸦已经开启 <br/> 现在可以和老师一起画画吧","success",1500);
        $("#student-drowbord").removeClass("off");
    }else{
        Alert.show("涂鸦已经关闭，耐心听老师讲课哦~","error",1500);
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
    Alert.show("画板已经清除干净！","success",1500);
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