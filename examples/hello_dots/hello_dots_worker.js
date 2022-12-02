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
var posEEToDot = new Vector(0, 0);
var posEEToDotMagnitude;
var velEEToDot = new Vector(0, 0);
var velEEToDotMagnitude;

var dt = 1 / 1000.0;
var bAir = 0.0;  // air damping coefficient (kg/s)

var rEE = 0.006; // end effector radius

/* Forces */
var fEE = new Vector(0, 0);
var fDamping = new Vector(0, 0);

/* virtual dot parameters */
var fDot = new Vector(0, 0); // force by the dots
var kDot = 2500; // spring constant (N/m)
var bDot = 5; // damping coefficient (kg/s)
// distance between the surfaces of the dot and EE when they are touching (m)
var penDot = new Vector(0, 0);

/* dot positions */
var rDot = 0.001;
var distBtwnRows = 0.005;
var distBtwnCols = 0.005;
var start = new Vector(-14 * distBtwnCols, 9 * distBtwnRows); // preferably not above (-0.07, 0.045)
var end = new Vector(14 * distBtwnCols, 26 * distBtwnRows); // preferably not below (0.07, 0.13)
var edgeMargin = 0.1;

/* Device version */
var newPantograph = 0; // uncomment for 2DIYv1
// var newPantograph = 1; // uncomment for 2DIYv3

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
    posEELast = posEE.clone();

    /* haptic physics force calculation */

    /* forces due to damping */
    fDamping = (velEE.clone()).multiply(-bAir);

    /* forces due to dots on EE */
    posEEToDot.x = posEE.x % distBtwnCols;
    posEEToDot.y = posEE.y % distBtwnRows;
    posEEToDotMagnitude = posEEToDot.mag();
    penDot = posEEToDotMagnitude - (rDot + rEE);
    
    if(posEE.y > (start.y)*(1+edgeMargin) && posEE.y < (end.y)*(1+edgeMargin) &&
       posEE.x > (start.x)*(1+edgeMargin) && posEE.x < (end.x)*(1+edgeMargin) && penDot < 0){

      fDot = posEEToDot.normalize();

      velEEToDot = (velEE.clone()).multiply(-1);
      velEEToDot = (fDot.clone()).multiply(velEEToDot.dot(fDot));
      velEEToDotMagnitude = velEEToDot.mag();

      /* since penDot is negative kDot must be negative to ensure the force acts along the end-effector to the ball */
      fDot = fDot.multiply((-kDot * penDot) - (bDot * velEEToDotMagnitude));
    }
    else {
      fDot.set(0, 0);
    }


    /* sum of forces */
    // fEE = (fDot.clone()).multiply(-1);
    fEE = ((fDot.clone()).multiply(-1)).add(fDamping);

    var data = [angles[0], angles[1], positions[0], positions[1], newPantograph]
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




