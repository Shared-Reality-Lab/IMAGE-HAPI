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

var oldTime = 0;

/* PID stuff */
// for kp
var error = new Vector(0, 0);
// for ki
var cumError = new Vector(0, 0);
var errorPosEE = new Vector(0, 0);
// for kd
var oldError = new Vector(0, 0);
//for exponential filter on differentiation
var diff = new Vector(0, 0);
var buff = new Vector(0, 0);

// changing values
var kp = 0.06; // kp += 0.01;
var ki = 3.1; // ki += 0.00001;
var kd = 4.5; // kd += 0.1;
var smoothing = 0.80; // smoothing += 0.01;
var looptime = 2; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

/* star function parameters */
const starArray = [
  [0.0, 0.03], [0.01, 0.05], [0.03, 0.06], [0.01, 0.07], [0.0, 0.09],
  [-0.01, 0.07], [-0.03, 0.06], [-0.01, 0.05], [0.0, 0.03]
]
const starFunc = starArray.map(([x,y]) => (new Vector(x, y + 0.02)))
const starFus = upsample(starFunc, 3500);
var idx;

var haplyBoard;
var newPantograph = 1;
var stop = false;

function upsample(pointArray, k = 2000) {
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
  if (n < max && n > min){
    return n;
  }
  else if (n >= max){
    return max;
  }
  return min;
}

self.addEventListener("message", async function (e) {
  if(e.data == "stop"){
    stop = true;
  }else if(e.data == "start"){
    stop = false;
  }else{
    /************ BEGIN SETUP CODE *****************/
    console.log('in worker');
    haplyBoard = new Board();
    await haplyBoard.init();
    console.log(haplyBoard);

    widgetOne = new Device(widgetOneID, haplyBoard);

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

    idx = 0;
    
    /************************ END SETUP CODE ************************* */

    /**********  BEGIN CONTROL LOOP CODE *********************/
    while (true) {

      if (!run_once) {
        widgetOne.device_set_parameters();
        run_once = true;
      }

      widgetOne.device_read_data();
      angles = widgetOne.get_device_angles();
      positions = widgetOne.get_device_position(angles);
      posEE.set(positions);
      posEE.x = -posEE.x; // device_to_graphics function

      /* haptic physics force calculation */
      /* forces due to guidance on EE */
      fCalc.set(0, 0);
      
      var timedif = performance.now() - oldTime;
      if(timedif > (looptime * 1.05)){
        console.log("caution, haptic loop took " + timedif.toFixed(2) + " ms");
      }

      error = (starFus[idx].subtract(posEE)).multiply(pixelsPerMeter);
      errorPosEE = posEE.subtract(prevPosEE);
      cumError = errorPosEE.add(errorPosEE.multiply(timedif * 0.001));

      //buff = (error.subtract(oldError)).divide(timedif);           
      //diff = (diff.multiply(smoothing)).add(buff.multiply(1.0 - smoothing));
      diff = errorPosEE.divide(timedif * 0.001);
      //oldError = error;
      oldTime = performance.now();
      prevPosEE = posEE;
      
      fCalc.x = constrain(kp * error.x + ki * cumError.x + kd * diff.x, -4, 4) * -1;
      fCalc.y = constrain(kp * error.y + ki * cumError.y + kd * diff.y, -4, 4);

      /* end forces due to guidance on EE */

      if(stop){
        fCalc.set(0, 0);
      }else{
        idx++;
        if(idx >= (starFus.length)){
          idx = 0;
        }
      }

      /* sum of forces */
      //fCalc.set(0, 0);
      fEE = fCalc.clone();
      /* end sum of forces */

      var data = [angles[0], angles[1], positions[0], positions[1], newPantograph]
      this.self.postMessage(data);

      widgetOne.set_device_torques(fEE.toArray());
      widgetOne.device_write_torques();

      
      // run every ${looptime} ms
      await new Promise(r => setTimeout(r, looptime));
    }
  }

  /**********  END CONTROL LOOP CODE *********************/
});




