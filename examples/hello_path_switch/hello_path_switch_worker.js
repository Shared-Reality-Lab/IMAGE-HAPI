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
var kp = 0.06; // kp += 0.01;
var ki = 3.1; // ki += 0.00001;
var kd = 4.5; // kd += 0.1;
var allowedError = 35;
var smoothing = 0.80; // smoothing += 0.01;
var looptime = 2; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

/* Path function parameters 1 */
const pArray1 = [[-0.05, 0.035], [0.05, 0.06]]
const pFunc1 = pArray1.map(([x,y]) => (new Vector(x, y + 0.01)))
const pInt1 = upsample(pFunc1, 3000);

/* Path function parameters 2 */
const pArray2 = [[0.05, 0.075], [-0.05, 0.1]]
const pFunc2 = pArray2.map(([x,y]) => (new Vector(x, y + 0.01)))
const pInt2 = upsample(pFunc2, 3000);

/* Both sections in one array */
const pFus = [pInt1, pInt2];
var idxSection;
var idxPoint;

/* Device version */
//var newPantograph = 0; // uncomment for 2DIYv1
var newPantograph = 1; // uncomment for 2DIYv3

/* Device variables */
var haplyBoard;
var stop = false;


function upsample(pointArray, k = 2000) {
  /* To interpolate between the points in an array */
  let upsampledSeg = [];

  // for each point (except the last one)...
  for (let n = 0; n < pointArray.length - 1; n++) {

    let upsampleSubSeg = [];

    // get the location of both points
    const currentPoint = new Vector(pointArray[n].x, pointArray[n].y);
    const nextPoint = new Vector(pointArray[n + 1].x, pointArray[n + 1].y);

    const x1 = currentPoint.x;
    const y1 = currentPoint.y;
    const x2 = nextPoint.x;
    const y2 = nextPoint.y;

    // find vars for equation
    const m = (y2 - y1) / (x2 - x1);
    const c = m == Number.POSITIVE_INFINITY ? 0 : y2 - (m * x2);

    // let the # of sample points be a function of the distance
    const euclidean1 = Math.hypot((nextPoint.x - currentPoint.x), (nextPoint.y - currentPoint.y));
    const samplePoints = Math.round(k * euclidean1);

    // get distance between the two points
    const sampleDistX = Math.abs(x2 - x1);
    const sampleDistY = Math.abs(y2 - y1);

    for (let v = 0; v < samplePoints; v++) {
      // find the location of each interpolated point
      const distX = (sampleDistX / (samplePoints - 1)) * v;
      const distY = (sampleDistY / (samplePoints - 1)) * v;

      let xLocation = 0;
      let yLocation = 0;

      // case where the x values are the same
      if (x1 == x2) {
        xLocation = x1;
        yLocation = y2;
      }

      // case where y values are the same
      else if (y1 == y2) {
        xLocation = x2;
        yLocation = y1;
      }

      // standard case
      else {
        xLocation = x2 > x1 ? x1 + distX : x1 - distX;
        yLocation = m * xLocation + c;
      }

      // add new interpolated point to vector array for these two points
      const p = new Vector(xLocation, yLocation);
      upsampleSubSeg.push(p);
    }
    upsampledSeg.push(...upsampleSubSeg);
  }
  return [...upsampledSeg];
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

      kp = 0.06;
      ki = 3.1;
      kd = 4.5;
    }else{
      pantograph = new Panto2DIYv1();
      widgetOne.set_mechanism(pantograph);
    
      widgetOne.add_actuator(1, 1, 2); //CCW
      widgetOne.add_actuator(2, 0, 1); //CW
    
      widgetOne.add_encoder(1, 1, 241, 10752, 2);
      widgetOne.add_encoder(2, 0, -61, 10752, 1);
      
      kp = 0.08;
      ki = 3.1;
      kd = 4.5;
      allowedError = 200;
    }

    var run_once = false;

    idxPoint = 0;
    idxSection = 0;
    
    /************************ END SETUP CODE ************************* */

    /**********  BEGIN CONTROL LOOP CODE *********************/
    while (true) {

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
      var timedif = performance.now() - oldTime;
      if(timedif > (looptime * 1.05)){
        /* notify if there is more than 5% looptime error */
        console.log("caution, haptic loop took " + timedif.toFixed(2) + " ms");
      }

      /* compute error (random target position - EE position), and scale to pixels */
      error = (pFus[idxSection][idxPoint].subtract(posEE)).multiply(pixelsPerMeter);
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
      oldTime = performance.now();
      prevPosEE = posEE;
      
      /* PID controller equation */
      fCalc.x = constrain(kp * error.x + ki * cumError.x + kd * diff.x, -4, 4) * -1;
      fCalc.y = constrain(kp * error.y + ki * cumError.y + kd * diff.y, -4, 4);
      // console.log(fCalc);

      /* end forces due to guidance on EE */

      if(stop){
        /* send zero force to the device */
        fCalc.set(0, 0);
      }else if((Math.abs(error.x) < allowedError) && (Math.abs(error.y) < allowedError)){
        /* evaluate if the error is between the range to allow to change - */
        /* the target to the next point in the point array of the path */
        idxPoint++;
        if(idxPoint >= (pFus[idxSection].length)){
          idxPoint = 0;
          idxSection++;
          if(idxSection >= (pFus.length)){
            idxPoint = 0;
            idxSection = 0;
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

      
      // run every ${looptime} ms
      await new Promise(r => setTimeout(r, looptime));
    }
  }

  /**********  END CONTROL LOOP CODE *********************/
});




