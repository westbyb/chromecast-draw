var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = require('./libs/game.js');
var active_rooms = [];

app.use(express.static(__dirname + '/public'));

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/chrome', function(req, res){
  res.sendFile(__dirname + '/chromehellotext.html');
});

io.on('connection', function(socket){
  socket.on('join room', function(room){
    console.log('Socket room created: ' + room);
    socket.join(room);
  });

  socket.on('new player', function(game_info){
    var current_game = get_room(game_info.room_code); //get the game
    if (current_game === undefined) {
      socket.emit('wrong code', game_info.room_code);
      return;
    }

    var draw_color = current_game.available_colors.pop(); //find a color that's left
    var player = {name: game_info.name, color: draw_color, score: 0}; //make a player
    current_game.add_player(player.name, player.color); //add the player
    socket.emit('join success', player); //tell the player they joined successfully
    send_to_room(game_info.room_code, 'new player', player); //send new player object to client
  });

  socket.on('player picture', function(player_sketch){
    var game_room = io.of(player_sketch.room_code);
    var current_game = get_room(player_sketch.room_code);
    var p = current_game.get_player(player_sketch.name)[0];
    p.add_picture(player_sketch.player_picture);
    send_to_room(player_sketch.room_code, 'player ready', p);
    // game_room.emit('player ready', p);
  });

  socket.on('new game', function(){
    function generate_room_code(){
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      for( var i=0; i < 4; i++ )
          text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    }

    var room_code = generate_room_code();
    //if the room code is already in use, generate a new one until you find one that isn't in use
    while(active_rooms.indexOf(room_code) === 0) {
      room_code = generate_room_code();
    }

    var g = new game(room_code);
    active_rooms.push(g);
    socket.join(room_code);
    // io.of(room_code).emit('new game', room_code);
    io.to(room_code).emit('new game', room_code);
    console.log('new game. room code: ' + g.room_code);
  });
});

http.listen(3000, function(){
    console.log('Server started listening on *:3000');
});

function get_room(room_code){
  var desired_game = active_rooms.filter(function(ga){
    return  ga.room_code === room_code;
  });
  return desired_game[0];
}

function send_to_room(room, message, data){
  io.sockets.in(room).emit(message, data); 
}