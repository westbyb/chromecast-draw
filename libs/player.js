/*
 * Player module, containing all player info and functionality
 */

module.exports = function player(name, color, socket_id){
  this.name = name;
  this.score = 0;
  this.color = color; //sketch color
  this.socket_id = socket_id;

  /**
   * assigns photo to player
   * @param {URI}  picture  The player picture
   */
  this.add_picture = function(picture){
    this.picture = picture;
    console.log('added photo for ' + this.name);
  };

  /**
   * Changes the score for a player +/- delta
   * @param  {Number} delta The difference in score. Should be a positive number
   */
  this.change_score = function(delta){
    this.score += delta;
  };
};