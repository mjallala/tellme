var express = require("express"),
    app = express(),
    cors = require('cors'),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    _ = require('underscore'),
    debug = require("debug")("index.js"),
    extend = require("extend"),
    md5 = require('MD5'),
    oCreds = require('../data/sendgrid.json'),
    https = require('https'),
    bodyParser = require('body-parser'),
    querystring = require('querystring');
app.use(cors({origin:true}));
app.use( bodyParser.json() );

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

debug(ipaddr, port);

server.listen(port, ipaddr, function () {
    console.log("Server listening at port %d", port);
});

var $scope = {
    model: {issues:[]},
    init: function () {
        io.set('origins', '*:*');
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

app.post('/sendemail', function(req, response){
    var sEmail = req.body.email;
    var sCode = md5(sEmail + ':' + oCreds.realm).substr(0,4);
    var sMessage = '<p>Thank-you for your interest in tellme!</p><p>Please enter this code: ' + sCode + ' to verify your email</p>';
    var sSender = "noreply@salesucation.com";
    var oData = {
        from: sSender,
        to: sEmail,
        subject: sCode + ' is your code ... please enter it in the app',
        html: sMessage,
        replyto: sSender,
        api_user: oCreds.account,
        api_key: oCreds.password
    };
    var post_data = querystring.stringify(oData);
    debug(post_data);

    // An object of options to indicate where to post to
    var post_options = {
        host: 'api.sendgrid.com',
        path: '/api/mail.send.json',
        method: 'POST',
        headers: {
            "User-Agent": "node.js",
            Accept: "*/*",
            "Content-Type": "application/x-www-form-urlencoded"
        },
    };

    // Set up the request
    var post_req = https.request(post_options, function (res) {
        debug("statusCode: ", res.statusCode);
        debug("headers: ", res.headers);
        var sData = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            debug('Response: ' + chunk);
            sData += chunk;
        });
        res.on('end', function () {
            var oData = JSON.parse(sData);
            if(oData.message == "success") response.end('{"result":{"message":"message sent to ' + sEmail + '"}}');
            else response.end('{"result":' + sData + '}');
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

});

app.post('/verifyemail', function(req, res){
    var sEmail = req.body.email;
    var sCode = req.body.code;
    if(sCode == md5(sEmail + ':' + oCreds.realm).substr(0,4)){
        res.end('{"result":"success"}');
    }else{
        res.end('{"result":"failure"}');
    }
});


app.use(express.static(__dirname + '/www/'));
