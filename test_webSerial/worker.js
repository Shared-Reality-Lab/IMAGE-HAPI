

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

var fEE  = new Vector(0, 0); 

var rBall = 0.02;

var mBall = 0.15;  // kg
var kBall = 445;  // N/m
var bBall = 3.7;
var penBall = 0.0;  // m
var bAir = 0.0;  // kg/s
var fGravity = new Vector(0, 9.8*mBall);
vardt = 1/1000.0;

var fBall = new Vector(0 ,0);    
var fContact = new Vector(0, 0);
var fDamping = new Vector(0, 0);

/* virtual wall parameters */
var fWall = new Vector(0, 0);
var kWall = 800; // N/m
var bWall = 2; // kg/s
var penWall = new Vector(0, 0);

var posWallLeft = new Vector(-0.07, 0.03);
var posWallRight = new Vector(0.07, 0.03);
var posWallBottom = new Vector(0.0, 0.1);


     

self.addEventListener("message", async function(e) {

  /**************IMPORTING HAPI FILES*****************/


  self.importScripts("libraries/Board.js");
  self.importScripts("libraries/Actuator.js");
  self.importScripts("libraries/Sensor.js");
  self.importScripts("libraries/Pwm.js");
  self.importScripts("libraries/Device.js");
  self.importScripts("libraries/Pantograph.js");
  
  /************ BEGIN SETUP CODE *****************/
  console.log('in worker');
  const haplyBoard = new Board();
  await haplyBoard.init();
  console.log(haplyBoard);
  // const delay = 1;
  // haplyBoard.transmit("1");
  // console.log("waiting for message");
  widgetOne           = new Device(widgetOneID, haplyBoard);
  pantograph          = new Pantograph();

  widgetOne.set_mechanism(pantograph);
  
  widgetOne.add_actuator(1, -1, 2); //CCW
  widgetOne.add_actuator(2, 1, 1); //CW
  
  widgetOne.add_encoder(1, -1, 241, 10752, 2);
  widgetOne.add_encoder(2, 1, -61, 10752, 1);
  
  widgetOne.device_set_parameters();
  // haplyBoard.transmit(1,widgetOneID,[1,1], [1,1])
  // await this.writer.write("1");

  /************************ END SETUP CODE ************************* */

  /**********  BEGIN CONTROL LOOP CODE *********************/
  // self.importScripts("runLoop.js")
  
  console.log("available: ", haplyBoard.data_available() );
  runLoop();
  
  
  /**********  END CONTROL LOOP CODE *********************/
});
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

function runLoop() {
  while(true){
  
    // runLoop(angles, torques, posEE, posEELast,);
    renderingForce = true;
    
    if(haplyBoard.data_available()){  //
      /* GET END-EFFECTOR STATE (TASK SPACE) */
      widgetOne.device_read_data();
      //console.log( widgetOne.device_read_data());
    
      angles.equals(widgetOne.get_device_angles()); 
      
      angleArray = angles.toArray();
      // console.log(angles.toArray);
      // console.log(angleArray.length);
      // console.log(angleArray[0], " , ",angleArray[1], " , ", angleArray[2] );
      posEE.equals(widgetOne.get_device_position(angles.toArray()));
      // posEE.equals(device_to_graphics(posEE)); 
      console.log(posEE.toArray());
      posEE_copy =posEE.clone()
      velEE.equals(((posEE_copy).subtract(posEELast)).divide(dt));
      posEELast = posEE;
      posEEArray = posEE.toArray();
      
      self.postMessage(posEEArray.concat(angleArray));
      // returnArray = 
      
      /* haptic physics force calculation */
      
      /* ball and end-effector contact forces */
      posEEToBall = (posBall.clone()).subtract(posEE);
      posEEToBallMagnitude = posEEToBall.mag();
      
      penBall = posEEToBallMagnitude - (rBall + rEE);
      /* end ball and end-effector contact forces */
      
      
      /* ball forces */
      if(penBall < 0){
        rEEContact = rEE + penBall;
        fContact = posEEToBall.normalize();
        velEEToBall = velBall.clone().subtract(velEE);
        velEEToBall = fContact.clone().multiply(velEEToBall.dot(fContact));
        velEEToBallMagnitude = velEEToBall.mag();
        
        /* since penBall is negative kBall must be negative to ensure the force acts along the end-effector to the ball */
        fContact = fContact.multiply((-kBall * penBall) - (bBall * velEEToBallMagnitude));
      }
      else{
        rEEContact = rEE;
        fContact.equals(0, 0);
      }
      /* end ball forces */
      
      
      /* forces due to damping */
      fDamping = (velBall.clone()).multiply(-bAir);
      /* end forces due to damping*/
      
      
      /* forces due to walls on ball */
      fWall.equals(0, 0);
      
      /* left wall */
      penWall.equals((posBall.x - rBall) - posWallLeft.x, 0);
      if(penWall.x < 0){
        fWall = fWall.add((penWall.multiply(-kWall))).add((velBall.clone()).multiply(-bWall));
      }
      
      /* bottom wall */
      penWall.equals(0, (posBall.y + rBall) - posWallBottom.y);
      if(penWall.y > 0){
        fWall = fWall.add((penWall.multiply(-kWall))).add((velBall.clone()).multiply(-bWall));
      }
      
      /* right wall */
      penWall.equals((posBall.x + rBall) - posWallRight.x, 0);
      if(penWall.x > 0){
        fWall = fWall.add((penWall.multiply(-kWall))).add((velBall.clone()).multiply(-bWall));
      }
      /* end forces due to walls on ball*/
      
      
      /* sum of forces */
      fBall = (fContact.clone()).add(fGravity).add(fDamping).add(fWall);      
      fEE = (fContact.clone()).multiply(-1);
      // fEE.equals(graphics_to_device(fEE));
      /* end sum of forces */
      
      
      /* end haptic physics force calculation */
    }
    
    /* dynamic state of ball calculation (integrate acceleration of ball) */
    posBall = (((fBall.clone()).divide(2*mBall)).multiply(dt*dt)).add((velBall.clone()).multiply(dt)).add(posBall);
    velBall = (((fBall.clone()).divide(mBall)).multiply(dt)).add(velBall);
    /*end dynamic state of ball calculation */
    
    
    
    torques.equals(widgetOne.set_device_torques(fEE.toArray()));
    widgetOne.device_write_torques();
    
  
    renderingForce = false;
  }
}

