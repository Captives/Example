/**
 * Created by Administrator on 2016/4/9.
 */
module.exports.attach = function (scServer, socket) {
    //认证结束的时间间隔
    var tokenExpiresInSeconds = 10 * 60;
    //认证更新间隔(毫秒)
    var tokenRenewalIntervalInMilliseconds = Math.round(1000 * tokenExpiresInSeconds / 3);
    console.log("start", tokenExpiresInSeconds, tokenRenewalIntervalInMilliseconds);
    var atid = setInterval(function () {
        var token = socket.getAuthToken();
        console.log(token);
        if (token) {
            console.log("update token", token, tokenExpiresInSeconds, tokenRenewalIntervalInMilliseconds);
            socket.setAuthToken(token, {expiresIn: tokenExpiresInSeconds})
        }
    }, tokenRenewalIntervalInMilliseconds);

    socket.once('disconnect', function () {
        clearInterval(atid);
    });

    socket.on("login", function (data, respond) {
        console.log("login", data);
        if (data.room == 1000 && data.uid == 111) {
            socket.setAuthToken(data, {expiresIn: tokenExpiresInSeconds});
            respond();
        } else {
            respond(null, "无效的登人数据");
        }
    });

    socket.once("error", function (err) {
        console.log("1", err);
    });

    socket.on("error", function (err) {
        console.log("2", err);
    });
};