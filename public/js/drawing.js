//handles drawing
var clickX = [];
var clickY = [];
var clickDrag = [];
var paint;
var $canvas = $('#sketch');
var context = $canvas[0].getContext("2d");

//set context and canvas width to the width of the window
context.canvas.width = $canvas[0].width = window.innerWidth - 20;
context.canvas.height = $canvas[0].height = window.innerHeight * 0.9;

function add_click(x,y,dragging){
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}

function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.strokeStyle = player.color;
  context.lineJoin = "round";
  context.lineWidth = 6;

  for(var i=0; i< clickX.length; i++){
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
    } else {
      context.moveTo(clickX[i]-1, clickY[i]);
    }

    context.lineTo(clickX[i], clickY[i]);
    context.closePath();
    context.stroke();
  }
}

function undo(){
  var to = clickDrag.lastIndexOf(undefined);
  clickDrag = clickDrag.slice(0, to);
  clickX = clickX.slice(0, to);
  clickY = clickY.slice(0, to);
  redraw();
}

function clear_canvas(){
  clickX = clickY = clickDrag = []; //reset all the arrays, otherwise the next click will redraw everything
  context.clearRect(0,0, $canvas[0].width, $canvas[0].height);
}

var eventDown = function(e){
  var mouseX, mouseY;
  if(e.pageX){
    mouseX = e.pageX - this.offsetLeft;
    mouseY = e.pageY - this.offsetTop;
  } else{
    mouseX = e.originalEvent.touches[0].pageX - this.offsetLeft;
    mouseY = e.originalEvent.touches[0].pageY - this.offsetTop;
  }

  paint = true;
  add_click(mouseX, mouseY);
  redraw();
};

var eventMove = function(e){
  e.preventDefault();
  if(paint){
    var mouseX, mouseY;
    if(e.pageX){
      mouseX = e.pageX - this.offsetLeft;
      mouseY = e.pageY - this.offsetTop;
    } else{
      mouseX = e.originalEvent.touches[0].pageX - this.offsetLeft;
      mouseY = e.originalEvent.touches[0].pageY - this.offsetTop;
    }
    add_click(mouseX, mouseY, true);
    redraw();
  }
};

var stopPainting = function(e){
  paint = false;
};

if(detect_device_type() === 'mobile') { // touch for mobile
  // context.canvas.height = $canvas[0].height = context.canvas.width * 1.5;
  $canvas.on('touchstart', eventDown);
  $canvas.on('touchmove', eventMove);
  $canvas.on('touchend', stopPainting);
  $canvas.on('touchleave', stopPainting);
} else{ //click for pc
  $canvas.mousedown(eventDown);
  $canvas.mousemove(eventMove);
  $canvas.mouseup(stopPainting);
  $canvas.mouseleave(stopPainting);
}