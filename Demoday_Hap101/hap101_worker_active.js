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
  //console.log(objectdata);
  for (let i = 0; i < segments.length; i++)  {
      let seg = segments[i];
      let area = seg.area;
      let centroid = seg.centroid;
      let coords = seg.coord;
      let name = seg.nameOfSegment;
      segmentationdata.push(new DetectedSegment(area, centroid, coords, name));
  }
  //console.log(segmentationdata);
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
  
  var force = new Vector(0, 0);
  var fEE = new Vector(0, 0); 
  //var velEEToBall;
  //var velEEToBallMagnitude;
  
  var rEE = 0.005;
  var rEEContact = 0.005;
  
  //var rBall = 0.02;
  
  var dt = 1/1000.0;
  
  var fObject = new Vector(0 ,0);    
  var fContact = new Vector(0, 0);
  var fDamping = new Vector(0, 0);

  /* virtual wall parameters */
  var fWall = new Vector(0, 0);
  var kWall = 200; // N/m
  var bWall = 2; // kg/s
  var penWall = new Vector(0, 0);
  
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

  var pixelsPerMeter = 6000;
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

    locations = [new Vector(-0.0354, 0.063866666666666665),
      new Vector(-0.036061071399653324, 0.09530481901415183),
      new Vector(-0.01595470939685663, 0.09663625970686075),
      new Vector(0.021783327903592782, 0.0661987345848704),
      new Vector(-0.022034144532448226, 0.08840344736901531),
     ]

    // use a timer to count
    var i = -1;
    var iter = 0;
    function counter() {
        if (iter++ % 2000 == 0) {
          i++;
        }
        setTimeout(counter, 2000);
    }

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

      posEE.set(device_to_graphics(positions));//-positions[0], positions[1]);  
      
      /* position conversion */
      /* on the screen vertices = +0.074 to -0.074, 0.018 to 0.112
         workspace = 0.148 m * 0.075 m, relative coords = [0-1, 0-1], screen coords = 950 * 600*/

      counter();

       const interval = setInterval(function() {

       // console.log(posEE);
         
        if (i >= objectdata.length)
          // reset the force
          fEE.set(0, 0);
        else
        {
          // convert centroid coords into haply frame of reference
          var centroid = to_haply_frame(new Vector(objectdata[i].centroid[0], objectdata[i].centroid[1]));
          //console.log(centroid);
          //var centroid = [-0.03772676532591132, 0.060276119739146976];
          //var centroid = new Vector(-0.0354, 0.063866666666666665);
          //var centroid = locations[i];

          var conv_posEE = posEE.clone();
          var xDiff = (conv_posEE).subtract(centroid);

          force.set(xDiff.multiply(-400));

          fEE.set(graphics_to_device(force));
        }
       }, 2000);

     var data = [angles[0], angles[1], positions[0], positions[1]];
     this.self.postMessage(data);    

      widgetOne.set_device_torques(fEE.toArray());
      widgetOne.device_write_torques();
 
      renderingForce = false;    
    
      // run every 1 ms
      await new Promise(r => setTimeout(r, 1));
      }
    
    /**********  END CONTROL LOOP CODE *********************/
  });

function to_world_frame(v) {
  var x = 6.2895 * v.x + 0.5009;
  var y = 10.017 * v.y - 0.2004;

  return new Vector(x, y);
}

function to_haply_frame(v) {
  var x = (v.x - 0.5009) / 6.2895;
  var y = (v.y + 0.2004) / 10.017;
  return new Vector(x, y);
}

function device_to_graphics(deviceFrame){
  //return deviceFrame.set(-deviceFrame.x, deviceFrame.y);
  return new Vector(-deviceFrame[0], deviceFrame[1]);
}

function graphics_to_device(graphicsFrame){
  return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
}
  
  
  