var express = require("express"),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    _ = require('underscore'),
    debug = require("debug")("index.js"),
    extend = require("extend");

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

debug(ipaddr, port);

server.listen(port, ipaddr, function () {
    console.log("Server listening at port %d", port);
});

var $scope = {
    model: {},
    socket: null,
    init: function () {
        io.on('connection', $scope.connection);
    },
    connection: function (socket) {
        $scope.socket = socket;
        $scope.socket.on('receive message', $scope.receive);
    },
    receive: function (data) {
        extend($scope.model, {
            from: _.escape(data.from),
            message: _.escape(data.message)
        });
        $scope.socket.broadcast.emit("receive message", $scope.model);
    }
};
$scope.init();


app.use(express.static(__dirname + '/www/'));
