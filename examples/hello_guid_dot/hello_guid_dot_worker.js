

function closeWorker() {
  console.log("worker before close");
  self.close();
  console.log("worker closed");
  var runLoop = true;
}

var message = "";
updateMess = function (mess) {
  message = mess;
}

getMessage = async function (m) {
  if (message == "") {
    return "connect";
  }
  else {
    return message;
  }

}

var counter = 0;
var msgcount = 0;
var runLoop = true
var widgetOne;
var pantograph;
var worker;

var widgetOneID = 5;
self.importScripts("libraries/vector.js");
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

var rEE = 0.006;

var dt = 1 / 1000.0;

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
var kp = 0.15; // kp += 0.01;
var ki = 1.2; // ki += 0.00001;
var kd = 1.5; // kd += 0.1;
var smoothing = 0.8; // smoothing += 0.01;
var looptime = 1; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

var randy = new Vector(0, 0.025);

var haplyBoard;
var newPantograph = 1;

function randGen(min, max){
  return Math.random() * (max - min) + min;
}

function resetIntegrator(){
  cumError.x = 0.0;
  cumError.y = 0.0;
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

  /**************IMPORTING HAPI FILES*****************/


  self.importScripts("libraries/Board.js");
  self.importScripts("libraries/Actuator.js");
  self.importScripts("libraries/Sensor.js");
  self.importScripts("libraries/Pwm.js");
  self.importScripts("libraries/Device.js");
  self.importScripts("libraries/Pantograph.js");
  self.importScripts("libraries/NewPantograph.js");


  /************ BEGIN SETUP CODE *****************/
  console.log('in worker');
  haplyBoard = new Board();
  await haplyBoard.init();
  console.log(haplyBoard);

  widgetOne = new Device(widgetOneID, haplyBoard);

  if(newPantograph == 1){
    pantograph = new NewPantograph();
    widgetOne.set_mechanism(pantograph);
  
    widgetOne.add_actuator(1, 1, 2); //CCW
    widgetOne.add_actuator(2, 1, 1); //CCW
  
    widgetOne.add_encoder(1, 1, 97.23, 2048 * 2.5 * 1.0194 * 1.0154, 2); //right in theory
    widgetOne.add_encoder(2, 1, 82.77, 2048 * 2.5 * 1.0194, 1); //left in theory
  }else{
    pantograph = new Pantograph();
    widgetOne.set_mechanism(pantograph);
  
    widgetOne.add_actuator(1, 1, 2); //CCW
    widgetOne.add_actuator(2, 0, 1); //CW
  
    widgetOne.add_encoder(1, 1, 241, 10752, 2);
    widgetOne.add_encoder(2, 0, -61, 10752, 1);
  }

  var run_once = false;
  var g = new Vector(10, 20, 2);

  randy.x = randGen(-0.1, 0.1);
  randy.y = randGen(0.025, 0.1);

  //widgetOne.device_set_parameters();

  /************************ END SETUP CODE ************************* */

  /**********  BEGIN CONTROL LOOP CODE *********************/
  // self.importScripts("runLoop.js")
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

    error = (randy.subtract(posEE)).multiply(pixelsPerMeter);
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

    /* sum of forces */
    //fCalc.set(0, 0);
    fEE = fCalc.clone();
    /* end sum of forces */

    var data = [angles[0], angles[1], positions[0], positions[1], randy.x, randy.y, newPantograph]
    this.self.postMessage(data);

    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();

    renderingForce = false;

    // run every ${looptime} ms
    await new Promise(r => setTimeout(r, looptime));
  }

  /**********  END CONTROL LOOP CODE *********************/
});




