;(function () {
    'use strict';

    /**该事件不仅可以共享还可以记录状态和日志**/
    var ShareEvent = {
        //~~~~~~~~~~~~~~~~~~~~~ 通用  ~~~~~~~~~~~~~~~~~~~~~
        /** 聊天 **/
        CHAT : "7",

        /** 奖励星星 **/
        GIVESTAR : "4",

        /** 呼叫帮助 **/
        HELP : "0",

        /** 用户进入 **/
        USER_ENTER : "31",

        /** 用户退出 **/
        USER_QUIT : "32",

        /** 被踢下线 **/
        USER_KICKOUT : "33",

        /**用户进入失败**/
        USER_ENTER_FAILED : "34",

        /**老师被提示的次数**/
        FAQ_COUNT : "35",
//~~~~~~~~~~~~~~~~~~~~~ 客户端  ~~~~~~~~~~~~~~~~~~

        /**客户端版本号码**/
        CLIENT_VERSION : "40",

        /**客户端大刷新**/
        CLIENT_REFRESH_BIG : "41",

        /**客户端小刷新**/
        CLIENT_REFRESH_SMALL : "42",


//~~~~~~~~~~~~~~~~~~~~~ 课  件  ~~~~~~~~~~~~~~~~~~
        /** 书签 **/
        BOOK_MARK : "1",

        /** 课件发生更改 **/
        COURSE_CHANGE : "2",

        /** 页码  **/
        COURSE_TURNPAGE : "3",

        /** 清除涂鸦 **/
        COURSE_GRAFFITI_CLEAR : "5",

        /** 鼠标位置 **/
        CURSOR_POSITION : "6",

        /** 涂鸦开关 **/
        COURSE_GRAFFITI_SWITCH : "8",

        /** 文本输入[暂时不记录] **/
        COURSE_GRAFFITI_TEXT : "9",

        /** 涂鸦绘图 [暂时不记录] **/
        COURSE_GRAFFITI_LINE : "10",

//~~~~~~~~~~~~~~~~~~~ 视  频  ~~~~~~~~~~~~~~~~~~~~~~
        /** 摄像头发生更改 ***/
        VIDEO_CAMERA : "11",

        /** 麦克风发生更改 ***/
        VIDEO_MICROPHONE : "12",

        /** 摄像头质量发生更改 ***/
        VIDEO_CAMERA_QUALITY : "13",

        /** 麦克风增益发生更改 ***/
        VIDEO_MICROPHONE_VOLUME : "14",

        /** 视频聊天开始 ***/
        VIDEO_CHAT_BEGIN : "15",

        /** 视频聊天结束 ***/
        VIDEO_CHAT_END : "16",

        /**视频状态,这里监控的是麦克风**/
        VIDEO_STATE : "17",

        /**视频旋转**/
        VIDEO_ROTATION : "18",

        //~~~~~~~~~~~~~~~~~~~ 服务器  ~~~~~~~~~~~~~~~~~~~~~
        /** 服务器发生更改  ***/
        SERVER_CHANGE : "20",

        /**断开连接**/
        SERVER_UNCONNECT : "21",

        /**服务器发送流**///未使用
        SERVER_PUBLISH_STREAM : "22"
    };

    //该事件仅做共享标识
    var RemoteShareEvent = {
        /** 用户的房间初始化完成,上线通知 **/
        ONLINE_COMPLETE : "onlineComplete",

        /**远程数据同步,该数据同步给除本人之外的所有在线用户**/
        REMOTE_SYN_DATA : "remoteSynData",

        /***远程帮助呼叫***/
        REMOTE_CALL : "remoteCall",

        /**教室是否开始启用**/
        ROOMENALED : "roomEnaled",

        /**课程已经结束***/
        CLASS_COMPLETED : "classCompleted",

        /** 是否允许学生涂鸦 **/
        SDRAWING : "SDrawing",

        /**文本框**/
         TEXTBOX : "textBox",

        /**鼠标按下**/
        MOUSEDOWN : "mouseDown",

        /**老师鼠标状态**/
        TMOUSEDOWN : "teacherMouseDown",

        /**学生鼠标状态**/
        SMOUSEDOWN : "studentMouseDown",

        /**绘图类型**/
        DRAWTYPE : "drawType",

        /**共享绘制线条**/
        DRAWLINES : "drawLines",

        /**清空课件剪辑**/
        CLEANLINE : "cleanLine",

        /***课件动画***/
        ANIMATION : "Animation",

        /**app日志**/
        APP_LOG : "applog",

        /**送心***/
        HEART : "heart",

        /**课件加载完成**/
        COURSECOMPLETE : "courseComplete",

        /**老师获得的总花数量**/
        TOTALHEART : "totalHeart",

        /**老师对学生互聊**/
        CHAT : "Chat",

        /**视频聊天**/
        VIDEOCHAT : "videoChat",

        /**是否允许聊天**/
        CHATON : "ChatOn",

        /**清空聊天信息**/
        CLEANCHAT : "cleanChat",

        /**管理员与老师私聊**/
        PRIVATECHATWITHTEACHER : "PrivateChatWithTeacher",

        /**管理员与学生私聊**/
        PRIVATECHATWITHSTUDENT : "PrivateChatWithStudent",

        /**远程刷新**/
        REFRESH : "refresh",

        /**麦克风增益发生更改**/
        GAINCHANGE : "gainChange",

        /**视频流音量更改**/
        VOLUMECHANGE : "volumeChange",


        /** 视频质量(0-100)0为关闭 **/
        CHANGEVIDEO : "changeVideo",

        /** 学生鼠标指针位置|StudentCursor **/
        STUDENTCURSOR : "StudentCursor",

        /** 老师鼠标指针位置|TeacherCursor **/
        TEACHERCURSOR : "TeacherCursor",

        /**鼠标指针(一对多中每个人的鼠标指针)**/
        CURSOR : "cursor",

        /**学生端设备***/
        STUDENTDEVICE : "studentDevice",

        /***老师端设备**/
        TEACHERDEVICE : "teacherDevice",
        /** 答题统计 **/
        ANSWERRESULTS : "answerResults",
        /** 结束答题 ***/
        ENDANSWER : "endAnswer",

        /**获取答题队列**/
        GETQUESTIONLIST : "getQuestionList",

        /** 麦克风增益大小  **/
        MICLEVEL : "miclevel",

        /**静音**/
        MUTED : "muted",

        /***发布的视频流发生更改**/
        STREAMCHANGE : "streamChange",

        /**修改服务器连接**/
        CHANGE_SERVER : "changeServer",

        /**修改服务器端口指向**/
        CHANGE_SERVER_PORT : "changeServerPort",

        /**本地硬件信息(麦克风、摄像头)**/
        MULTIMEDIA_DEVICES : "multimediaDevices",

        /**本地硬件状态(麦克风、摄像头)**/
        MULTIMEDIA_STATUS : "multimediaStatus",

        /**麦克风活动状态**/
        ACTIVITY : "activity",

        /**更新用户的硬件信息**/
        UPDATE_DEVICES : "updateDevices",

        /**旋转视频**/
        ROTATION_VIDEO : "rotationVideo",

        /**课程提问**/
        FAQ : "faq"
    };

    var exports = this;
    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    ShareEvent.noConflict = function noConflict() {
        exports.ShareEvent = ShareEvent;
        return ShareEvent;
    };


     if (typeof module === 'object' && module.exports){
        module.exports = ShareEvent;
    }
    else {
        exports.ShareEvent = ShareEvent;
    }
}.call(this));