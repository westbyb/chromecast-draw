/*
 * Client-side JS for handling user & server events
 */

var socket = io();

var player = {score: 0, color: '#000000', name: 'Player'};
var room_code;
var ready = false;

//start a new game
$('#new_game').click(function(){
  socket.emit('new game');
});

//new game server response
socket.on('new game', function(code){
  $('#current_game').text(code);
  update(); //starts chromecast
});

//create new player joining a game
$('#join_game').click(function(){
  var player_info = {name: $('#player_name').val().toUpperCase(), room_code: $('#room_code').val().toUpperCase()};
  room_code = player_info.room_code; 
  socket.emit('new player', player_info);
});

//new player server response
socket.on('join success', function(player_info){
  player = player_info;
  switch_pages('#sketch_page');
  $('#sketch').attr('player', player.name);
});

//player already exists server response
socket.on('wrong code', function(code){
  alert('The game ' + code + ' does not exist');
});

//sketch submit handler
$('#sketch_submit').click(function(e){
  var dataURL = $('#sketch')[0].toDataURL('image/png');
  var is_player = $('#sketch').attr('player');
  //submitting a player picture
  if(is_player){
    var player_sketch = {name: is_player, player_picture: dataURL, room_code: $('#room_code').val().toUpperCase() };
    player.picture = dataURL;
    $('#sketch').removeAttr('player'); //makes it so that your next sketches are seen as game submissions
    socket.emit('player picture', player_sketch);
  } else { //maybe have this as an else-if for later on?
    var sketch_data = { room: room_code, name: player.name, sketch: dataURL };
    socket.emit('new image', sketch_data);
  }
  switch_pages('#waiting_page');
  clear_canvas();
});

//game has enough players, can now begin
//TODO: only activates for one person right now
socket.on('ready to begin', function(){
  ready = true;
  $('#start_game').removeClass('hidden');
});

//click the start game button
$('#start_game').click(function(){
  var state = { room: room_code, starting: true };
  // send_to_room(room_code, 'next round', state);
  socket.emit('next round', state);
});

socket.on('new phrase', function(phrase){
  switch_pages('#sketch_page');
  $('#phrase').removeClass('hidden').text(phrase.toUpperCase());
});

socket.on('guessing time', function(){
  switch_pages('#guess_page');
});

function detect_device_type(){
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    return "mobile";
  } else {
    return "desktop";
  }
}

/**
 * switches pages, hiding one, while setting the other as current
 * @param  {[type]} to   [description]
 * @return {[type]}      [description]
 */
function switch_pages(to){
  $('.page').addClass('hidden').removeClass('current');
  $(to).removeClass('hidden').addClass('current');
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