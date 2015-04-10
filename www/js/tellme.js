angular.module("myApp", [
    'mobile-angular-ui',

    // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'
    // it is at a very beginning stage, so please be careful if you like to use
    // in production. This is intended to provide a flexible, integrated and and
    // easy to use alternative to other 3rd party libs like hammer.js, with the
    // final pourpose to integrate gestures into default ui interactions like
    // opening sidebars, turning switches on/off ..
    'mobile-angular-ui.gestures'
]).controller("myCtrl", function ($scope, $http) {
   angular.extend($scope, {
       pendingemail: "",
       from: "",
       email: null,
       code: "",
       socket: null,
       // commented out to put on gh-pages branch ... for local testing uncomment this
       // url: document.URL,
       url: "https://tellme-hildred.rhcloud.com/",
       init: function () {
           if (typeof (localStorage.getItem("email")) != 'undefined') {
               $scope.from = localStorage.from;
               $scope.email = localStorage.email;
           }
           $scope.socket = io($scope.url, {
               'reconnection': false
           });
           document.addEventListener('deviceready', $scope.deviceReady, false);
           $scope.socket.on("receive message", $scope.receive);
           $scope.socket.on("receive issue", $scope.update);
           $scope.socket.on("disconnect", $scope.retry);
       },
       retry: function () {
           $scope.socket = io($scope.url, {
               'reconnection': true,
               'force new connection': true
           });
           $scope.socket.on("receive message", $scope.receive);
           $scope.socket.on("receive issue", $scope.update);
       },
       deviceReady: function () {
           $scope.url = "https://tellme-hildred.rhcloud.com/";
           $scope.socket = io($scope.url, {
               'reconnection': true,
               'force new connection': true
           });
           $scope.socket.on("receive message", $scope.receive);
           $scope.socket.on("receive issue", $scope.update);
       },
       messages: [],
       model: {
           issues: []
       },
       receive: function (data) {
           $scope.messages.unshift(data);
           $scope.$apply();
       },
       update: function (data) {
           angular.extend($scope.model, data);
           $scope.$apply();
       },
       sendMessage: function () {
           var data = {
               from: $scope.from,
               message: $scope.message
           };
           $scope.socket.emit('receive message', data);
           $scope.message = "";
       },
       addIssue: function () {
           var data = {
               id: $scope.generateUUID(),
               reporter: $scope.from,
               title: $scope.issueTitle,
               comments: []
           };
           $scope.socket.emit('receive issue', data);
           $scope.issueTitle = "";
       },
       addComment: function (issue) {
           var data = {
               id: issue.id,
               commenter: $scope.from,
               comment: issue.newcomment
           };
           $scope.socket.emit('receive comment', data);
           issue.newComment = "";
       },
       sendEmail: function () {
           var data = {
               email: $scope.pendingemail
           }
           $http.post($scope.url + "sendemail", data).success(function (data) {
               $scope.servermessage = data.result.message;
           });
       },
       setAlias: function () {
           var data = {
               email: $scope.pendingemail,
               code: $scope.code
           }
           $http.post($scope.url + "verifyemail", data).success(function (data) {
               if (data.result == "success") {
                   $scope.email = $scope.pendingemail;
                   if($scope.rememberMe){
                       localStorage.email = $scope.email;
                       localStorage.from = $scope.from;
                   }
               } else {
                   $scope.servermessage = data.result;
               }
           });
       },
       bSendReady: function () {
           return ($scope.pendingemail != "" && $scope.from != "");
       },
       bVerifyReady: function () {
           return ($scope.bSendReady() && $scope.code != "");
       },
       generateUUID: function () {
           var d = new Date().getTime();
           var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
               var r = (d + Math.random() * 16) % 16 | 0;
               d = Math.floor(d / 16);
               return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
           });
           return uuid;
       }
   });
   $scope.init();
});
