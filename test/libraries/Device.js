class Device{

    deviceLink;

	deviceID;
	mechanism;
	
	communicationType;
	
	actuatorsActive    = 0;
	motors             = new Actuator();
	
	encodersActive     = 0;
	encoders           = new Sensor();
	
	sensorsActive      = 0;
	sensors            = new Sensor();
	
	pwmsActive = 0;
    pwms = new Pwm();
    
    actuatorPositions  = [0, 0, 0, 0];
    encoderPositions   = [0, 0, 0, 0];
    
    constructor(deviceID, deviceLink){
        this.deviceID = deviceID;
		this.deviceLink = deviceLink;

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
                    System.err.println("error: encoder port index out of bounds");
                    error = true;
                }
                
                if(encoder < 1 || encoder > 4){
                    System.err.println("error: encoder index out of bound!");
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
                            System.err.println("error: pwm pin: " + pin + " has already been set");
                            error = true;
                        }
                    }
                    
                    if(pin < 0 || pin > 13){
                            System.err.println("error: outside pwn pin range");
                            error = true;
                    }
            
                if(pin == 0 || pin == 1){
                    System.out.println("warning: 0 and 1 are not pwm pins on Haply M3 or Haply original");
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
    
        var encoderParams = new Uint8Array;
        var motorParams = new Uint8Array;
        var sensorParams = new Uint8Array;
        var pwmParams = new Uint8Array;
        
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
        
            encoderParameters = new Float32Array(2*this.encodersActive);
            
            let j = 0;
            for(let i = 0; i < this.encoderPositions.length; i++){
                if(this.encoderPositions[i] > 0){
          //           encoderParameters[2*j] = this.encoders[this.encoderPositions[i]-1].get_offset(); 
          //           encoderParameters[2*j+1] = this.encoders[this.encoderPositions[i]-1].get_resolution();
          //           j++;
          // encoderParams[j] = this.encoders[this.encoderPositions[i]-1].get_direction(); 
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
        // if(this.actuatorPositions[i] > 0){
        //   motorParams[j] = this.motors[this.actuatorPositions[i]-1].get_direction();
        //   j++;
        // }
      }
        }
    else{
      const motorParams = new Uint8Array[1];
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