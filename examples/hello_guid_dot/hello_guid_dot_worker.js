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

/* Screen and world setup parameters */
var pixelsPerMeter = 4000.0;

/* task space */
var prevPosEE = new Vector(0, 0);
var posEE = new Vector(0, 0);
var fCalc = new Vector(0, 0);
var fEE = new Vector(0, 0);
var randy = new Vector(0, 0.045);
var startTime = 0;
var codeTime = 0;
var promTime = 0;

/* PID stuff */
// for kp
var error = new Vector(0, 0);
// for ki
var cumError = new Vector(0, 0);
var errorPosEE = new Vector(0, 0);
var oldTime = 0;
// for kd
var oldError = new Vector(0, 0);
var diff = new Vector(0, 0);
//for exponential filter on differentiation
var buff = new Vector(0, 0);

/* Changing values */
var kp = 0.15; // kp += 0.01;
var ki = 1.2; // ki += 0.00001;
var kd = 1.5; // kd += 0.1;
var smoothing = 0.8; // smoothing += 0.01;
var looptime = 1; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

/* Device version */
//var newPantograph = 0; // uncomment for 2DIYv1
var newPantograph = 1; // uncomment for 2DIYv3

/* Device variables */
var haplyBoard;
var stop = false;


function randGen(min, max){
  /* to generate a random number within a range */
  return Math.random() * (max - min) + min;
}

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
  /* take action depending on the message content */
  if(e.data == "stop"){
    stop = true;
  }else if(e.data == "start"){
    stop = false;
  }else{
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

      /* generate random coordinates according to the work area of the device*/
      randy.x = randGen(-0.07, 0.05);
      randy.y = randGen(0.045, 0.1);
    }else{
      pantograph = new Panto2DIYv1();
      widgetOne.set_mechanism(pantograph);
    
      widgetOne.add_actuator(1, 1, 2); //CCW
      widgetOne.add_actuator(2, 0, 1); //CW
    
      widgetOne.add_encoder(1, 1, 241, 10752, 2);
      widgetOne.add_encoder(2, 0, -61, 10752, 1);
      
      /* generate random coordinates according to the work area of the device*/
      randy.x = randGen(-0.1, 0.1);
      randy.y = randGen(0.025, 0.1);
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

      /* haptic physics force calculation */
      /* forces due to guidance on EE */
      fCalc.set(0, 0);
      
      /* compute time difference from previous loop */
      var timedif = this.performance.now() - oldTime;
      if(timedif > (looptime * 1.05)){
        /* notify if there is more than 5% looptime error */
        console.log("caution, haptic loop took " + timedif.toFixed(2) + " ms");
      }

      /* compute error (random target position - EE position), and scale to pixels */
      error = (randy.subtract(posEE)).multiply(pixelsPerMeter);
      /* compute error (EE previous pos - EE current pos) */
      errorPosEE = posEE.subtract(prevPosEE);
      /* compute accumulated error - integral*/
      cumError = errorPosEE.add(errorPosEE.multiply(timedif * 0.001));

      //buff = (error.subtract(oldError)).divide(timedif);
      //diff = (diff.multiply(smoothing)).add(buff.multiply(1.0 - smoothing));

      /* compute differential error - derivative */
      diff = errorPosEE.divide(timedif * 0.001);
      //oldError = error;

      /* update "previous" variables */
      oldTime = this.performance.now();
      prevPosEE = posEE;
      
      /* PID controller equation */
      fCalc.x = constrain(kp * error.x + ki * cumError.x + kd * diff.x, -4, 4) * -1;
      fCalc.y = constrain(kp * error.y + ki * cumError.y + kd * diff.y, -4, 4);
      /* end forces due to guidance on EE */

      if(stop){
        /* send zero force to the device */
        fCalc.set(0, 0);
      }

      /* sum of forces */
      fEE = fCalc.clone();
      /* end sum of forces */

      var data = [angles[0], angles[1], positions[0], positions[1], randy.x, randy.y, newPantograph]
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
  }

  /**********  END CONTROL LOOP CODE *********************/
});




