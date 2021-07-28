var haplyBoard;
var widgetOne;
var pantograph;

var widgetOneID = 5;
var CW = 0;
var CCW = 1;
var renderingForce= false;

/* framerate definition ************************************************************************************************/
var baseFrameRate= 120;
/* end framerate definition ********************************************************************************************/ 

/* elements definition *************************************************************************************************/

/* Screen and world setup parameters */
var pixelsPerMeter = 4000.0;
var radsPerDegree = 0.01745;

/* pantagraph link parameters in meters */
var l = 0.07; // m
var L = 0.09; // m


/* end effector radius in meters */
var rEE = 0.006;
var rEEContact = 0.006;

/* virtual ball parameters  */
var rBall = 0.02;

var mBall = 0.15;  // kg
var kBall = 445;  // N/m
var bBall = 3.7;
var penBall = 0.0;  // m
var bAir = 0.0;  // kg/s
var fGravity = new p5.Vector(0, 9.8*mBall);
vardt = 1/1000.0;

var posBall = new p5.Vector(0, 0.05);  
var velBall                             = new p5.Vector(0, 0);    

var fBall = new p5.Vector(0 ,0);    
var fContact = new p5.Vector(0, 0);
var fDamping = new p5.Vector(0, 0);

var posEEToBall;
var posEEToBallMagnitude;

var velEEToBall;
var velEEToBallMagnitude;

/* virtual wall parameters */
var fWall = new p5.Vector(0, 0);
var kWall = 800; // N/m
var bWall = 2; // kg/s
var penWall = new p5.Vector(0, 0);

var posWallLeft = new p5.Vector(-0.07, 0.03);
var posWallRight = new p5.Vector(0.07, 0.03);
var posWallBottom = new p5.Vector(0.0, 0.1);

/* generic data for a 2DOF device */
/* joint space */
var angles                              = new p5.Vector(0, 0);
var torques                             = new p5.Vector(0, 0);

/* task space */
var posEE                               = new p5.Vector(0, 0);
var posEELast                           = new p5.Vector(0, 0);
var velEE                               = new p5.Vector(0, 0);

var fEE                                 = new p5.Vector(0, 0); 

/* device graphical position */
var deviceOrigin                        = new p5.Vector(0, 0);

/* World boundaries reference */
const worldPixelWidth                     = 1000;
const worldPixelHeight                    = 650;

/* graphical elements */
var pGraph, joint, endEffector;
var ball, leftWall, bottomWall, rightWall;
/* end elements definition *********************************************************************************************/ 


function setup() {
    createCanvas(800, 800);
    // this.haplyBoard          = new Board(this,'COM7',0);//Serial.list()[0]
    // this.widgetOne           = new Device(this.widgetOneID, this.haplyBoard);
    // this.pantograph          = new Pantograph();

    // widgetOne.set_mechanism(pantograph);
  
    // widgetOne.add_actuator(1, CCW, 2);
    // widgetOne.add_actuator(2, CW, 1);
    
    // widgetOne.add_encoder(1, CCW, 241, 10752, 2);
    // widgetOne.add_encoder(2, CW, -61, 10752, 1);
    
    // widgetOne.device_set_parameters();
    
    /* visual elements setup */
    //background(0);
    deviceOrigin.add(worldPixelWidth/2, 0);
    
    /* create pantagraph graphics */
    create_pantagraph();
    
    /* create ball */
    ball = create_ball(rBall);
    ball.stroke(color(0));
    
    /* create left-side wall */
    leftWall = create_wall(posWallLeft.x, posWallLeft.y, posWallLeft.x, posWallLeft.y+0.07);
    leftWall.stroke(color(0));
    
    /* create right-sided wall */
    rightWall = create_wall(posWallRight.x, posWallRight.y, posWallRight.x,           posWallRight.y+0.07);
    rightWall.stroke(color(0));
    
    /* create bottom wall */
    bottomWall = create_wall(posWallBottom.x-0.07, posWallBottom.y, posWallBottom.x+0.07, posWallBottom.y);
    bottomWall.stroke(color(0));

    /* setup framerate speed */
    frameRate(baseFrameRate);
    
    simulationThread();
    // /* setup simulation thread to run at 1kHz */ 
    // var st = new SimulationThread();
    // scheduler.scheduleAtFixedRate(st, 1, 1, MILLISECONDS);
  }
  
  function draw() {
    /* put graphical code here, runs repeatedly at defined framerate in setup, else default at 60fps: */
     if(renderingForce == false){
       //  background(255);  
      //   update_animation(angles.x*radsPerDegree, angles.y*radsPerDegree, posEE.x, posEE.y);
     }
  }

// if (window.Worker) {
//     // console.log("here");
//     worker = new Worker("worker.js");
//     //document.getElementById("button").addEventListener("click", setup);
// }
// else {
//     console.log("oops!");
// }

function simulationThread(){}
// function simulationThread()
// {
    console.debug("PING from simulation thread");
    if (window.Worker) {
    worker = new Worker("worker.js");
    // document.getElementById("button").addEventListener("click",function(e) 
    // {
        worker.postMessage("start");
  //   });
  document.getElementById("button").addEventListener("click",function(e) 
    {
      worker.postMessage('button');
        });
    
  }
  else {
      console.log("oops!");
  }
  addEventListener("message", function(e) {
    if(e.data == 'close')
    worker.terminate();
  });
  
// }

// worker.addEventListener("message", function(e) 
    // {
    //     worker.postMessage("ping");
    // });
      
 // worker = new Worker('worker.js');
 // worker.postMessage("hello");
  //workers.onmessage = workerDone;
  //workers.postMessage({
  //  message_1: 'first message',
  //  message_2: 'another message'
  //});
  //console.log("PING3");
    // var worker;
    // if(haplyBoard.data_available()){
    //      worker.postMessage("start");
    // }
    // else{
    //      worker.postMessage("stop");
    // } 


/* helper functions section, place helper functions here ***************************************************************/
function create_pantagraph(){
    var lAni = pixelsPerMeter * l;
    var LAni = pixelsPerMeter * L;
    var rEEAni = pixelsPerMeter * rEE;
    
    pGraph = beginShape();
    pGraph.beginShape();
    pGraph.fill(255);
    pGraph.stroke(0);
    pGraph.strokeWeight(2);
    
    pGraph.vertex(deviceOrigin.x, deviceOrigin.y);
    pGraph.vertex(deviceOrigin.x, deviceOrigin.y);
    pGraph.vertex(deviceOrigin.x, deviceOrigin.y);
    pGraph.vertex(deviceOrigin.x, deviceOrigin.y);
    pGraph.endShape(CLOSE);
    
    // joint = beginShape(ELLIPSE, deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni);
  joint = ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
    joint.stroke(color(0));
    
    // endEffector = beginShape(ELLIPSE, deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni);
  endEffector = ellipse(deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni)
    endEffector.stroke(color(0));
    strokeWeight(5);
    
  }
  
  
function create_wall(x1, y1, x2, y2){
    x1 = pixelsPerMeter * x1;
    y1 = pixelsPerMeter * y1;
    x2 = pixelsPerMeter * x2;
    y2 = pixelsPerMeter * y2;
    
    // return beginShape(LINE, deviceOrigin.x + x1, deviceOrigin.y + y1, deviceOrigin.x + x2, deviceOrigin.y+y2);
  return line(deviceOrigin.x + x1, deviceOrigin.y + y1, deviceOrigin.x + x2, deviceOrigin.y+y2);
  }
  
  
function create_ball(rBall){
    rBall = pixelsPerMeter * rBall;
    
    // return beginShape(ELLIPSE, deviceOrigin.x, deviceOrigin.y, 2*rBall, 2*rBall);
  return ellipse(deviceOrigin.x, deviceOrigin.y, 2*rBall, 2*rBall);
  }
  
  
function update_animation(th1, th2, xE, yE){
    background(255);
    
    var lAni = pixelsPerMeter * l;
    var LAni = pixelsPerMeter * L;
    
    xE = pixelsPerMeter * xE;
    yE = pixelsPerMeter * yE;
    
    th1 = 3.14 - th1;
    th2 = 3.14 - th2;
    pGraph.beginShape();
    pGraph.vertex(1, deviceOrigin.x + lAni*cos(th1), deviceOrigin.y + lAni*sin(th1));
    pGraph.vertex(3, deviceOrigin.x + lAni*cos(th2), deviceOrigin.y + lAni*sin(th2));
    pGraph.vertex(2, deviceOrigin.x + xE, deviceOrigin.y + yE);
    pGraph.endShape();
    //shape(pGraph);
    joint.beginShape();
    joint.endShape();
    // shape(joint);
    
    // shape(leftWall);
    leftWall.beginShape();
    leftWall.endShape();
    // shape(rightWall);
    rightWall.beginShape();
    rightWall.endShape();
    // shape(bottomWall);
    bottomWall.beginShape();
    bottomWall.endShape();
    ball.beginShape();
    ball.endShape();
    //shape(ball, posBall.x * pixelsPerMeter, posBall.y * pixelsPerMeter);
    stroke(0);
    
    
    translate(xE, yE);
    endEffector.beginShape();
    endEffector.endShape();
     shape(endEffector);
  }
  
  
function device_to_graphics(deviceFrame){
    return deviceFrame.set(-deviceFrame.x, deviceFrame.y);
  }
  
  
function graphics_to_device(graphicsFrame){
    return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
  }
  /* end helper function ****************************************************************************************/

class Device{
    
    constructor(deviceID, deviceLink){
        this.deviceID = deviceID;
		this.deviceLink = deviceLink;
      
	this.mechanism = null;
	
	this.communicationType = 1;
	
	//actuatorsActive    = 0;
	this.motors             = new Actuator();
	
	//encodersActive     = 0;
	this.encoders           = new Sensor();
	
	//sensorsActive      = 0;
	this.sensors            = new Sensor();
	
	this.pwmsActive = 0;
    this.pwms = new Pwm();
      
    
    this.actuatorPositions  = [0, 0, 0, 0];
    this.encoderPositions   = [0, 0, 0, 0];      

    }

    add_actuator(actuator, rotation, port){
      
        let error = false;
        
            if(port < 1 || port > 4){
                System.err.println("error: encoder port index out of bounds");
                error = true;
            }
        
            if(actuator < 1 || actuator > 4){
                System.err.println("error: encoder index out of bound!");
                error = true;
            }
            
            let j = 0;
            for(let i = 0; i < this.actuatorsActive; i++){
                if(this.motors[i].get_actuator() < actuator){
                    j++;
                }
                
                if(this.motors[i].get_actuator() == actuator){
                    System.err.println("error: actuator " + actuator + " has already been set");
                    error = true;
                }
            }
    
        
            
            if(!error){
                let temp = new Actuator(this.actuatorsActive + 1);
    
                this.arraycopy(this.motors, 0, temp, 0, this.motors.length);
                
                if(j < this.actuatorsActive){
                    this.arraycopy(this.motors, j, temp, j+1, this.motors.length - j);
                }
                
                temp[j] = new Actuator(actuator, rotation, port);
                this.actuator_assignment(actuator, port);
                
                this.motors = temp;
                this.actuatorsActive++;
            }
        }
            add_encoder(encoder, rotation, offset, resolution, port){
                let error = false;
            
                if(port < 1 || port > 4){
                    console.log("error: encoder port index out of bounds");
                    error = true;
                }
                
                if(encoder < 1 || encoder > 4){
                    console.log("error: encoder index out of bound!");
                    error = true;
                }
                
                // determine index for copying
                let j = 0;
                for(let i = 0; i < this.encodersActive; i++){
                    if(this.encoders[i].get_encoder() < encoder){
                        j++;
                    }
                    
                    if(this.encoders[i].get_encoder() == encoder){
                        // System.err.println("error: encoder " + encoder + " has already been set");
                      throw new Error("error: encoder " + encoder + " has already been set")
                        error = true;
                    }
                }
                
                if(!error){
                    let temp = new Sensor(this.encodersActive + 1);
                    
                    this.arraycopy(this.encoders, 0, temp, 0, this.encoders.length);
              
                    if(j < this.encodersActive){
                        this.arraycopy(this.encoders, j, temp, j+1, this.encoders.length - j);
                    }
                    
                    temp[j] = new Sensor(encoder, rotation, offset, resolution, port);
                    this.encoder_assignment(encoder, port);
                    
                    this.encoders = temp;
                    this.encodersActive++;
                }
            }
    
                add_analog_sensor(pin) {
                    // set sensor to be size zero
                    let error = false;
                    
                    let port = pin.charAt(0);
                    let number = pin.substring(1);
                    
                    let value = Integer.parseInt(number);
                    value = value + 54;
                    
                    for(let i = 0; i < sensorsActive; i++){
                        if(value == sensors[i].get_port()){
                            System.err.println("error: Analog pin: A" + (value - 54) + " has already been set");
                            error = true;
                        }
                    }
                    
                    if(port != 'A' || value < 54 || value > 65){
                            System.err.println("error: outside analog pin range");
                            error = true;
                    }
                    
                    if(!error){
                        let temp = Arrays.copyOf(sensors, sensors.length + 1);
                        temp[sensorsActive] = new Sensor();
                        temp[sensorsActive].set_port(value);
                        sensors = temp;
                        sensorsActive++;
                    }
                }
    
    add_pwm_pin(pin){
            
                    let error = false;
                    
                    for(let i = 0; i < pwmsActive; i++){
                        if(pin == pwms[i].get_pin()){
                            console.log("error: pwm pin: " + pin + " has already been set");
                            error = true;
                        }
                    }
                    
                    if(pin < 0 || pin > 13){
                            console.log("error: outside pwn pin range");
                            error = true;
                    }
            
                if(pin == 0 || pin == 1){
                    console.log("warning: 0 and 1 are not pwm pins on Haply M3 or Haply original");
                }
                    
                    
                    if(!error){
                        const temp = Arrays.copyOf(pwms,pwms.length + 1);
                        temp[pwmsActive] = new Pwm();
                        temp[pwmsActive].set_pin(pin);
                        pwms = temp;
                        pwmsActive++;
                    }
                     
                }
    
    set_mechanism (mechanism){
        this.mechanism = mechanism;
    }
    
    device_set_parameters (){
      
        this.communicationType = 1;
        
        let control;
        
        var encoderParameters = new float();
    
        var encoderParams = new Uint8Array();
        var motorParams = new Uint8Array();
        var sensorParams = new Uint8Array();
        var pwmParams = new Uint8Array();
        
        if(this.encodersActive > 0){	
      encoderParams = new Uint8Array(this.encodersActive + 1);
            control = 0;		
    
            for(let i = 0; i < this.encoders.length; i++){
                if(this.encoders[i].get_encoder() != (i+1)){
                    //System.err.println("warning, improper encoder indexing");
                  console.warn("warning, improper encoder indexing")
                    this.encoders[i].set_encoder(i+1);
                    encoderPositions[encoders[i].get_port() - 1] = this.encoders[i].get_encoder();
                }
            }
            
            for(let i = 0; i < this.encoderPositions.length; i++){
                control = control >> 1;
                
                if(this.encoderPositions[i] > 0){
                    control = control | 0x0008;
                }
            }
            
            encoderParams[0] = control;
        
            encoderParameters = new float(2*this.encodersActive);
            
            let j = 0;
            for(let i = 0; i < this.encoderPositions.length; i++){
                if(this.encoderPositions[i] > 0){
                    encoderParameters[2*j] = this.encoders[this.encoderPositions[i]-1].get_offset();
                    encoderParameters[2*j+1] = this.encoders[this.encoderPositions[i]-1].get_resolution();
                    j++;
          encoderParams[j] = this.encoders[this.encoderPositions[i]-1].get_direction(); 
                }
            }
        }
        else{
      encoderParams = new Uint8Array(1);
      encoderParams[0] = 0;
            encoderParameters = new Float32Array(0);
        }
        
        
        if(this.actuatorsActive > 0){
      motorParams = new Uint8Array(this.actuatorsActive + 1);
            control = 0;
            
            for(let i = 0; i < this.motors.length; i++){
                if(this.motors[i].get_actuator() != (i+1)){
                    // System.err.println("warning, improper actuator indexing");
                    motors[i].set_actuator(i+1);
                    actuatorPositions[motors[i].get_port() - 1] = motors[i].get_actuator();
                }
            }
            
            for(let i = 0; i < this.actuatorPositions.length; i++){
                control = control >> 1;
                
                if(this.actuatorPositions[i] > 0){
                    control = control | 0x0008;
                }
            }
            
            motorParams[0] = control;
      
      let j = 1;
      for(let i = 0; i < this.actuatorPositions.length; i++){
        if(this.actuatorPositions[i] > 0){
          motorParams[j] = this.motors[this.actuatorPositions[i]-1].get_direction();
          j++;
        }
      }
        }
    else{
      const motorParams = new Uint8Array(1);
      motorParams[0] = 0;
    }
        
        
        if(this.sensorsActive > 0){
            sensorParams = new Uint8Array(this.sensorsActive + 1);
            sensorParams[0] = sensorsActive;
            
            for(let i = 0; i < sensorsActive; i++){
                sensorParams[i+1] = sensors[i].get_port();
            }
            
            Arrays.sort(sensorParams);
            
            for(let i = 0; i < this.sensorsActive; i++){
                sensors[i].set_port(sensorParams[i+1]);
            }
            
        }
        else{
            sensorParams = new Uint8Array(1);
            sensorParams[0] = 0;
        }
    
    
    if(this.pwmsActive > 0){
      let temp = new Uint8Array(this.pwmsActive);
      
      pwmParams = new Uint8Array(this.pwmsActive + 1);
      pwmParams[0] = this.pwmsActive;
      
      
      for(let i = 0; i < this.pwmsActive; i++){
        temp[i] = pwms[i].get_pin();
      }
      
      Arrays.sort(temp);
      
      for(let i = 0; i < pwmsActive; i++){
        pwms[i].set_pin(temp[i]);
        pwmParams[i+1] = pwms[i].get_pin();
      }
      
    }
    else{
      pwmParams = new Uint8Array(1);
      pwmParams[0] = 0;
    }
            
        
        const encMtrSenPwm = new Uint8Array(motorParams.length  + encoderParams.length + sensorParams.length + pwmParams.length);
        this.arraycopy(motorParams, 0, encMtrSenPwm, 0, motorParams.length);
    this.arraycopy(encoderParams, 0, encMtrSenPwm, motorParams.length, encoderParams.length);
        this.arraycopy(sensorParams, 0, encMtrSenPwm, motorParams.length+encoderParams.length, sensorParams.length);
    this.arraycopy(pwmParams, 0, encMtrSenPwm, motorParams.length+encoderParams.length+sensorParams.length, pwmParams.length);
        
        this.deviceLink.transmit(this.communicationType, this.deviceID, encMtrSenPwm, encoderParameters);	
    }

    actuator_assignment(actuator, port){
		if(this.actuatorPositions[port - 1] > 0){
			System.err.println("warning, double check actuator port usage");
		}
		
		this.actuatorPositions[port - 1] = actuator;
	}


 /**
  * assigns encoder positions based on actuator port
  */	
	encoder_assignment(encoder, port){
		
		if(this.encoderPositions[port - 1] > 0){
			// System.err.println("warning, double check encoder port usage");
          console.warn('warning, double check encoder port usage'); 
		}
		
		this.encoderPositions[port - 1] = encoder;
	}
    
    device_read_data (){
        communicationType = 2;
        let dataCount = 0;
        
        //float[] device_data = new float[sensorUse + encodersActive];
        const device_data = deviceLink.receive(communicationType, deviceID, sensorsActive + encodersActive);
    
        for(let i = 0; i < sensorsActive; i++){
            sensors[i].set_value(device_data[dataCount]);
            dataCount++;
        }
        
        for(let i = 0; i < encoderPositions.length; i++){
            if(encoderPositions[i] > 0){
                encoders[encoderPositions[i]-1].set_value(device_data[dataCount]);
                dataCount++;
            }
        }
    }
    
    device_read_request (){
        communicationType = 2;
        const pulses = new Uint8Array[pwmsActive];
        const encoderRequest = new Float32Array[actuatorsActive];
        
    for(let i = 0; i < pwms.length; i++){
      pulses[i] = pwms[i].get_value();
    }
    
        // think about this more encoder is detached from actuators
        let j = 0;
        for(let i = 0; i < actuatorPositions.length; i++){
            if(actuatorPositions[i] > 0){
                encoderRequest[j] = 0;
                j++;
            }
        }
        
        deviceLink.transmit(communicationType, deviceID, pulses, encoderRequest);
    }
    
    device_write_torques(){
        communicationType = 2;
        const pulses = new Uint8Array[pwmsActive];
        const deviceTorques = new Float32Array[actuatorsActive];
        
    for(let i = 0; i < pwms.length; i++){
      pulses[i] = pwms[i].get_value();
    }
        
        let j = 0;
        for(let i = 0; i < actuatorPositions.length; i++){
            if(actuatorPositions[i] > 0){
                deviceTorques[j] = motors[actuatorPositions[i]-1].get_torque();
                j++;
            }
        }
        
        deviceLink.transmit(communicationType, deviceID, pulses, deviceTorques);
    }
    
    set_pwm_pulse (pin, pulse){
        
        for(let i = 0; i < pwms.length; i++){
          if(pwms[i].get_pin() == pin){
            pwms[i].set_pulse(pulse);
          }
        }
      }	
    
    get_pwm_pulse (pin){
       
        let pulse = 0;
        
        for(let i = 0; i < pwms.length; i++){
          if(pwms[i].get_pin() == pin){
            pulse = pwms[i].get_pulse();
          }
        }
        
        return pulse;
      }
    
    get_device_angles(){
        const angles = new Float32Array[encodersActive];
        
        for(let i = 0; i < encodersActive; i++){
            angles[i] = encoders[i].get_value();
        }
        
        return angles;
    }
    
    get_sensor_data (){
        const data = new Float32Array[sensorsActive];
        
        let j = 0;
        for(let i = 0; i < sensorsActive; i++){
            data[i] = sensors[i].get_value();
        }
    
        return data;
    }
    
    get_device_position (angles){
        this.mechanism.forwardKinematics(angles);
        var endEffectorPosition = this.mechanism.get_coordinate();
        
        return endEffectorPosition;
    }
    
    set_device_torques (forces){
        this.mechanism.torqueCalculation(forces);
        var torques = this.mechanism.get_torque();
        
        for(let i = 0; i < actuatorsActive; i++){
            motors[i].set_torque(torques[i]);
        }
        
        return torques;
    }

    arraycopy(src, srcPos, dst, dstPos, length) {
        while (length--) dst[dstPos++] = src[srcPos++]; return dst;
    }
	
}
class Mechanisms{
  constructor() {
    if (this.constructor === Mechanisms) {
        throw new TypeError('Abstract class "Mechanisms" cannot be instantiated directly.'); 
    }
  }

	forwardKinematics(angles){}
	

	torqueCalculation(forces){}


  /**
   * Performs force calculations
   */
	forceCalculation(){}
	

  /**
   * Performs calculations for position control
   */
	positionControl(){}
	

  /**
   * Performs inverse kinematics calculations
   */
	inverseKinematics(){}
	
	

	set_mechanism_parameters(parameters){}
	

	set_sensor_data(data){}
	
	
 
	get_coordinate(){}

	
	
	get_torque(){}

	get_angle(){}
	

}

class Pantograph extends Mechanisms{
    l;
    L;
    d;
	
    th1;
    th2;
    tau1;
    tau2;
    f_x;
    f_y;
    x_E;
    y_E;
	
	pi = 3.14159265359;
    JT11;
    JT12;
    JT21;
    JT22;
    gain = 1.0;
    
    constructor(){
        super();
        this.l = 0.07;
        this.L = 0.09;
        this.d = 0.0;
    }

    torqueCalculation(force){
      super.torqueCalculation(force);
        f_x = force[0];
		f_y = force[1];

    
        tau1 = JT11*f_x + JT12*f_y;
		tau2 = JT21*f_x + JT22*f_y;
		
		tau1 = tau1*gain;
		tau2 = tau2*gain;
    }

    forwardKinematics(angles){
      super.forwardKinematics(angles);
        let l1 = l;
    let l2 = l;
    let L1 = L;
    let L2 = L;
    
    th1 = pi/180*angles[0];
    th2 = pi/180*angles[1];

    // Forward Kinematics
    let c1 = parseFloat(cos(th1));
    let c2 = parseFloat(cos(th2));
    let s1 = parseFloat(sin(th1));
    let s2 = parseFloat((sin(th2)));
    let xA = l1*c1;
    let yA = l1*s1;
    let xB = d+l2*c2;
     
    let yB = l2*s2;
    let hx = xB-xA; 
    let hy = yB-yA; 
    let hh = parseFloat( Math.pow(hx,2) +  Math.pow(hy,2)); 
    let hm =parseFloat(Math.sqrt(hh)); 
    let cB = - ( parseFloat(Math.pow(L2,2)) - parseFloat(Math.pow(L1,2) - hh) / (2*L1*hm)); 
    
    let h1x = L1*cB * hx/hm; 
    let h1y = L1*cB * hy/hm; 
    let h1h1 = parseFloat(Math.pow(h1x,2)) + parseFloat(Math.pow(h1y,2)); 
    let h1m = parseFloat(Math.sqrt(h1h1)); 
    let sB = parseFloat(  Math.sqrt(1-Math.pow(cB,2)));  
     
    let lx = -L1*sB*h1y/h1m; 
    let ly = L1*sB*h1x/h1m; 
    
    let x_P = xA + h1x + lx; 
    let y_P = yA + h1y + ly; 
     
    let phi1 = parseFloat( acos((x_P-l1*c1)/L1));
    let phi2 = parseFloat( acos((x_P-d-l2*c2)/L2));
     
    let c11 = parseFloat(  cos(phi1)); 
    let s11 =parseFloat(  sin(phi1)); 
    let c22= parseFloat(  cos(phi2)); 
    let s22 = parseFloat(  sin(phi2)); 
  
    let dn = L1 *(c11 * s22 - c22 * s11); 
    let eta = (-L1 * c11 * s22 + L1 * c22 * s11 - c1 * l1 * s22 + c22 * l1 * s1)  / dn;
    let nu = l2 * (c2 * s22 - c22 * s2)/dn;
    
    JT11 = -L1 * eta * s11 - L1 * s11 - l1 * s1;
    JT12 = L1 * c11 * eta + L1 * c11 + c1 * l1;
    JT21 = -L1 * s11 * nu;
    JT22 = L1 * c11 * nu;

    x_E = x_P;
    y_E = y_P;    
    }

  
	set_mechanism_parameters(parameters){
      super.set_mechanism_parameters(parameters);
		this.l = parameters[0];
		this.L = parameters[1];
		this.d = parameters[2];
	}
	
	
	
	get_coordinate(){
      super.get_coordinate();
		let temp = [x_E, y_E];
		return temp;
	}
	
	
	get_torque(){
      super.get_torque();
		let temp = [tau1, tau2];
		return temp;
	}
	
	
	get_angle(){
      super.get_angle();
		let temp = [th1, th2];
		return temp;
	}


}



