var db = require('./dataBase');
var connection;

db.ready(function(_connection,data){
    if(_connection) {
        connection = _connection;
    }
    console.log(data);
});

exports.insert = function(values, callback){
    var sql = "INSERT INTO token SET username=?, password=?, phone=?";
    var values = [values.name, values.password, values.phone];

    connection.query(sql, values, function(error, result){
        if(error) {
            return callback({code: 1, message: "Error：" + error.message});
        }

        return callback({code : 0, message : result.inserId});
    });
};

exports.insert = function(values, callback){
    var sql = "INSERT INTO token SET userId=?, userName=?, userType=?, socketId=?";
    var values = [values.userId, values.userName, values.userType, values.socketId];

    connection.query(sql, values, function(error, result){
        if(error) {
            return callback({code: 1, message: "Error：" + error.message});
        }
        return callback({code : 0, message : result.inserId});
    });
};


