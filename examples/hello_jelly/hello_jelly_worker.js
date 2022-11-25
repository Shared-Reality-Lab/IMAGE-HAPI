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
var dt = 1/1000.0;

var rEE = 0.006; // end effector radius

/* Forces */
var fEE = new Vector(0, 0);
var fDamping = new Vector(0, 0);

/* virtual division parameters */
var fDiv = new Vector(0, 0); // force in the division
var fEnv = new Vector(0, 0);
var fEnvLast = new Vector(0, 0);
var fEnvLastLast = new Vector(0, 0);
var fEnvLastLastLast = new Vector(0, 0);
var fCalc = new Vector(0, 0);

/* damping coefficients (kg/s) */
var bAir = 0;  // air
var bTopLeft = 1; // top left quadrant
var bTopRight = 2; // top right quadrant
var bBotLeft = 3; // bottom left quadrant
var bBotRight = 4; // bottom right quadrant

/* division positions */
var posWallVer = new Vector(0.0, 0.12);
var posWallHor = new Vector(0.07, 0.07);

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

function constrain(n, min, max){
  /* to constrain a number within a range */
  if (n < max && n > min){
    return n;
  }
  else if (n >= max){
    return max;
  }
  return min;
}

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
    posEE.x = -posEE.x; // device_to_graphics function

    velEE.set(((posEE.clone()).subtract(posEELast)).divide(dt));

    /* haptic physics force calculation */        
    /* update "previous" variable */
    posEELast = posEE.clone();

    /* forces due to damping in air */
    fDamping = (velEE.clone()).multiply(-bAir);

    /* forces due to damping in divisions */
    if (posEE.y < posWallHor.y) {
      if(posEE.x < posWallVer.x){
        /* top left quadrant */
        fDiv = (velEE.clone()).multiply(-bTopLeft);
      }else{
        /* top right quadrant */
        fDiv = (velEE.clone()).multiply(-bTopRight);
      }
    }else{
      if(posEE.x < posWallVer.x){
        /* bottom left quadrant */
        fDiv = (velEE.clone()).multiply(-bBotLeft);
      }else{
        /* bottom right quadrant */
        fDiv = (velEE.clone()).multiply(-bBotRight);
      }
    }

    fEnv.x = fDamping.x + fDiv.x;
    fEnv.y = fDamping.y + fDiv.y;

    fCalc.x = constrain(0.4*fEnv.x + 0.3*fEnvLast.x + 0.2*fEnvLastLast.x + 0.1*fEnvLastLastLast.x, -6, 6) * -1;
    fCalc.y = constrain(0.4*fEnv.y + 0.3*fEnvLast.y + 0.2*fEnvLastLast.y + 0.1*fEnvLastLastLast.y, -6, 6);

    // fCalc.x = constrain(0.1*fEnv.x + 0.2*fEnvLast.x + 0.3*fEnvLastLast.x + 0.4*fEnvLastLastLast.x, -6, 6) * -1;
    // fCalc.y = constrain(0.1*fEnv.y + 0.2*fEnvLast.y + 0.3*fEnvLastLast.y + 0.4*fEnvLastLastLast.y, -6, 6);

    /* updating "previous" variables */
    fEnvLastLastLast = fEnvLastLast.clone();
    fEnvLastLast = fEnvLast.clone();
    fEnvLast = fEnv.clone();

    /* sum of forces */
    fEE = fCalc.clone();

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




