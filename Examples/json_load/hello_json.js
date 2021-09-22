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

    /* Loading boxes from json*/
data = loadJSON('test.json');
let object = data['object'];
let boxcoordinates = object['dimensions'];
let centroids = data['centroid'];
// object list to find coordinates
let boxcoordinate = boxcoordinates['items'];
let centroid = centroids['items'];
let box_ulx = boxcoordinates[0];
let box_uly = boxcoordinates[1];
let box_brx = boxcoordinates[2];
let box_bry = boxcoordinates[3];

/* converting the box and centroid*/
/* -0.1 to 0.1 x, 0 to 0.1 y*/
let screen_ulx = (box_ulx * 0.2) - 0.1;
let screen_uly = (box_uly * 0.2) - 0.1;
let screen_brx = (box_brx * 0.1);
let screen_bry = (box_brx * 0.1);

