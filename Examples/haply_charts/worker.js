 
  var widgetOne;
  var pantograph;
  var haplyBoard;
  
  var widgetOneID = 5;
  self.importScripts("libraries/vector.js");
  var angles = new Vector(0,0);    
  var torques= new Vector(0,0);
  var positions = new Vector(0, 0);
  
  /* task space */
  var posEE = new Vector(0,0);   
 
 
  var fDamping = new Vector(0, 0);
  var fEE = new Vector(0,0)

  
  
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
    var g = new Vector(10, 20, 2);
    //widgetOne.device_set_parameters();
  
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
  
    
    
  
  // /*end dynamic state of ball calculation */
  
    var data = {x:positions[0], y:positions[1]}
    this.self.postMessage(data);
  
    widgetOne.set_device_torques(fEE.toArray());
    widgetOne.device_write_torques();
      
    renderingForce = false;    
  
      // run every 1 ms
      await new Promise(r => setTimeout(r, 1));
    }
    
    /**********  END CONTROL LOOP CODE *********************/
  });
  
  
  
  
  