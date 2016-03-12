var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');
var game = require('./libs/game.js');
var active_rooms = [];
const min_players = 4;

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

  //create a new game
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

  //handles adding new players to an existing game
  socket.on('new player', function(game_info){
    var current_game = get_room(game_info.room_code); //get the game
    if (current_game === undefined) { //code is wrong
      socket.emit('wrong code', game_info.room_code);
      return;
    }

    var draw_color = current_game.available_colors.pop(); //find a color that's left
    var player = {name: game_info.name, color: draw_color, score: 0}; //make a player
    current_game.add_player(player.name, player.color, socket.id); //add the player
    socket.emit('join success', player); //tell the player they joined successfully
    send_to_room(game_info.room_code, 'new player', player); //send new player object to client
  });

  //player is adding a picture to their player object
  socket.on('player picture', function(player_sketch){
    var game_room = io.of(player_sketch.room_code);
    var current_game = get_room(player_sketch.room_code);
    var p = current_game.get_player(player_sketch.name)[0];
    p.add_picture(player_sketch.player_picture);
    if (current_game.players.length >= min_players && !current_game.ready) {
      current_game.ready = true;
      send_to_room(player_sketch.room_code, 'ready to begin', '');
    }
    send_to_room(player_sketch.room_code, 'player ready', p);
  });

  //begin the game
  socket.on('start game', function(room){
    var game = get_room(room);
    if(!game.ready || game.status === 1) return; //game isn't ready or has already begun
    var phrases = game.get_new_phrases();
    game.status = 1;
    
    send_unique_to_players(game, 'new phrase', phrases);
  });

  //send phrase to players to draw
  socket.on('send new phrases', function(room){
    var game = get_room(room);
    var phrases = game.get_new_phrases();
    
    send_unique_to_players(game, 'new phrase', phrases);
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

function send_unique_to_players(game, message, data_arr){
  var players = game.get_players();
  if (players.length !== data_arr.length) return -1; //there must be a player for each array item
  _.each(players, function(p, i){
    var socket_id = p.socket_id;
    if(io.sockets.connected[socket_id]){
      io.to(socket_id).emit(message, data_arr[i]);
    }
  });
}