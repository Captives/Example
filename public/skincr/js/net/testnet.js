var c = document.getElementById("loadCanvas");
var cw = c.getAttribute("width");
var ch = c.getAttribute("height");
var cl = new lightLoader(c, cw, ch);
cl.init();

var url = "http://" + window.location.hostname +":3000/";
var user = JSON.parse(sessionStorage.userdata);
console.log(user.room,user.id,user.name,user.type,url);
var ua = new UAParser();
function onload(){
    var ios = ua.getOS().name =="iOS";
    console.log(user, user.id , user.type ,user.room,(!user.id || !user.type || !user.room));
    cl.updateLoader(10, 100);
    if(user.id && user.type && user.room){
        TestNet(user,forward,function(){
            console.log("Error");
        });
    }
};

function forward(room, id, type, ios){
    if(type == 1){
        url += "SingleTeacher.html";
    } else if(type == 2){
        url += "SingleStudent.html";
    } else if(type == 3){
        url += "SingleMonitor.html";
    } else {
        url += "SinglePreview.html";
    }
    window.location.href = url + "?" + encodeURIComponent("room=" + room + "&id=" + id + "&type=" + type);
}

function TestNet(errorCallBack){
    cl.updateLoader(20, 100);
    var ios = ua.getOS().name =="iOS";
    //测网许可
    var lac = new SingleAction();
    lac.networkLicense(user.id,user.type);
    lac.on(lac.COMPLETE,function(data){
        if(!data.result){
            cl.updateLoader(100, 100);
            forward(user.room, user.id, user.type, ios);
        }else{
            cl.updateLoader(50, 100);
            var ac2 = new SingleAction();
            ac2.getServerList(user.type,user.id);
            ac2.on(ac2.COMPLETE,function(data){
                cl.updateLoader(80, 100);
                console.log(JSON.stringify(ua.getResult()));
                var os = ua.getOS();
                var bw = ua.getBrowser();
                var dev = ua.getDevice();
                sessionStorage.os = JSON.stringify(os);
                sessionStorage.browser = JSON.stringify(bw);
                sessionStorage.device = JSON.stringify(dev);
                netReport += "\n 浏览器属性:" + navigator.userAgent;
                netReport += "\n 系统:" + os.name+" "+ os.version;
                netReport += "\t 浏览器:" + bw.name+" "+ bw.version ;
                if(dev.model){
                    netReport += "\n 设备：" + dev.vendor + " " + dev.model + " " + dev.type;
                }else{
                    if(dev.type){
                        netReport += "\n 设备：" + dev.type;
                    }else{
                        netReport += "\n 设备：PC";
                    }
                }
                netReport += "\t 分辨率:" + window.screen.width + "x" + window.screen.height;
                netReport += "\t 有效视窗：" + window.screen.availWidth + "x" + window.screen.availHeight;
                netReport += JSON.stringify(ua.getResult());
                checkServer(data);
            });
        }
    });

    var netReport = "进入教室测网：";
    function checkServer(data){
        var list = [];
        for(var i in data){
            var server = new Server();
            server.data = data[i];
            server.instance = "/net";
            server.protocol = "ws://";
            if(server.forced){
                server.time = 0;
                server.timeArray = [];
                list.push(server);
            }else{
                netReport += "\n" + server.label + ",不强制使用,已经忽略";
            }
            console.log(i,server.forced,server.enabled,"位置",server.url, JSON.stringify(data[i]));
        }
        cl.updateLoader(100, 100);
        pingServer(list);
    }

    function pingServer(list){
        var ts = new NetTestServer();
        ts.list = list;
        ts.count = 30;
        ts.on("progress",function(load, totalload){
            cl.updateLoader(load, totalload);
        });

        ts.on("complete",function(result){
            console.log(JSON.stringify(result),"\n",netReport);
            var ac = new SingleAction();
            ac.saveTestNet(user.id,user.type, JSON.stringify(result),netReport);
            ac.on(ac.COMPLETE,function(data){
                forward(user.room, user.id, user.type, ios);
            });
        });
        ts.start();
    };
}