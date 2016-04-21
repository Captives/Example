function BaseAction(){
    this.OPEN = "open";
    this.ERROR = "error";
    this.COMPLETE = "complete";
    this.requestCount = 0;
}

BaseAction.prototype = new EventEmitter();
/**
 * 请求php的接口
 * @param type      php的方法名称
 * @param data      请求数据
 * @param method    请求方法类型
 */
BaseAction.prototype.send = function(type, data, method){
    this.requestCount += 1;
    data.action = type ||"";
    this.sendAction("action",data,method);
};

/**
 * 向node服务发送HTTP请求
 * @param url       Node服务监听
 * @param type      事件类型,自定义
 * @param data      数据
 * @param method    请求方法类型
 */
BaseAction.prototype.sendAction = function(url, data, method){
    method = method || "POST";
    url = "/" + url || "action";
    var options = {type:method, data:data, url:url};
    var that = this;
    this.action(options, function(text){
        var json = JSON.parse(text);
        if(json){
           // console.log(json,json.error);
            if(json.error){
                console.log(json.error);
                that.emit(that.ERROR, new Error(text));
            }else{
                that.requestCount = 0;
                that.emit(that.COMPLETE,json);
            }
        }else{
            that.emit(that.ERROR, new Error("返回值为空"));
            console.warn(JSON.stringify(data),"返回值为空");
        }
    },function(error){
        that.emit(that.ERROR, error);
    },function(){
        that.emit(that.OPEN);
    });
};

BaseAction.prototype.action = function(options,completeCallBack,faildCallBack, openCallBack){
    $.ajax({
        //提交数据的类型 POST GET
        type:options.type || "POST",
        //提交的网址
        url:options.url || "/action",
        //提交的数据
        data: options.data,
        //返回数据的格式
        datatype: options.datatype || "text",//"xml", "html", "script", "json", "jsonp", "text".
        //在请求之前调用的函数
        beforeSend:openCallBack,
        //调用成功返回的数据
        success: completeCallBack,
        //调用执行后调用的函数
        complete: function(XMLHttpRequest, textStatus){
            //   console.log(textStatus);
            //  console.log(XMLHttpRequest.responseText);
        },
        //调用出错执行的函数
        error:faildCallBack
    });
};

/********************************************************
 *
 *      日志服务 数据接口
 *
*********************************************************/

var ActionLog = {
    userId:0,
    tuserType :0,
    userName : "-",
    //~~~~~~~~~~~~~~~~~~~ 权限  ~~~~~~~~~~~~~~~~~~~~~
    //动作记录是否记录到服务器上
    record:false,
    //
    sendActionLog:function(room, data, userId, userType, userName){
        if(this.record) {
            userId = userId || this.userId;
            userType = userType || this.userType;
            userName = userName || this.userName;
            var ac = new BaseAction();
            var d = {
                roomId: room,
                userId: userId,
                userType: userType,
                userName: userName,
                toActionType: data.actionType,
                toUserId: data.userId,
                toUserType: data.userType,
                toUserName: data.userName,
                toContent: data.content
                //dataSet:JSON.stringify(data)
            };
            ac.send("actionLog", d);
        }
    },
    saveActionStatus:function(room, data, userId, userType){
        if(this.record) {
            userId = userId || this.userId;
            userType = userType || this.userType;
            var ac = new BaseAction();
            var d = {
                roomId: room,
                userId: userId,
                userType: userType,
                toActionType: data.actionType,
                toUserId: data.userId,
                toUserType: data.userType,
                toUserName: data.userName,
                toContent: data.content
            };
            ac.send("actionStatus", d);
        }
    },

    /**
     * 包装一条被记录的信息,如果被记录的信息是自己的，那么userId,userType,userName可为空
     * @param actionType    被记录信息的类型，取值范围在ShareEvent对象中
     * @param content       被记录的信息内容
     * @param userId        记录信息的归属者
     * @param userType      记录信息的归属者
     * @param userName      记录信息的归属者
     * @returns {{actionType: *, content: *, userId: *, userType: *, userName: *}}
     */
    actionData:function(actionType, content, userId, userType, userName){
        userId = userId || this.userId;
        userType = userType || this.userType;
        userName = userName || this.userName;
        return {
            actionType : actionType,
            content : content,
            userId : userId,
            userType : userType,
            userName : userName
        }
    }
};

/********************************************************
 *
 *      服务监控 数据接口
 *
*********************************************************/
function MonitorService(){

}
MonitorService.prototype = new BaseAction();
MonitorService.prototype.getSocketlist = function(){
    this.sendAction("list");
};

MonitorService.prototype.offline = function(socketId){
    this.sendAction("list/offline",{id:socketId});
};

/********************************************************
 *
 *      一对一 数据接口
 *
*********************************************************/
function SingleAction(){

}

SingleAction.prototype = new BaseAction();
//获取服务器列表
SingleAction.prototype.getServerList = function(userType,userId){
    var data = {userType:userType, userId:userId};
    this.send("getServerList", data);
};

//获取指定服务器信息，room不给则不分配端口,使用默认的
SingleAction.prototype.getServerById = function(room,id){
    var data = {roomId:room, serverId:id};
    this.send("getServerById", data);
};

SingleAction.prototype.networkLicense = function(userId,userType){
    var data = {userId:userId, userType:userType};
    this.send("isNeedRetest",data);
};
//保存测网
SingleAction.prototype.saveTestNet = function(userId,userType,data,text){
    var data = {userId:userId, userType:userType, dataSet:data, report:text};
    this.send("saveTestNet",data);
};

//校验登陆
SingleAction.prototype.checkUser = function(room, id, type){
    var data = {roomId:room,userId:id, userType:type};
    this.send("classMessage",data);
};

//签到
SingleAction.prototype.signLogin = function(room,userType){
    console.log("signLogin",room,userType);
    var data = {roomId:room, userType:userType};
    this.send("classBegin",data);
};

//课程状态
SingleAction.prototype.getAction = function(room, userId, userType){
    var data = {roomId:room, userId:userId, userType:userType};
    this.send("getActionLog", data);
};

SingleAction.prototype.getCourseList = function(room,userType){
    var data = {roomId:room, userType:userType};
    this.send("courseList", data);
};

//获取指定页码的课件
SingleAction.prototype.getCourseByPage = function(room,courseId,userType,page){
    var data = {roomId:room, courseId:courseId, userType:userType,page:page};
    this.send("courseByid", data);
};

//获取任意两者之间的历史对话
SingleAction.prototype.getChatLog = function(sid,tid,aid){
    var data = {studentId:sid, teacherId:tid, adminId:aid};
        this.send("getChatData", data);
};

//获取教室内监控对学生的备注信息
SingleAction.prototype.getClassTips = function(room, userid, userType){
    var data = {roomId:room, userId:userid, userType:userType};
    this.send("getRemind",data);
};

//获取指定课件的教参
SingleAction.prototype.getReferenceById = function(id, userType){
    var data = {courseId:id, userType:userType};
    this.send("getReference", data);
};

//学生发送点评
SingleAction.prototype.sendReviewMessageFromStudent = function(room, num, message){
    var data = {roomId:room, level:num, content:message};
    this.send("cTeacher", data);
};

//老师奖励星星
SingleAction.prototype.giveStar = function(room, studentId){
    var data = {roomId:room, studentId:studentId};
    this.send("classStar", data);
};

//老师结束课程
SingleAction.prototype.sendClassOver = function(room){
    var data = {roomId:room};
    this.send("classOver", data);
};

//保存书签
SingleAction.prototype.sendBookmark = function(room, courseId, lastPage){
    var data = {roomId:room, courseId:courseId, lastPage:lastPage};
    this.send("saveBookmark", data);
};

//老师结束课程
SingleAction.prototype.seeTeacherToDo = function(room, userId){
    var data = {roomId:room, userId:userId};
    this.send("seeTeacherToDo", data);
};

//获取下节课
SingleAction.prototype.getNextCourse = function(userId,userType){
    var data = {userId:userId, userType:userType};
    this.send("nextCourse", data);
};

//获取这节课中，老师还剩余被提问的次数
SingleAction.prototype.getFaqCount = function (room, userId, userType) {
    var data = {roomId:room, userId:userId, userType:userType};
    this.send("faqCount", data);
};

//保存下载速度
SingleAction.prototype.saveDownloadSpeed = function(room, userId, userType, url, time){
    var data = {roomId:room, userId:userId, userType:userType, url:url, time:time};
    this.send("downloadSpeed", data);
};

SingleAction.prototype.saveUserDevices = function(userId,userType,camera,microphone){
    var data = {userId:userId, userType:userType, camera:camera, microphone:microphone};
    this.send("saveUserDevices", data);
};
