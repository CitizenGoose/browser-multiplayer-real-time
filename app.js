/*
Main application. Type "node app.js" on terminal in the adecuate directory to
run. Connect to localhost:2000. Built so that it can be uploaded to my account
on Heroku (citizengoosevv@gmail.com).

Check .json file for dependencies.

This file combines all the other files and incorporates node.js networking
elements, like express and socket + loging in and signing in. Also
disconnections and server evaluations....

-CitizenGoose

*/


require('./Database');
require('./Entity');
require('./client/Inventory');

var express = require('express');// Express ////////////////////////////////////
var app = express();////////////////////////////////////////////////////////////
var serv = require('http').Server(app);/////////////////////////////////////////

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var SOCKET_LIST = {};

var DEBUG = true;

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('signIn',function(data){ //{username,password} //Sign In ///////////
		Database.isValidPassword(data,function(res){ ///////////////////////////////
			if(!res)//////////////////////////////////////////////////////////////////
				return socket.emit('signInResponse',{success:false});///////////////////
			Database.getPlayerProgress(data.username,function(progress){//////////////
				Player.onConnect(socket,data.username,progress);////////////////////////
				socket.emit('signInResponse',{success:true});///////////////////////////
			})////////////////////////////////////////////////////////////////////////
		});/////////////////////////////////////////////////////////////////////////
	});

	socket.on('signUp',function(data){ // Sign Up ////////////////////////////////
		Database.isUsernameTaken(data,function(res){////////////////////////////////
			if(res){//////////////////////////////////////////////////////////////////
				socket.emit('signUpResponse',{success:false});//////////////////////////
			} else {//////////////////////////////////////////////////////////////////
				Database.addUser(data,function(){///////////////////////////////////////
					socket.emit('signUpResponse',{success:true});/////////////////////////
				});/////////////////////////////////////////////////////////////////////
			}/////////////////////////////////////////////////////////////////////////
		});/////////////////////////////////////////////////////////////////////////
	});
///////////////////////////////////////////////////////////////////////////////////////
	socket.on('sendMsgToServer',function(data){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',Player.username + ': ' + data);
		}
	});
	socket.on('sendPmToServer',function(data){ //data:{username,message}
		var recipientSocket = null;
		for(var i in Player.list)
			if(Player.list[i].username === data.username)
				recipientSocket = SOCKET_LIST[i];
		if(recipientSocket === null){
			socket.emit('addToChat','The player ' + data.username + ' is not online.');
		} else {
			recipientSocket.emit('addToChat','From ' + Player.player.username + ':' + data.message);
			socket.emit('addToChat','To ' + data.username + ':' + data.message);
		}
	});
///////////////////////////////////////////////////////////////////////////////////////

	socket.on('disconnect',function(){// Disconnect //////////////////////////////
		delete SOCKET_LIST[socket.id];//////////////////////////////////////////////
		Player.onDisconnect(socket);////////////////////////////////////////////////
	});

	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer',res);
	});



});


setInterval(function(){ // Update each frame ///////////////////////////////////
	var packs = Entity.getFrameUpdateData();//////////////////////////////////////
	for(var i in SOCKET_LIST){////////////////////////////////////////////////////
		var socket = SOCKET_LIST[i];////////////////////////////////////////////////
		socket.emit('init',packs.initPack);/////////////////////////////////////////
		socket.emit('update',packs.updatePack);/////////////////////////////////////
		socket.emit('remove',packs.removePack);/////////////////////////////////////
	}/////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
},1000/25);
