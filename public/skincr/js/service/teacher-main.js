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
}

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

$('#prvChatDiv > .modal-header >.close').click(
    function(){
        $("#prvChatDiv").fadeOut(200);
        $("#prvChatDiv").removeClass('animated');
        $("#prvChatDiv").removeClass('bounceInDown');
    }
);

$('#courseList > .modal-header >.close').click(
    function(){
        $("#courseList").fadeOut(300);
        $("#courseList").removeClass('fadeInUp');
        $("#courseList").addClass('animated');
        $("#courseList").addClass('fadeOutDown');
    }
);

/**************************************************************/
//涂鸦开关
document.querySelector("#switchButton").onchange = function(event){
    if(event.target.checked == true){
        swal({
            title:"涂鸦打开",
            text:"学生涂鸦已经开启，现在可以一起绘图了!",
            type:"success",
            timer:1500,
            showConfirmButton: false
        });
    }else{
        swal({
            title:"涂鸦关闭",
            text:"学生涂鸦已经关闭，您不能看到学生的涂鸦痕迹!",
            type:"error",
            timer:1500,
            showConfirmButton: false
        });
    }

    singleRoom.drawStatus(event.target.checked);
};

//教室刷新
document.querySelector('.btn-refresh button').onclick = function (event) {
    swal({
            title: "Refresh",
            text: "Are you sure refresh Classroom?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            confirmButtonText: 'Yes, refresh it!',
            animation: "slide-from-top",
            closeOnConfirm: false
        },
        function () {
            reload();
        });
};

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

////清除涂鸦
document.querySelector(".btn-eraser button").onclick = function(event){
    swal({
        title:"Clear Complete",
        text:"Sketchpad cleanup is complete!",
        type:"success",
        timer:1500,
        showConfirmButton: false
    });
    singleRoom.sendClean();
    singleRoom.clearCourse();
};

document.querySelector("#starButton").onclick = function(event){
     singleRoom.sendStar();
};

document.querySelector("#preButton").onclick = function(event){
    singleRoom.sendPage(-1);
};

document.querySelector("#nextButton").onclick = function(event){
    singleRoom.sendPage(1);
};

//设置书签
document.querySelector(".btn-bookmark button").onclick = function(event){
    var text = "You finished Page " + SingleDatasets.page + " of this book.";
    var title = "Create Bookmark?";
    if(SingleDatasets.page != singleRoom.bookmarkNum){
        text = "Confirm the completion of " + singleRoom.bookmarkNum + " pages to modify "
            + SingleDatasets.page + " pages?";
        title = "Modify the bookmark";
    }
    swal({
            title: title,
            text: text,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            cancelButtonText: "No, unset",
            confirmButtonText: 'Confirm Settings',
            animation: "slide-from-bottom",
            closeOnConfirm: false
        },
        function () {
            singleRoom.setBookmark();
            swal({
                title:"Create complete",
                text:"The bookmark has been set on the " + singleRoom.bookmarkNum + " page",
                type:"success"
            });
        });
};

document.querySelector("#courseChangeBtn").onclick = function(event){
    singleRoom.getCourseList();
};

//下课
document.querySelector('.btn-classover button').onclick = function (event) {
    singleRoom.finishClass();
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
    console.log("浏览器当前缩放状态=",detectZoom());
    document.querySelector(".webcam-name").innerText = result.sName;

    var lv = document.querySelector("#liveVideo");
    lv.autoplay = true;
    lv.width = 100;
    lv.height = 75;
    lv.volume = 0;
    singleRoom.createStream(lv);
    singleRoom.initCourse(parent,cursor);
});

singleRoom.on("user_auth_error", function(result){
    var text = "The classroom has been closed,or you are not a teacher in this class \n"
        + "You need help,Please call 021 3158-6855";
    gohome("身份验证失败或课程已经结束！",SingleDatasets.url + "teacher/home/");
});

var helpCount = 0;
var helpStart = false;
var nextLastTime = 0;
var nextClassStart = false;
singleRoom.on("clock_change", function (time, text) {
    //时钟
    document.querySelector('.total-time .icon_time').innerHTML = text;
   // 帮助禁用倒计时
    if(helpStart){
        helpCount --;//
        document.querySelector("#helpButton").disabled = true;
        document.querySelector("#helpButton").setAttribute("href","javascript:void(0);");
        document.querySelector("#helpButton .icon_message").innerText ="HELP(" + helpCount +")";
        document.querySelector("#helpButton").setAttribute("data-hint","Already call, please wait "+helpCount +"s");
    }

    if(helpCount <= 0 && helpStart === true){
        helpStart = false;
        document.querySelector("#helpButton").disabled = false;
        document.querySelector("#helpButton").setAttribute("href","skincr/module/helpTea.html");
        document.querySelector("#helpButton .icon_message").innerText ="HELP";
        document.querySelector("#helpButton").setAttribute("data-hint","Request support");
    }

    //下节课开始倒计时
    if(nextClassStart){
        var ldiv = document.getElementById("lastTimeTip");
        if(!ldiv){
            popTips("lastTimeTip","",true,0,function(event){
                nextClassStart = false;
            });
            ldiv = document.getElementById("lastTimeTip");
        }
        var lastText = "";
        nextLastTime--;
        if(nextLastTime >= 0){
            if(nextLastTime >60){
                lastText = formatTimes(nextLastTime) +" min";
            }else{
                lastText = nextLastTime + " sec";
            }

            ldiv.innerText =  "Your next class is in " + lastText +" seconds, " +
                "Please finish this class on time.";
        }else{
            if(nextLastTime >-60){
                lastText = Math.abs(nextLastTime) + " sec";
            }else{
                lastText = formatTimes(Math.abs(nextLastTime)) +" min";
            }

            ldiv.innerText =  "You are late for the next class about " + lastText +
                " Please enter into the next classroom ASAP."
        }
    }

    //下课提示
    if(SingleDatasets.timeLength * 60 === time){
        var endTip = "Before the class was over, Please say the following " +
            "things to make the kid like dadaabc,thanks " + singleRoom.userName + "," +
            "your did a very good job today! I like you very much, hope to see you " +
            "again in dadaabc. See you next time.";
        popTips("endTips"+Date.now(),endTip,true,1000*30);
    }
});
//下节课时间预报
singleRoom.on("next_class_time",function(lastTime,time){
    nextLastTime = lastTime;
    nextClassStart = true;
});

//接入服务器成功
singleRoom.on("login",function(data){
    var html = document.getElementsByTagName("html");
    html[0].setAttribute("style"," -webkit-filter:grayscale(0);");
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
   html[0].setAttribute("style"," -webkit-filter:grayscale(90%);");
});

var comment = null;
var reference_text = null;
singleRoom.on("class_tip",function(timeLength, remind, data){
    comment = data;
    document.querySelector("#timeth").innerHTML = timeLength;
    document.querySelector(".lesson-time").setAttribute("data-hint","This lesson is " + timeLength + " minutes");
    document.querySelector(".courseware-tips .tiptext").innerText = "Student " + SingleDatasets.studentName
                        + " - the progress of last class:《"
                        + data.c_name_en + "-" + data.c_c_name_en + "》"
                        + " finished at page "+ data.page_end
                        + ". Teacher: " + singleRoom.userName;

    if(remind != null && remind != ""){
        document.querySelector(".mod-warning p").innerText = remind;
    }else{
        document.querySelector(".mod-warning p").innerText = "No notes from DaDaABC for this class!";
        //document.querySelector(".mod-warning").parentNode.removeChild(document.querySelector(".mod-warning"));
    }
});

//Teacher's Plan
singleRoom.on("reference",function(text){
    if(text ==null || text==""){
        reference_text = "No plan information";
    }else{
        reference_text = text;
    }
});

//下课
singleRoom.on("class_over",function(){
    swal({
            title: "You will class over?",
            text: "If you click 'Class Over', you can’t enter classroom again. Are you sure to do that?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            confirmButtonText: 'Class Over',
            closeOnConfirm: false
        },
        function () {
            singleRoom.classOver();
            swal("Class over", "Your imaginary file has been deleted!", "success");
        }
    );
});
//书签
singleRoom.on("bookmark",function(page){
    swal({
            title: "书签设置在第" + page + "页?",
            text: "准确写下你今天完成的页码，否则不能完成这节课程，无法得到相应的报酬",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#f44e51',
            confirmButtonText: '是的,设置正确',
            cancelButtonText: "错误，更该设置",
            animation: "slide-from-top",
            closeOnConfirm: false,
        },
        function (isConfirm) {
            if(isConfirm){
                singleRoom.emit("class_over");
            }
        });
});

//未到下课时间
singleRoom.on("class_not_over", function(){
    var text = "The Class time is less than " + SingleDatasets.timeLength + " minutes," +
        " you shouldn't click Class Over.\n If student didn't show up, please wait in the classroom.";
    swal({title:"Can not class",text:text,type:"warning"});
});

singleRoom.on("helpme",function(type){
    swal({
        title:"The students call for help",
        text:"The student has called for help ,please wait...",
        type:"success",
        timer:2000,
        showConfirmButton: false
    });
});

singleRoom.on("drawing",function(selected){
    document.querySelector("#switchButton").checked = selected;
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
        if (i >= 5) {
            $("#starButton").removeClass("on").addClass("off");
            $("#starButton").parent().attr("data-hint", "你加的星星也是够了,歇歇吧!!");
        }
    }
});

singleRoom.on("add_user", function (user, id) {
    if (user.userType == UserType.STUDENT) {
        $(".webcam-name").removeClass("offline");
        var audio = new Audio();
        audio.url = "assets/medias/stuin.mp3";
        audio.play();
    }
});

singleRoom.on("remove_user", function (user, id) {
    if (user.userType == UserType.STUDENT) {
        $(".webcam-name").addClass("offline");
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
    document.querySelector("#stuPoint").innerText = "S("+x+","+y+")";
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

singleRoom.on("faq",function(text, user){
    popTips("faq" + Date.now, "Course Consultant say:\n" + text, true);
});

singleRoom.on("private_chat",function (name, userType, text, photo,popup) {
    if(popup){
        $("#prvChatDiv").addClass('animated bounceInDown');
        $("#prvChatDiv").fadeIn(200);
        movePanel($("#prvChatDiv"));
    }

    document.querySelector("#prvChatDiv .modal-title").innerText = "Chat with "+ name;
    var d = document.querySelector("#prvChatDiv .mod-msg");
    var dv = createChatItem(name, photo, text, userType == singleRoom.userType);
    d.appendChild(dv);
    d.scrollTop = d.scrollHeight;
});

//添加课件元素
singleRoom.on("add_course",function(list,def,id){
    $("#courseList").removeClass('fadeOutDown');
    $("#courseList").fadeIn(200);
    $("#courseList").addClass('animated');
    $("#courseList").addClass('fadeInUp');
    var parent = $(".couresware-list");
    parent.empty();
    for(var i in list){
        var data = list[i];

        var li = document.createElement("li");
        var label = document.createElement("label");
        li.setAttribute("id", data.id);
        if(data.id == def){//约课课件
            li.setAttribute("class","original");
            label.innerText = "Original<br>Couresware";
            li.appendChild(label);
        }

        if(data.id == id){//当前课件
            li.setAttribute("class","current");
            label.innerHTML = "Current<br>Couresware";
            li.appendChild(label);
        }

        var img = document.createElement("img");
        img.src = data.cover;
        li.appendChild(img);

        var p = document.createElement("p");
        p.setAttribute("class","name");
        p.innerText = data.label;
        li.appendChild(p);
        parent.append(li);

        li.onclick = function(event){
            var cid = event.currentTarget.id;
            swal({
                title: "切换课件",
                text: "切换课件到" + event.currentTarget.innerText,
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#f44e51',
                confirmButtonText: '是的,切换到该课件',
                cancelButtonText: "取消切换",
                animation: "slide-from-top",
                closeOnConfirm: false,
            },function(isConfim){
                if(isConfim){
                    swal("请求已发送",""+ cid,"success");
                    singleRoom.shareChangeCourse(cid);
                    document.querySelector("#courseList .close").click(new MouseEvent("onclick"));
                }
            });
        }
    }
});

//刷新页面
singleRoom.on("refresh_page",function(){
    reload();
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
/**
 * 课件上消息提示
 * @param cId
 * @param text
 * @param showClose
 * @param timer
 * @test popTips("c"+Math.random().toFixed(2),"涂鸦清除结束"+Date.now(),false,5000);
 */
function popTips(cId, text, showClose, timer, callback){
    var parent = document.querySelector(".courseware .alertbox");

    var art = document.createElement("article");
    art.setAttribute("class","alert fade in");

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

document.querySelector(".color.red").onclick = function (event) {
    popTip("General tips", "info" + Date.now(), "info", null, true);
    popTip("The warning", "error" + Date.now(), "error", null, true, 3000);
    popTip("Error message", "warning" + Date.now(), "warning", null, false, 5000);
    popTip("Teacher webcam has been closed", "success" + Date.now(), "success", null, true);
};

document.querySelector(".color.orange").onclick = function (event) {

};

document.querySelector(".color.blue").onclick = function (event) {
    var parent = document.querySelector(".tips-content");
    var item = document.createElement("div");
    var id = "tips"+Date.now();
    item.setAttribute("id",id);
    item.setAttribute("class","tips animated fadeInUp");
    item.innerHTML = "<h1>测试文本</h1>";
    parent.appendChild(item);
    $("#"+id).fadeIn(1200);
    setTimeout(function(){
        parent.removeChild(item);
    },3000);
};

