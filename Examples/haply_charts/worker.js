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
var prevPosEE = new Vector(0, 0);
var fDamping = new Vector(0, 0);

// get force needed for torques
let force = new Vector(0, 0);
var fEE = new Vector(0, 0);
let fEEPrev5 = new Vector(0, 0);
let fEEPrev4 = new Vector(0, 0);
let fEEPrev3 = new Vector(0, 0);
let fEEPrev2 = new Vector(0, 0);
let fEEPrev = new Vector(0, 0);

var baseCoords = [];
var nfcoords = [];
var coords = [];

const Mode = Object.freeze({
  Idle: 0,
  Wait: 1,
  MoveToFirstPoint: 2,
  WaitAtFirstPoint: 3,
  Guidance: 4,
  End: 5
});

var mode = Mode.Idle;

var tStartWaitTime = Number.POSITIVE_INFINITY;
var tFirstPointWaitTime = Number.POSITIVE_INFINITY;
var tPointToPointTime = Number.POSITIVE_INFINITY;

var idx = 0;

self.addEventListener("message", async function (e) {

  baseCoords = e.data.coords;

  // non filtered coords
  nfcoords = baseCoords.map(x => mapToHaply(x));
  var avgX = getAverage(nfcoords.map(a => a.x), 500);
  var avgY = getAverage(nfcoords.map(a => a.y), 2);

  for (var i = 0; i < avgX.length; i++) {
    let c = { x: avgX[i], y: avgY[i] }
    coords.push(c);
  }

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

    posEE.set(device_to_graphics(positions));
    convPosEE = posEE.clone();

    switch (mode) {
      case Mode.Idle: {
        tStartWaitTime = Date.now();
        mode = Mode.Wait;
        break;
      }
      case Mode.Wait: {
        if (Date.now() - tStartWaitTime > 500) { // wait 2 sec
          idx = 1;
          console.log("Moving To First Point");
          mode = Mode.MoveToFirstPoint;
        }
        break;
      }
      case Mode.MoveToFirstPoint: {
        moveToPos(coords[0]);
        tFirstPointWaitTime = Date.now();
        mode = Mode.WaitAtFirstPoint;
        break;
      }
      case Mode.WaitAtFirstPoint: {
        if (Date.now() - tFirstPointWaitTime > 2000) {
          console.log("Starting Guidance now");
          tPointToPointTime = Date.now();
          mode = Mode.Guidance;
        }
        break;
      }
      case Mode.Guidance: {
        if (idx >= coords.length - 1) {
          idx = 0;
          mode = Mode.End;
          break;
        }
        //if (Date.now() - tPointToPointTime > 12) {
          idx++;
          moveToPos(coords[idx]);
          //tPointToPointTime = Date.now();
        //}
        break;
      }
      case Mode.End: {
        fEE.set(0, 0);
        break;
      }
    }

    prevPosEE = posEE.clone();

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
  ki = 0,
  kd = 0.1) {

  if (vector == undefined)
    return;

  // find the distance between our current position and target
  const targetPos = new Vector(vector.x, vector.y);
  const xDiff = targetPos.subtract(posEE.clone());
  const kx = xDiff.multiply(200).multiply(springConstMultiplier);

  //console.log(posEE, vector);
  // allow for higher tolerance when moving from the home position
  // apparently needs more force to move from there
  const constrainedMax = atHomePos() ? 6 : 3;

  // D controller
  const dx = (posEE.clone()).subtract(prevPosEE);
  const dt = 1 / 1000;
  const cdxdt = (dx.divide(dt)).multiply(kd);

  // I controller
  const cumError = dx.add(dx.multiply(dt));

  // set forces
  let fx = constrain(kx.x + cdxdt.x + ki * cumError.x, -1 * constrainedMax, constrainedMax);
  let fy = constrain(kx.y + cdxdt.y + ki * cumError.y, -1 * constrainedMax, constrainedMax);
  const forceMag = new Vector(fx, fy).mag();
  const maxMag = new Vector(constrainedMax, constrainedMax).mag();

  // if outside of the initial movement from the home position the force is too high, ignore it

  if (forceMag >= maxMag)
    force.set(0, 0);
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

  if (!isFinite(fx))
    fx = 0;
  if (!isFinite(fy))
    fy = 0;

  fx = constrain(fx, -constrainedMax, constrainedMax);
  fy = constrain(fy, -constrainedMax, constrainedMax);

  force.set(fx, fy);

  fEEPrev5 = fEEPrev4.clone();
  fEEPrev4 = fEEPrev3.clone();
  fEEPrev3 = fEEPrev2.clone();
  fEEPrev2 = fEEPrev.clone();
  fEEPrev = force.clone();

  console.log(force);
  fEE.set(graphics_to_device(force));
}


function getAverage(array, countBefore, countAfter) {
  if (countAfter == undefined) countAfter = 0;
  const result = [];
  for (let i = 0; i < array.length; i++) {
    const subArr = array.slice(Math.max(i - countBefore, 0), Math.min(i + countAfter + 1, array.length));
    const avg = subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
    result.push(avg);
  }
  return result;
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

function mapToHaply(v) {
  const x = -1 * (-0.00518656 * v.x + 0.79727573); //0.09673275448453048 * v.x - 14.912244045131631;
  const y = -0.000495 * v.y + 0.119761; //  0.0006815798671793079 * v.y + -16.455144634814502;
  return { x, y };
}

function atHomePos() {
  return idx == 1 ? true : false;
}

function device_to_graphics(deviceFrame) {
  return new Vector(-deviceFrame[0], deviceFrame[1]);
}

function graphics_to_device(graphicsFrame) {
  return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
}