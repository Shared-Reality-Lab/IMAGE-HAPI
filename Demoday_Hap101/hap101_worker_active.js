class DetectedObject{
  constructor(ID, type, area, centroid, dimensions) {
    this.ID = ID;
    this.type = type;
    this.area = area;
    this.centroid = centroid;
    this.dimensions = dimensions;
  }
}

class DetectedSegment{
  constructor(area, centroid, coords, name) {
    this.area = area;
    this.centroid = centroid;
    this.coords = coords;
    this.name = name;
  }
}

function loadJSON(callback) {   

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', jsonFilename, true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
  };
  xobj.send(null);  
}

function onFileLoad()   {    
  //console.log(jsondata);
  let segments = jsondata.preprocessors['ca.mcgill.a11y.image.preprocessor.semanticSegmentation'].segments;
  let objects = jsondata.preprocessors['ca.mcgill.a11y.image.preprocessor.objectDetection'].objects;
  //console.log(objects);
  //console.log(segments);
  
  for (let i = 0; i < objects.length; i++)  {
      let obj = objects[i];
      let ID = obj.ID;
      let area = obj.area;
      let centroid = obj.centroid;
      let dimensions = obj.dimensions;
      let type = obj.type;
      objectdata.push(new DetectedObject(ID, type, area, centroid, dimensions));
  }
  console.log(objectdata);
  for (let i = 0; i < segments.length; i++)  {
      let seg = segments[i];
      let area = seg.area;
      let centroid = seg.centroid;
      let coords = seg.coord;
      let name = seg.nameOfSegment;
      segmentationdata.push(new DetectedSegment(area, centroid, coords, name));
  }
  console.log(segmentationdata);
}

function closeWorker(){
    console.log("worker before closing");
    self.close();
    console.log("worker closed");
    var runLoop = true;
}
  
  var message = "";
  updateMess = function(mess){
    message = mess;
  }
  
  getMessage = async function(m){
    if( message == ""){ 
      return "connect";
    }
    else{
      return message;
    }
    
  }

  self.onmessage = function handleMessageFromMain(msg) {
    //console.log("message from main received in worker:", msg);
  
    jsonFilename = msg.data;
    //console.log(bufFromMain);
  }

  /* setting up Haply variables */
  var counter = 0;
  var msgcount = 0;
  var runLoop=true
  var widgetOne;
  var pantograph;
  var worker;
  
  var widgetOneID = 5;
  self.importScripts("libraries/vector.js");

/* Force rendering variables*/
  var angles = new Vector(0,0);      
  var positions = new Vector(0,0);
  
  /* task space */
  var posEE = new Vector(0,0);   
  var posEE_copy = new Vector(0,0);
  var posEELast = new Vector(0,0) ; 
  var posObject;  
  var posEEToObject;
  var posEEToObjectMagnitude;
  
  //var velEEToBall;
  //var velEEToBallMagnitude;
  
  var rEE = 0.006;
  var rEEContact = 0.006;
  
  //var rBall = 0.02;
  
  var dt = 1/1000.0;
  
  var fObject = new Vector(0 ,0);    
  var fContact = new Vector(0, 0);
  var fDamping = new Vector(0, 0);

  /* virtual wall parameters */
  var fWall = new Vector(0, 0);
  var kWall = 800; // N/m
  var bWall = 2; // kg/s
  var penWall = new Vector(0, 0);

  var pixelsPerMeter = 4000.0;
  var radsPerDegree = 0.01745;
  
  //var posWallLeft = new Vector(-0.07, 0.03);
  //var posWallRight = new Vector(0.07, 0.03);
  //var posWallBottom = new Vector(0.0, 0.1);
  
  var box_leftwall = new Vector(0, 0);
  var box_rightwall = new Vector(0, 0);
  var box_topwall = new Vector(0, 0);
  var box_bottomwall = new Vector (0, 0);
  var box_center = new Vector(0,0);

  var haplyBoard;
  
  var jsonFilename;
  var jsondata;
  var objectdata = [];
  var segmentationdata = [];

  self.addEventListener("message", async function(e) {
  
    /**************IMPORTING HAPI FILES*****************/
  
    self.importScripts("libraries/Board.js");
    self.importScripts("libraries/Actuator.js");
    self.importScripts("libraries/Sensor.js");
    self.importScripts("libraries/Pwm.js");
    self.importScripts("libraries/Device.js");
    self.importScripts("libraries/Pantograph.js");
    
  
  
    /************ BEGIN SETUP CODE *****************/
    //console.log('in worker');
    haplyBoard = new Board();
    await haplyBoard.init();
    //console.log(haplyBoard);
  
    widgetOne           = new Device(widgetOneID, haplyBoard);
    pantograph          = new Pantograph();
  
    widgetOne.set_mechanism(pantograph);
  
    widgetOne.add_actuator(1, 1, 2); //CCW
    widgetOne.add_actuator(2, 0, 1); //CW
    
    widgetOne.add_encoder(1, 1, 241, 10752, 2);
    widgetOne.add_encoder(2, 0, -61, 10752, 1);
  
    var run_once = false;
    //var g = new Vector(10, 20, 2);
    widgetOne.device_set_parameters();
  
    /************************ END SETUP CODE ************************* */
     

    /**********  BEGIN CONTROL LOOP CODE *********************/

    // self.importScripts("runLoop.js")
    var iter =0;
    var oldtime = 0;
    var timetaken = 0;
    var looptime = 500;
    var looptiming = 0;
    var x_m, y_m;
    var xr = 0.4;;
    var yr = 0.1;
    var cumerrorx = 0;
    var cumerrory = 0;
    var oldex = 0;
    var oldey = 0;
    var buffx = 0;
    var buffy = 0;            
    var diffx = 0;
    var diffy =0;
    var smoothing = 0.80;
    var P = 0.12;
    var I =0;
    var D = 0;
    while(true){
        let starttime = performance.now();
        let  timesincelastloop=starttime-this.timetaken;
        iter+= 1;
        // we check the loop is running at the desired speed (with 10% tolerance)
        if (timesincelastloop >= looptime*1000*1.1) {
          let freq = 1.0/timesincelastloop*1000000.0;
          console.debug("caution, freq droped to: "+freq + " kHz");
        } else if (iter >= 1000) {
          let freq = 1000.0/(starttime-looptiming)*1000000.0;
          console.debug("loop running at "  + freq + " kHz");
          iter=0;
          looptiming=starttime;
        }
    
        let timetaken=starttime;
    
  
      if (!run_once)
      {
        //loading JSON
        widgetOne.device_set_parameters();
        run_once = true;
        loadJSON(function(response) {
          // Parse JSON string into object
            jsondata = JSON.parse(response);
            console.log(jsondata);
            onFileLoad();
         });
        
      }
  
      widgetOne.device_read_data();
      noforce = 0;
      angles = widgetOne.get_device_angles();
      positions = widgetOne.get_device_position(angles);
      posEE.set(positions);  
      posEELast = posEE;
      /** Draw circle path */
      //xr = (cx + circleRadius*sin((float)(millis())/1000.0 * radpers));
      //yr = (cy + circleRadius*cos((float)(millis())/1000.0 * radpers));
      x_m = xr*300; 
      y_m = yr*300+350;//mouseY;
  
    /* haptic physics force calculation */
  
    
    /* centroid force */
    //RI SG
     // Torques from difference in endeffector and setpoint, set gain, calculate force
     let xE = pixelsPerMeter * posEE.x;
     let yE = pixelsPerMeter * posEE.y;
     let timedif =  performance.now()-oldtime;

     let dist_X = x_m-xE;
     cumerrorx += dist_X*timedif*0.000000001;
     let dist_Y = y_m-yE;
     cumerrory += dist_Y*timedif*0.000000001;
     //println(dist_Y*k + " " +dist_Y*k);
     // println(timedif);
     if (timedif > 0) {
       buffx = (dist_X-oldex)/timedif*1000*1000;
       buffy = (dist_Y-oldey)/timedif*1000*1000;            

       diffx = smoothing*diffx + (1.0-smoothing)*buffx;
       diffy = smoothing*diffy + (1.0-smoothing)*buffy;
       oldex = dist_X;
       oldey = dist_Y;
       oldtime= performance.now();
     }

    
    
    /* sum of forces */
    fEE = (fContact.clone()).multiply(-1);
    // fEE.set(graphics_to_device(fEE));
    /* end sum of forces */
  
  
    var data = [angles[0], angles[1], positions[0], positions[1]]
    this.self.postMessage(data);

    
    fEE.x = Math.min(Math.max(P*dist_X, -4), 4) + Math.min(Math.max(I*cumerrorx, -4), 4) + Math.min(Math.max(D*diffx, -8), 8);
    fEE.y = Math.min(Math.max(P*dist_Y, -4), 4) + Math.min(Math.max(I*cumerrory, -4), 4) + Math.min(Math.max(D*diffy, -8), 8); 
    if (noforce==1)
    {
      fEE.x=0.0;
      fEE.y=0.0;
    }
    // console.log(fEE.x);
    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();
      
    renderingForce = false;    
  
      // run every 1 ms
      await new Promise(r => setTimeout(r, 1));
    }
    
    /**********  END CONTROL LOOP CODE *********************/
  });
  
  
  
  
  