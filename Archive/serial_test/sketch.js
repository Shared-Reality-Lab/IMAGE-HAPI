
var serial;          // variable to hold an instance of the serialport library
var portName = 'COM1';  // fill in your serial port name here

var inData;

function setup() {
  createCanvas(400, 300);
  
  serial = new p5.SerialPort();       // make a new instance of the serialport library
  serial.on('connected', serverConnected); // callback for connecting to the server
  serial.on('open', portOpen);        // callback for the port opening
  serial.on('data', serialEvent);     // callback for when new data arrives
  serial.on('error', serialError);    // callback for errors
  serial.on('close', portClose);      // callback for the port closing

  serial.open(portName);              // open a serial port
}

function draw(){
  background('darkcyan');
	print(inData);
  noStroke();
  ellipse(width/2, height/2, inData, inData);
}

function serverConnected() {
  print('connected to server.');
}

function portOpen() {
  print('the serial port opened.')
}

function serialEvent() {
  inData = Number(serial.read());
}

function serialError(err) {
  print('Something went wrong with the serial port. ' + err);
}

function portClose() {
  print('The serial port closed.');
}


// let serial; // variable to hold an instance of the serialport library
// // let portName = 'COM6'; // fill in your serial port name here
// let inData; // for incoming serial data

// function setup() {
//   createCanvas(400, 300);
//   serial = new p5.SerialPort(); // make a new instance of the serialport library
//   serial.on('data', serialEvent); // callback for when new data arrives
//   serial.on('error', serialError); // callback for errors

//   serial.open('COM1'); // open a serial port
//   serial.clear();
// }

// function draw() {
//   // black background, white text:
//   background(0);
//   fill(255);
//   // display the incoming serial data as a string:
//   text("incoming value: " + inData, 30, 30);
// }

// function keyTyped() {
//     let outByte = key;
//     console.log("Sending " + outByte);
//     //serial.write(Number(outByte)); // Send as byte value
//     serial.write(outByte); // Send as a string/char/ascii value
// }

// function serialEvent() {
//   // read a byte from the serial port:
//   let inByte = serial.read();
//   print("inByte: " + inByte);
//   inData = inByte;
// }

// function serialError(err) {
//   print('Something went wrong with the serial port. ' + err);
// }