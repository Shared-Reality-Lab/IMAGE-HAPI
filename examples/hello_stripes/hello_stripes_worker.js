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
var dt = 1 / 1000.0;
var bAir = 0.0;  // air damping coefficient (kg/s)

var rEE = 0.006; // end effector radius

/* Forces */
var fEE = new Vector(0, 0);
var fDamping = new Vector(0, 0);

/* virtual division parameters */
var fWall = new Vector(0, 0); // force by the division
var kWall = 3500; // spring constant (N/m)
var bWall = 5; // damping coefficient (kg/s)
// distance between the surfaces of the division and EE, 
// which is zero / negative when they are touching / overlapping (m)
var penWall = new Vector(0, 0);
var penWallMagnitude = new Vector(0, 0);

/* division positions */
var distBtwnWalls = 0.005;
// start vector corresponds to the left top corner of the area with the pattern
var start = new Vector(-14 * distBtwnWalls, 9 * distBtwnWalls); // preferably not above (-0.07, 0.045)
// end vector corresponds to the right bottom corner of the area with the pattern
var end = new Vector(14 * distBtwnWalls, 26 * distBtwnWalls); // preferably not below (0.07, 0.13)

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

    /* forces due to divisions on EE */
    fWall.set(0, 0);

    // if the EE is on the area with stripes
    if(posEE.y > start.y && posEE.y < end.y && posEE.x > start.x && posEE.x < end.x){
      penWall.set(0, posEE.y % distBtwnWalls);
      penWallMagnitude = penWall.mag();
      // if the EE is overlapping with the stripes
      if (penWallMagnitude < (rEE - 0.004)) {
        fWall = fWall.add((penWall.multiply(-kWall))).add((velEE.clone()).multiply(-bWall));
      }
    }


    /* sum of forces */
    fEE = (fWall.clone()).add(fDamping);

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




