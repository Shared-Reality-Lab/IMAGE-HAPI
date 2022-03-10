
var widgetOne;
var pantograph;
var haplyBoard;

var widgetOneID = 5;
self.importScripts("libraries/vector.js");
var angles = new Vector(0, 0);
var torques = new Vector(0, 0);
var positions = new Vector(0, 0);

/* task space */
var posEE = new Vector(0, 0);


var fDamping = new Vector(0, 0);
var fEE = new Vector(0, 0)

export const Mode = {
  Idle,
  Wait,
  MoveToFirstPoint,
  WaitAtFirstPoint,
  Guidance,
  End
}

var mode = Mode.Wait;
var tStartWaitTime = Number.POSITIVE_INFINITY;
var tFirstPointWaitTime = Number.POSITIVE_INFINITY;
var tPointToPointTime = Number.POSITIVE_INFINITY;

self.addEventListener("message", async function (e) {

  console.log(e.data);

  /**************IMPORTING HAPI FILES*****************/


  self.importScripts("libraries/Board.js");
  self.importScripts("libraries/Actuator.js");
  self.importScripts("libraries/Sensor.js");
  self.importScripts("libraries/Pwm.js");
  self.importScripts("libraries/Device.js");
  self.importScripts("libraries/Pantograph.js");



  /************ BEGIN SETUP CODE *****************/
  haplyBoard = new Board();
  await haplyBoard.init();

  widgetOne = new Device(widgetOneID, haplyBoard);
  pantograph = new Pantograph();

  widgetOne.set_mechanism(pantograph);

  widgetOne.add_actuator(1, 1, 2); //CCW
  widgetOne.add_actuator(2, 0, 1); //CW

  widgetOne.add_encoder(1, 1, 241, 10752, 2);
  widgetOne.add_encoder(2, 0, -61, 10752, 1);

  var run_once = false;

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

    posEE.set(device_to_graphics(posEE));

    switch (mode) {
      case Idle: {
        tStartWaitTime = Date.now();
        mode = Mode.Wait;
        break;
      }
      case Wait: {
        if (Date.now - tStartWaitTime > 2000) { // wait 2 sec
          mode = mode.MoveToFirstPoint;
        }
        break;
      }
      case MoveToFirstPoint: {
        // moveToPos(x_coords[0]);
        tFirstPointWaitTime = Date.now();
        break;
      }
      case WaitAtFirstPoint: {
        if (Date.now() - tFirstPointWaitTime > 2000) {
          mode = mode.Guidance;
        }
        break;
      }
      case Guidance: {
        break;
      }
      case End: {
        break;
      }
    }
    // /*end dynamic state of ball calculation */

    var data = { x: positions[0], y: positions[1] }
    this.self.postMessage(data);

    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();

    renderingForce = false;

    // run every 1 ms
    await new Promise(r => setTimeout(r, 1));
  }

  /**********  END CONTROL LOOP CODE *********************/
});

function moveToPos(vector,
  springConstMultiplier = 2,
  ki = 0.5,
  kd = 1.2) {

  if (vector == undefined)
    return;

  // find the distance between our current position and target
  const targetPos = new Vector(vector.x, vector.y);
  const xDiff = targetPos.subtract(convPosEE.clone());
  const kx = xDiff.multiply(springConst).multiply(springConstMultiplier);


  // allow for higher tolerance when moving from the home position
  // apparently needs more force to move from there
  const constrainedMax = 6;

  // D controller
  const dx = (convPosEE.clone()).subtract(prevPosEE);
  const dt = 1 / 1000;
  const c = 1.8;
  const cdxdt = (dx.divide(dt)).multiply(kd);

  // I controller
  const cumError = dx.add(dx.multiply(dt));

  // set forces
  let fx = constrain(kx.x + cdxdt.x + ki * cumError.x, -1 * constrainedMax, constrainedMax);
  let fy = constrain(kx.y + cdxdt.y + ki * cumError.y, -1 * constrainedMax, constrainedMax);
  const forceMag = new Vector(fx, fy).mag();
  const maxMag = new Vector(constrainedMax, constrainedMax).mag();

  // if outside of the initial movement from the home position the force is too high, ignore it
  if (forceMag >= maxMag) {
    force.set(0, 0);
  }
  else {
    if (!atHomePos()) {

      // this will break if we have less than 10 points in a subsegment
      //console.log(finishTransition);
      if (finishTransition) {
        const w = 21;
        const i = 6;

        const x1 = (i / w) * fx;
        const x2 = ((i - 1) / w) * fEEPrev.x;
        const x3 = ((i - 2) / w) * fEEPrev2.x;
        const x4 = ((i - 3) / w) * fEEPrev3.x;
        const x5 = ((i - 4) / w) * fEEPrev4.x;
        const x6 = ((i - 5) / w) * fEEPrev5.x;

        const y1 = (i / w) * fy;
        const y2 = ((i - 1) / w) * fEEPrev.y;
        const y3 = ((i - 2) / w) * fEEPrev2.y;
        const y4 = ((i - 3) / w) * fEEPrev3.y;
        const y5 = ((i - 4) / w) * fEEPrev4.y;
        const y6 = ((i - 5) / w) * fEEPrev5.y;

        fx = x1 + x2 + x3 + x4 + x5 + x6;
        fy = y1 + y2 + y3 + y4 + y5 + y6;
        const stdX = getStd([x1, x2, x3, x4, x5, x6])
        const stdY = getStd([y1, y2, y3, y4, y5, y6]);

        if (stdX < 0.2 && stdY < 0.2) {
          finishTransition = false;
        }
      }
      else {
        fx = (1 / 2 * fEEPrev.x + fx);
        fy = (1 / 2 * fEEPrev.y + fy);
      }

      if (!isFinite(fx))
        fx = 0;
      if (!isFinite(fy))
        fy = 0;

      fx = constrain(fx, -constrainedMax, constrainedMax);
      fy = constrain(fy, -constrainedMax, constrainedMax);
    }
  }

  force.set(fx, fy);

  fEEPrev5 = fEEPrev4.clone();
  fEEPrev4 = fEEPrev3.clone();
  fEEPrev3 = fEEPrev2.clone();
  fEEPrev2 = fEEPrev.clone();
  fEEPrev = force.clone();

  console.log(idx, currentSubSegmentPointIndex, force, finishTransition);
  fEE.set(graphics_to_device(force));
}

/**
 * 
 * @param val Value to constrain.
 * @param min Minimum constrained value.
 * @param max Maximum constrained value.
 * @returns 
 */
 function constrain(val, min, max) {
  return val > max ? max : val < min ? min : val;
}

function mapToHaply(x, y) {
  //x range in highcharts: 
  //y range in highcharts:
  const x_new = 0.09673275448453048 * x - 14.912244045131631
  const y_new = 0.0006815798671793079 * y + -16.455144634814502
  return [x_new, y_new]

  //x range haply:
  //y  range haply: 
}




