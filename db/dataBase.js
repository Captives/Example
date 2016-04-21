var mysql = require('mysql');
var sql = require('./../conf/config').mysql;

var options = {
    host : sql.host,
    port : sql.port,
    user : sql.user,
    password : sql.password,
    database : sql.database
};

var connection = mysql.createConnection(options);

exports.ready = function(callback){
    if(connection.state !== "disconnected"){
        return callback(null, {'code':0,'message':"数据库已经连接"});
    }

    connection.connect(function(error){
        if(error){
            return callback(null,{'code':1,'message':"Error:"+error.message});
        }
        return callback(connection,{'code':0, 'message':"数据库连接成功"});
    });
};
