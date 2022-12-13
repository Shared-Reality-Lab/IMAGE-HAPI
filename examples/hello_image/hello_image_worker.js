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

/* Radius */
var rEE = 0.006; // end effector

/* task space */
var posEE = new Vector(0, 0);
var posEELast = new Vector(0, 0);
var velEE = new Vector(0, 0);
var dt = 1/1000.0;

var posEEToObj = [];
var posEEToObjMagnitude = [];
var velEEToObj = [];
var velEEToObjMagnitude = [];

/* Forces */
var fEE = new Vector(0, 0);
var fDamping = new Vector(0, 0);

/* virtual division parameters */
var fDiv = new Vector(0, 0); // force in the division
var fEnv = new Vector(0, 0);
var fEnvLast = new Vector(0, 0);
var fEnvLastLast = new Vector(0, 0);
var fEnvLastLastLast = new Vector(0, 0);
var fCalc = new Vector(0, 0);
var fEdge = new Vector(0, 0); // additional force to feel better the edge

/* damping coefficients (kg/s) */
var bAir = 0;  // air
var b = 4;
var bEdge = 100; // edge effect
var kEdge = 5000; // edge effect

/* virtual object parameters */
var fAllObj = new Vector(0, 0);
var fObj = []; // force by the objects
var kObj = 3500; // spring constant (N/m)
var bObj = 1; // damping coefficient (kg/s)
// distance between the surfaces of the dot and EE, 
// which is zero / negative when they are touching / overlapping (m)
var penObj = [];

/* Time variables */
var startTime = 0;
var codeTime = 0;
var promTime = 0;

/* for logic */
var prevSeg = -1;
var currSeg = -1;
var txtrSeg = 0;
var changeTxSeg = false;

/* Changing values */
var looptime = 1; // in ms [0.5(2000), 1(1000), 2(500), 4(250)]

/* Path function parameters */
var segments, objects;

/* Device version */
var newPantograph = 0; // uncomment for 2DIYv1
// var newPantograph = 1; // uncomment for 2DIYv3

/* Device variables */
var haplyBoard;
var stop = false;
var remObj = false;
var remSeg = false;


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


function edge() {
  var dif = (posEE.clone()).subtract(posEELast);
  if(prevSeg != currSeg){
    fEdge = fEdge.add(((dif.clone()).multiply(4 * -kEdge))).add((velEE.clone()).multiply(-bEdge));
    fCalc.x = constrain(fCalc.x + fEdge.x, -8, 8);
    fCalc.y = constrain(fCalc.y + fEdge.y, -8, 8);
    // console.log("edge");
  }
}


function jelly() {
  fDiv = (velEE.clone()).multiply(-b);

  fEnv.x = fDamping.x + fDiv.x;
  fEnv.y = fDamping.y + fDiv.y;
  fCalc.x = constrain(0.4*fEnv.x + 0.3*fEnvLast.x + 0.2*fEnvLastLast.x + 0.1*fEnvLastLastLast.x, -6, 6) * -1;
  fCalc.y = constrain(0.4*fEnv.y + 0.3*fEnvLast.y + 0.2*fEnvLastLast.y + 0.1*fEnvLastLastLast.y, -6, 6);

  /* updating "previous" variables */
  fEnvLastLastLast = fEnvLastLast.clone();
  fEnvLastLast = fEnvLast.clone();
  fEnvLast = fEnv.clone();
}


function ice() {
  fDiv = (velEE.clone()).multiply(b);

  fEnv.x = fDamping.x + fDiv.x;
  fEnv.y = fDamping.y + fDiv.y;
  fCalc.x = constrain(0.4*fEnv.x + 0.3*fEnvLast.x + 0.2*fEnvLastLast.x + 0.1*fEnvLastLastLast.x, -6, 6) * -1;
  fCalc.y = constrain(0.4*fEnv.y + 0.3*fEnvLast.y + 0.2*fEnvLastLast.y + 0.1*fEnvLastLastLast.y, -6, 6);
  
  /* updating "previous" variables */
  fEnvLastLastLast = fEnvLastLast.clone();
  fEnvLastLast = fEnvLast.clone();
  fEnvLast = fEnv.clone();
}


function forceFromObjs(){
  /* forces due to dots on EE */
  for(let i = 0; i < objects.length; i++){  
    posEEToObj[i].x = objects[i]["centroid"][0] - posEE.x;
    posEEToObj[i].y = objects[i]["centroid"][1] - posEE.y;
    posEEToObjMagnitude[i] = posEEToObj[i].mag();
    penObj[i] = posEEToObjMagnitude[i] - (objects[i]["minRadius"] + rEE);
    
    if(penObj[i] < 0){
      // console.log(i);

      fObj[i] = posEEToObj[i].normalize();

      velEEToObj[i] = (velEE.clone()).multiply(-1);
      velEEToObj[i] = (fObj[i].clone()).multiply(velEEToObj[i].dot(fObj[i]));
      velEEToObjMagnitude[i] = velEEToObj[i].mag();

      /* since penObj[i] is negative kObj must be negative to ensure the force acts along the end-effector to the ball */
      fAllObj = fAllObj.add((fObj[i].clone()).multiply((-kObj * penObj[i]) - (bObj * velEEToObjMagnitude[i])));
    }
    else {
      fObj[i].set(0, 0);
    }
  }

  fCalc.x = fCalc.x + fAllObj.x;
  fCalc.y = fCalc.y + (-1 * fAllObj.y);
}


self.addEventListener("message", async function (e) {
  /* listen to messages from the main script */
  /* take action depending on the message content */
  if(e.data == "stop"){
    stop = true;
  }else if(e.data == "start"){
    stop = false;
  }else if(e.data == "next"){
    changeTxSeg = true;
  }else if(e.data == "remove_obj"){
    remObj = true;
  }else if(e.data == "show_obj"){
    remObj = false;
  }else if(e.data == "remove_seg"){
    remSeg = true;
  }else if(e.data == "show_seg"){
    remSeg = false;
  }else{
    /************ BEGIN SETUP CODE *****************/
    console.log('in worker');

    /* get image data*/
    segments = e.data[0];
    objects = e.data[1];
    // console.log(objects);

    /* initialize arrays with image data */
    posEEToObj.length = objects.length;
    posEEToObj.fill(new Vector(0, 0));

    posEEToObjMagnitude.length = objects.length;
    posEEToObjMagnitude.fill(0);

    velEEToObj.length = objects.length;
    velEEToObj.fill(new Vector(0, 0));

    velEEToObjMagnitude.length = objects.length;
    velEEToObjMagnitude.fill(0);

    fObj.length = objects.length;
    fObj.fill(new Vector(0, 0));

    penObj.length = objects.length;
    penObj.fill(0);

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

      velEE.set(((posEE.clone()).subtract(posEELast)).divide(dt));

      /* haptic physics force calculation */
      /* update "previous" variable */
      posEELast = posEE.clone();
      prevSeg = currSeg;
      
      /* forces due to damping in air */
      fDamping = (velEE.clone()).multiply(-bAir);

      /* forces due to guidance on EE */
      fCalc.set(0, 0);
      fEdge.set(0, 0);
      fAllObj.set(0, 0);

      if(changeTxSeg){
        changeTxSeg = false;
        txtrSeg++;
        if(txtrSeg >= (segments.length)){
          txtrSeg = 0;
        }
        // console.log(txtrSeg);
      }
      
      if(stop){
        /* send zero force to the device */
        fCalc.set(0, 0);
      }else{
        /* find in which segment the EE is currently located */
        if(!remSeg){
          for(let j = 0; j < segments[txtrSeg].length; j++){
            if(pointInPolygon(segments[txtrSeg][j], [posEE.x, posEE.y])){
              currSeg = txtrSeg;
              jelly();
              edge();
              // console.log(currSeg);
              break;
            }
            else{
              currSeg = -1;
              edge();
            }
          }
        }

        if(!remObj){
          forceFromObjs();
        }
      }

      /* sum of forces */
      fEE = fCalc.clone();

      var data = [angles[0], angles[1], positions[0], positions[1], newPantograph, txtrSeg]
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




