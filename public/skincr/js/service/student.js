function SingleRoom() {
    var that = this;
    this.room = 100;
    this.userId = 0;
    this.userType = UserType.TEACHER;
    this.userName = "-";
    this.studentDrawing = false;//涂鸦开关

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
        //   console.log(RemoteEvent.SHARE,data);
        switch (message.action) {
            case ShareEvent.COURSE_GRAFFITI_SWITCH:
                that.LDraw.drawing = message.content;
                that.emit("drawing", message.content);
                break;
            case ShareEvent.CHAT :
                var photo = null;
                console.log(user.userType, user.userType === UserType.TEACHER);
                if (user.userType === UserType.TEACHER) {
                    photo = SingleDatasets.teacherPhoto;
                } else if (user.userType === UserType.STUDENT) {
                    photo = SingleDatasets.studentPhoto;
                }
                that.emit("msg", user.userName, user.userType, message.content, photo);
                break;
            case ShareEvent.GIVESTAR :
                SingleDatasets.level = Number(message.content);
                that.emit("star", SingleDatasets.level);
                break;
            case ShareEvent.COURSE_GRAFFITI_CLEAR :
                that.clearCourse();
                break;
            case ShareEvent.CURSOR_POSITION ://鼠标
                that.remoteMouseMove(message.content);
                break;
            case ShareEvent.COURSE_TURNPAGE ://翻页
                that.goPage(message.content);
                break;
            case ShareEvent.HELP :
                that.emit("helpme", message.content, user);
                break;
            case ShareEvent.SERVER_CHANGE:
                swal("服务器更改", JSON.stringify(user) + "\n" + message.content, "warning");
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
                that.emit("private_chat", user.userName, user.userType, message.content, photo, true);
                break;
            case "refreshPage":
                if (message.content) {
                    that.emit("refresh_page");
                } else {
                    that.emit("refresh_server");
                }
                break;
        }
    });

    this.server.on("addstream", function (stream, wid, user) {
        console.log("新视频接入", stream, wid, JSON.stringify(user));
        that.emit("add_stream", stream, wid, user);
    });

    this.server.on('invalid_message', function (message) {
        console.log("无效信息", message);
    });

    this.server.on('socket_close', function () {
        SingleDatasets.studentOnline = false;
        console.info("远程服务已关闭");
        that.emit("logout", "已经退出");
    });

    this.server.on('socket_error', function (error) {
        console.info("远程服务发生错误", error);
        that.emit("logout", "已经退出");
    });
};

SingleRoom.prototype = new EventEmitter();

SingleRoom.prototype.addUser = function (user, id, time) {
    this.userList[id] = {id: id, user: user, time: time};
    if (user.userType == UserType.TEACHER) {
        SingleDatasets.teacherId = user.userId;
        SingleDatasets.teacherName = user.userName;
        SingleDatasets.teacherOnline = true;
    }
    this.server.share("serverId", SingleDatasets.serverId);

    this.emit("add_user", user, id, time);
};

SingleRoom.prototype.removeUser = function (user, id) {
    delete this.userList[id];
    if (user.userType == UserType.TEACHER) {
        SingleDatasets.teacherOnline = false;
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

SingleRoom.prototype.userVerification = function (room, id, type) {
    var that = this;
    this.room = room;
    this.userId = id;
    this.userType = type;
    SingleDatasets.room = room;
    SingleDatasets.studentId = id;
    var action = new SingleAction();
    action.checkUser(room, id, type);
    action.on(action.COMPLETE, function (data) {
        that.clock = new Clock();
        that.clock.start(data.time);
        that.clock.on(that.clock.EVENT_CHANGE, function (time, text) {
            SingleDatasets.time = time;
            that.clockChange(time, text);
        });

        that.clock.on(that.clock.EVENT_COMPLETE, function (time) {
            console.log(time);
        });

        that.userName = data.sName;
        SingleDatasets.courseId = Number(data.courseId);
        SingleDatasets.level = data.level;
        SingleDatasets.teacherName = data.tName;
        SingleDatasets.studentName = data.sName;
        SingleDatasets.roomStyle = data.appro_status;
        SingleDatasets.localIP = data.cip;
        SingleDatasets.studentPhoto = ResourceFile.getUserPhoto(data.logo, that.userType);

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
        if (time == 120) {//2分钟检查老师
            this.seeTeacherToDo();
        }

        if (time % 60 == 0 && ActionLog.record == true) {//&& this.checked == true
            //定时校验查询服务器
            //this.checkServer();
        }
    }
};

//查询老师是否在拖堂
SingleRoom.prototype.seeTeacherToDo = function () {
    if (!SingleDatasets.teacherOnline) {
        var stAction = new SingleAction();
        stAction.seeTeacherToDo(this.room, SingleDatasets.teacherId);
        stAction.on(stAction.COMPLETE, function (data) {
            if (data.data == 1) {
                var audio = new Audio();
                audio.url = "assets/medias/waitamonent.mp3";
                audio.play();
            }
        });
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
            SingleDatasets.microphone = JSON.stringify(result.mic)
        }

        if (result.selfsev != null && Number(result.selfsev) != NaN) {
            SingleDatasets.serverId = Number(result.selfsev);
        }

        that.LDraw.drawing = (Number(result.switch) === 1);
        that.emit("star", SingleDatasets.level);
        that.emit("drawing", that.LDraw.drawing);
        console.log("课程状态", data, JSON.stringify(data));

        var vd = ActionLog.actionData(ShareEvent.CLIENT_VERSION, "Version: js1.0");
        ActionLog.sendActionLog(that.room, vd);

        that.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
        that.connectServer(SingleDatasets.serverId);
    });

    //历史聊天记录
    var chatlog = new SingleAction();
    SingleDatasets.teacherId = 117;
    chatlog.getChatLog(this.userId, SingleDatasets.teacherId, null);
    chatlog.on(chatlog.COMPLETE, function (data) {
        var result = data.chat;
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

    //给学生的留言
    var cltip = new SingleAction();
    cltip.getClassTips(this.room, this.userId, this.userType);
    cltip.on(cltip.COMPLETE, function (data) {
        that.emit("class_tip", data.remind);
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
            that.emit("error", "第" + page + "页数据请求失败", "数据错误");
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
    var cc = document.createElement("canvas");
    cc.setAttribute("width", parent.offsetWidth);
    cc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(cc);

    var rc = document.createElement("canvas");
    rc.setAttribute("width", parent.offsetWidth);
    rc.setAttribute("height", parent.offsetHeight);
    parent.appendChild(rc);

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
    this.LDraw.lineColor = "blue";
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
    this.emit("clear_rect");
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

SingleRoom.prototype.sendMSN = function (text) {
    //广播消息,内容从服务器获取
    this.server.share(ShareEvent.CHAT, text, null, null, true);

    var data = ActionLog.actionData(ShareEvent.CHAT, text, SingleDatasets.teacherId, UserType.TEACHER, SingleDatasets.teacherName);
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
    return page;
};

SingleRoom.prototype.goPage = function (page) {
    SingleDatasets.page = page;
    this.cw.load(page);
    this.loadCourse(SingleDatasets.courseId, SingleDatasets.page);
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

SingleRoom.prototype.helpMe = function (type) {
    var hd = ActionLog.actionData(ShareEvent.HELP, type);
    ActionLog.sendActionLog(this.room, hd);
    this.server.share(ShareEvent.HELP, type);
};

/**
 * 下课
 * @param level 给老师的评级
 * @param text  给老师的评语
 */
SingleRoom.prototype.finishClass = function (level, text) {
    var that = this;
    var overAction = new SingleAction();
    overAction.sendReviewMessageFromStudent(this.room, level, text);
    overAction.on(overAction.COMPLETE, function (data) {
        if (data.result == "success") {
            that.goToPage("student/classover");
            that.emit("finish_class_success");
        } else {
            that.emit("finish_class_error", data.result);
        }
    });
    overAction.on(overAction.ERROR, function (err) {
        that.emit("finish_class_error", err);
    });
};

SingleRoom.prototype.classOver = function () {

};

SingleRoom.prototype.remoteDeviceStatusHandler = function (user, data) {

};

SingleRoom.prototype.remoteHelpMeHandler = function (user, data) {

};

SingleRoom.prototype.goToPage = function (path) {
    this.emit("reward_page", path);
};

//发送私聊
SingleRoom.prototype.sendPrvChat = function (userType, text) {
    if (this.server) {
        this.server.share("privateChat", text, null, userType, true);
    }
};
