var player = require('./player.js');

var drawObj = function(drawing, player){
  this.drawing = drawing;
  this.player = player;
};

module.exports = function game(room_code){
    this.room_code = room_code;
    this.players = [];
    this.ready = false;
    this.available_colors = ["#3366FF", "#33FFCC", "#FF6633", "#33FF66", "#FF0000", "#8000FF", "#990099", "#006600"]; //todo: populate with colors
    this.scoreboard = [];
    this.drawings = [];
    this.guesses = [];
    this.status = 0; //0 for accepting players/ready to start, 1+ for locked/round #
    this.phrases = ["darth vader", "gatorade", "group of swans", "selfie", "small donut", "leap year", "missing button", "juggling leprechauns", "snake charmer", "strange bulge", "voldemort", "field goal", "octopus massage", "mystery ooze", "whacky wavy inflatable tube man", "money trees", "a fat weiner dog"];
    this.adult_phrases = ["sexy cats", "jizz stained t shirt", "sausage fest", "smegma"];

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
     * returns -1 on failure, 0 on success
     * @param {[type]}
     * @param {[type]}
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

    this.get_players = function(){
      return this.players;
    };

    this.get_player = function(name){
      var player = this.players.filter(function(p){
        return  p.name === name;
      });
      return player;
    };

    this.ready_up = function(){
      this.ready = true;
    };

    this.start = function(){
      this.status = 1;
      this.drawings = shuffle(this.drawings); //shuffle the entries
    };

    this.next_drawing = function(){
      return this.drawings.pop(); //will return empty when it's empty (game will be over)
    };

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
     * updates the leaderboard to reflect current standing
     */
    this.update_scoreboard = function(){
      this.scoreboard.sort(function(p1, p2){
        if(p1.score > p2.score) { return 1; }
        if(p1.score < p2.score) { return -1; }
        return 0;
      });
    };

    this.collect_guess = function(guess, name){
      var guess_data = { guess: guess, player: name };
      this.guesses.push(guess_data);
    };

    this.submit_drawing = function(drawing, player){
      this.drawings.push(drawing);
    };

};