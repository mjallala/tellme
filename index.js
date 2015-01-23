var express = require("express"),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    _ = require('underscore'),
    debug=require("debug")("index.js");

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

debug(ipaddr, port);

server.listen(port, ipaddr, function(){
    console.log("Server listening at port %d", port);
});

io.on('connection', function (socket) {
  // when the client emits 'receive message', this listens and executes
  socket.on('receive message', function (data) {
      var oOut = {
          from: _.escape(data.from),
          message: _.escape(data.message)
      };
      socket.broadcast.emit("receive message", oOut);
  });
});

app.use(express.static(__dirname + '/www/'));
