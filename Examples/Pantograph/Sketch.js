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

/* virtual ball parameters  */
var rBall = 0.02;

var mBall = 0.15;  // kg
var kBall = 445;  // N/m
var bBall = 3.7;
var penBall = 0.0;  // m
var bAir = 0.0;  // kg/s
var fGravity = new p5.Vector(0, 9.8*mBall);
vardt = 1/1000.0;

var posBall = new p5.Vector(0, 0.05);  
var velBall                             = new p5.Vector(0, 0);    

var fBall = new p5.Vector(0 ,0);    
var fContact = new p5.Vector(0, 0);
var fDamping = new p5.Vector(0, 0);

var posEEToBall;
var posEEToBallMagnitude;

var velEEToBall;
var velEEToBallMagnitude;

/* virtual wall parameters */
var fWall = new p5.Vector(0, 0);
var kWall = 800; // N/m
var bWall = 2; // kg/s
var penWall = new p5.Vector(0, 0);

var posWallLeft = new p5.Vector(-0.07, 0.03);
var posWallRight = new p5.Vector(0.07, 0.03);
var posWallBottom = new p5.Vector(0.0, 0.1);

/* generic data for a 2DOF device */
/* joint space */
var angles                              = new p5.Vector(0, 0);
var torques                             = new p5.Vector(0, 0);

/* task space */
var posEE                               = new p5.Vector(0, 0);
var posEELast                           = new p5.Vector(0, 0);
var velEE                               = new p5.Vector(0, 0);

var fEE                                 = new p5.Vector(0, 0); 

/* device graphical position */
var deviceOrigin                        = new p5.Vector(0, 0);

/* World boundaries reference */
const worldPixelWidth                     = 1000;
const worldPixelHeight                    = 650;

/* graphical elements */
var pGraph, joint, endEffector;
var ball, leftWall, bottomWall, rightWall;
/* end elements definition *********************************************************************************************/ 


function setup() {
    createCanvas(1200, 1200);

    /* visual elements setup */
   // background(0);
    deviceOrigin.add(worldPixelWidth/2, 0);

    // angles.x = Math.random();
    // angles.y = Math.random();
    // posEE.x = Math.random();
    // posEE.y = Math.random();
    
    /* create pantagraph graphics */
    create_pantagraph();
    
    /* create ball */
    ball = create_ball(rBall);
    ball.stroke(color(0));
    
    /* create left-side wall */
    leftWall = create_wall(posWallLeft.x, posWallLeft.y, posWallLeft.x, posWallLeft.y+0.07);
    leftWall.stroke(color(0));
    
    /* create right-sided wall */
    rightWall = create_wall(posWallRight.x, posWallRight.y, posWallRight.x,           posWallRight.y+0.07);
    rightWall.stroke(color(0));
    
    /* create bottom wall */
    bottomWall = create_wall(posWallBottom.x-0.07, posWallBottom.y, posWallBottom.x+0.07, posWallBottom.y);
    bottomWall.stroke(color(0));

    /* setup framerate speed */
    // frameRate(baseFrameRate);
  
    
    // simulationThread();
    // /* setup simulation thread to run at 1kHz */ 
    // var st = new SimulationThread();
    // scheduler.scheduleAtFixedRate(st, 1, 1, MILLISECONDS);
  }
  
   function draw() {

     /* put graphical code here, runs repeatedly at defined framerate in setup, else default at 60fps: */
       if(renderingForce == false){
         background(255);  
          update_animation(this.angles.x*radsPerDegree, 
                            this.angles.y*radsPerDegree, 
                            this.posEE.x, 
                            this.posEE.y);
       }
   }



async function workerSetup(){
    let port = await navigator.serial.requestPort();
    // let port = await navigator.serial.getPorts();
    worker.postMessage("test");
    //console.log(port);
    // worker.postMessage("test");
}

if (window.Worker) {
    // console.log("here");
    worker = new Worker("worker.js");
    document.getElementById("button").addEventListener("click", workerSetup);
    worker.addEventListener("message", function(msg){

        angles.x = msg.data[0];
        angles.y = msg.data[1];
        posEE.x = msg.data[2];
        posEE.y = msg.data[3];

       // console.log(angles.x);
       // console.log(angles.y);

     // console.log(this.posEE.x);

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
    
    // this.pGraph = beginShape();
    // pGraph.beginShape();
    // pGraph.fill(255);
    // pGraph.stroke(0);
    // pGraph.strokeWeight(2);

 //   pGraph.beginShape(POINTS);
    //beginShape();
   // this.pGraph.fill(255);
    //pGraph.stroke(0);
    //pGraph.strokeWeight(2);

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
  
  
function create_ball(rBall){
    rBall = pixelsPerMeter * rBall;
    
    // return beginShape(ELLIPSE, deviceOrigin.x, deviceOrigin.y, 2*rBall, 2*rBall);
  return ellipse(deviceOrigin.x, deviceOrigin.y, 2*rBall, 2*rBall);
  }
  
  
function update_animation(th1, th2, xE, yE){

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

    //console.log("(" + v1x + ", " + v1y + "), (" + v2x + ", " + v2y + "), (" + v3x + ", " + v3y + ")");

    // p5.js doesn't seem to have setVertex, so the coordinates are set in order rather than using an index
     this.pGraph = beginShape();
     this.pGraph.vertex(v0x, v0y);
     this.pGraph.vertex(v1x, v1y);
     this.pGraph.vertex(v2x, v2y);
     this.pGraph.vertex(v3x, v3y);
    
    this.pGraph.endShape(CLOSE);

    // shape(leftWall);
    leftWall.beginShape();
    leftWall.endShape();
    // shape(rightWall);
    rightWall.beginShape();
    rightWall.endShape();
    // shape(bottomWall);
    bottomWall.beginShape();
    bottomWall.endShape();
    ball.beginShape();
    ball.endShape();
    //shape(ball, posBall.x * pixelsPerMeter, posBall.y * pixelsPerMeter);
    stroke(0);

   // console.log("xE value is: " + posEE.x);
    
    translate(xE, yE);
    
    endEffector = ellipse(deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni)
    endEffector.beginShape();
    endEffector.endShape();
//     shape(endEffector);
  }
  
  
function device_to_graphics(deviceFrame){
    return deviceFrame.set(-deviceFrame.x, deviceFrame.y);
  }
  
  
function graphics_to_device(graphicsFrame){
    return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
  }
  /* end helper function ****************************************************************************************/



class Pantograph //extends Mechanisms
{

    
    constructor(){
        this.l = 0.07;
        this.L = 0.09;
        this.d = 0.0;
      
    // l;
    // L;
    // d;
	
    this.th1 = 0;
    this.th2 = 0;
    this.tau1 = 0;
    this.tau2 = 0;
    this.f_x = 0;
    this.f_y = 0;
    this.x_E = 0;
    this.y_E = 0;
	
	this.pi = 3.14159265359;
    this.JT11 = 0;
    this.JT12 = 0;
    this.JT21 = 0;
    this.JT22 = 0;
    this.gain = 1.0;      
    }

    torqueCalculation(force){
        this.f_x = force[0];
		this.f_y = force[1];

    
        this.tau1 = this.JT11*this.f_x + this.JT12*this.f_y;
		this.tau2 = this.JT21*this.f_x + this.JT22*this.f_y;
		
		this.tau1 = this.tau1*this.gain;
		this.tau2 = this.tau2*this.gain;
    }

    forwardKinematics(angles){
        let l1 = this.l;
    let l2 = this.l;
    let L1 = this.L;
    let L2 = this.L;
    
    this.th1 = this.pi/180*angles[0];
    this.th2 = this.pi/180*angles[1];

    // Forward Kinematics
    let c1 = parseFloat(Math.cos(this.th1));
    let c2 = parseFloat(Math.cos(this.th2));
    let s1 = parseFloat(Math.sin(this.th1));
    let s2 = parseFloat(Math.sin(this.th2));
    let xA = l1*c1;
    let yA = l1*s1;
    let xB = this.d+l2*c2;
     
    let yB = l2*s2;
    let hx = xB-xA; 
    let hy = yB-yA; 
    let hh = parseFloat( Math.pow(hx,2) +  Math.pow(hy,2)); 
    let hm =parseFloat(Math.sqrt(hh)); 
    let cB = - (parseFloat(Math.pow(L2,2) - parseFloat(Math.pow(L1,2) - hh) / (2*L1*hm))); 
    
    let h1x = L1*cB * hx/hm; 
    let h1y = L1*cB * hy/hm; 
    let h1h1 = parseFloat(Math.pow(h1x,2)) + parseFloat(Math.pow(h1y,2)); 
    let h1m = parseFloat(Math.sqrt(h1h1)); 
    let sB = parseFloat(Math.sqrt(1-Math.pow(cB,2)));  
     
    let lx = -L1*sB*h1y/h1m; 
    let ly = L1*sB*h1x/h1m; 
    
    let x_P = xA + h1x + lx; 
    let y_P = yA + h1y + ly; 
     
    let phi1 = parseFloat(Math.acos((x_P-l1*c1)/L1));
    let phi2 = parseFloat(Math.acos((x_P-this.d-l2*c2)/L2));
     
    let c11 = parseFloat(Math.cos(phi1)); 
    let s11 =parseFloat(Math.sin(phi1)); 
    let c22= parseFloat(Math.cos(phi2)); 
    let s22 = parseFloat(Math.sin(phi2)); 
  
    let dn = L1 *(c11 * s22 - c22 * s11); 
    let eta = (-L1 * c11 * s22 + L1 * c22 * s11 - c1 * l1 * s22 + c22 * l1 * s1)  / dn;
    let nu = l2 * (c2 * s22 - c22 * s2)/dn;
    
    this.JT11 = -L1 * eta * s11 - L1 * s11 - l1 * s1;
    this.JT12 = L1 * c11 * eta + L1 * c11 + c1 * l1;
    this.JT21 = -L1 * s11 * nu;
    this.JT22 = L1 * c11 * nu;

    this.x_E = x_P;
    this.y_E = y_P;   
    
    }

    forceCalculation(){
	}
	
	
	positionControl(){
	}
	
	
	inverseKinematics(){
	}
	
	
	set_mechanism_parameters(parameters){
		this.l = parameters[0];
		this.L = parameters[1];
		this.d = parameters[2];
	}
	
	
	set_sensor_data(data){
	}
	
	
	get_coordinate(){
		let temp = [this.x_E, this.y_E];
		return temp;
	}
	
	
	get_torque(){
		let temp = [this.tau1, this.tau2];
		return temp;
	}
	
	
	get_angle(){
		let temp = [this.th1, this.th2];
		return temp;
	}


}