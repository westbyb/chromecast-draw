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

  /**
   * Create a new game, push it to the active games array
   */
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
    socket.emit('new game', room_code);
    console.log('new game. room code: ' + g.room_code);
  });

  /**
   * Handles adding new players to an existing game
   * @param  {Object} game_info   Object containing room code, player name
   */
  socket.on('new player', function(game_info){
    var current_game = get_room(game_info.room_code); //get the game
    if (current_game === undefined) { //code is wrong
      socket.emit('wrong code', game_info.room_code);
      return;
    }

    var draw_color = current_game.available_colors.pop(); //find a color that's left
    var player = {name: game_info.name, color: draw_color, score: 0}; //make a player
    current_game.add_player(player.name, player.color, socket.id); //add the player
    socket.join(game_info.room_code);
    socket.emit('join success', player); //tell the player they joined successfully
    send_to_room(game_info.room_code, 'new player', player); //send new player object to client
  });

  /**
   * Player is adding a picture to their player object
   * @param  {Object} player_sketch   Object containing room code, player name & picture
   */
  socket.on('player picture', function(player_sketch){
    var current_game = get_room(player_sketch.room_code);
    var p = current_game.get_player(player_sketch.name)[0];
    p.add_picture(player_sketch.player_picture);
    if (current_game.players.length >= min_players && !current_game.ready) {
      current_game.ready = true;
      send_to_room(player_sketch.room_code, 'ready to begin', '');
    }
    send_to_room(player_sketch.room_code, 'player ready', p);
  });

  /**
   * Begin game/send phrase to players to draw
   * @param  {Object} state  Object containing room code
   */
  socket.on('next round', function(state){
    var game = get_room(state.room);
    send_to_room(state.room, 'next_round', null);
    console.log('Game ' + state.room + ': next round');
    if (state.starting){
      console.log('ready: ' + game.ready + ', status: ' + game.status);
      if(!game.ready || game.status !== 0) return;
      console.log('started game ' + state.room);
      game.start();
    }
    var phrases = game.next_round();
    
    send_unique_to_players(game, 'new phrase', phrases);
  });

  /**
   * New sketch being submitted for a phrase
   * @param  {Object} sketch_data   Object containing room code, player name, sketch
   */
  socket.on('new image', function(sketch_data){
    var game = get_room(sketch_data.room);
  });

  /**
   * Tells the server to move to the next sketch
   * @param  {Object} sketch_data   Object containing room code
   */
  socket.on('next image', function(sketch_data){
    var game = get_room(sketch_data.room);
    var sketch = game.next_drawing();
    if (sketch === undefined) { //no more sketches
      if (game.status < 3) { //next round!
        var state = { room: sketch_data.room, starting: false};
        socket.emit('next round', state);
      } else { //game over
        socket.emit('game over');
      }
    } else {
      send_to_room(room_code, 'next sketch', sketch);
    }
  });
});

http.listen(3000, function(){
    console.log('Server started listening on *:3000');
});

/**
 * Gets the room object for the corresponding room code
 * @param  {String} room_code Room code
 * @return {Object}           Room Object
 */
function get_room(room_code){
  var desired_game = active_rooms.filter(function(ga){
    return  ga.room_code === room_code;
  });
  return desired_game[0];
}

/**
 * Sends the same message to all users in room
 * @param  {String} room    Room code
 * @param  {String} message Message to send to room
 * @param  {Object} data    Data to be sent alongside message
 */
function send_to_room(room, message, data){
  io.sockets.in(room).emit(message, data); 
}

/**
 * Sends a unique object to each user in a room
 * @param  {Object} game     Game object
 * @param  {String} message  Message to send data with
 * @param  {Array}  data_arr Array of data to pop and send to users
 */
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