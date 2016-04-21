function SingleRoom(){
    var that = this;
    this.room = 100;
    this.userId = 0;
    this.userType = UserType.MANAGER;
    this.userName = "-";
    this.lasePage = 1;

    this.server = WebServerUtils();
    this.cw = null;//Courseware(course canvas)
    this.LDraw = null;//Draw(local canvas)
    this.TDraw = null;//remove canvas
    this.SDraw = null;//remove canvas

    this.clock = null;//1秒间隔时钟
    this.userList = {};
    /********************************************
     * 事件监听
     ********************************************/
    this.server.on(RemoteEvent.OFFLINE, function(data){
        that.emit("offline",data);
        console.log("当前客户端已经下线", JSON.stringify(data));
    });

    this.server.on(RemoteEvent.RP, function(data){
        that.emit("repeat_online",data);
        console.log("重复登入", JSON.stringify(data));
    });

    this.server.on(RemoteEvent.ES, function(data){
        SingleDatasets.adminOnline = true;
        that.emit("login", data);
        that.addUser(data.userdata, data.id, data.time, SingleDatasets.device);
        console.log("登入成功",JSON.stringify(data));

        var list = data.list;
        for(var i in list) {
            that.addUser(list[i].userdata, list[i].id, list[i].time, list[i].type);
        }
    });

    this.server.on(RemoteEvent.UE, function(data){
        that.addUser(data.userdata, data.id, data.time, data.type);
        console.log("新用户进入",JSON.stringify(data));
    });

    this.server.on(RemoteEvent.UQ, function(data){
        that.removeUser(data.userdata, data.id);
        console.log("用户退出",JSON.stringify(data));
    });

    this.server.on(RemoteEvent.SHARE,function(data){
        var message = data.message;
        var user = data.userdata;
        //   console.log(RemoteEvent.SHARE,data);
        switch (message.action){
            case ShareEvent.COURSE_GRAFFITI_SWITCH:
                that.emit("drawing",message.content);
                break;
            case ShareEvent.CHAT :
                var photo = null;
                console.log(user.userType, user.userType === UserType.TEACHER);
                if(user.userType === UserType.TEACHER){
                    photo = SingleDatasets.teacherPhoto;
                }else if(user.userType === UserType.STUDENT){
                    photo = SingleDatasets.studentPhoto;
                }
                that.emit("msg",user.userName, user.userType, message.content, photo);
                break;
            case ShareEvent.GIVESTAR :
                SingleDatasets.level = Number(message.content);
                that.emit("star", SingleDatasets.level);
                break;
            case ShareEvent.COURSE_GRAFFITI_CLEAR :
                that.clearCourse(true);
                break;
            case ShareEvent.CURSOR_POSITION :
                that.remoteMouseMove(user,message.content);
                break;
            case ShareEvent.HELP :
                that.emit("helpme",message.content,user);
                break;
            case ShareEvent.COURSE_TURNPAGE :
                that.goPage(message.content);
                break;
            case ShareEvent.COURSE_CHANGE ://课件更换
                SingleDatasets.page = 1;
                that.clearCourse(true);
                that.loadCourse(message.content, SingleDatasets.page);
                break;
            case "serverId":
                that.emit("server_id",user,parseInt(message.content));
                break;
            case "privateChat":
                var photo = null;
                console.log(user.userType, user.userType === UserType.TEACHER);
                if (user.userType === UserType.TEACHER) {
                    photo = SingleDatasets.teacherPhoto;
                } else if (user.userType === UserType.STUDENT) {
                    photo = SingleDatasets.studentPhoto;
                } else {
                    photo = ResourceFile.getUserPhoto(user.photo, user.userType);
                }
                that.emit("private_chat", user, message.content, photo, message.toType,true);
                break;
        }
    });

    this.server.on('invalid_message',function(message){
        console.log("无效信息", message);
    });

    this.server.on('socket_close',function(){
        that.logout();
        console.info("远程服务已关闭");
    });

    this.server.on('socket_error',function(error){
        that.logout();
        console.info("远程服务发生错误",error);
    });
};

SingleRoom.prototype = new EventEmitter();

SingleRoom.prototype.addUser = function(user, id, time, type){
    this.userList[id] = {id:id, user:user, time:time, type:type};
    if(user.userType == UserType.STUDENT) {
        SingleDatasets.studentId = user.userId;
        SingleDatasets.studentName = user.userName;
        SingleDatasets.studentOnline = true;
    }else if(user.userType == UserType.TEACHER) {
        SingleDatasets.teacherId = user.userId;
        SingleDatasets.teacherName = user.userName;
        SingleDatasets.teacherOnline = true;
    }

    this.emit("add_user", user, id, time, type);
};

SingleRoom.prototype.removeUser = function (user, id) {
    delete this.userList[id];
    if(user.userType == UserType.STUDENT) {
        SingleDatasets.studentOnline = false;
    }else if(user.userType == UserType.TEACHER){
        SingleDatasets.teacherOnline = false;
    }

    this.emit("remove_user", user, id);
};

//断开的业务处理
SingleRoom.prototype.logout = function(){
    SingleDatasets.adminOnline = false;
    for(var key in this.userList){
        this.removeUser(this.userList[key].user, key);
    }
    this.dispose();
    this.emit("logout","已经退出");
};

SingleRoom.prototype.userVerification = function(room,id,type){
    console.log("userVerification", room, id, type);
    var that = this;
    this.room = room;
    this.userId = id;
    this.userType = type;
    SingleDatasets.room = room;
    SingleDatasets.adminId = id;
    var action = new SingleAction();
    action.checkUser(room,id,type);
    action.on(action.COMPLETE,function(data){
        that.clock = new Clock();
        that.clock.start(data.time);
        that.clock.on(that.clock.EVENT_CHANGE,function(time,text){
            SingleDatasets.time = time;
            that.clockChange(time, text);
        });

        that.clock.on(that.clock.EVENT_COMPLETE, function(time){
            console.log(time);
        });

        that.userName = data.userName;
        that.lasePage = data.lasePage;
        SingleDatasets.adminName = data.userName;
        SingleDatasets.courseId = Number(data.courseId);
        SingleDatasets.level = data.level;
        SingleDatasets.teacherId = data.tid;
        SingleDatasets.teacherName = data.tName;
        SingleDatasets.studentId = data.sid;
        SingleDatasets.studentName = data.sName;
        SingleDatasets.roomStyle = data.appro_status;
        SingleDatasets.localIP = data.cip;
        SingleDatasets.teacherPhoto = ResourceFile.getUserPhoto(data.tlogo,UserType.TEACHER);
        SingleDatasets.studentPhoto = ResourceFile.getUserPhoto(data.slogo,UserType.STUDENT);

        //日志信息
        ActionLog.record = true;
        ActionLog.userId = that.userId;
        ActionLog.userType = that.userType;
        ActionLog.userName = that.userName;

        that.emit("user_auth_pass",data);
        that.getCurrentCourseStatus();
    });

    action.on(action.ERROR,function(error){
        that.emit("user_auth_error", error);
    });
};

//1秒间隔的定时器
SingleRoom.prototype.clockChange = function(time, text){
    this.emit("clock_change", time,text);

};

//获取课程状态信息
SingleRoom.prototype.getCurrentCourseStatus = function(){
    var that = this;
    ////签到
    //var sa = new SingleAction();
    //sa.signLogin(this.room,this.userType);

    //获取课程状态信息
    var alog = new SingleAction();
    alog.getAction(this.room,this.userId, this.userType);
    alog.on(alog.COMPLETE,function(data){
        var result = data.data;
        if(result.star != null && Number(result.star)!= NaN){
            SingleDatasets.level = Number(result.star);
        }

        if(result.courseId != null && Number(result.courseId) != NaN){
            SingleDatasets.courseId = result.courseId;
        }

        if(result.page != null && Number(result.page)!= NaN){
            SingleDatasets.page = Number(result.page);
        }

        if(result.selfsev != null && Number(result.selfsev)!= NaN){
            SingleDatasets.serverId = Number(result.selfsev);
        }

        that.emit("star",SingleDatasets.level);
        that.emit("drawing",(Number(result.switch) === 1));
        console.log("课程状态", data, JSON.stringify(data));

        var vd = ActionLog.actionData(ShareEvent.CLIENT_VERSION,"Version: js1.0");
        ActionLog.sendActionLog(that.room, vd);
        //加载课件
        that.loadCourse(SingleDatasets.courseId,SingleDatasets.page);
        that.connectServer(SingleDatasets.serverId);
    });

    //历史聊天记录
    var chatlog = new SingleAction();
    chatlog.getChatLog(SingleDatasets.studentId,SingleDatasets.teacherId,null);
    chatlog.on(chatlog.COMPLETE,function(data){
        var result = data.chat;
        SingleDatasets.teacherPhoto = ResourceFile.getUserPhoto(result.tLogo, UserType.TEACHER);
        SingleDatasets.studentPhoto =  ResourceFile.getUserPhoto(result.sLogo,UserType.STUDENT);
        for(var i in result){
            var item = result[i];
            if(item.userType === null){
                that.emit("msg", null, null, item.content, null);
            }else{
                var name = "";
                var photo = null;
                if(item.userType == UserType.TEACHER){
                    name = SingleDatasets.teacherName;
                    photo = SingleDatasets.teacherPhoto;
                }else{
                    name = SingleDatasets.studentName;
                    photo = SingleDatasets.studentPhoto;
                }
                that.emit("msg", name, item.userType, item.content, photo);
            }
        }
    });
};

//获取服务器列表
SingleRoom.prototype.getServerList = function(userType, userId, sid){
    var that = this;
    var listAction = new SingleAction();
    listAction.getServerList(userType, userId);
    listAction.on(listAction.COMPLETE,function(data){
        var serverList = {};
        for(var i in data){
            var server = new Server();
            server.instance = SingleDatasets.instance;
            server.data = data[i];
            serverList[server.id] = server;
        }
        that.emit("server_list", serverList, userType, sid);
    });
};

//修改服务器
SingleRoom.prototype.changeServer = function(server,userType){
    var data = null;
    if(userType == UserType.TEACHER){
        data = ActionLog.actionData(ShareEvent.SERVER_CHANGE,server.id,SingleDatasets.teacherId,UserType.TEACHER,SingleDatasets.teacherName);
        this.server.share(ShareEvent.SERVER_CHANGE, server.id, SingleDatasets.teacherId);
    }else if(userType == UserType.STUDENT){
        data = ActionLog.actionData(ShareEvent.SERVER_CHANGE,server.id,SingleDatasets.studentId,UserType.STUDENT,SingleDatasets.studentName);
        this.server.share(ShareEvent.SERVER_CHANGE, server.id, SingleDatasets.studentId);
    }
    ActionLog.saveActionStatus(this.room,data,this.userId,this.userType);
};

//获取服务器信息并准备连接
SingleRoom.prototype.connectServer = function(serverId){
    var that = this;
    //获取服务器信息，并登陆
    var sevAction = new SingleAction();
    sevAction.getServerById(that.room,serverId);
    sevAction.on(sevAction.COMPLETE,function(data){
        SingleDatasets.server = data;
        //SingleDatasets.ws = "ws://" + data.url + ":" + data.port + SingleDatasets.instance;
        that.server.connect(SingleDatasets.ws + SingleDatasets.instance);
        that.server.on("socket_open",function(){
            var userdata = {userId:that.userId, userName:that.userName, userType:Number(that.userType)};
            that.server.join({
                room:that.room,
                userdata: userdata,
                clientIP:SingleDatasets.localIP,
                type: SingleDatasets.device
            });
        });
    });

    sevAction.on(sevAction.ERROR,function(e){
        if(sevAction.requestCount < 3){
            setTimeout(function(){
                sevAction.getServerById(that.room,serverId);
            },500);
        }else{
            that.emit("error","Unable to get server information","Server Error");
        }
    });
};

//加载课件
SingleRoom.prototype.loadCourse = function(id, page){
    //id = 700;
    var that = this;
    var courseAction = new SingleAction();
    courseAction.getCourseByPage(this.room, id, this.userType, page);
    courseAction.on(courseAction.COMPLETE,function(data){
        that.cw.currentPage = page;
        that.cw.dataProvider(data);
        that.emit("course_Complete", page, data.totalPage);
    });

    courseAction.on(courseAction.ERROR,function(err){
        if(courseAction.requestCount < 3){
            courseAction.getCourseByPage(that.room, id, that.userType, page);
        }else{
            var data = ActionLog.actionData(ShareEvent.COURSE_TURNPAGE, page + "页3次数据获取失败,课件id:" + id);
            ActionLog.sendActionLog(this.room, data);
            that.emit("error","第" + page + "页数据请求失败","数据错误");
        }
    });
};

//初始化课件区域和绘图区域
SingleRoom.prototype.initCourse = function(parent,cursor){
    var that = this;
    this.cw = new Courseware();
    this.cw.canvas = this.getCoursePanel(parent,cursor);
    this.cw.on(this.cw.EVENT_CHANGE,function(page,total){
        SingleDatasets.page = page;
        that.emit("page", page, total);
    });

    this.cw.on(this.cw.EVENT_ERROR,function(error){
        if(that.cw.requestCount < 3){
            that.goPage(SingleDatasets.page);
        }else{
            var data = ActionLog.actionData(ShareEvent.COURSE_TURNPAGE, that.cw.currentPage + "页下载失败,url:" + that.cw.url);
            ActionLog.sendActionLog(this.room, data);
            that.emit("error","第" + that.cw.currentPage + "页加载失败","加载失败");
        }
    });
};

SingleRoom.prototype.getCoursePanel = function(parent,cursor){
    var cc = document.createElement("canvas");
    cc.setAttribute("width", parent.offsetWidth);
    cc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(cc);

    var tc = document.createElement("canvas");
    tc.setAttribute("width", parent.offsetWidth);
    tc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(tc);

    var sc = document.createElement("canvas");
    sc.setAttribute("width", parent.offsetWidth);
    sc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(sc);

    var lc = document.createElement("canvas");
    lc.setAttribute("width",parent.offsetWidth);
    lc.setAttribute("height",parent.offsetHeight);
    parent.appendChild(lc);

    cursor.setAttribute("width",parent.offsetWidth);
    cursor.setAttribute("height",parent.offsetHeight);
    parent.appendChild(cursor);

    this.TDraw = new Draw();
    this.TDraw.canvas = tc;

    this.SDraw = new Draw();
    this.SDraw.canvas = sc;

    this.LDraw = new Draw();
    this.LDraw.canvas = lc;
    this.LDraw.sync = false;
    this.LDraw.drawing = true;
    this.LDraw.lineColor = "yellow";
    this.LDraw.ratio = SingleDatasets.draws.zoom;
    this.LDraw.offsetX = SingleDatasets.draws.offsetX;
    this.LDraw.offsetY = SingleDatasets.draws.offsetY;
    return cc;
};

SingleRoom.prototype.clearCourse = function(auth){
    if(this.LDraw){
        this.LDraw.clearRect();
    }

    if(auth){
        if(this.TDraw){
            this.TDraw.clearRect();
        }
        if(this.SDraw){
            this.SDraw.clearRect();
        }
    }
    this.emit("clear_rect");
};

SingleRoom.prototype.remoteMouseMove = function(user, data){
    if(user.userType === UserType.TEACHER){
        if(data.type === "strat"){
            this.TDraw.startLine(data.x, data.y, data.width, data.color);
        }else if(data.type === "move"){
            if(data.mouseDown){
                this.TDraw.drawLine(data.x,data.y);
            }
            //仅显示鼠标位置
            this.emit("t_mouse_move", data.x, data.y);
        }else if(data.type === "end"){
            this.TDraw.endLine();
        }

    }else if(user.userType === UserType.STUDENT){
        if(data.type === "strat"){
            this.SDraw.startLine(data.x, data.y, data.width, data.color);
        }else if(data.type === "move"){
            if(data.mouseDown){
                this.SDraw.drawLine(data.x, data.y);
            }
            //仅显示鼠标位置
            this.emit("s_mouse_move", data.x, data.y);
        }else if(data.type === "end"){
            this.SDraw.endLine();
        }
    }
};

SingleRoom.prototype.setRatio = function(ratio,offsetX,offsetY){
    SingleDatasets.draws.zoom = ratio;
    SingleDatasets.draws.offsetX = offsetX;
    SingleDatasets.draws.offsetY = offsetY;
    if(this.LDraw){
        this.LDraw.ratio = ratio || 1;
        this.LDraw.offsetX = offsetX;
        this.LDraw.offsetY = offsetY;
    }
};

SingleRoom.prototype.setDraw = function(width,color){
    this.LDraw.lineWidth = width || this.LDraw.lineWidth;
    this.LDraw.lineColor = color || this.LDraw.lineColor;
};

SingleRoom.prototype.sendPage = function(p){
    var page = 1;
    if(p>0){
        page = this.cw.nextPage();
    }else{
        page = this.cw.prevPage();
    }

    SingleDatasets.page = page;
    this.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
    return page;
};

SingleRoom.prototype.goPage = function(page){
    this.cw.load(page);
    SingleDatasets.page = page;
    this.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
};

SingleRoom.prototype.offline = function(data){
    if(this.server){
        this.server.offline(data);
    }
};

//断开服务器
SingleRoom.prototype.dispose = function(){
    if(this.clock){
        this.clock.stop();
    }

    if(this.server){
        this.server.close();
    }
};

SingleRoom.prototype.goToPage = function(path){
    window.location.href = SingleDatasets.url + path;
};

//发送私聊
SingleRoom.prototype.sendPrvChat = function(userType,text){
    if(this.server){
        this.server.share("privateChat",text,null,userType,true);
    }
};

SingleRoom.prototype.sendRefresh = function(refresh,userId){
    if(this.server){
        this.server.share("refreshPage",refresh, userId,null);
    }
};

SingleRoom.prototype.getfaq = function(callback){
    var action = new SingleAction();
    action.getFaqCount(this.room, SingleDatasets.teacherId, UserType.TEACHER);
    action.on(action.COMPLETE, callback);
};