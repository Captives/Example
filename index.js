var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require('socketcluster').SocketCluster;
var cpus = require('os').cpus().length;

/*****************************************
 *
 *
 ******************************************/
var socketCluster = new SocketCluster({
    workers: Number(argv.w) || cpus,
    brokers: Number(argv.b) || 1,
    port: Number(argv.p) || 3000,
    appName: argv.n || null,
    workerController: __dirname + '/server/worker.js',
    brokerController: __dirname + '/server/broker.js',
    balancerController: __dirname + '/server/balancer.js',
    socketChannelLimit: 1000,
    crashWorkerOnError: argv['auto-reboot'] != false
});

