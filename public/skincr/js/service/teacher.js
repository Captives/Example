function SingleRoom() {
    var that = this;
    this.room = 100;
    this.userId = 0;
    this.userType = UserType.TEACHER;
    this.userName = "-";
    /**上节课的最后一页 ***/
    this.lasePage = 1;

    this.bookmarkNum = 1;

    this.server = WebServerUtils();
    this.cw = null;//Courseware(course canvas)
    this.LDraw = null;//Draw(local canvas)
    this.RDraw = null;//remove canvas
    this.clock = null;//1秒间隔时钟
    this.userList = {};
    /********************************************
     * 事件监听
     ********************************************/
    this.server.on(RemoteEvent.OFFLINE, function (data) {
        that.emit("offline", data);
        console.log("当前客户端已经下线", JSON.stringify(data));
    });

    this.server.on(RemoteEvent.RP, function (data) {
        that.emit("repeat_online", data);
        console.log("重复登入", JSON.stringify(data));
    });

    this.server.on(RemoteEvent.ES, function (data) {
        SingleDatasets.adminOnline = true;
        that.emit("login", data);
        console.log("登入成功", JSON.stringify(data));

        var list = data.list;
        for (var i in list) {
            that.addUser(list[i].userdata, list[i].id, list[i].time);
        }

        that.server.createPeerConnections(that.userList);
    });

    this.server.on(RemoteEvent.UE, function (data) {
        that.addUser(data.userdata, data.id, data.time);
        that.server.createPeerConnection(data.id, data.userdata);
        console.log("新用户进入", JSON.stringify(data));
    });

    this.server.on(RemoteEvent.UQ, function (data) {
        that.server.closePeerConnection(data.id);
        that.removeUser(data.userdata, data.id);
        console.log("用户退出", JSON.stringify(data));
    });

    this.server.on(RemoteEvent.SHARE, function (data) {
        var message = data.message;
        var user = data.userdata;
        that.shareEvent(message.action, message.content, user);
    });

    this.server.on("addstream", function (stream, wid, user) {
        console.log("新视频接入", stream, wid, JSON.stringify(user));
        that.emit("add_stream", stream, wid, user);
    });

    this.server.on('invalid_message', function (message) {
        console.log("无效信息", message);
    });

    this.server.on('socket_close', function () {
        SingleDatasets.teacherOnline = false;
        console.info("远程服务已关闭");
        that.emit("logout", "已经退出");
    });

    this.server.on('socket_error', function (error) {
        SingleDatasets.teacherOnline = false;
        console.info("远程服务发生错误", error);
        that.emit("logout", "已经退出");
    });

    this.on("faq", function (text, user) {
        var data = ActionLog.actionData(ShareEvent.FAQ_COUNT, text);
        ActionLog.sendActionLog(that.room, data, user.userId, user.userType, user.userName);
    });
};

SingleRoom.prototype = new EventEmitter();

SingleRoom.prototype.addUser = function (user, id, time) {
    this.userList[id] = {id: id, user: user, time: time};
    if (user.userType == UserType.STUDENT) {
        SingleDatasets.studentId = user.userId;
        SingleDatasets.studentName = user.userName;
        SingleDatasets.studentOnline = true;
    }
    this.server.share("serverId", SingleDatasets.serverId);
    this.server.share(ShareEvent.COURSE_TURNPAGE, SingleDatasets.page);

    this.emit("add_user", user, id, time);
};

SingleRoom.prototype.removeUser = function (user, id) {
    delete this.userList[id];
    if (user.userType == UserType.STUDENT) {
        SingleDatasets.studentOnline = false;
    }
    this.emit("remove_user", user, id);
};

SingleRoom.prototype.createStream = function (video, option) {
    var that = this;
    this.server.initMediaStream({
            video: {width: 320, height: 240},
            audio: true
        }, function (stream) {
            that.server.attachStream(stream, video);
            that.getCurrentCourseStatus();
        }, function (error) {

        }
    );
};

SingleRoom.prototype.viewStream = function (stream, video) {
    this.server.attachStream(stream, video);
};

SingleRoom.prototype.shareEvent = function (action, content, user) {
    switch (action) {
        case ShareEvent.COURSE_GRAFFITI_SWITCH:
            this.emit("drawing", content);
            break;
        case ShareEvent.CHAT :
            var photo = null;
            console.log(user.userType, user.userType === UserType.TEACHER);
            if (user.userType === UserType.TEACHER) {
                photo = SingleDatasets.teacherPhoto;
            } else if (user.userType === UserType.STUDENT) {
                photo = SingleDatasets.studentPhoto;
            }
            this.emit("msg", user.userName, user.userType, content, photo);
            break;
        case ShareEvent.GIVESTAR :
            SingleDatasets.level = Number(content);
            this.emit("star", SingleDatasets.level);
            break;
        case ShareEvent.COURSE_GRAFFITI_CLEAR :
            this.clearCourse();
            break;
        case ShareEvent.CURSOR_POSITION :
            this.remoteMouseMove(content);
            break;
        case ShareEvent.HELP :
            this.emit("helpme", content, user);
            break;
        case ShareEvent.FAQ_COUNT :
            this.emit("faq", content, user);
            break;
        case ShareEvent.SERVER_CHANGE:
            swal("服务器更改", JSON.stringify(user) + "\n" + content, "warning");
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
            this.emit("private_chat", user.userName, user.userType, content, photo, true);
            break;
        case "refreshPage":
            if (content) {
                this.emit("refresh_page");
            } else {
                this.emit("refresh_server");
            }
            break;
    }
};

SingleRoom.prototype.userVerification = function (room, id, type) {
    console.log("userVerification", room, id, type);
    var that = this;
    this.room = room;
    this.userId = id;
    this.userType = type;
    SingleDatasets.room = room;
    var action = new SingleAction();
    action.checkUser(room, id, type);
    action.on(action.COMPLETE, function (data) {
        console.log("验证成功", data);
        that.clock = new Clock();
        that.clock.start(data.time);
        that.clock.on(that.clock.EVENT_CHANGE, function (time, text) {
            SingleDatasets.time = time;
            that.clockChange(time, text);
        });

        that.clock.on(that.clock.EVENT_ERROR, function (error) {
            //Alert.show("您调整了计算机时钟，请刷新重进教室","时钟被更新");
            //that.clock.stop();
        });

        that.clock.on(that.clock.EVENT_COMPLETE, function (time) {
            console.log(time);
        });

        that.userName = data.tName;
        that.lasePage = data.lasePage;
        SingleDatasets.courseId = Number(data.courseId);
        SingleDatasets.level = Number(data.level);
        SingleDatasets.teacherName = data.tName;
        SingleDatasets.studentName = data.sName;
        SingleDatasets.teacherId = data.tid;
        SingleDatasets.studentId = data.sid;
        SingleDatasets.roomStyle = data.appro_status;
        SingleDatasets.localIP = data.cip;
        SingleDatasets.teacherPhoto = ResourceFile.getUserPhoto(data.logo, that.userType);

        //日志信息
        ActionLog.record = true;
        ActionLog.userId = that.userId;
        ActionLog.userType = that.userType;
        ActionLog.userName = that.userName;

        that.emit("user_auth_pass", data);
        //that.getCurrentCourseStatus();
    });

    action.on(action.ERROR, function (error) {
        that.emit("user_auth_error", error);
    });
};

//1秒间隔的定时器
SingleRoom.prototype.clockChange = function (time, text) {
    this.emit("clock_change", time, text);
    if (time > 0) {
        //距离下课还有1分钟
        if (SingleDatasets.timeLength * 60 - 60 == time) {
            this.checkNextClass();
        }

        if (time % 60 == 0 && ActionLog.record == true) {//&& this.checked == true
            //定时校验查询服务器
            //this.checkServer();
        }
    }
};

//获取课程状态信息
SingleRoom.prototype.getCurrentCourseStatus = function () {
    var that = this;
    //签到
    var sa = new SingleAction();
    sa.signLogin(this.room, this.userType);
    //获取课程状态信息
    var alog = new SingleAction();
    alog.getAction(this.room, this.userId, this.userType);
    alog.on(alog.COMPLETE, function (data) {
        var result = data.data;
        if (result.star != null && Number(result.star) != NaN) {
            SingleDatasets.level = Number(result.star);
        }

        if (result.courseId != null && Number(result.courseId) != NaN) {
            SingleDatasets.courseId = result.courseId;
        }

        if (result.page != null && Number(result.page) != NaN) {
            SingleDatasets.page = Number(result.page);
        }

        if (result.audio !== null && Number(result.audio) != NaN) {
            SingleDatasets.gain = Number(result.audio);
        }

        if (result.camera != null) {
            SingleDatasets.camera = JSON.stringify(result.camera);
        }

        if (result.microphone != null) {
            SingleDatasets.microphone = JSON.stringify(result.mic);
        }

        if (result.selfsev != null && Number(result.selfsev) != NaN) {
            SingleDatasets.serverId = Number(result.selfsev);
        }

        that.emit("star", SingleDatasets.level);
        that.emit("drawing", (Number(result.switch) === 1));
        console.log("课程状态", data, JSON.stringify(data));

        var vd = ActionLog.actionData(ShareEvent.CLIENT_VERSION, "Version: js1.0");
        ActionLog.sendActionLog(that.room, vd);
        //加载课件
        that.getReference(SingleDatasets.courseId);
        that.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
        that.connectServer(SingleDatasets.serverId);
    });

    //历史聊天记录
    var chatlog = new SingleAction();
    chatlog.getChatLog(SingleDatasets.studentId, this.userId, null);
    chatlog.on(chatlog.COMPLETE, function (data) {
        var result = data.chat;
        console.log(result);
        SingleDatasets.teacherPhoto = ResourceFile.getUserPhoto(result.tLogo, UserType.TEACHER);
        SingleDatasets.studentPhoto = ResourceFile.getUserPhoto(result.sLogo, UserType.STUDENT);
        for (var i in result) {
            var item = result[i];
            if (item.userType === null) {
                that.emit("msg", null, null, item.content, null);
            } else {
                var name = "";
                var photo = null;
                if (item.userType == UserType.TEACHER) {
                    name = SingleDatasets.teacherName;
                    photo = SingleDatasets.teacherPhoto;
                } else {
                    name = SingleDatasets.studentName;
                    photo = SingleDatasets.studentPhoto;
                }
                that.emit("msg", name, item.userType, item.content, photo);
            }
        }
    });

    //获取教室内监控对学生的备注信息
    var cltip = new SingleAction();
    cltip.getClassTips(this.room, this.userId, this.userType);
    cltip.on(cltip.COMPLETE, function (data) {
        SingleDatasets.timeLength = data.mintime;
        that.emit("class_tip", data.mintime, data.remind, data.comment);
        console.log("备注信息内容", data, JSON.stringify(data));
    });
};

//获取服务器信息并准备连接
SingleRoom.prototype.connectServer = function (serverId) {
    var that = this;
    //获取服务器信息，并登陆
    var sevAction = new SingleAction();
    sevAction.getServerById(that.room, serverId);
    sevAction.on(sevAction.COMPLETE, function (data) {
        SingleDatasets.server = data;
        SingleDatasets.serverId = serverId;
        //SingleDatasets.ws = "ws://" + data.url + ":" + data.port + SingleDatasets.instance;
        that.server.connect(SingleDatasets.ws + SingleDatasets.instance);
        that.server.on("socket_open", function () {
            var userdata = {userId: that.userId, userName: that.userName, userType: Number(that.userType)};
            that.server.join({
                room: that.room,
                userdata: userdata,
                clientIP: SingleDatasets.localIP,
                type: SingleDatasets.device
            });
        });
    });

    sevAction.on(sevAction.ERROR, function (e) {
        if (sevAction.requestCount < 3) {
            setTimeout(function () {
                sevAction.getServerById(that.room, serverId);
            }, 500);
        } else {
            that.emit("error", "Unable to get server information", "Server Error");
        }
    });
};

//加载课件
SingleRoom.prototype.loadCourse = function (id, page) {
    //id = 700;
    var that = this;
    //保存记录和日志
    var data = ActionLog.actionData(ShareEvent.COURSE_TURNPAGE, page);
    ActionLog.sendActionLog(this.room, data);
    //获取页码
    var courseAction = new SingleAction();
    courseAction.getCourseByPage(this.room, id, this.userType, page);
    courseAction.on(courseAction.COMPLETE, function (data) {
        that.cw.currentPage = page;
        that.cw.dataProvider(data);
        that.emit("course_Complete", page, data.totalPage);
    });

    courseAction.on(courseAction.ERROR, function (err) {
        if (courseAction.requestCount < 3) {
            courseAction.getCourseByPage(that.room, id, that.userType, page);
        } else {
            var data = ActionLog.actionData(ShareEvent.COURSE_TURNPAGE, page + "页3次数据获取失败,课件id:" + id);
            ActionLog.sendActionLog(this.room, data);
            that.emit("error", "第" + page + "页数据请求失败", "Data Error");
        }
    });
};

//获取教参
SingleRoom.prototype.getReference = function (id) {
    var that = this;
    //教参
    var refAction = new SingleAction();
    refAction.getReferenceById(id, this.userType);
    refAction.on(refAction.COMPLETE, function (data) {
        if (data) {
            that.emit("reference", data.content);
        }
    });
};

SingleRoom.prototype.checkNextClass = function () {
    var that = this;
    var action = new SingleAction();
    action.getNextCourse(this.userId, this.userType);
    action.on(action.COMPLETE, function (data) {
        if (data.result) {
            that.emit("next_class_time", data.result.lastTime, data.result.time);
        }
    });
};

//初始化课件区域和绘图区域
SingleRoom.prototype.initCourse = function (parent, cursor) {
    var that = this;
    this.cw = new Courseware();
    this.cw.canvas = this.getCoursePanel(parent, cursor);
    this.cw.on(this.cw.EVENT_CHANGE, function (page, total) {
        SingleDatasets.page = page;
        that.emit("page", page, total);
    });

    this.cw.on(this.cw.EVENT_ERROR, function (error) {
        if (that.cw.requestCount < 3) {
            that.goPage(SingleDatasets.page);
        } else {
            var data = ActionLog.actionData(ShareEvent.COURSE_TURNPAGE, that.cw.currentPage + "页下载失败,url:" + that.cw.url);
            ActionLog.sendActionLog(this.room, data);
            that.emit("error", "第" + that.cw.currentPage + "页加载失败", "加载失败");
        }
    });
};

SingleRoom.prototype.getCoursePanel = function (parent, cursor) {
    //课件的Canvas
    var cc = document.createElement("canvas");
    cc.setAttribute("width", parent.offsetWidth);
    cc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(cc);
    //远程的Canvas
    var rc = document.createElement("canvas");
    rc.setAttribute("width", parent.offsetWidth);
    rc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(rc);

    //本地的Canvas
    var lc = document.createElement("canvas");
    lc.setAttribute("width", parent.offsetWidth);
    lc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(lc);

    cursor.setAttribute("width", parent.offsetWidth);
    cursor.setAttribute("height", parent.offsetHeight);
    parent.appendChild(cursor);

    this.RDraw = new Draw();
    this.RDraw.canvas = rc;

    this.LDraw = new Draw();
    this.LDraw.canvas = lc;
    this.LDraw.sync = true;
    this.LDraw.drawing = true;
    this.LDraw.ratio = SingleDatasets.draws.zoom;
    this.LDraw.offsetX = SingleDatasets.draws.offsetX;
    this.LDraw.offsetY = SingleDatasets.draws.offsetY;
    var that = this;
    this.LDraw.on("startMove", function (x, y, mouseDown, width, color) {
        that.server.share(ShareEvent.CURSOR_POSITION, {
            type: "strat",
            x: x,
            y: y,
            mouseDown: mouseDown,
            width: width,
            color: color
        });
    });

    this.LDraw.on("mouseMove", function (x, y, mouseDown) {
        that.server.share(ShareEvent.CURSOR_POSITION, {type: "move", x: x, y: y, mouseDown: mouseDown});
    });

    this.LDraw.on("endMove", function (line) {
        console.log("当前线的轨迹", line, JSON.stringify(line));
        that.server.share(ShareEvent.CURSOR_POSITION, {type: "end"});
    });

    return cc;
};

SingleRoom.prototype.clearCourse = function () {
    if (this.LDraw) {
        this.LDraw.clearRect();
    }
    if (this.RDraw) {
        this.RDraw.clearRect();
    }
    this.emit("clear");
};

SingleRoom.prototype.remoteMouseMove = function (data) {
    if (data.type === "strat") {
        this.RDraw.startLine(data.x, data.y, data.width, data.color);
    } else if (data.type === "move") {
        if (data.mouseDown) {
            this.RDraw.drawLine(data.x, data.y);
        }
        //仅显示鼠标位置
        this.emit("mouse_move", data.x, data.y);
    } else if (data.type === "end") {
        this.RDraw.endLine();
    }
};

SingleRoom.prototype.setRatio = function (ratio, offsetX, offsetY) {
    SingleDatasets.draws.zoom = ratio;
    SingleDatasets.draws.offsetX = offsetX;
    SingleDatasets.draws.offsetY = offsetY;
    if (this.LDraw) {
        this.LDraw.ratio = ratio || 1;
        this.LDraw.offsetX = offsetX;
        this.LDraw.offsetY = offsetY;
    }
};

SingleRoom.prototype.setDraw = function (width, color) {
    this.LDraw.lineWidth = width || this.LDraw.lineWidth;
    this.LDraw.lineColor = color || this.LDraw.lineColor;
};

//涂鸦开关
SingleRoom.prototype.drawStatus = function (enabled) {
    this.server.share(ShareEvent.COURSE_GRAFFITI_SWITCH, enabled ? 1 : 0);
    var data = ActionLog.actionData(ShareEvent.COURSE_GRAFFITI_SWITCH, "学生涂鸦" + (enabled ? "打开" : "关闭"), SingleDatasets.studentId, UserType.STUDENT, SingleDatasets.studentName);
    ActionLog.sendActionLog(this.room, data);
};

SingleRoom.prototype.sendMSN = function (text) {
    //广播消息,内容从服务器获取
    this.server.share(ShareEvent.CHAT, text, null, null, true);
    var data = ActionLog.actionData(ShareEvent.CHAT, text, SingleDatasets.studentId, UserType.STUDENT, SingleDatasets.studentName);
    ActionLog.sendActionLog(this.room, data);
};

SingleRoom.prototype.sendStar = function () {
    var that = this;
    SingleDatasets.level += 1;
    if (SingleDatasets.level <= 5) {
        var levelAction = new SingleAction();
        levelAction.giveStar(this.room, SingleDatasets.studentId);
        levelAction.on(levelAction.COMPLETE, function (data) {
            that.server.share(ShareEvent.GIVESTAR, SingleDatasets.level, "", "", true);
        });

        var data = ActionLog.actionData(ShareEvent.GIVESTAR, SingleDatasets.levelSingleDatasets.studentId, UserType.STUDENT, SingleDatasets.studentName);
        ActionLog.sendActionLog(this.room, data);
    }
};

SingleRoom.prototype.sendClean = function () {
    this.server.share(ShareEvent.COURSE_GRAFFITI_CLEAR, true);
    var data = ActionLog.actionData(ShareEvent.COURSE_GRAFFITI_CLEAR, "清除画板");
    ActionLog.sendActionLog(this.room, data);
};

SingleRoom.prototype.sendPage = function (p) {
    var page = 1;
    if (p > 0) {
        page = this.cw.nextPage();
    } else {
        page = this.cw.prevPage();
    }

    SingleDatasets.page = page;
    this.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
    this.server.share(ShareEvent.COURSE_TURNPAGE, page);
    return page;
};

SingleRoom.prototype.goPage = function (page) {
    this.cw.load(page);
    SingleDatasets.page = page;
    this.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
    this.server.share(ShareEvent.COURSE_TURNPAGE, page);
};

SingleRoom.prototype.offline = function (data) {
    if (this.server) {
        this.server.offline(data);
    }
};

SingleRoom.prototype.dispose = function () {
    if (this.clock) {
        this.clock.stop();
    }

    if (this.server) {
        this.server.close();
    }
};

SingleRoom.prototype.setBookmark = function () {
    this.bookmarkNum = SingleDatasets.page;
    var data = ActionLog.actionData(ShareEvent.BOOK_MARK, "更新书签至" + this.bookmarkNum + "页");
    ActionLog.sendActionLog(this.room, data);

    var action = new SingleAction();
    action.sendBookmark(this.room, SingleDatasets.courseId, this.bookmarkNum);
};

SingleRoom.prototype.helpMe = function (type) {
    var hd = ActionLog.actionData(ShareEvent.HELP, type);
    ActionLog.sendActionLog(this.room, hd);

    this.server.share(ShareEvent.HELP, type);
};

SingleRoom.prototype.finishClass = function () {
    console.log("下课", this.clock.time, (SingleDatasets.timeLength - 1) * 60, SingleDatasets.roomStyle, CourseType.status_2, SingleDatasets.roomStyle == CourseType.status_2);
    if ((this.clock.time > (SingleDatasets.timeLength - 1) * 60) || SingleDatasets.roomStyle == CourseType.status_2) {
        this.emit("bookmark", this.bookmarkNum);
    } else {
        this.emit("class_not_over");
    }
};

SingleRoom.prototype.classOver = function () {
    var that = this;
    var over = new SingleAction();
    over.sendClassOver(this.room);
    over.on(over.COMPLETE, function (data) {
        if (SingleDatasets.roomStyle == CourseType.status_2) {
            that.goToPage("teacher/classover/" + that.room);
        } else {
            that.dispose();
            //调用其他的JS方法，点评下课
            //classComment();
            that.goToPage("ztest/enypt/" + that.room);
        }
    });

    over.on(over.ERROR, function (error) {
        that.emit("error", "ending the class failed ,plz contact TA", "Tip");
    });
};

SingleRoom.prototype.goToPage = function (path) {
    window.location.href = SingleDatasets.url + path;
};

//发送私聊
SingleRoom.prototype.sendPrvChat = function (userType, text) {
    if (this.server) {
        this.server.share("privateChat", text, null, userType, true);
    }
};

SingleRoom.prototype.getCourseList = function () {
    var that = this;
    var action = new SingleAction();
    action.getCourseList(this.room, this.userType);
    action.on(action.COMPLETE, function (data) {
        that.emit("add_course", data.list, data.def, SingleDatasets.courseId);
    });
    action.on(action.ERROR, function (data) {
        that.emit("error", "List data acquisition failed, please try again");
    });
};

SingleRoom.prototype.shareChangeCourse = function (id) {
    this.bookmarkNum = 1;
    SingleDatasets.page = 1;
    this.clearCourse();
    this.getReference(id);
    this.loadCourse(id, SingleDatasets.page);
    this.server.share(ShareEvent.COURSE_CHANGE, id);
};