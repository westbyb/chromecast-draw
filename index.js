var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req,res){
	res.sendFile(__dirname + '/index.html');
	// res.send('Hello World!');
});

io.on('connection', function(socket){
	socket.on('new image', function(msg){
		io.emit('new image', msg);
	});
});

http.listen(3000, function(){
	console.log('Server started listening on *:3000');
});