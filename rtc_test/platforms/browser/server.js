var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var clients = {};
app.use(require('express').static(__dirname));

io.on('connection', function (socket) {
	socket.on('add-user', function(data){
		console.log("Add-user --->"+data.userCode);
		clients[data.userCode] = {
		  "socket": socket.id
		};
	  });
  
	socket.on('private-message', function(data){
	console.log("Sending: " + data.content + " to " + data.userCode);
	if (clients[data.userCode]){
		io.sockets.connected[clients[data.userCode].socket].emit("add-message", data);
	} else {
		console.log("User does not exist: " + data.username); 
	}
	});

  //Removing the socket on disconnect
  socket.on('disconnect', function() {
            return;
        });
    });	
  
http.listen(3000, function(){
  console.log('listening on *:3000');
});
