

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

/* task space */
var posEE = new Vector(0, 0);
var posEE_copy = new Vector(0, 0);
var posEELast = new Vector(0, 0);
var velEE = new Vector(0, 0);
dt = 1 / 1000.0;

var rEE = 0.006;

var bAir = 0.0;  // kg/s
var dt = 1 / 1000.0;

/* virtual wall parameters */
var fWall = new Vector(0, 0);
var kWall = 1500; // N/m
var bWall = 20; // kg/s
var penWall = new Vector(0, 0);
var penWallMagnitude = new Vector(0, 0);

var posWallVer = new Vector(0.0, 0.1);
var posWallHor = new Vector(0.07, 0.05);

var haplyBoard;
var newPantograph = 1;

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

    velEE.set((posEE.clone()).subtract(posEELast).divide(dt));

    posEELast = posEE;

    /* haptic physics force calculation */

    /* forces due to walls on EE */
    fWall.set(0, 0);

    /* vertical wall */
    penWall.set(posWallVer.x - posEE.x, 0);
    penWallMagnitude = penWall.mag();
    if (penWallMagnitude < (rEE - 0.004) && posEE.y > posWallHor.y) {
      fWall = fWall.add((penWall.multiply(-kWall))).add((velEE.clone()).multiply(-bWall));
    }

    /* horizontal wall */
    penWall.set(0, posWallHor.y - posEE.y);
    penWallMagnitude = penWall.mag();
    if (penWallMagnitude < (rEE - 0.004)) {
      fWall = fWall.add((penWall.multiply(-kWall))).add((velEE.clone()).multiply(-bWall));
    }

    /* end forces due to walls on EE*/


    /* sum of forces */
    fEE = (fWall.clone()).multiply(-1);
    /* end sum of forces */

    var data = [angles[0], angles[1], positions[0], positions[1], newPantograph]
    this.self.postMessage(data);

    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();

    renderingForce = false;

    // run every 1 ms
    await new Promise(r => setTimeout(r, 1));
  }

  /**********  END CONTROL LOOP CODE *********************/
});




