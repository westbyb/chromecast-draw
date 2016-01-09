var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = require('./libs/game.js');
var active_rooms = [];

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('new player', function(player_info){
      console.log('New player: ' + player_info.name);
      // console.log(active_rooms);
      var current_game = get_room(player_info.room_code);
      current_game.add_player(player_info.name);
      io.emit('new player', player_info.name);
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
    io.emit('new game', room_code);
    console.log('new game. room code: ' + g.room_code);
    // console.log('all games: ' + active_rooms);    
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