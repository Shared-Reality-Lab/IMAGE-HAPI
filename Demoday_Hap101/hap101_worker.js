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
  var runLoop = true;
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
  var posEELast = new Vector(0,0); 
  var velEE = new Vector(0,0);

  var b_EE = 10.0;
  var rEE = 0.005;
  var fEE = new Vector(0, 0);
  //for force shading
  var fEE_prev1 = new Vector(0, 0);
  var fEE_prev2 = new Vector(0, 0);
  var fEE_prev3 = new Vector(0, 0);
  var fEE_prev4 = new Vector(0, 0);
  var dt = 1/1000.0;
  
  var fObject = new Vector(0 ,0);    
  var fContact = new Vector(0, 0);
  var fDamping = new Vector(0, 0);

  /* virtual wall parameters */
  var fWall = new Vector(0, 0);
  var kWall = 200; // N/m
  var penWall = new Vector(0, 0);
  var haplyBoard;
  
  var jsonFilename;
  var jsondata;
  var objectdata = [];
  var segmentationdata = [];

  var pixelsPerMeter = 8000;
  var worldPixelWidth = 950;
  var worldPixelHeight = 600;

  var screenFactor_x = worldPixelWidth/pixelsPerMeter;
  var screenFactor_y = worldPixelHeight/pixelsPerMeter;


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
    widgetOne.device_set_parameters();
  
    /************************ END SETUP CODE ************************* */
     

    /**********  BEGIN CONTROL LOOP CODE *********************/
    // self.importScripts("runLoop.js")
    while(true){
  
      if (!run_once)
      {
        //loading JSON
        widgetOne.device_set_parameters();
        run_once = true;
        loadJSON(function(response) {
          // Parse JSON string into object
            jsondata = JSON.parse(response);
            //console.log(jsondata);
            onFileLoad();
         });
        
      }
  
      widgetOne.device_read_data();
      angles = widgetOne.get_device_angles();
      positions = widgetOne.get_device_position(angles);
      posEELast = posEE;
      posEE.set(positions);  
      velEE = posEE.subtract(posEELast);
      fDamping = velEE.multiply(-b_EE);
      //console.log(posEE.x, posEE.y);
      /* position conversion relative coords = [0-1, 0-1], screen coords = 950 * 600*/
      /* It varies! need to measure on each connection... */
      //fine-tuned. 
      let conv_posEE = new Vector(posEE.x * (-0.5/0.060) + 0.5, (posEE.y- 0.022) / 0.068);

      /* haptic physics force calculation */
      /* find the nearest line segment */
      // initial value as VERY LARGE one
      var nearestx = 99.9;
      var nearesty = 99.9;
      var x_line;
      var y_line;
      /* to find minimum distance line segment */
      for(let i = 0; i < objectdata.length; i++)  {
        let ulx = objectdata[i].dimensions[0];
        let uly = objectdata[i].dimensions[1];
        let lrx = objectdata[i].dimensions[2];
        let lry = objectdata[i].dimensions[3]; 
        
        /* x direction */
        /* if y coord is between line seg */
        //console.log(ulx, uly, lrx, lry, conv_posEE.x, conv_posEE.y);
        if (conv_posEE.y < lry && conv_posEE.y > uly) {
          //check distance between vertical lines;
          let x_dist1 = Math.abs((ulx-2*rEE) - conv_posEE.x);
          let x_dist2 = Math.abs((lrx+2*rEE) - conv_posEE.x);
          if (x_dist1 < x_dist2 && x_dist1 < nearestx)  {
              x_line = ulx;
              nearestx = x_dist1;
          }
          else if (x_dist2 < x_dist1 && x_dist2 < nearestx) {
              x_line = lrx;
              nearestx = x_dist2;
          }
        }
        /* y direction, the same method */
        if (conv_posEE.x > ulx && conv_posEE.x < lrx) {
          //check distance between vertical lines;
          let y_dist1 = Math.abs((uly-2*rEE) - conv_posEE.y);
          let y_dist2 = Math.abs((lry+2*rEE) - conv_posEE.y);
          if (y_dist1 < y_dist2 && y_dist1 < nearesty)  {
              y_line = uly;
              nearesty = y_dist1;
          }
          else if (y_dist2 < y_dist1 && y_dist2 < nearesty) {
              y_line = lry;
              nearesty = y_dist2;
          }
        }
      }


      fWall.set(0,0);
      let threshold = 0.02;
      if (nearestx < nearesty && nearestx < threshold)  {
        if(x_line < conv_posEE.x) {
          penWall.set(kWall* (threshold-(x_line - conv_posEE.x)), 0);
        }
        else{
          penWall.set(-kWall* (threshold-(conv_posEE.x - x_line)), 0);
        }
        if (Math.abs(conv_posEE.x - x_line) < rEE)  {
          fWall.set(0,0);
        }
        else{
          fWall = penWall;
        }
        
      }
      else if (nearesty < nearestx && nearesty < threshold){
        if(y_line < conv_posEE.y) {
          penWall.set(0, -kWall*(threshold-(y_line - conv_posEE.y)));
        }
        else{
          penWall.set(0, kWall*(threshold-(conv_posEE.y - y_line)));
        }
        if (Math.abs(conv_posEE.x - x_line) < rEE)  {
          fWall.set(0,0);
        }
        else{
          fWall = penWall;
        }
      }
      fEE = (fWall.clone()).multiply(-1);
      fEE.add(fDamping);

      //fEE.set(graphics_to_device(fEE));
      
      //force shading (weighted moving average)
      
      fEE.set(0.4 * fEE.x + 0.3 * fEE_prev1.x + 0.15 * fEE_prev2.x + 0.1 * fEE_prev3.x + 0.05 * fEE_prev4.x,
        0.4 * fEE.y + 0.3 * fEE_prev1.y + 0.15 * fEE_prev2.y + 0.1 * fEE_prev3.y + 0.05 * fEE_prev4.y);

      fEE_prev1 = fEE.clone();
      fEE_prev2 = fEE_prev1.clone();
      fEE_prev3 = fEE_prev2.clone();
      fEE_prev4 = fEE_prev3.clone();
      
      /* rendering the force within distance threshold */
      
            
      
      //console.log(nearestx, nearesty);
      var data = [angles[0], angles[1], positions[0], positions[1]];
      this.self.postMessage(data);
    
      widgetOne.set_device_torques(fEE.toArray());
      widgetOne.device_write_torques();
        
      //if(fEE.x == 0 && fEE.y == 0) 
      renderingForce = false;    
    
        // run every 1 ms
        await new Promise(r => setTimeout(r, 1));
      }
    
    /**********  END CONTROL LOOP CODE *********************/
  });
  
  
  
  
  