class haplyBoard{

  async init() {
    if ('serial' in navigator) {
      try {
        const port = (await navigator.serial.getPorts())[0];
        console.debug(port);
        console.debug(navigator.serial);
        await port.open({ baudRate: 57600 }); // `baudRate` was `baudrate` in previous versions.

        this.writer = port.writable.getWriter();
        this.reader = port.readable.getReader();

        const signals = await port.getSignals();
        console.log(signals);
      } catch(err) {
        console.error('There was an error opening the serial port:', err);
      }
    } else {
      console.error('Web serial doesn\'t seem to be enabled in your browser. Try enabling it by visiting:')
      console.error('chrome://flags/#enable-experimental-web-platform-features');
      console.error('opera://flags/#enable-experimental-web-platform-features');
      console.error('edge://flags/#enable-experimental-web-platform-features');
    }
  }

  async write(data) {
    const dataArrayBuffer = this.encoder.encode(data);
    return await this.writer.write(dataArrayBuffer);
  }

  /**
   * Gets data from the `reader`, decodes it and returns it inside a promise.
   * @returns A promise containing either the message from the `reader` or an error.
   */
  async read() {
    try {
      const readerData = await this.reader.read();
      return this.decoder.decode(readerData.value);
    } catch (err) {
      const errorMessage = `error reading data: ${err}`;
      console.error(errorMessage);
      return errorMessage;
    }
  }
}

function closeWorker(){
  console.log("worker before close")
  self.close();
  console.log("worker closed")
  var runLoop = true;
}


var counter = 0;
var msgcount = 0;
var runLoop=true
self.addEventListener("message", function(e) {
  while(runLoop){
    msgcount++;
  console.log("PING from worker.js: " + msgcount);
  console.log(e.data);
  self.postMessage('I\'m alive!');
    var done = Date.now() + 100; // 100ms
    while (Date.now() < done) {
        // Busy wait (boo!)
    }
    ++counter;
    // self.postMessage(counter);
    this.console.log(counter)
    //if(e.data == "close"){
      if (msgcount >= 50){runLoop = false; 
        closeWorker();}
      if(e.data == 'button'){
        msgcount =0;
      }

      
    }
});


// /**
//  * If you're not familiar with TypeScript code, just ignore the `<TYPE>` and `:TYPE` parts.
//  */
// var data =false;
// self.addEventListener('message', function(e) {
//   console.log("hello from worker.js");
//   var data = e.data;
//   switch (data.cmd) {
//     case 'start':
//       self.postMessage('WORKER STARTED: ' + data.msg);
//       data = true;
//       break;
//     case 'stop':
//       self.postMessage('WORKER STOPPED: ' + data.msg +
//                        '. (buttons will no longer work)');
//       self.close(); // Terminates the worker.
//       break;
//     default:
//       self.postMessage('Unknown command: ' + data.msg);
//   };
// }, false);

// if (data){
//         /* GET END-EFFECTOR STATE (TASK SPACE) */
//         widgetOne.device_read_data();
      
//         angles.set(widgetOne.get_device_angles()); 
//         posEE.set(widgetOne.get_device_position(angles.array()));
//         posEE.set(device_to_graphics(posEE)); 
        
//         velEE.set((posEE.copy().sub(posEELast)).div(dt));
//         posEELast = posEE;
//         /* haptic physics force calculation */
      
//       /* ball and end-effector contact forces */
//       posEEToBall = (posBall.copy()).sub(posEE);
//       posEEToBallMagnitude = posEEToBall.mag();
      
//       penBall = posEEToBallMagnitude - (rBall + rEE);
//       /* end ball and end-effector contact forces */
      
      
//       /* ball forces */
//       if(penBall < 0){
//         rEEContact = rEE + penBall;
//         fContact = posEEToBall.normalize();
//         velEEToBall = velBall.copy().sub(velEE);
//         velEEToBall = fContact.copy().mult(velEEToBall.dot(fContact));
//         velEEToBallMagnitude = velEEToBall.mag();
        
//         /* since penBall is negative kBall must be negative to ensure the force acts along the end-effector to the ball */
//         fContact = fContact.mult((-kBall * penBall) - (bBall * velEEToBallMagnitude));
//       }
//       else{
//         rEEContact = rEE;
//         fContact.set(0, 0);
//       }
//       /* end ball forces */
      
      
//       /* forces due to damping */
//       fDamping = (velBall.copy()).mult(-bAir);
//       /* end forces due to damping*/
      
      
//       /* forces due to walls on ball */
//       fWall.set(0, 0);
      
//       /* left wall */
//       penWall.set((posBall.x - rBall) - posWallLeft.x, 0);
//       if(penWall.x < 0){
//         fWall = fWall.add((penWall.mult(-kWall))).add((velBall.copy()).mult(-bWall));
//       }
      
//       /* bottom wall */
//       penWall.set(0, (posBall.y + rBall) - posWallBottom.y);
//       if(penWall.y > 0){
//         fWall = fWall.add((penWall.mult(-kWall))).add((velBall.copy()).mult(-bWall));
//       }
      
//       /* right wall */
//       penWall.set((posBall.x + rBall) - posWallRight.x, 0);
//       if(penWall.x > 0){
//         fWall = fWall.add((penWall.mult(-kWall))).add((velBall.copy()).mult(-bWall));
//       }
//       /* end forces due to walls on ball*/
      
      
//       /* sum of forces */
//       fBall = (fContact.copy()).add(fGravity).add(fDamping).add(fWall);      
//       fEE = (fContact.copy()).mult(-1);
//       fEE.set(graphics_to_device(fEE));
//       /* end sum of forces */
      
      
//       /* end haptic physics force calculation */
//     }
    
//     /* dynamic state of ball calculation (integrate acceleration of ball) */
//     posBall = (((fBall.copy()).div(2*mBall)).mult(dt*dt)).add((velBall.copy()).mult(dt)).add(posBall);
//     velBall = (((fBall.copy()).div(mBall)).mult(dt)).add(velBall);
//     /*end dynamic state of ball calculation */
    
    
    
//     torques.set(widgetOne.set_device_torques(fEE.array()));
//     widgetOne.device_write_torques();
    
  
//     renderingForce = false;

// }
  
  