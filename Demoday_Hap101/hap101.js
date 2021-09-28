var haplyBoard;
var widgetOne;
var pantograph;
var worker;

var widgetOneID = 5;
var CW = 0;
var CCW = 1;
var renderingForce= false;

/* framerate definition ************************************************************************************************/
var baseFrameRate= 120;
/* end framerate definition ********************************************************************************************/ 

/* elements definition *************************************************************************************************/

/* Screen and world setup parameters */
var pixelsPerMeter = 4000.0;
var radsPerDegree = 0.01745;

/* pantagraph link parameters in meters */
var l = 0.07; // m
var L = 0.09; // m

/* end effector radius in meters */
var rEE = 0.006;
var rEEContact = 0.006;

var posEEToBox;
var posEEToCentroid;

var jsondata;

var box_ulx;
var box_uly;
var box_brx;
var box_bry;

var screen_ulx;
var screen_uly;
var screen_brx;
var screen_bry;

var angles                              = new p5.Vector(0, 0);

/* task space */
var posEE                               = new p5.Vector(0, 0);
var posEELast                           = new p5.Vector(0, 0);
var fEE                                 = new p5.Vector(0, 0); 

/* device graphical position */
var deviceOrigin                        = new p5.Vector(0, 0);

/* World boundaries reference */
const worldPixelWidth                     = 1000;
const worldPixelHeight                    = 650;

/* graphical elements */
var pGraph, joint, endEffector;
var leftWall;
var bottomWall;
var rightWall;
var topWall;

function onFileLoad()   {
    
    console.log(jsondata);
    //let object = jsondata.object;
    //let boxcoordinates = object.dimensions;
    box_ulx = boxcoordinates[0];
    box_uly = boxcoordinates[1];
    box_brx = boxcoordinates[2];
    box_bry = boxcoordinates[3];
    //console.log(box_ulx);
    box_ulx = 0;
    box_uly = 0;
    box_brx = 0;
    box_bry = 0;
    
    /* converting the box and centroid*/
    /* -0.1 to 0.1 x, 0 to 0.1 y*/
    screen_ulx = (box_ulx * 0.25) - 0.125;
    screen_uly = (box_uly * 0.13);
    screen_brx = (box_brx * 0.25) - 0.125;
    screen_bry = (box_bry * 0.13);
}

function setup() {
    createCanvas(1000, 650);

    /* visual elements setup */
    //background(255);
    deviceOrigin.add(worldPixelWidth/2, 0);
    
    jsondata = loadJSON('json/ex5_preprocessor.json', onFileLoad);

    /* create pantagraph graphics */
    create_pantagraph();

  }
  
   function draw() {

     /* put graphical code here, runs repeatedly at defined framerate in setup, else default at 60fps: */
     //  if(renderingForce == false){
         background(255);  
          update_animation(this.angles.x*radsPerDegree, this.angles.y*radsPerDegree, 
                            this.posEE.x, this.posEE.y);
     //  }
   }



async function workerSetup(){
    let port = await navigator.serial.requestPort();
    worker.postMessage("test");
}

if (window.Worker) {
    // console.log("here");
    worker = new Worker("hap101_worker.js");
    document.getElementById("button").addEventListener("click", workerSetup);
    worker.addEventListener("message", function(msg){

        //retrieve data from worker.js needed for update_animation()
        //TODO: find a more elegant way to retrieve the variables
        angles.x = msg.data[0];
        angles.y = msg.data[1];
        posEE.x = msg.data[2];
        posEE.y = msg.data[3];
    });
    
}
else {
    console.log("oops!");
}

/* helper functions section, place helper functions here ***************************************************************/
function create_pantagraph(){
    var lAni = pixelsPerMeter * l;
    var LAni = pixelsPerMeter * L;
    var rEEAni = pixelsPerMeter * rEE;

     joint = ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
     joint.beginShape();
     joint.endShape();
    
    // endEffector = beginShape(ELLIPSE, deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni);
  endEffector = ellipse(deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni)
    
  }
  
  
function create_wall(x1, y1, x2, y2){
    x1 = pixelsPerMeter * x1;
    y1 = pixelsPerMeter * y1;
    x2 = pixelsPerMeter * x2;
    y2 = pixelsPerMeter * y2;
    
    // return beginShape(LINE, deviceOrigin.x + x1, deviceOrigin.y + y1, deviceOrigin.x + x2, deviceOrigin.y+y2);
  return line(deviceOrigin.x + x1, deviceOrigin.y + y1, deviceOrigin.x + x2, deviceOrigin.y+y2);
  }

function create_ball(x1, y1, rad)   {

}
  
function update_animation(th1, th2, xE, yE){

    /* create left-side wall */
    leftWall = create_wall(screen_ulx, screen_uly, screen_ulx, screen_bry);
    leftWall.stroke(color(0));
    
    /* create right-sided wall */
    rightWall = create_wall(screen_brx, screen_uly, screen_brx, screen_bry);
    rightWall.stroke(color(0));
    
    /* create bottom wall */
    bottomWall = create_wall(screen_ulx, screen_bry, screen_brx, screen_bry);
    bottomWall.stroke(color(0));

    topWall = create_wall(screen_ulx, screen_uly, screen_brx, screen_uly);
    topWall.stroke(color(0));

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

    var lAni = pixelsPerMeter * l;
    var LAni = pixelsPerMeter * L;
    var rEEAni = pixelsPerMeter * rEE;

    joint = ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
    joint.stroke(color(0));

    var v0x = deviceOrigin.x;
    var v0y = deviceOrigin.y;
    var v1x = deviceOrigin.x + lAni*cos(th1);
    var v1y = deviceOrigin.y + lAni*sin(th1);
    var v2x = deviceOrigin.x + xE;
    var v2y = deviceOrigin.y + yE;
    var v3x = deviceOrigin.x + lAni*cos(th2);
    var v3y = deviceOrigin.y + lAni*sin(th2);

   // background(255);
    // p5.js doesn't seem to have setVertex, so the coordinates are set in order rather than using an index 
    this.pGraph = beginShape();
     this.pGraph.vertex(v0x, v0y);
     this.pGraph.vertex(v1x, v1y);
     this.pGraph.vertex(v2x, v2y);
     this.pGraph.vertex(v3x, v3y);
    
    this.pGraph.endShape(CLOSE);
    translate(xE, yE);
    
    endEffector = ellipse(deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni)
    endEffector.beginShape();
    endEffector.endShape();
  }
  
  
function device_to_graphics(deviceFrame){
    return deviceFrame.set(-deviceFrame.x, deviceFrame.y);
  }
  
  
function graphics_to_device(graphicsFrame){
    return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
  }
  /* end helper function ****************************************************************************************/