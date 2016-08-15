var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var clients = {};
app.use(require('express').static(__dirname));

io.on('connection', function (socket) {
	
	//on login, need userCode and CALLBACK to manage userCodes collisions
	socket.on('login', function(data,callback){
		//checking if userCode already exists
		if(clients.hasOwnProperty(data.userCode)){
			//quitting
			callback({error : true,msg:"Error, userCode already exists!"});
			return;
		}

		//userCode is avaliable
		//add to register
		console.log("User logged in --->"+data.userCode);
		clients[data.userCode] = {
		  "socket": socket.id
		};
		callback({error : false,msg:""});
		//broadcast clients update
		io.sockets.emit("update-users",Object.keys(clients));
	  });
	
	//on message. need data and CALLBACK to manage errors
	socket.on('msg', function(data,callback){
		//logging
		console.log("Sending: " + data.content + " to " + data.userCode);
		//checking receiver
		if (clients[data.userCode]){
			io.sockets.connected[clients[data.userCode].socket].emit("msg", data);
		} else {
			callback("Error, user not found!");
		}
	})
	
	//set-up call
	socket.on('setup_call', function(data,callback){
		var sender_userCode = lookup(socket);
		//logging
		console.log(sender_userCode+" is setting up the call to call "+data.userCode);
		
		if (sender_userCode == data.userCode){
			callback({error:true,msg:"Can't call yourself!"});
		} else if (clients[data.userCode]){
			console.log("EMITTING!");
			io.sockets.connected[clients[data.userCode].socket].emit("setup_call", {userCode:sender_userCode});
		} else {
			callback({error:true,msg:"User not found!"});
		}
	});

	//starting call
	socket.on('call', function(data,callback){
		var sender_userCode = lookup(socket);
		//logging
		console.log(sender_userCode+" is ready to get call from "+data.userCode);
		
		if (sender_userCode == data.userCode){
			callback({error:true,msg:"Can't call yourself!"});
		} else if (clients[data.userCode]){
			io.sockets.connected[clients[data.userCode].socket].emit("call", {userCode:sender_userCode});
		} else {
			callback({error:true,msg:"User not found!"});
		}
	});

  //Removing the socket on disconnect
	socket.on('disconnect', function() {
		//finding disconnected user's userCode
		for (var userCode in clients) {
			if (clients.hasOwnProperty(userCode)) {
				if (clients[userCode].socket == socket.id) {
					//deleting user
					delete clients[userCode];
					//broadcast clients update
					io.sockets.emit("update-users",Object.keys(clients));
					console.log("removed --> "+userCode);
					return;
				}
			}
		}
	});
});	

function lookup(socket){
	for (var userCode in clients) {
		if (clients.hasOwnProperty(userCode)) {
			if (clients[userCode].socket == socket.id) {
				return userCode;
			}
		}
	}
}
  
http.listen(3000, function(){
  console.log('listening on *:3000');
});
