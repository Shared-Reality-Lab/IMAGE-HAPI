import { Actuator, Board, Device, Pwm, Sensor, Panto2DIYv1, Panto2DIYv3 } from "../../dist/hAPI.js";
import { Vector } from "../../libraries/vector.js";

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

var counter = 0;
var msgcount = 0;
var runLoop = true
var widgetOne;
var pantograph;
var worker;

var widgetOneID = 5;
//self.importScripts("libraries/vector.js");
var angles = new Vector(0, 0);
var torques = new Vector(0, 0);
var positions = new Vector(0, 0);

/* task space */
var posEE = new Vector(0, 0);
var posEE_copy = new Vector(0, 0);
var posEELast = new Vector(0, 0);
var velEE = new Vector(0, 0);
dt = 1 / 1000.0;

var posBall1 = new Vector(0.025, 0.05);
var velBall1 = new Vector(0, 0);
var posBall2 = new Vector(-0.025, 0.05);
var velBall2 = new Vector(0, 0);

var posEEToBall1;
var posEEToBall1Magnitude;
var posEEToBall2;
var posEEToBall2Magnitude;

var velEEToBall1;
var velEEToBall1Magnitude;
var velEEToBall2;
var velEEToBall2Magnitude;

var rEE = 0.006;
var rEEContact1 = 0.006;
var rEEContact2 = 0.006;

var rBall1 = 0.02;
var mBall1 = 0.05;  // kg
var kBall1 = 445;  // N/m
var bBall1 = 3.7;
var penBall1 = 0.0;  // m

var rBall2 = 0.01;
var mBall2 = 0.1;  // kg
var kBall2 = 445;  // N/m
var bBall2 = 3.7;
var penBall2 = 0.0;  // m

var bAir = 0.0;  // kg/s
var dt = 1 / 1000.0;
var fGravity1 = new Vector(0, 9.8 * mBall1);
var fGravity2 = new Vector(0, 9.8 * mBall2);

var fEE = new Vector(0, 0);
var fBall1 = new Vector(0, 0);
var fBall2 = new Vector(0, 0);
var fContact1 = new Vector(0, 0);
var fContact2 = new Vector(0, 0);
var fDamping1 = new Vector(0, 0);
var fDamping2 = new Vector(0, 0);

var test = new Vector(0, 0);

/* virtual wall parameters */
var fWall1 = new Vector(0, 0);
var fWall2 = new Vector(0, 0);
var kWall = 800; // N/m
var bWall = 2; // kg/s
var penWall1 = new Vector(0, 0);
var penWall2 = new Vector(0, 0);

var posWallLeft = new Vector(-0.07, 0.03);
var posWallRight = new Vector(0.07, 0.03);
var posWallBottom = new Vector(0.0, 0.1);
var posWallTop = new Vector(0.0, 0.03);

var haplyBoard;
var newPantograph = 1;

self.addEventListener("message", async function (e) {

  /**************IMPORTING HAPI FILES*****************/
  

  //self.importScripts("../../dist/Board.js");
  //self.importScripts("../../dist/Actuator.js");
  //self.importScripts("../../dist/Sensor.js");
  //self.importScripts("../../dist/Pwm.js");
  //self.importScripts("../../dist/Device.js");
  //self.importScripts("../../dist/Pantograph.js");
  //self.importScripts("../../dist/NewPantograph.js");



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

    /* ball1 and end-effector contact forces */
    posEEToBall1 = (posBall1.clone()).subtract(posEE);
    posEEToBall1Magnitude = posEEToBall1.mag();

    penBall1 = posEEToBall1Magnitude - (rBall1 + rEE);
    /* end ball1 and end-effector contact forces */

    /* ball2 and end-effector contact forces */
    posEEToBall2 = (posBall2.clone()).subtract(posEE);
    posEEToBall2Magnitude = posEEToBall2.mag();

    penBall2 = posEEToBall2Magnitude - (rBall2 + rEE);
    /* end ball2 and end-effector contact forces */

    /* ball1 forces */
    if (penBall1 < 0) {
      rEEContact1 = rEE + penBall1;

      fContact1 = posEEToBall1.normalize();

      velEEToBall1 = velBall1.clone().subtract(velEE);
      velEEToBall1 = fContact1.clone().multiply(velEEToBall1.dot(fContact1));
      velEEToBall1Magnitude = velEEToBall1.mag();

      /* since penBall1 is negative kBall1 must be negative to ensure the force acts along the end-effector to the ball */
      fContact1 = fContact1.multiply((-kBall1 * penBall1) - (bBall1 * velEEToBall1Magnitude));
    }
    else {
      rEEContact1 = rEE;
      fContact1.set(0, 0);
    }
    /* end ball1 forces */

    /* ball2 forces */
    if (penBall2 < 0) {
      rEEContact2 = rEE + penBall2;

      fContact2 = posEEToBall2.normalize();

      velEEToBall2 = velBall2.clone().subtract(velEE);
      velEEToBall2 = fContact2.clone().multiply(velEEToBall2.dot(fContact2));
      velEEToBall2Magnitude = velEEToBall2.mag();

      /* since penBall2 is negative kBall2 must be negative to ensure the force acts along the end-effector to the ball */
      fContact2 = fContact2.multiply((-kBall2 * penBall2) - (bBall2 * velEEToBall2Magnitude));
    }
    else {
      rEEContact2 = rEE;
      fContact2.set(0, 0);
    }
    /* end ball2 forces*/


    /* forces due to damping */
    fDamping1 = (velBall1.clone()).multiply(-bAir);
    fDamping2 = (velBall2.clone()).multiply(-bAir);
    /* end forces due to damping*/

    /* forces due to walls on ball1 */
    fWall1.set(0, 0);
    /* left wall */
    penWall1.set((posBall1.x - rBall1) - posWallLeft.x, 0);
    if (penWall1.x < 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* bottom wall */
    penWall1.set(0, (posBall1.y + rBall1) - posWallBottom.y);
    if (penWall1.y > 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* right wall */
    penWall1.set((posBall1.x + rBall1) - posWallRight.x, 0);
    if (penWall1.x > 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* top wall */
    penWall1.set(0, (posBall1.y - rBall1) - posWallTop.y);
    if (penWall1.y < 0) {
      fWall1 = fWall1.add((penWall1.multiply(-kWall))).add((velBall1.clone()).multiply(-bWall));
    }
    /* end forces due to walls on ball1*/

    /* forces due to walls on ball2 */
    fWall2.set(0, 0);
    /* left wall */
    penWall2.set((posBall2.x - rBall2) - posWallLeft.x, 0);
    if (penWall2.x < 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* bottom wall */
    penWall2.set(0, (posBall2.y + rBall2) - posWallBottom.y);
    if (penWall2.y > 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* right wall */
    penWall2.set((posBall2.x + rBall2) - posWallRight.x, 0);
    if (penWall2.x > 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* top wall */
    penWall2.set(0, (posBall2.y - rBall2) - posWallTop.y);
    if (penWall2.y < 0) {
      fWall2 = fWall2.add((penWall2.multiply(-kWall))).add((velBall2.clone()).multiply(-bWall));
    }
    /* end forces due to walls on ball2*/

    /* sum of forces */
    fBall1 = (fContact1.clone()).add(fGravity1).add(fDamping1).add(fWall1);
    fBall2 = (fContact2.clone()).add(fGravity2).add(fDamping2).add(fWall2);
    fEE = (fContact1.clone()).multiply(-1).add((fContact2.clone()).multiply(-1));
    // fEE.set(graphics_to_device(fEE));
    /* end sum of forces */

    // /* dynamic state of ball1 calculation (integrate acceleration of ball1) */
    posBall1 = (((fBall1.clone()).divide(2 * mBall1)).multiply(dt * dt)).add((velBall1.clone()).multiply(dt)).add(posBall1);
    velBall1 = (((fBall1.clone()).divide(mBall1)).multiply(dt)).add(velBall1);
    // /*end dynamic state of ball1 calculation */

    // /* dynamic state of ball2 calculation (integrate acceleration of ball2) */
    posBall2 = (((fBall2.clone()).divide(2 * mBall2)).multiply(dt * dt)).add((velBall2.clone()).multiply(dt)).add(posBall2);
    velBall2 = (((fBall2.clone()).divide(mBall2)).multiply(dt)).add(velBall2);
    // /*end dynamic state of ball2 calculation */

    var data = [angles[0], angles[1], positions[0], positions[1], posBall1, posBall2, newPantograph]
    this.self.postMessage(data);

    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();

    
    // run every 1 ms
    await new Promise(r => setTimeout(r, 1));
  }

  /**********  END CONTROL LOOP CODE *********************/
});




