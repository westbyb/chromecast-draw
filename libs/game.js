var player = require('./player.js');

module.exports = function game(room_code){
    this.room_code = room_code;
    this.players = [];
    this.available_colors = []; //todo: populate with colors
    this.scoreboard = [];

    /**
     * returns -1 on failure, 0 on success
     * @param {[type]}
     * @param {[type]}
     */
    this.add_player = function(name){
      //don't add player if player with same name already exists
      if (this.get_player(name).length > 0){
        console.log('Player with name ' + name + ' already exists in room ' + this.room_code);
        return -1;
      }

      var new_player = new player(name);
      this.players.push(new_player);
      console.log('Added player ' + name + ' to game ' + this.room_code);
      return 0;
    };

    this.get_player = function(name){
      var player = this.players.filter(function(p){
        return  p.name === name;
      });
      return player;
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
};