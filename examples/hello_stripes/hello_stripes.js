var worker;

/* elements definition *************************************************************************************************/

/* Screen and world setup parameters */
var pixelsPerMeter = 4000.0;
var radsPerDegree = 0.01745;

/* pantagraph link parameters in meters */
var l = 0.07; // m
var L = 0.09; // m

/* version of device, modified by worker */
var newPantograph;

/* end effector radius in meters */
var rEE = 0.006;

/* virtual wall parameters */
var start = new p5.Vector(-0.07, 0.045);
var end = new p5.Vector(0.07, 0.13);
var distBtwnWalls = 0.005;

/* generic data for a 2DOF device */
/* joint space */
var angles = new p5.Vector(0, 0);
var torques = new p5.Vector(0, 0);

/* task space */
var posEE = new p5.Vector(0, 0);

/* device graphical position */
var deviceOrigin = new p5.Vector(0, 0);

/* World boundaries reference */
const worldPixelWidth = 1000;
const worldPixelHeight = 650;

/* graphical elements */
var pGraph, joint1, joint2, endEffector;
var verWall;
var horWall;

/* end elements definition *********************************************************************************************/


function setup() {
  createCanvas(1200, 1200);
  /* visual elements setup */
  deviceOrigin.add(worldPixelWidth / 2, 0);
  /* create pantagraph graphics */
  create_pantagraph();
}

function draw() {
  /* put graphical code here, runs repeatedly at defined framerate in setup, else default at 60fps: */
  background(255);
  update_animation(this.angles.x * radsPerDegree,
    this.angles.y * radsPerDegree,
    this.posEE.x,
    this.posEE.y);
}


async function workerSetup() {
  /* ask user to select the port where the device is connected */
  let port = await navigator.serial.requestPort();
  /* post generic message to the worker for the device to start functioning */
  worker.postMessage("test");
}

if (window.Worker) {
  // console.log("here");
  worker = new Worker("hello_stripes_worker.js", {type: "module"});
  /* connect function to click event in button */
  document.getElementById("button").addEventListener("click", workerSetup);
  /* listen to messages from the worker */
  worker.addEventListener("message", function (msg) {
    //retrieve data from worker.js needed for update_animation()
    angles.x = msg.data[0];
    angles.y = msg.data[1];
    posEE.x = msg.data[2];
    posEE.y = msg.data[3];
    newPantograph = msg.data[4];

  });

}
else {
  console.log("oops!");
}

/* helper functions section, place helper functions here ***************************************************************/
function create_pantagraph() {
  var rEEAni = pixelsPerMeter * rEE;

  /* draw first joint */
  joint1 = ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
  joint1.beginShape();
  joint1.endShape();

  if(newPantograph == 1){
    /* draw second joint - only in 2DIYv3 */
    joint2 = ellipse(deviceOrigin.x - 38e-3 * pixelsPerMeter, deviceOrigin.y, rEEAni, rEEAni)
    joint2.beginShape();
    joint2.endShape();
  }

  /* draw end effector */
  endEffector = ellipse(deviceOrigin.x, deviceOrigin.y, 2 * rEEAni, 2 * rEEAni)

}


function create_line(x1, y1, x2, y2) {
  /* draw lines with coordinates in the device frame */
  x1 = pixelsPerMeter * x1;
  y1 = pixelsPerMeter * y1;
  x2 = pixelsPerMeter * x2;
  y2 = pixelsPerMeter * y2;

  return line(deviceOrigin.x + x1, deviceOrigin.y + y1, deviceOrigin.x + x2, deviceOrigin.y + y2);
}


function update_animation(th1, th2, xE, yE) {

  /* draw horizontal lines */
  for(var i=start.y; i<end.y; i+=distBtwnWalls){
    horWall = create_line(start.x, i, end.x, i);
    horWall.stroke(color(0));
  }

  th1 = angles.x * (3.14 / 180);
  th2 = angles.y * (3.14 / 180);
  xE = posEE.x;
  yE = posEE.y;

  var lAni = pixelsPerMeter * l;
  var LAni = pixelsPerMeter * L;

  xE = pixelsPerMeter * -xE;
  yE = pixelsPerMeter * yE;

  th1 = 3.14 - th1;
  th2 = 3.14 - th2;

  var rEEAni = pixelsPerMeter * rEE;

  /* draw first joint */
  joint1 = ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
  joint1.stroke(color(0));

  if(newPantograph == 1){
    /* draw second joint - only in 2DIYv3 */
    joint2 = ellipse(deviceOrigin.x - 38e-3 * pixelsPerMeter, deviceOrigin.y, rEEAni, rEEAni)
    joint2.stroke(color(0));

    /* draw arms */
    var v0x = deviceOrigin.x - 38e-3 * pixelsPerMeter;
    var v0y = deviceOrigin.y;
    var v1x = deviceOrigin.x;
    var v1y = deviceOrigin.y;
    var v2x = deviceOrigin.x + lAni * cos(th1);
    var v2y = deviceOrigin.y + lAni * sin(th1);
    var v3x = deviceOrigin.x + xE;
    var v3y = deviceOrigin.y + yE;
    var v4x = deviceOrigin.x + lAni * cos(th2) - 38e-3 * pixelsPerMeter;
    var v4y = deviceOrigin.y + lAni * sin(th2);

    // p5.js doesn't seem to have setVertex, so the coordinates are set in order rather than using an index 
    this.pGraph = beginShape();

    this.pGraph.vertex(v0x, v0y);
    this.pGraph.vertex(v1x, v1y);
    this.pGraph.vertex(v2x, v2y);
    this.pGraph.vertex(v3x, v3y);
    this.pGraph.vertex(v4x, v4y);

    this.pGraph.endShape(CLOSE);

  }else{
    /* draw arms */
    var v0x = deviceOrigin.x;
    var v0y = deviceOrigin.y;
    var v1x = deviceOrigin.x + lAni * cos(th1);
    var v1y = deviceOrigin.y + lAni * sin(th1);
    var v2x = deviceOrigin.x + xE;
    var v2y = deviceOrigin.y + yE;
    var v3x = deviceOrigin.x + lAni * cos(th2);
    var v3y = deviceOrigin.y + lAni * sin(th2);

    // p5.js doesn't seem to have setVertex, so the coordinates are set in order rather than using an index 
    this.pGraph = beginShape();
    
    this.pGraph.vertex(v0x, v0y);
    this.pGraph.vertex(v1x, v1y);
    this.pGraph.vertex(v2x, v2y);
    this.pGraph.vertex(v3x, v3y);

    this.pGraph.endShape(CLOSE);
  }

  /* draw end effector according to the received position */
  translate(xE, yE);
  endEffector = ellipse(deviceOrigin.x, deviceOrigin.y, 2 * rEEAni, 2 * rEEAni)
  endEffector.beginShape();
  endEffector.endShape();
}


function device_to_graphics(deviceFrame) {
  return deviceFrame.set(-deviceFrame.x, deviceFrame.y);
}


function graphics_to_device(graphicsFrame) {
  return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
}
  /* end helper function ****************************************************************************************/