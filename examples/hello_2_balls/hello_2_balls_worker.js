import { Actuator, Board, Device, Pwm, Sensor, Panto2DIYv1, Panto2DIYv3 } from "../../dist/hAPI.js";
import { Vector } from "../libraries/vector.js";

function closeWorker() {
  console.log("worker before close");
  self.close();
  console.log("worker closed");
  var runLoop = true;
}

var message = "";
var updateMess = function (mess) {
  message = mess;
}

var getMessage = async function (m) {
  if (message == "") {
    return "connect";
  }
  else {
    return message;
  }

}

var runLoop = true

/* Device specifications */
var widgetOne;
var pantograph;

var widgetOneID = 5;
var angles = new Vector(0, 0);
var torques = new Vector(0, 0);
var positions = new Vector(0, 0);

/* task space */
var posEE = new Vector(0, 0);
var posEELast = new Vector(0, 0);
var velEE = new Vector(0, 0);

var posBall1 = new Vector(0.025, 0.05);
var velBall1 = new Vector(0, 0);
var posBall2 = new Vector(-0.025, 0.05);
var velBall2 = new Vector(0, 0);

var posEEToBall1;
var posEEToBall1Magnitude;
var posEEToBall2;
var posEEToBall2Magnitude;

var velEEToBall1;
var velEEToBall1Magnitude;
var velEEToBall2;
var velEEToBall2Magnitude;

/* Radius */
var rEE = 0.006; // end effector
var rBall1 = 0.02; // ball 1
var rBall2 = 0.01; // ball 2

/* virtual ball 1 parameters */
var mBall1 = 0.05;  // mass (kg)
var kBall1 = 445;  // spring constant (N/m)
var bBall1 = 3.7; // damping coefficient (kg/s)
// distance between the surfaces of the ball and EE, 
// which is zero / negative when they are touching / overlapping (m)
var penBall1 = 0.0;  // m

/* virtual ball 2 parameters */
var mBall2 = 0.1;  // mass (kg)
var kBall2 = 445;  // spring constant (N/m)
var bBall2 = 3.7; // damping coefficient (kg/s)
// distance between the surfaces of the ball and EE, 
// which is zero / negative when they are touching / overlapping (m)
var penBall2 = 0.0;  // m

var bAir = 0.0;  // air damping coefficient (kg/s)
var dt = 1 / 1000.0;
/* gravity force for each ball */
var fGravity1 = new Vector(0, 9.8 * mBall1);
var fGravity2 = new Vector(0, 9.8 * mBall2);

/* Forces */
var fEE = new Vector(0, 0);
var fBall1 = new Vector(0, 0);
var fBall2 = new Vector(0, 0);
var fContact1 = new Vector(0, 0);
var fContact2 = new Vector(0, 0);
var fDamping1 = new Vector(0, 0);
var fDamping2 = new Vector(0, 0);

/* virtual wall parameters */
var fWall1 = new Vector(0, 0);  // force by the wall in ball 1
var fWall2 = new Vector(0, 0);  // force by the wall in ball 2
var kWall = 800; // spring constant (N/m)
var bWall = 2; // damping coefficient (kg/s)
// distances between the surfaces of the wall and ball, 
// which is zero / negative when they are touching / overlapping (m)
var penWall1 = new Vector(0, 0);
var penWall2 = new Vector(0, 0);

/* wall positions */
var posWallLeft = new Vector(-0.07, 0.03);
var posWallRight = new Vector(0.07, 0.03);
var posWallBottom = new Vector(0.0, 0.1);
var posWallTop = new Vector(0.0, 0.03);

/* Device version */
//var newPantograph = 0; // uncomment for 2DIYv1
var newPantograph = 1; // uncomment for 2DIYv3

/* Time variables */
var startTime = 0;
var codeTime = 0;
var promTime = 0;

/* Changing values */
var looptime = 1; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

/* Device variables */
var haplyBoard;

self.addEventListener("message", async function (e) {
  /* listen to messages from the main script */

  /************ BEGIN SETUP CODE *****************/
  console.log('in worker');
  
  /* initialize device */
  haplyBoard = new Board();
  await haplyBoard.init();
  console.log(haplyBoard);

  widgetOne = new Device(widgetOneID, haplyBoard);

  /* configure and declare device specifications according to the version */
  if(newPantograph == 1){
    pantograph = new Panto2DIYv3();
    widgetOne.set_mechanism(pantograph);
  
    widgetOne.add_actuator(1, 1, 2); //CCW
    widgetOne.add_actuator(2, 1, 1); //CCW
  
    widgetOne.add_encoder(1, 1, 97.23, 2048 * 2.5 * 1.0194 * 1.0154, 2); //right in theory
    widgetOne.add_encoder(2, 1, 82.77, 2048 * 2.5 * 1.0194, 1); //left in theory
  }else{
    pantograph = new Panto2DIYv1();
    widgetOne.set_mechanism(pantograph);
  
    widgetOne.add_actuator(1, 1, 2); //CCW
    widgetOne.add_actuator(2, 0, 1); //CW
  
    widgetOne.add_encoder(1, 1, 241, 10752, 2);
    widgetOne.add_encoder(2, 0, -61, 10752, 1);
  }

  var run_once = false;

  /************************ END SETUP CODE ************************* */

  /**********  BEGIN CONTROL LOOP CODE *********************/
  while (true) {
    startTime = this.performance.now();

    if (!run_once) {
      widgetOne.device_set_parameters();
      run_once = true;
    }

    /* read and save device status */
    widgetOne.device_read_data();
    angles = widgetOne.get_device_angles();
    positions = widgetOne.get_device_position(angles);
    posEE.set(positions);

    velEE.set((posEE.clone()).subtract(posEELast).divide(dt));

    /* update "previous" variable */
    posEELast = posEE;

    /* haptic physics force calculation */

    /* ball1 and end-effector contact forces */
    posEEToBall1 = (posBall1.clone()).subtract(posEE);
    posEEToBall1Magnitude = posEEToBall1.mag();

    penBall1 = posEEToBall1Magnitude - (rBall1 + rEE);

    /* ball2 and end-effector contact forces */
    posEEToBall2 = (posBall2.clone()).subtract(posEE);
    posEEToBall2Magnitude = posEEToBall2.mag();

    penBall2 = posEEToBall2Magnitude - (rBall2 + rEE);

    /* ball1 forces */
    if (penBall1 < 0) {
      fContact1 = posEEToBall1.normalize();

      velEEToBall1 = velBall1.clone().subtract(velEE);
      velEEToBall1 = fContact1.clone().multiply(velEEToBall1.dot(fContact1));
      velEEToBall1Magnitude = velEEToBall1.mag();

      /* since penBall1 is negative kBall1 must be negative to ensure the force acts along the end-effector to the ball */
      fContact1 = fContact1.multiply((-kBall1 * penBall1) - (bBall1 * velEEToBall1Magnitude));
    }
    else {
      fContact1.set(0, 0);
    }

    /* ball2 forces */
    if (penBall2 < 0) {

      fContact2 = posEEToBall2.normalize();

      velEEToBall2 = velBall2.clone().subtract(velEE);
      velEEToBall2 = fContact2.clone().multiply(velEEToBall2.dot(fContact2));
      velEEToBall2Magnitude = velEEToBall2.mag();

      /* since penBall2 is negative kBall2 must be negative to ensure the force acts along the end-effector to the ball */
      fContact2 = fContact2.multiply((-kBall2 * penBall2) - (bBall2 * velEEToBall2Magnitude));
    }
    else {
      fContact2.set(0, 0);
    }


    /* forces due to damping */
    fDamping1 = (velBall1.clone()).multiply(-bAir);
    fDamping2 = (velBall2.clone()).multiply(-bAir);

    /* forces due to walls on ball1 */
    fWall1.set(0, 0);
    /* left wall */
    penWall1.set((posBall1.x - rBall1) - posWallLeft.x, 0);
    if (penWall1.x < 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* bottom wall */
    penWall1.set(0, (posBall1.y + rBall1) - posWallBottom.y);
    if (penWall1.y > 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* right wall */
    penWall1.set((posBall1.x + rBall1) - posWallRight.x, 0);
    if (penWall1.x > 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* top wall */
    penWall1.set(0, (posBall1.y - rBall1) - posWallTop.y);
    if (penWall1.y < 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }

    /* forces due to walls on ball2 */
    fWall2.set(0, 0);
    /* left wall */
    penWall2.set((posBall2.x - rBall2) - posWallLeft.x, 0);
    if (penWall2.x < 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* bottom wall */
    penWall2.set(0, (posBall2.y + rBall2) - posWallBottom.y);
    if (penWall2.y > 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* right wall */
    penWall2.set((posBall2.x + rBall2) - posWallRight.x, 0);
    if (penWall2.x > 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* top wall */
    penWall2.set(0, (posBall2.y - rBall2) - posWallTop.y);
    if (penWall2.y < 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }

    /* sum of forces */
    fBall1 = (fContact1.clone()).add(fGravity1).add(fDamping1).add(fWall1);
    fBall2 = (fContact2.clone()).add(fGravity2).add(fDamping2).add(fWall2);
    fEE = (fContact1.clone()).multiply(-1).add((fContact2.clone()).multiply(-1));
    
    /* dynamic state of ball1 calculation (integrate acceleration of ball1) */
    posBall1 = (((fBall1.clone()).divide(2 * mBall1)).multiply(dt * dt)).add((velBall1.clone()).multiply(dt)).add(posBall1);
    velBall1 = (((fBall1.clone()).divide(mBall1)).multiply(dt)).add(velBall1);
    
    /* dynamic state of ball2 calculation (integrate acceleration of ball2) */
    posBall2 = (((fBall2.clone()).divide(2 * mBall2)).multiply(dt * dt)).add((velBall2.clone()).multiply(dt)).add(posBall2);
    velBall2 = (((fBall2.clone()).divide(mBall2)).multiply(dt)).add(velBall2);
    
    var data = [angles[0], angles[1], positions[0], positions[1], posBall1, posBall2, newPantograph]
    /* post message to main script with position data */
    this.self.postMessage(data);

    /* send forces to device */
    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();

    codeTime = this.performance.now();
    promTime = looptime - (codeTime - startTime);
    if(promTime > 0){
      // run every ${looptime} ms
      await new Promise(r => setTimeout(r, promTime));        
    }
  }

  /**********  END CONTROL LOOP CODE *********************/
});




