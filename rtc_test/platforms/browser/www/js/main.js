var socket;
var config;
var session;
var signaling_address = "http://sssserver.ddns.net:443"//"http://192.168.1.121:3000"
var turn_address = 'turn:numb.viagenie.ca'

var signaling = {};
signaling.login = function(user){
	socket.emit("login",{userCode:user},login_response);
	socket.on("setup_call",function(data){
		console.log("received 'setup_call' event");
		var user = data.userCode;
		config = {
			isInitiator: false,
			stun: { //cose che non so se servono
				host: 'stun:stun.l.google.com:19305'
			},
			turn: {
				host: turn_address,
				username: 'spam4me2@outlook.it',
				password: 'thisisnew'				
			},
			streams: {
				audio: true,
				video: false
			}
		}
		session = new cordova.plugins.phonertc.Session(config);
		session.on('sendMessage', function (data) { 
			console.log("sending message");
			socket.emit("msg",{content:JSON.stringify(data),userCode:user});
		});
		socket.on("msg", function(data){		
			console.log("receiving message"+data.content);
			session.receiveMessage(JSON.parse(data.content));
		});

		session.on('answer', function () { 
			console.log('Other client answered!');
		});

		session.on('disconnect', function () { 
			console.log('Other client disconnected!');
		});
		session.call();
		console.log("passive call done, now emitting call to "+user);
		socket.emit("call",{userCode:user});
	});
};
signaling.call = function(user){
	config = {
		isInitiator: true,
		stun: { //cose che non so se servono
			host: 'stun:stun.l.google.com:19305'
		},
		turn: {
			host: turn_address,
			username: 'spam4me2@outlook.it',
			password: 'thisisnew'
		},
		streams: {
			audio: true,
			video: false
		}
	}
	session = new cordova.plugins.phonertc.Session(config);
	session.on('sendMessage', function (data) { 
		console.log("sending message");
		socket.emit("msg",{content:JSON.stringify(data),userCode:user});
	});
	socket.on("msg", function(data){		
			console.log("receiving message"+data.content);
			session.receiveMessage(JSON.parse(data.content));
		});

	socket.on("call", function(data){		
			console.log(data.userCode+" is ready to get called");
			session.call();
		});

	session.on('answer', function () { 
		console.log('Other client answered!');
	});

	session.on('disconnect', function () { 
		console.log('Other client disconnected!');
	});
	socket.emit("setup_call",{userCode:user},call_response);
};

function call_response(data){
	if (data.error == true){
		alert(data.msg);
	}
	//maybe clean session ??
}

signaling.init = function login(){
	socket = io.connect(signaling_address);
	socket.on('update-users',function(data){
		updateTable(data);
	});
};

var div_login = document.getElementById("login");
var div_list_users = document.getElementById("list_users");
var div_calling = document.getElementById("calling");
var login_button  = document.getElementById("login_button");
var login_field  = document.getElementById("login_field");

div_login.style.display 	= "inline";
div_list_users.style.display= "none";
div_calling.style.display	= "none";

function setup_login(){
	
	//login button listener, checks return value, if ok switch to list_users
	login_button.addEventListener("click",function(){
		signaling.login(login_field.value)
	});
}
function login_response(data){
	if (data.error == false){
		div_login.style.display 	= "none";
		div_list_users.style.display= "inline";
	} else {
		alert(data.msg);
	}
}
function setup_list_users(){
	//maybe force list refresh
	
}

function updateTable(data){
	//getting table
	userTable = document.getElementById("users_table");
	//cleaning table
	userTable.innerHTML = "";
	for (var i =0;i<data.length;i++){
		var cellContent = data[i];
		var row = userTable.insertRow(-1);
		cell = row.insertCell(-1);
		cell.innerHTML = data[i];
		with({name:cellContent}){
			row.addEventListener("click",function(){
				console.log(name);
				signaling.call(name);
			});
		}
	}
}
