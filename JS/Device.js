class Device{

    deviceLink;

	deviceID;
	mechanism;
	
	communicationType;
	
	actuatorsActive    = 0;
	motors             = new Actuator[0];
	
	encodersActive     = 0;
	encoders           = new Sensor[0];
	
	sensorsActive      = 0;
	sensors            = new Sensor[0];
	
	pwmsActive		     = 0;
    pwms 			         = new Pwm[0];
    
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
            for(let i = 0; i < actuatorsActive; i++){
                if(motors[i].get_actuator() < actuator){
                    j++;
                }
                
                if(motors[i].get_actuator() == actuator){
                    System.err.println("error: actuator " + actuator + " has already been set");
                    error = true;
                }
            }
    
        
            
            if(!error){
                let temp = new Actuator[actuatorsActive + 1];
    
                arraycopy(motors, 0, temp, 0, motors.length);
                
                if(j < actuatorsActive){
                    arraycopy(motors, j, temp, j+1, motors.length - j);
                }
                
                temp[j] = new Actuator(actuator, rotation, port);
                actuator_assignment(actuator, port);
                
                motors = temp;
                actuatorsActive++;
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
                for(let i = 0; i < encodersActive; i++){
                    if(encoders[i].get_encoder() < encoder){
                        j++;
                    }
                    
                    if(encoders[i].get_encoder() == encoder){
                        System.err.println("error: encoder " + encoder + " has already been set");
                        error = true;
                    }
                }
                
                if(!error){
                    let temp = new Sensor[encodersActive + 1];
                    
                    System.arraycopy(encoders, 0, temp, 0, encoders.length);
              
                    if(j < encodersActive){
                        System.arraycopy(encoders, j, temp, j+1, encoders.length - j);
                    }
                    
                    temp[j] = new Sensor(encoder, rotation, offset, resolution, port);
                    encoder_assignment(encoder, port);
                    
                    encoders = temp;
                    encodersActive++;
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
            
        communicationType = 1;
        
        let control;
        
        const encoderParameters = new float();
    
        const encoderParams = new Uint8Array;
        const motorParams = new Uint8Array;
        const sensorParams = new Uint8Array;
        const pwmParams = new Uint8Array;
        
        if(encodersActive > 0){	
      encoderParams = new Uint8Array[encodersActive + 1];
            control = 0;		
    
            for(let i = 0; i < encoders.length; i++){
                if(encoders[i].get_encoder() != (i+1)){
                    System.err.println("warning, improper encoder indexing");
                    encoders[i].set_encoder(i+1);
                    encoderPositions[encoders[i].get_port() - 1] = encoders[i].get_encoder();
                }
            }
            
            for(let i = 0; i < encoderPositions.length; i++){
                control = control >> 1;
                
                if(encoderPositions[i] > 0){
                    control = control | 0x0008;
                }
            }
            
            encoderParams[0] = control;
        
            encoderParameters = new float[2*encodersActive];
            
            let j = 0;
            for(let i = 0; i < encoderPositions.length; i++){
                if(encoderPositions[i] > 0){
                    encoderParameters[2*j] = encoders[encoderPositions[i]-1].get_offset(); 
                    encoderParameters[2*j+1] = encoders[encoderPositions[i]-1].get_resolution();
                    j++;
          encoderParams[j] = encoders[encoderPositions[i]-1].get_direction(); 
                }
            }
        }
        else{
      encoderParams = new byte[1];
      encoderParams[0] = 0;
            encoderParameters = new float[0];
        }
        
        
        if(actuatorsActive > 0){
      motorParams = new byte[actuatorsActive + 1];
            control = 0;
            
            for(let i = 0; i < motors.length; i++){
                if(motors[i].get_actuator() != (i+1)){
                    System.err.println("warning, improper actuator indexing");
                    motors[i].set_actuator(i+1);
                    actuatorPositions[motors[i].get_port() - 1] = motors[i].get_actuator();
                }
            }
            
            for(let i = 0; i < actuatorPositions.length; i++){
                control = control >> 1;
                
                if(actuatorPositions[i] > 0){
                    control = control | 0x0008;
                }
            }
            
            motorParams[0] = control;
      
      let j = 1;
      for(let i = 0; i < actuatorPositions.length; i++){
        if(actuatorPositions[i] > 0){
          motorParams[j] = motors[actuatorPositions[i]-1].get_direction();
          j++;
        }
      }
        }
    else{
      const motorParams = new Uint8Array[1];
      motorParams[0] = 0;
    }
        
        
        if(sensorsActive > 0){
            sensorParams = new Uint8Array[sensorsActive + 1];
            sensorParams[0] = sensorsActive;
            
            for(let i = 0; i < sensorsActive; i++){
                sensorParams[i+1] = sensors[i].get_port();
            }
            
            Arrays.sort(sensorParams);
            
            for(let i = 0; i < sensorsActive; i++){
                sensors[i].set_port(sensorParams[i+1]);
            }
            
        }
        else{
            sensorParams = new byte[1];
            sensorParams[0] = 0;
        }
    
    
    if(pwmsActive > 0){
      let temp = new Uint8Array[pwmsActive];
      
      pwmParams = new byte[pwmsActive + 1];
      pwmParams[0] = pwmsActive;
      
      
      for(let i = 0; i < pwmsActive; i++){
        temp[i] = pwms[i].get_pin();
      }
      
      Arrays.sort(temp);
      
      for(let i = 0; i < pwmsActive; i++){
        pwms[i].set_pin(temp[i]);
        pwmParams[i+1] = pwms[i].get_pin();
      }
      
    }
    else{
      pwmParams = new byte[1];
      pwmParams[0] = 0;
    }
            
        
        const encMtrSenPwm = new Uint8Array[motorParams.length  + encoderParams.length + sensorParams.length + pwmParams.length];
        System.arraycopy(motorParams, 0, encMtrSenPwm, 0, motorParams.length);
    System.arraycopy(encoderParams, 0, encMtrSenPwm, motorParams.length, encoderParams.length);
        System.arraycopy(sensorParams, 0, encMtrSenPwm, motorParams.length+encoderParams.length, sensorParams.length);
    System.arraycopy(pwmParams, 0, encMtrSenPwm, motorParams.length+encoderParams.length+sensorParams.length, pwmParams.length);
        
        deviceLink.transmit(communicationType, deviceID, encMtrSenPwm, encoderParameters);	
    }

    #actuator_assignment(actuator, port){
		if(actuatorPositions[port - 1] > 0){
			System.err.println("warning, double check actuator port usage");
		}
		
		this.actuatorPositions[port - 1] = actuator;
	}


 /**
  * assigns encoder positions based on actuator port
  */	
	#encoder_assignment(encoder, port){
		
		if(encoderPositions[port - 1] > 0){
			System.err.println("warning, double check encoder port usage");
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