var haplyBoard;
var widgetOne;
var pantograph;
var worker;

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

var posEEToBox;
var posEEToCentroid;

var jsondata;

function preload() {
    data = loadJSON('assets/bubbles.json');

  }