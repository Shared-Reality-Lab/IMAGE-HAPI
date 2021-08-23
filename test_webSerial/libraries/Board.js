class Board {
    //communicationType;  //type of communication taking place
    // deviceID; //ID of device transmitting the information
    //bData; //byte inforamation to be transmitted
    //fData; //float information to be transmitted
    //type; // type of communication taking place
    //expected; //number for floating point numbers that are expected
	port;
	reader;
	writer;
	encoder = new TextEncoder();
	decoder = new TextDecoder();

    constructor(){ //portName, baud
		// let port = await navigator.serial.requestPort();
        // this.port = new p5.SerialPort();  
        // let options = { baudrate: baud};
        // this.port.open(portName, options);              // open a serial port
		// this.port.on('connected', this.serverConnected);
		//this.init();
        // this.port.clear();
		// this.reset_board();
		console.log("created board")
	}
	
	async init(){
		if ('serial' in navigator) {
			try {
			  this.port = (await navigator.serial.getPorts())[0];
			  console.log(this.port);
			  console.log(navigator.serial);
			  await this.port.open({ baudRate: 57600 }); // `baudRate` was `baudrate` in previous versions.
	  
			  this.writer = this.port.writable.getWriter();
			  console.log(this.writer);
			  this.reader = this.port.readable.getReader();
	  
			  const signals = await this.port.getSignals();
			  console.log(signals);
			  this.reset_board();
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

    async transmit(communicationType, deviceID, bData, fData){
		// console.log("this is in transmit: ");
        let outData = new Uint8Array(2 + bData.length + 4 * fData.length);
		let segments = new Uint8Array(4);

		//console.log(fData.length);
		//console.log(segments.)
		
		outData[0] = communicationType;
		outData[1] = deviceID;
		
		// this.deviceID = deviceID;
		
		this.arraycopy(bData, 0, outData, 2, bData.length);
		
		//  let j = 2 + bData.length;
		segments = this.FloatToBytes(fData);
		this.arraycopy(segments, 0, outData,2 + bData.length , fData.length);
		// for(let i = 0; i < fData.length; i++){
		// 	segments = this.FloatToBytes(fData[i]);
		// 	this.arraycopy(segments, 0, outData, j, 4);
		// 	j = j + 4;
		// }
		
		// this.port.write(outData);
		console.log('this is in trasmit:');
		console.log(outData);
		// const dataArrayBuffer = this.encoder.encode(outData);
		// return await this.writer.write(dataArrayBuffer);
		// console.log(dataArrayBuffer);
		// return await this.writer.write(dataArrayBuffer);
		return await this.writer.write(outData)
    }

    async receive(communicationType, deviceID, expected){
  
		try {
			const readerData = await this.reader.read();
			// print(this.decoder.decode(readerData.value));
			console.log("reading");
			return this.decoder.decode(readerData.value);
		  } catch (err) {
			const errorMessage = `error reading data: ${err}`;
			console.error(errorMessage);
			return errorMessage;
		  }
		
    }

    data_available(){
        let available = false;
        
        if(this.port.readable){
            available = true;
        }
        
        return available;
    }

    reset_board() {
		let communicationType = 0;
		let deviceID = 0;
		let bData = new Uint8Array();
		let fData = new Float32Array();
		
		this.transmit(communicationType, deviceID, bData, fData);
	}

    set_buffer(length){
		this.port.buffer(length);
	}

    FloatToBytes(val){

		//let v = this.FloatToIEEE(val)
		// let segments = new Uint8Array(4);
		// let temp = this.floatToRawIntBits(val);
  
		// segments[3] = (uint8)((temp >> 24) & 0xff);
		// segments[2] = (uint8)((temp >> 16) & 0xff);
		// segments[1] = (uint8)((temp >> 8) & 0xff);
		// segments[0] = (uint8)((temp) & 0xff);
		let buffer = new ArrayBuffer(val.byteLength);
		let floatView = new Float32Array(buffer).set(val);
		var segments = new Uint8Array(buffer);

		return segments;
  
	}

    BytesToFloat(segment){
  
		let temp = 0;
  
		temp = (temp | (segment[3] & 0xff)) << 8;
		temp = (temp | (segment[2] & 0xff)) << 8;
		temp = (temp | (segment[1] & 0xff)) << 8;
		temp = (temp | (segment[0] & 0xff)); 
  
		let val = this.intBitsToFloat(temp);
  
		return val;
	}
	
	//replaces FloatToBytes
	floatToRawIntBits(f)
	{
		var buf = new ArrayBuffer(4);
		(new Float32Array(buf))[0] = f;
		return (new Uint32Array(buf))[0];
	}

	//JS version of intBitsToFloat
	intBitsToFloat(f) {
		var int8 = new Int8Array(4);
		var int32 = new Int32Array(int8.buffer, 0, 1);
		int32[0] = f;
		var float32 = new Float32Array(int8.buffer, 0, 1);
		return float32[0];
	  }	
  
    arraycopy(src, srcPos, dst, dstPos, length) {
    while (length--) dst[dstPos++] = src[srcPos++]; return dst;
}
  serverConnected() {
  print("Connected to Server");
}
    
}