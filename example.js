//var config = require('./conf/config');
//console.log(config.server.httpHost + ":" + config.server.httpPort);
//console.log(config.server.httpsHost + ":" + config.server.httpsPort);

//
//var FileResource = require('./resource/FileResource');
//
//FileResource.writeFile('logs/file.txt',"测试啊，测试啊");
//FileResource.readFile('logs/file.txt');
//
//setTimeout(function(event){
//    FileResource.writeFile('logs/file.txt');
//},3000);
//
//FileResource.watchFile('logs/file.txt');
//
//console.log(__dirname);

//var Logger = require('./resource/LoggerResource');
//var logger = new Logger();
//setInterval(function(){
//    var date = new Date();
//    logger.path = "logs/action/" + date.getMinutes();
//    logger.fileName = date.getMinutes() + "_" + date.getSeconds()+"_log.txt";
//    logger.info("记录信息",date.toJSON());
//},1000);
//if(req.event == "create" || req.event == 'read' || req.event == "update" || req.event == "delete")
var events = ["create", "read", "update", "delete"];
var req ={event:"reads"};
console.log(events.indexOf(req.event));