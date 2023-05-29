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

var posBall = new Vector(0, 0.05);
var velBall = new Vector(0, 0);

var posEEToBall;
var posEEToBallMagnitude;

var velEEToBall;
var velEEToBallMagnitude;

/* Radius */
var rEE = 0.006; // end effector
var rBall = 0.02; // ball

/* virtual ball parameters */
var mBall = 0.15;  // mass (kg)
var kBall = 445;  // spring constant (N/m)
var bBall = 3.7; // damping coefficient (kg/s)
// distance between the surfaces of the ball and EE, 
// which is zero / negative when they are touching / overlapping (m)
var penBall = 0.0;

var bAir = 0.0;  // air damping coefficient (kg/s)
var fGravity = new Vector(0, 9.8 * mBall); // gravity force
var dt = 1 / 1000.0;

/* Forces */
var fEE = new Vector(0, 0);
var fBall = new Vector(0, 0);
var fContact = new Vector(0, 0);
var fDamping = new Vector(0, 0);

/* virtual wall parameters */
var fWall = new Vector(0, 0); // force by the wall
var kWall = 800; // spring constant (N/m)
var bWall = 2; // damping coefficient (kg/s)
// distance between the surfaces of the wall and ball, 
// which is zero / negative when they are touching / overlapping (m)
var penWall = new Vector(0, 0);

/* wall positions */
var posWallLeft = new Vector(-0.07, 0.03);
var posWallRight = new Vector(0.07, 0.03);
var posWallBottom = new Vector(0.0, 0.1);

/* Device version */
// var newPantograph = 0; // uncomment for 2DIYv1
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

    /* ball and end-effector contact forces */
    posEEToBall = (posBall.clone()).subtract(posEE);
    posEEToBallMagnitude = posEEToBall.mag();

    penBall = posEEToBallMagnitude - (rBall + rEE);

    /* ball forces */
    if (penBall < 0) {
      fContact = posEEToBall.normalize();

      velEEToBall = velBall.clone().subtract(velEE);
      velEEToBall = fContact.clone().multiply(velEEToBall.dot(fContact));
      velEEToBallMagnitude = velEEToBall.mag();

      /* since penBall is negative kBall must be negative to ensure the force acts along the end-effector to the ball */
      fContact = fContact.multiply((-kBall * penBall) - (bBall * velEEToBallMagnitude));
    }
    else {
      fContact.set(0, 0);
    }


    /* forces due to damping */
    fDamping = (velBall.clone()).multiply(-bAir);

    /* forces due to walls on ball */
    fWall.set(0, 0);
    /* left wall */
    penWall.set((posBall.x - rBall) - posWallLeft.x, 0);
    if (penWall.x < 0) {
      fWall = fWall.add((penWall.multiply(-kWall))).add((velBall.clone()).multiply(-bWall));
    }
    /* bottom wall */
    penWall.set(0, (posBall.y + rBall) - posWallBottom.y);
    if (penWall.y > 0) {
      fWall = fWall.add((penWall.multiply(-kWall))).add((velBall.clone()).multiply(-bWall));
    }
    /* right wall */
    penWall.set((posBall.x + rBall) - posWallRight.x, 0);
    if (penWall.x > 0) {
      fWall = fWall.add((penWall.multiply(-kWall))).add((velBall.clone()).multiply(-bWall));
    }


    /* sum of forces */
    fBall = (fContact.clone()).add(fGravity).add(fDamping).add(fWall);
    fEE = (fContact.clone()).multiply(-1);

    /* dynamic state of ball calculation (integrate acceleration of ball) */
    posBall = (((fBall.clone()).divide(2 * mBall)).multiply(dt * dt)).add((velBall.clone()).multiply(dt)).add(posBall);
    velBall = (((fBall.clone()).divide(mBall)).multiply(dt)).add(velBall);

    var data = [angles[0], angles[1], positions[0], positions[1], posBall, newPantograph]
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




