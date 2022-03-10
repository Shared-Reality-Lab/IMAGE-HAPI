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
let fEEPrev12 = new Vector(0, 0);
let fEEPrev11 = new Vector(0, 0);
let fEEPrev10 = new Vector(0, 0);
let fEEPrev9 = new Vector(0, 0);
let fEEPrev8 = new Vector(0, 0);
let fEEPrev7 = new Vector(0, 0);
let fEEPrev6 = new Vector(0, 0);
let fEEPrev5 = new Vector(0, 0);
let fEEPrev4 = new Vector(0, 0);
let fEEPrev3 = new Vector(0, 0);
let fEEPrev2 = new Vector(0, 0);
let fEEPrev = new Vector(0, 0);

var baseCoords = [];
var nfcoords = [];
var coords = [];

var forces = [];

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
          console.log(idx, forces);
          break;
        }
        //if (Date.now() - tPointToPointTime > 0) {
          const v = new Vector(coords[idx].x, coords[idx].y);
          const curr = posEE.clone();
          //console.log(curr, v);
          const distance = curr.subtract(v).mag();
          //console.log(distance);
          if (distance <= 0.009) {
         //   console.log("next pos", idx);
            idx++;
          }
          moveToPos(coords[idx]);
       //   tPointToPointTime = Date.now();
      //  }
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
  springConstMultiplier = 1.7,
  ki = 0,
  kd = 0.01) {

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
  const w = 91;//21;
  const i = 13;//6;

  const x1 = (i / w) * fx;
  const x2 = ((i - 1) / w) * fEEPrev.x;
  const x3 = ((i - 2) / w) * fEEPrev2.x;
  const x4 = ((i - 3) / w) * fEEPrev3.x;
  const x5 = ((i - 4) / w) * fEEPrev4.x;
  const x6 = ((i - 5) / w) * fEEPrev5.x;

  const x7 = ((i - 6) / w) * fEEPrev6.x;
  const x8 = ((i - 7) / w) * fEEPrev7.x;
  const x9 = ((i - 8) / w) * fEEPrev8.x;
  const x10 = ((i - 9) / w) * fEEPrev9.x;
  const x11 = ((i - 10) / w) * fEEPrev10.x;
  const x12 = ((i - 11) / w) * fEEPrev11.x;
  const x13 = ((i - 12) / w) * fEEPrev12.x;

  const y1 = (i / w) * fy;
  const y2 = ((i - 1) / w) * fEEPrev.y;
  const y3 = ((i - 2) / w) * fEEPrev2.y;
  const y4 = ((i - 3) / w) * fEEPrev3.y;
  const y5 = ((i - 4) / w) * fEEPrev4.y;
  const y6 = ((i - 5) / w) * fEEPrev5.y;

  const y7 = ((i - 6) / w) * fEEPrev6.y;
  const y8 = ((i - 7) / w) * fEEPrev7.y;
  const y9 = ((i - 8) / w) * fEEPrev8.y;
  const y10 = ((i - 9) / w) * fEEPrev9.y;
  const y11 = ((i - 10) / w) * fEEPrev10.y;
  const y12 = ((i - 11) / w) * fEEPrev11.y;
  const y13 = ((i - 12) / w) * fEEPrev12.y;


  fx = x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13;
  fy = y1 + y2 + y3 + y4 + y5 + y6 + y7 + y8 + y9 + y10 + y11 + y12 + y13;

  if (!isFinite(fx))
    fx = 0;
  if (!isFinite(fy))
    fy = 0;

  fx = constrain(fx, -constrainedMax, constrainedMax);
  fy = constrain(fy, -constrainedMax, constrainedMax);

  force.set(fx, fy);

  fEEPrev12 = fEEPrev11.clone();
  fEEPrev11 = fEEPrev10.clone();
  fEEPrev10 = fEEPrev9.clone();
  fEEPrev9 = fEEPrev8.clone();
  fEEPrev8 = fEEPrev7.clone();
  fEEPrev7 = fEEPrev6.clone();
  fEEPrev6 = fEEPrev5.clone();
  fEEPrev5 = fEEPrev4.clone();
  fEEPrev4 = fEEPrev3.clone();
  fEEPrev3 = fEEPrev2.clone();
  fEEPrev2 = fEEPrev.clone();
  fEEPrev = force.clone();

    console.log(idx, Date.now(), force.x, force.y);
  //forces.push({x: fx, y: fy});
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
  const x = 0.00518656 * v.x - 0.79727573; //0.09673275448453048 * v.x - 14.912244045131631;
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