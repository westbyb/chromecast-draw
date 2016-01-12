module.exports = function player(name){
  this.name = name;
  this.score = 0;

  /**
   * assigns photo to player
   */
  this.add_picture = function(picture){
    this.picture = picture;
    console.log('added photo for ' + this.name);
  };

  /**
   * @delta  {number} score difference from the round (+/-)
   */
  this.change_score = function(delta){
    this.score += delta;
  };

  this.submit_drawing = function(drawing){
    //todo: figure this out
  };
};