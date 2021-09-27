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
  
  //var posWallLeft = new Vector(-0.07, 0.03);
  //var posWallRight = new Vector(0.07, 0.03);
  //var posWallBottom = new Vector(0.0, 0.1);
  
  var box_leftwall = new Vector(0, 0);
  var box_rightwall = new Vector(0, 0);
  var box_topwall = new Vector(0, 0);
  var box_bottomwall = new Vector (0, 0);
  var box_center = new Vector(0,0);

  var haplyBoard;
  
  self.addEventListener("message", async function(e) {
  
    /**************IMPORTING HAPI FILES*****************/
  
  
    self.importScripts("libraries/Board.js");
    self.importScripts("libraries/Actuator.js");
    self.importScripts("libraries/Sensor.js");
    self.importScripts("libraries/Pwm.js");
    self.importScripts("libraries/Device.js");
    self.importScripts("libraries/Pantograph.js");
    
  
  
    /************ BEGIN SETUP CODE *****************/
    console.log('in worker');
    haplyBoard = new Board();
    await haplyBoard.init();
    console.log(haplyBoard);
  
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
    while(true){
  
      if (!run_once)
      {
        widgetOne.device_set_parameters();
        run_once = true;
      }
  
      widgetOne.device_read_data();
      angles = widgetOne.get_device_angles();
      positions = widgetOne.get_device_position(angles);
      posEE.set(positions);  
      posEELast = posEE;
  
    /* haptic physics force calculation */
    
   

    /* box force */

    /* centroid force */

    /* wall force calculation*/
    fWall.set(0, 0);
    
    /* sum of forces */
    fEE = (fContact.clone()).multiply(-1);
    // fEE.set(graphics_to_device(fEE));
    /* end sum of forces */
  
  
    var data = [angles[0], angles[1], positions[0], positions[1]]
    this.self.postMessage(data);
  
    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();
      
    renderingForce = false;    
  
      // run every 1 ms
      await new Promise(r => setTimeout(r, 1));
    }
    
    /**********  END CONTROL LOOP CODE *********************/
  });
  
  
  
  
  