/*
 * Game module, containing all game info and functionality.
 * Each connection should result in a game, or a connection to a game.
 */

var player = require('./player.js');

var Drawing = function(drawing, player, phrase){
  this.drawing = drawing;
  this.player = player;
  this.phrase = phrase;
};

var Guess = function(guess, player){
  this.guess = guess;
  this.player = player;
};

module.exports = function game(room_code){
    this.room_code = room_code;
    this.players = [];
    this.ready = false;
    this.available_colors = shuffle(["#3366FF", "#33FFCC", "#FF6633", "#33FF66", "#FF0000", "#8000FF", "#990099", "#006600"]); //todo: populate with colors
    this.scoreboard = [];
    this.drawings = [];
    this.guesses = [];
    this.status = 0; //0 for accepting players/ready to start, 1+ for locked/round #. Seems like it might be reduntant?
    this.phrases = 
    this.current_drawing = {};

    /**
     * Takes an array and shuffles it. Useful for randomizing entries.
     * @param  {Array} array Array to be shuffled
     * @return {Array}       Shuffled array
     */
    function shuffle(array) {
      var counter = array.length, temp, index;

      // While there are elements in the array
      while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
      }

        return array;
    }

    /**
     * Adds player to game object
     * @param  {String} name      Player name
     * @param  {String} color     Sketch color HEX value
     * @param  {String} socket_id Socket ID for the player
     * @return {Number} 0 for success, -1 for failure
     */
    this.add_player = function(name, color, socket_id){
      //don't add player if player with same name already exists
      if (this.get_player(name).length > 0){
        console.log('Player with name ' + name + ' already exists in room ' + this.room_code);
        return -1;
      }

      var new_player = new player(name, color, socket_id);
      this.players.push(new_player);
      console.log('Added player ' + name + ' to game ' + this.room_code);
      return 0;
    };

    /**
     * Gets all players for the game. Maybe remove and just access game.players?
     * @return {Array} Players in game
     */
    this.get_players = function(){
      return this.players;
    };

    /**
     * Gets player based on name
     * @param  {String} name Name of the player to get
     * @return {Object}      Player object
     */
    this.get_player = function(name){
      var player = this.players.filter(function(p){
        return  p.name === name;
      });
      return player;
    };

    /**
     * Sets game as ready
     */
    this.ready_up = function(){
      this.ready = true;
    };

    /**
     * Starts game
     */
    this.start = function(){
      this.status = 1;
      this.drawings = shuffle(this.drawings); //shuffle the entries
    };

    /**
     * Sends out the next drawing from a game
     * @return {URI} URI of the image
     */
    this.next_drawing = function(){
      var next_drawing = shuffle(this.drawings).pop();
      this.current_drawing = next_drawing;
      this.guesses = [];
      return next_drawing; //will return empty when it's empty (game will be over)
    };

    /**
     * Moves the game to the next round
     * @return {Array} Array of phrases to draw
     */
    this.next_round = function(){
      var round = [];
      this.status++;
      this.phrases = shuffle(this.phrases);
      for(var i=0; i<this.players.length; i++){
        round.push(this.phrases.pop());
      }
      return round;
    };

    /**
     * Updates the leaderboard to reflect current standing
     */
    this.update_scoreboard = function(){
      this.scoreboard.sort(function(p1, p2){
        if(p1.score > p2.score) { return 1; }
        if(p1.score < p2.score) { return -1; }
        return 0;
      });
    };

    /**
     * Adds guess from user for a sketch, to be voted on.
     * @param  {String} guessStr  Guess from user
     * @param  {String} name      Player name of the user guessing
     */
    this.collect_guess = function(guessStr, name){
      //TODO: if guess is the sketch phrase, reject and have them submit another
      var new_guess = new Guess(guessStr, name);
      this.guesses.push(new_guess);
      return this.players.length - this.guesses.length;
    };

    /**
     * Adds user sketch to the current round
     * @param  {URI}    drawURI Sketch URI
     * @param  {String} player  Player name to submit drawing for
     */
    this.submit_drawing = function(drawURI, player, phrase){
      var new_drawing = new Drawing(drawURI, player, phrase);
      this.drawings.push(new_drawing);
      console.log(player + 'has submitted a drawing');
      return this.players.length - this.drawings.length;
    };

};