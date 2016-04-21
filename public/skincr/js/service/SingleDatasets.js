var SingleDatasets = {
    room:1000,
    level:1,
    time : 0,
    timeLength:0, //课程时常
    instance:"/single",
    url: window.location.protocol + "/",
    furl : window.location.protocol + "/",
    ws : "ws://" + window.location.hostname + ":" + window.location.port,
    //*********************************************************
    studentId : 0,
    studentName : "--",
    studentPhoto:"",
    studentOnline : false,

    teacherId : 0,
    teacherName : "--",
    teacherPhoto:"",
    teacherOnline : false,

    adminId : 0,
    adminName  : "--",
    adminPhoto:"",
    adminOnline : false,
    page : 1,
    camera:null,
    microphone:null,
    volume:70,//视频播放流的音量大小。有效值为 0 到 100
    gain:85,//麦克风放大信号的程度。有效值为 0 到 100
    roomStyle : 0,
    serverId:0,
    server:{},
    localIP:"",
    device:"",
    courseId:1,
    files:{},
    draws:{zoom:1,offsetX:0,offsetY:0}
};

const UserType = { TOURIST : 0, TEACHER : 1,
    STUDENT : 2, MANAGER : 3, PARENT : 4,
    TECHNOLOGY : 5, EDU : 6,  SALES : 7,
    message:function(type){
        switch (type){
            case this.TOURIST: return "游客"; break;
            case this.TEACHER: return "老师"; break;
            case this.STUDENT: return "学生"; break;
            case this.MANAGER: return "管理员"; break;
            case this.PARENT: return "家长"; break;
            case this.TECHNOLOGY: return "技术"; break;
            case this.EDU: return "教务"; break;
            case this.SALES: return "销售"; break;
        }
    }
};

const CourseType = {
    status_0:0, status_1:1, status_2:2, status_3:3,
    message:function(type){
        switch (type){
            case this.status_0: 	return "正式课(扣课)"; 	break;
            case this.status_1: 	return "试听课(不扣课)"; 	break;
            case this.status_2: 	return "测网课(不扣课)"; 	break;
            case this.status_3: 	return "测评课(不扣课)";	break;
        }
        return null;
    }
};

var ResourceFile = {
    getUserPhoto:function(path,userType){
        if(path =="" || path == null){
            if(userType == UserType.TEACHER){
                return SingleDatasets.url + "assets/photo/teacherPhoto.png";
            }

            if(userType == UserType.STUDENT){
                return SingleDatasets.url + "assets/photo/studentPhoto.png";
            }

            if(userType == UserType.MANAGER){
                return SingleDatasets.url + "assets/photo/adminPhoto.png";
            }
        }else{
            if(userType == UserType.TEACHER){
                return SingleDatasets.fileurl + "logo/" + path;
            }

            if(userType == UserType.STUDENT){
                return SingleDatasets.fileurl + "userlogo/"+ path;
            }

            if(userType == UserType.MANAGER){
                return SingleDatasets.url + "assets/photo/adminPhoto.png";
            }
            return path;
        }
        return null;
    }
}


