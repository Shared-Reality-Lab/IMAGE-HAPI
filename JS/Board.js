function Board(app, portName, baud){



    var reset_board = function(){
		communicationType = 0;
		deviceID = 0;
		bData = new byte[0];
		fData = new float[0];
		
		transmit(communicationType, deviceID, bData, fData);
	}

    var set_buffer = function(length){
		this.port.buffer(length);
	}

    var FloatToBytes = function(val){
  
		segments = new Uint8Array[4];
  
		let temp = Float.floatToRawIntBits(val);
  
		segments[3] = (byte)((temp >> 24) & 0xff);
		segments[2] = (byte)((temp >> 16) & 0xff);
		segments[1] = (byte)((temp >> 8) & 0xff);
		segments[0] = (byte)((temp) & 0xff);

		return segments;
  
	}

    var BytesToFloat = function(segment){
  
		let temp = 0;
  
		temp = (temp | (segment[3] & 0xff)) << 8;
		temp = (temp | (segment[2] & 0xff)) << 8;
		temp = (temp | (segment[1] & 0xff)) << 8;
		temp = (temp | (segment[0] & 0xff)); 
  
		let val = Float.intBitsToFloat(temp);
  
		return val;
	}	
}

Board.prototype.transmit = function(communicationType, deviceID, bData, fData){
    const outData = new Uint8Array[2 + bData.length + 4*fData.length];
    const segments = new Uint8Array[4];
    
    outData[0] = communicationType;
    outData[1] = deviceID;
    
    this.deviceID = deviceID;
    
    System.arraycopy(bData, 0, outData, 2, bData.length);
    
    let j = 2 + bData.length;
    for(let i = 0; i < fData.length; i++){
        segments = FloatToBytes(fData[i]);
        System.arraycopy(segments, 0, outData, j, 4);
        j = j + 4;
    }
    
    this.port.write(outData);
}

Board.prototype.receive = function(communicationType, deviceID, expected){
		
    set_buffer(1 + 4*expected);
    
    const segments = new Uint8Array[4];
    
    const inData = new Uint8Array[1 + 4*expected];
    const data = new Float32Array[expected];
    
    this.port.readBytes(inData);
    
    if(inData[0] != deviceID){
        System.err.println("Error, another device expects this data!");
    }
    
    let  j = 1;
    
    for(let i = 0; i < expected; i++){
        System.arraycopy(inData, j, segments, 0, 4);
        data[i] = BytesToFloat(segments);
        j = j + 4;
    }
    
    return data;
}

Board.prototype.data_available = function(){
    available = false;
    
    if(port.available() > 0){
        available = true;
    }
    
    return available;
}
