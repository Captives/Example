function WebServerUtils() {
    //var getUserMedia = (navigator.getUserMedia
    //                || navigator.webkitGetUserMedia
    //                || navigator.mediaDevices.getUserMedia //被替代navigator.mozGetUserMedia
    //                || navigator.msGetUserMedia);

    var PeerConnection = ( window.PeerConnection
    || window.RTCPeerConnection
    || window.mozRTCPeerConnection
    || window.webkitPeerConnection
    || window.webkitRTCPeerConnection
    || window.msRTCPeerConnection);

    var nativeRTCSessionDescription = (window.RTCSessionDescription
    || window.mozRTCSessionDescription
    || window.webkitRTCSessionDescription
    || window.msRTCSessionDescription );

    var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
    var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
    //ICE，全名交互式连接建立（Interactive Connectivity Establishment）,
    var iceServer = {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }]
    };

    /**********************************************************
     /*
     /*      WebSocket 服务部分
     /*
     /**********************************************************/
    function WebServerClient() {
        this.remote = null;
        //MediaServer
        //本地媒体流
        this.localMediaStream = null;
        //当前房间的媒体流数量
        this.streamCount = 0;
        //初始时已经连接的数目
        this.initializedStreams = 0;
        //保存所有与本地连接的Peer Connection对象
        //键名wid,键值为PeerConnection类型,并附带当前socketId对应的用户数据
        this.peerConnections = {};
        //保存所有的data channel，键名为wid，键值通过PeerConnection实例的createChannel创建
        this.dataChannels = {};
        //服务器连接成功后需要登入的数据
        this.data = null;
        this.on("offer", function (data) {
            this.receiveOffer(data.id, data.sdp);
        });

        this.on("answer", function (data) {
            this.receiveAnswer(data.id, data.sdp);
        });

        this.on("icecandidate", function (data) {
            console.log("receive ice candidate ", data.id, data.candidate);
            var pc = this.peerConnections[data.id];
            if (pc) {
                var candidate = new nativeRTCIceCandidate(data);
                pc.addIceCandidate(candidate);
            }
        });
    }

    WebServerClient.prototype = new EventEmitter();

    WebServerClient.prototype.connect = function (server) {
        var that = this;
        this.remote = new RemoteClient(server);
        this.remote.on("message", function (event, data) {
            that.emit(event, data);
        });

        this.remote.on("status", function (event, data) {
            console.log(event, that.remote.count, that.remote.recount(),that.remote.ws);
            if(event == 'socket_open'){
                if(that.data){
                    that.join(that.data);
                }else{
                    that.emit(event, data);
                }
            }else if(event == 'socket_close' || event == 'socket_error'){
                //大于10次,直接报状态,小于10次,报重连次数
                if(that.remote.recount() >= that.remote.count){
                    that.emit(event, data);
                }else{
                    that.emit('socket_reconnect', that.remote.recount());
                }
            }
            console.log('WebServerClient', status, event);
        });
    };

    //接入
    WebServerClient.prototype.join = function (data) {
        if (this.remote) {
            this.data = data;
            this.remote.join(data);
        }
    };

    WebServerClient.prototype.sendIceCandidate = function (wid, sdpMLineIndex, candidate) {
        if (this.remote) {
            this.remote.sendIceCandidate(wid, sdpMLineIndex, candidate);
        }
    };

    WebServerClient.prototype.sendOfferSdp = function (wid, sdp) {
        if (this.remote) {
            this.remote.sendOfferSdp(wid, sdp);
        }
    };

    WebServerClient.prototype.sendAnswerSdp = function (wid, sdp) {
        if (this.remote) {
            this.remote.sendAnswerSdp(wid, sdp);
        }
    };

    //业务事件
    WebServerClient.prototype.share = function (event, data, toId, toType, back) {
        if (this.remote) {
            this.remote.sending(event, data, toId, toType, back);
        }
    };

    WebServerClient.prototype.offline = function (data) {
        if (this.remote) {
            this.remote.offline(data);
        }
    };

    WebServerClient.prototype.close = function () {
        for (var id in this.peerConnections) {
            this.closePeerConnection(id);
        }
        ;

        if (this.remote) {
            this.remote.close();
            this.remote = null;
        }

        this.streamCount = 0;
        this.initializedStreams = 0;
        this.peerConnections = {};
        this.dataChannels = {};
    };

    /**********************************************************
     /*
     /*      WebRTC 视频流
     /*
     /**********************************************************/
    WebServerClient.prototype.initMediaStream = function (options, successCb, errorCb) {
        var that = this;
        //类型转换为boolean
        options.video = !!options.video;
        options.audio = !!options.audio;
        console.log("准备创建本地视频", getUserMedia);
        if (getUserMedia) {
            this.streamCount++;
            var onsuccess = function (stream) {
                console.log("local stream create success！", stream);
                that.localMediaStream = stream;
                that.initializedStreams++;
                that.emit("stream_created", stream);
                if (that.initializedStreams == that.streamCount) {
                    successCb(stream);
                }
            };
            //navigator.getUserMedia(options, onsuccess, onerror);
            getUserMedia.call(navigator, options, onsuccess, errorCb);
        } else {
            errorCb(new Error("WebRTC is not yet supported in this browser."));
            console.error("WebRTC is not yet supported in this browser.");
        }
    };

    /**
     * 把视频流附加到指定的video对象上
     * @param stream
     * @param video
     */
    WebServerClient.prototype.attachStream = function (stream, video) {
        if (navigator.mozGetUserMedia) {
            video.mozSrcObject = stream;
        } else {
            if (window.URL) {
                video.src = window.URL.createObjectURL(stream);
            } else {
                video.src = stream;
            }
        }
        video.play();
        console.log(this.getSimulcastInfo(stream));
        console.info("Label:" + stream.Label);
        console.info("AudioTracks:" + stream.getAudioTracks());
        console.info("VideoTracks:" + stream.getVideoTracks());
        console.info("attachStream", stream);
    };

    WebServerClient.prototype.getSimulcastInfo = function (videoStream) {
        var videoTracks = videoStream.getVideoTracks();
        var lines = [
            'a=x-google-flag:conference',
            'a=ssrc-group:SIM 1 2 3',
            'a=ssrc:1 cname:localVideo',
            'a=ssrc:1 msid:' + videoStream.id + ' ' + videoTracks[0].id,
            'a=ssrc:1 mslabel:' + videoStream.id,
            'a=ssrc:1 label:' + videoTracks[0].id,
            'a=ssrc:2 cname:localVideo',
            'a=ssrc:2 msid:' + videoStream.id + ' ' + videoTracks[0].id,
            'a=ssrc:2 mslabel:' + videoStream.id,
            'a=ssrc:2 label:' + videoTracks[0].id,
            'a=ssrc:3 cname:localVideo',
            'a=ssrc:3 msid:' + videoStream.id + ' ' + videoTracks[0].id,
            'a=ssrc:3 mslabel:' + videoStream.id,
            'a=ssrc:3 label:' + videoTracks[0].id
        ];
        lines.push('');
        return lines.join('\n');
    }


    /**********************************************************
     /*
     /*      WebRTC 点对点连接
     /*
     /**********************************************************/

    WebServerClient.prototype.createPeerConnections = function (userList) {
        console.log("###########   createPeerConnections     ###############");
        for (var id in userList) {
            this.createPeerConnection(id, userList[id]);
        }
        this.sendOffers(userList);
    };
    /**
     * 创建用户的PeerConnection对象
     * @param wid
     * @param user
     * @returns {*}
     */
    WebServerClient.prototype.createPeerConnection = function (wid, user, enabled) {
        var that = this;
        var pc = new PeerConnection(iceServer);
        pc.user = user;
        enabled = enabled || true;
        if (enabled) {
            pc.addStream(this.localMediaStream);
        } else {
            pc.addStream(null);
        }

        this.peerConnections[wid] = pc;

        console.log("create PeerConnection", wid, JSON.stringify(user), this.localMediaStream);
        pc.onopen = function (event) {
            console.log("PeerConnection # onopen", wid, JSON.stringify(user));
            that.emit("pc_opened", pc, wid);
        };

        pc.onicecandidate = function (event) {
            console.log("PeerConnection # onicecandidate", wid, JSON.stringify(user), event.candidate);
            if (event.candidate) {
                that.sendIceCandidate(wid, event.candidate.sdpMLineIndex, event.candidate.candidate);
            }
            ;
            that.emit("pc_icecandidate", event.candidate, wid, pc);
        };

        //添加mediastream作为本地音频或视频源
        pc.onaddstream = function (event) {
            console.log("PeerConnection # onaddstream", event.stream, wid, JSON.stringify(user));
            that.emit("addstream", event.stream, wid, user);
        };

        pc.onidpvalidationerror = function (event) {
            console.error("PeerConnection # onidpvalidationerror", event.idp, event.protocol);
        };

        pc.onidpassertionerror = function (event) {
            console.error("PeerConnection # onidpassertionerror", event.idp, event.protocol);
        };

        pc.onremovestream = function (event) {
            console.info("PeerConnection # onremovestream", event.stream);
        };

        pc.onclose = function (event) {
            console.info("PeerConnection # onclose");
        };

        //数据通道
        pc.ondatachannel = function (event) {
            console.info("PeerConnection # ondatachannel", event.channel, wid, JSON.stringify(user));
            that.addDataChannel(wid, event.channel);
            that.emit('pc_ondatachannel', event.channel, wid, pc);
        };

        //this.addDataChannel(wid,pc);
        return pc;
    };

    /**
     * 关闭连接
     * @param wid
     * @param pc
     */
    WebServerClient.prototype.closePeerConnection = function (wid) {
        var pc = this.peerConnections[wid];
        if (pc) {
            pc.close();
            this.removeDataChannel(wid);
            delete this.peerConnections[wid];
            console.log("PeerConnection", wid, "已经关闭");
        }
    };

    WebServerClient.prototype.sendOffers = function (userList) {
        var that = this;
        var onerror = function (err) {
            that.emit("error", err);
        };

        var constraints = {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        };

        for (var wid in this.peerConnections) {
            var pc = this.peerConnections[wid];
            pc.createOffer(function (session_desc) {
                console.log("sendOffers # createOffer", wid, JSON.stringify(pc.user), session_desc);
                pc.setLocalDescription(session_desc);
                that.sendOfferSdp(wid, session_desc);
            }, onerror);
        }
    };

    /**
     * 响应别人的offer请求
     * @param wid
     * @param sdp
     */
    WebServerClient.prototype.receiveOffer = function (wid, sdp) {
        console.info('receiveOffer', wid, sdp);
        this.sendAnswer(wid, sdp);
    };

    /**
     * 回应offer请求
     * @param wid
     * @param sdp
     */
    WebServerClient.prototype.sendAnswer = function (wid, sdp) {
        var that = this;
        var onerror = function (error) {
            this.emit("error", error);
        };
        var constraints = {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        };

        var pc = this.peerConnections[wid];
        if (pc) {
            console.log("sendAnswer # setRemoteDescription", sdp);
            pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
            pc.createAnswer(function (session_desc) {
                console.info('sendAnswer # createAnswer', wid, JSON.stringify(pc.user), session_desc);
                pc.setLocalDescription(session_desc);
                that.sendAnswerSdp(wid, session_desc);
            }, onerror);
        }
    };

    /**
     * 接收别人的sdp信息，并保存到当前他本人的PeerConnection对象上
     * @param wid
     * @param sdp
     */
    WebServerClient.prototype.receiveAnswer = function (wid, sdp) {
        var pc = this.peerConnections[wid];
        console.info('receiveAnswer', wid, JSON.stringify(pc.user), sdp);
        if (pc) {
            pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
            console.log("receiveAnswer # setRemoteDescription", sdp);
        }
    };


    /**********************************************************
     /*
     /*      WebRTC 数据通道部分
     /*
     /**********************************************************/

    WebServerClient.prototype.addDataChannels = function () {
        for (var wid in this.peerConnections) {
            this.createDataChannel(wid, this.peerConnections[wid]);
        }
    };

    WebServerClient.prototype.createDataChannel = function (wid, pc) {
        var onerror = function (err) {
            this.emit("data_channel_create_error", err);
        };
        if (!wid) {
            onerror(new Error("无效的socketId，创建数据通道失败!"));
        }

        if (!pc instanceof PeerConnection) {
            onerror(new Error("创建数据通道失败,不是PeerConnection对象"));
        }

        try {
            var channel = pc.createDataChannel("dataChannel");
            return this.addDataChannel(wid, channel);
        } catch (error) {
            onerror(error);
        }

        return null;
    };

    WebServerClient.prototype.addDataChannel = function (wid, channel) {
        var that = this;
        console.log("add dataChannel", wid);
        channel.onopen = function (event) {
            that.emit("data_channel_opened", channel, wid);
        };

        channel.onclose = function (event) {
            that.removeDataChannel(wid);
            that.emit("data_channel_closed", channel, wid);
        };

        channel.onmessage = function (message) {
            var json = JSON.parse(message);
            if (json.type === "file") {

            } else {
                that.emit("invalid_channel_message", message);
            }
        };

        channel.onerror = function (err) {
            that.emit("data_channel_error", err, wid);
        };

        this.dataChannels[wid] = channel;
        console.info("成功为", wid, "创建 Data channel", channel);
        return channel;
    };

    WebServerClient.prototype.removeDataChannel = function (wid) {
        delete this.dataChannels[wid];
        console.log("成功移除数据通道", wid);
    };


    /**********************************************************
     /*
     /*              单例模式对象
     /*
     /**********************************************************/

    var webServerClient = null;
    if (webServerClient == null) {
        webServerClient = new WebServerClient();
        console.log("WebSocket Client init");
    }
    return webServerClient;
}
