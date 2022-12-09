import { Actuator, Board, Device, Pwm, Sensor, Panto2DIYv1, Panto2DIYv3 } from "../../dist/hAPI.js";
import { Vector } from "../libraries/vector.js";
import { pointInPolygon } from "../libraries/pointInPolygon.js";

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
var startTime = 0;
var codeTime = 0;
var promTime = 0;

/* for calculations */
var currSeg = -1;

/* Changing values */
var kp = 0.06; // kp += 0.01;
var ki = 3.1; // ki += 0.00001;
var kd = 4.5; // kd += 0.1;
var smoothing = 0.80; // smoothing += 0.01;
var looptime = 2; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

/* Path function parameters */
var segments, objects;

/* Device version */
var newPantograph = 0; // uncomment for 2DIYv1
// var newPantograph = 1; // uncomment for 2DIYv3

/* Device variables */
var haplyBoard;
var stop = false;


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


function jelly(level) {
    
}


function ice() {
    
}


function stripes() {
    
}


function dots() {
    
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

    /* get image data*/
    segments = e.data[0];
    objects = e.data[1];
    // console.log(segments);
    // for(let i = 0; i < segments.length; i++){
    //   for(let j = 0; j < segments[i].length; j++){
    //       console.log(segments[i][j]);
    //   }
    // }

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

      /* haptic physics force calculation */
      /* forces due to guidance on EE */
      fCalc.set(0, 0);
      
      if(stop){
        /* send zero force to the device */
        fCalc.set(0, 0);
      }else{
        segLoop: // label to break both loops at once
        for(let i = 0; i < segments.length; i++){
          for(let j = 0; j < segments[i].length; j++){
            if(pointInPolygon(segments[i][j], [posEE.x, posEE.y])){
              currSeg = i;
              // console.log(currSeg);
              break segLoop;
            }
          }
        }
      }

      /* sum of forces */
      fEE = fCalc.clone();
      /* end sum of forces */

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
  }

  /**********  END CONTROL LOOP CODE *********************/
});




