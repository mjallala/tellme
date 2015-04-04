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
    model: {issues:[]},
    init: function () {
        io.on('connection', $scope.connection);
    },
    connection: function (socket) {
        socket.on('receive message', $scope.receive);
        socket.on('receive issue', $scope.newIssue);
        socket.on('receive comment', $scope.newComment);
        socket.emit("receive issue", $scope.model);
    },
    receive: function (data) {
        extend($scope.model, {
            from: _.escape(data.from),
            message: _.escape(data.message)
        });
        io.emit("receive message", $scope.model);
    },
    newIssue: function(data) {
        $scope.model.issues.unshift(data);
        io.emit("receive issue", $scope.model);
    },
    newComment: function(data){
        for(var n = 0; n < $scope.model.issues.length; n++){
            if($scope.model.issues[n].id == data.id){
                delete data.id;
                // then we want to add the comment to this issue
                $scope.model.issues[n].comments.unshift(data);
                io.emit("receive issue", $scope.model);
                return;
            }
        }
    }

};
$scope.init();


app.use(express.static(__dirname + '/www/'));
