var token = require('./../db/tokenRegistry');
var sql = require('./../db/dataBase').mysql;
function create (request, response){
    "use strict";
    //console.log("post/create token");
    //console.log(request.body);
    var data = request.body;
    token.insert(data,function(data){
        //console.log(data);
    });
}
exports.create = create;

exports.register = function (socketId,data){
    data.socketId = socketId;
    token.insert(data,function(data){

    });
};

