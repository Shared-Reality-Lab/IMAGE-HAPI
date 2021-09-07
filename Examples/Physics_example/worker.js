



function closeWorker(){
  console.log("worker before close");
  self.close();
  console.log("worker closed");
  var runLoop = true;
}

var message = "";
updateMess = function(mess){
  message = mess;
}

getMessage = async function(m){
  if( message == ""){ 
    return "connect";
  }
  else{
    return message;
  }
  
}

var counter = 0;
var msgcount = 0;
var runLoop=true
var widgetOne;
var pantograph;
var worker;

var widgetOneID = 5;
self.importScripts("libraries/vector.js");
var angles = new Vector(0,0);    
var torques= new Vector(0,0);
var positions = new Vector(0, 0);

/* task space */
var posEE = new Vector(0,0);   
var posEE_copy = new Vector(0,0);
var posEELast =new Vector(0,0) ; 
var velEE =new Vector(0,0);
dt= 1/1000.0;

var posBall = new Vector(0, 0.05);  
var velBall = new Vector(0, 0);    

var posEEToBall;
var posEEToBallMagnitude;

var velEEToBall;
var velEEToBallMagnitude;

var rEE = 0.006;
var rEEContact = 0.006;

var rBall = 0.02;

var mBall = 0.15;  // kg
var kBall = 445;  // N/m
var bBall = 3.7;
var penBall = 0.0;  // m
var bAir = 0.0;  // kg/s
var fGravity = new Vector(0, 9.8*mBall);
var dt = 1/1000.0;

var fBall = new Vector(0 ,0);    
var fContact = new Vector(0, 0);
var fDamping = new Vector(0, 0);

var test = new Vector(0, 0);

/* virtual wall parameters */
var fWall = new Vector(0, 0);
var kWall = 800; // N/m
var bWall = 2; // kg/s
var penWall = new Vector(0, 0);

var posWallLeft = new Vector(-0.07, 0.03);
var posWallRight = new Vector(0.07, 0.03);
var posWallBottom = new Vector(0.0, 0.1);

var haplyBoard;

self.addEventListener("message", async function(e) {

  /**************IMPORTING HAPI FILES*****************/


  self.importScripts("libraries/Board.js");
  self.importScripts("libraries/Actuator.js");
  self.importScripts("libraries/Sensor.js");
  self.importScripts("libraries/Pwm.js");
  self.importScripts("libraries/Device.js");
  self.importScripts("libraries/Pantograph.js");
  self.importScripts('https://cdn.jsdelivr.net/npm/planck-js@0.3.31/lib/index.min.js')

  


  /************ BEGIN SETUP CODE *****************/
  console.log('in worker');
  haplyBoard = new Board();
  await haplyBoard.init();
  console.log(haplyBoard);

  widgetOne           = new Device(widgetOneID, haplyBoard);
  pantograph          = new Pantograph();

  widgetOne.set_mechanism(pantograph);

  widgetOne.add_actuator(1, 1, 2); //CCW
  widgetOne.add_actuator(2, 0, 1); //CW
  
  widgetOne.add_encoder(1, 1, 241, 10752, 2);
  widgetOne.add_encoder(2, 0, -61, 10752, 1);

  var run_once = false;

  /* 2D physics scaling and world creation */
  // hAPI_Fisica.init(this); 
  // hAPI_Fisica.setScale(pixelsPerCentimeter); 
  // world               = new FWorld();
  let gravity = planck.Vec2(0.0, -10.0);
  let world = planck.World({
    gravity: gravity,
  });
  

  /* Haptic Tool Initialization */
  s                   = new HVirtualCoupling((1)); 
  s.h_avatar.setDensity(4);  
  s.init(world, edgeTopLeftX+worldWidth/2, edgeTopLeftY+2); 
  
  //widgetOne.device_set_parameters();

  /************************ END SETUP CODE ************************* */

  /**********  BEGIN CONTROL LOOP CODE *********************/

  while(true){

    if (!run_once)
    {
      widgetOne.device_set_parameters();
      run_once = true;
    }

    // input
    var force = [0, 0];

    // output, leave as is
    var angles = [0, 0];
    var positions = [0, 0];

    widgetOne.set_device_torques(force);
    widgetOne.device_write_torques();

    await widgetOne.device_read_data();
    angles = widgetOne.get_device_angles();
    positions = widgetOne.get_device_position(angles);

    s.setToolPosition(edgeTopLeftX+worldWidth/2-(posEE).x, edgeTopLeftY+(posEE).y-7); 
    
    
    s.updateCouplingForce();
    fEE.set(-s.getVirtualCouplingForceX(), s.getVirtualCouplingForceY());
    fEE.div(100000); //dynes to newtons
    
    torques.set(widgetOne.set_device_torques(fEE.array()));
    widgetOne.device_write_torques();
  
    world.step(1.0/1000.0);
  

    var data = [angles[0], angles[1], positions[0], positions[1]]

    //console.log("angles: " + angles);
    //console.log("positions: " + positions);
    this.self.postMessage(data);



    // run every 1 ms
    await new Promise(r => setTimeout(r, 1));
  }
  
  /**********  END CONTROL LOOP CODE *********************/
});



