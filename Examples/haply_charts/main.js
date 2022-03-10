// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');


let btn = document.createElement("button");
btn.id = "btn";
btn.innerHTML = "Play Haptic Rendering";
document.body.appendChild(btn);

let btn_com = document.createElement("button");
btn_com.id = "com";
btn_com.innerHTML = "Press Me!";
document.body.appendChild(btn_com);

btn_com.style.display = "none";

document.getElementById("btn").addEventListener("click", function() {
  createCanvas();
  console.log("printed canvas");
});

var raf;
var worker;
const worldPixelWidth                     = 1000;


var posEE = {
  x:0,
  y:0
};

var deviceOrigin ={
  x:worldPixelWidth/2,
  y:0
};

var x_trans = 100;


function createCanvas(){
  document.body.removeChild(btn);
  btn_com.style.display = "block";
 

  

var canvas = document.createElement('canvas');

canvas.id = "main";
canvas.width = 800;
canvas.height = 500;
canvas.style.zIndex = 8;
canvas.style.position = "absolute";
canvas.style.border = "1px solid";
canvas.style.left = "100px";
canvas.style.top = "100px";


var body = document.getElementsByTagName("body")[0];
body.appendChild(canvas);

var ctx = canvas.getContext('2d');

/* Screen and world setup parameters */
var pixelsPerMeter = 4000.0;



var border = {
  draw: function(){
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }
};

var box = {
  draw:function(){
    ctx.strokeRect(140,70,canvas.width-310, canvas.height-200);
  }

}


var endEffector = {
  x: canvas.width/2,
  y: 25,
  radius: 15,
  color: 'black',
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }

};

function draw() {
  ctx.clearRect(0,0, canvas.width, canvas.height);
  updateAnimation();
  checkBounds();
 
  raf = window.requestAnimationFrame(draw);
}

canvas.addEventListener('mouseover', function(e) {
  raf = window.requestAnimationFrame(draw);
});


// canvas.addEventListener('mouseout', function(e) {
//   window.cancelAnimationFrame(raf);
// });

function checkBounds(){

  if (endEffector.y + endEffector.vy > canvas.height ||
    endEffector.y + endEffector.vy < 0) {
  endEffector.vy = -endEffector.vy;
  }
  if (endEffector.x + endEffector.vx > canvas.width ||
      endEffector.x + endEffector.vx < 0) {
    endEffector.vx = -endEffector.vx;
  }

}

function updateAnimation(){
  border.draw();
  box.draw();
  let xE = posEE.x;
  let yE = posEE.y;
  // console.log(xE);

  xE = pixelsPerMeter * -xE;
  yE = pixelsPerMeter * yE;

 

  //update endEffector
  endEffector.x = deviceOrigin.x +xE-x_trans;
  endEffector.y = deviceOrigin.y+yE;
  endEffector.draw();
}



border.draw();
box.draw();
endEffector.draw();

}

  /******worker code******** */
async function workerSetup(){
  const filters = [
    { usbVendorId: 0x2341, usbProductId: 0x804D }
];

let hapticPort = await navigator.serial.requestPort({filters});
  worker.postMessage("test");
}

if (window.Worker) {
  worker = new Worker("worker.js");
  document.getElementById("com").addEventListener("click", workerSetup);
  worker.addEventListener("message", function(msg){
      posEE.x = msg.data.x;
      posEE.y = msg.data.y;
      // console.log(posEE)
  });
  
}
else {
  console.log("Workers not supported.");
}
