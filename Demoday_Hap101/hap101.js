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

/* Screen and world setup parameters */
var pixelsPerMeter = 8000.0;

var radsPerDegree = 0.01745;

/* pantagraph link parameters in meters */
var l = 0.07; // m
var L = 0.09; // m

/* end effector radius in meters */
var rEE = 0.005;
var rEEContact = 0.005;

var jsondata;

/* task space */
var angles                             = new p5.Vector (0,0);
var posEE                              = new p5.Vector(0, 0);
var posEELast                          = new p5.Vector(0, 0);
var fEE                                = new p5.Vector(0, 0); 

/* device graphical position */
var deviceOrigin                       = new p5.Vector(0, 0);

/* World boundaries reference */
const worldPixelWidth                     = 950;
const worldPixelHeight                    = 600;

var screenFactor_x = worldPixelWidth/pixelsPerMeter;
var screenFactor_y = worldPixelHeight/pixelsPerMeter;

var jsonFilename = "json/ex5_preprocess.json";

/* graphical elements */
var pGraph, joint, endEffector;
var img, pg, curso;

//Class definition: extracted JSON data, the same structure;
class DetectedObject{
  constructor(ID, type, area, centroid, dimensions) {
    this.ID = ID;
    this.type = type;
    this.area = area;
    this.centroid = centroid;
    this.dimensions = dimensions;
  }
}

class DetectedSegment{
  constructor(area, centroid, coords, name) {
    this.area = area;
    this.centroid = centroid;
    this.coords = coords;
    this.name = name;
  }
}

var objectdata = [];
var segmentationdata = [];
var workermessage;
//preload
function preload()  {
  img = loadImage('image/ex5.jpg');
}

//loading data from JSON 
function onFileLoad()   {    
    //console.log(jsondata);
    let segments = jsondata.preprocessors['ca.mcgill.a11y.image.preprocessor.semanticSegmentation'].segments;
    let objects = jsondata.preprocessors['ca.mcgill.a11y.image.preprocessor.objectDetection'].objects;
    //console.log(objects);
    //console.log(segments);
    
    for (let i = 0; i < objects.length; i++)  {
        let obj = objects[i];
        let ID = obj.ID;
        let area = obj.area;
        let centroid = obj.centroid;
        let dimensions = obj.dimensions;
        let type = obj.type;
        objectdata.push(new DetectedObject(ID, type, area, centroid, dimensions));
    }
    //console.log(objectdata);
    for (let i = 0; i < segments.length; i++)  {
        let seg = segments[i];
        let area = seg.area;
        let centroid = seg.centroid;
        let coords = seg.coord;
        let name = seg.nameOfSegment;
        segmentationdata.push(new DetectedSegment(area, centroid, coords, name));
    }
    //console.log(segmentationdata);
}

function setup() {
    createCanvas(950, 750);
    pg = createGraphics(950, 600);
    curso = createGraphics(950, 750);
    /* visual elements setup */
    //background(255);
    deviceOrigin.add(worldPixelWidth/2, 0);
    
    jsondata = loadJSON(jsonFilename, onFileLoad);

    // loading image
    //image(img, 0, 0);

    /* create pantagraph graphics */
    create_pantagraph();

}
  
function draw() {
  /* put graphical code here, runs repeatedly at defined framerate in setup, else default at 60fps: */
  //  if(renderingForce == false){
      //background(255);  
      update_animation(img, pg, this.angles.x*radsPerDegree, this.angles.y*radsPerDegree, 
                        this.posEE.x, this.posEE.y);
  //  }
}


async function workerSetup(){
    let port = await navigator.serial.requestPort();
    let combineddata = objectdata.concat(segmentationdata);
    workermessage = new ArrayBuffer(combineddata)
    //workermessage = ArrayBuffer(objectdata);
    //console.log(workermessage);
    worker.postMessage(jsonFilename);
}

if (window.Worker) {
    // console.log("here");
    worker = new Worker("hap101_worker.js");
    document.getElementById("button").addEventListener("click", workerSetup);
    worker.addEventListener("message", function(msg){
        //retrieve data from worker.js needed for update_animation()
        //TODO: find a more elegant way to retrieve the variables
        angles.x = msg.data[0];
        angles.y = msg.data[1];
        posEE.x = msg.data[2];
        posEE.y = msg.data[3];
    });
    
}
else {
    console.log("oops!");
}

/* helper functions section, place helper functions here ***************************************************************/
function create_pantagraph(){
    var rEEAni = pixelsPerMeter * rEE;
    // endEffector = beginShape(ELLIPSE, deviceOrigin.x, deviceOrigin.y, 2*rEEAni, 2*rEEAni);
  endEffector = curso.ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
    
  }
    
function create_wall(x1, y1, x2, y2){
    x1 = pixelsPerMeter * x1 * (screenFactor_x);
    y1 = pixelsPerMeter * y1 * (screenFactor_y);
    x2 = pixelsPerMeter * x2 * (screenFactor_x);
    y2 = pixelsPerMeter * y2 * (screenFactor_y);
    
    // return beginShape(LINE, deviceOrigin.x + x1, deviceOrigin.y + y1, deviceOrigin.x + x2, deviceOrigin.y+y2);
  return pg.line(x1, y1, x2, y2);
  }

function create_circle(x1, y1, rad)   {
  x1 = pixelsPerMeter * x1 * (screenFactor_x);
  y1 = pixelsPerMeter * y1 * (screenFactor_y);
  rad = pixelsPerMeter * rad * (screenFactor_x);
  return pg.ellipse(x1, y1, rad, rad);
}
 
function create_rect(x1, y1, x2, y2)   {
  x1 = pixelsPerMeter * x1 * (screenFactor_x);
  y1 = pixelsPerMeter * y1 * (screenFactor_y);
  x2 = pixelsPerMeter * x2 * (screenFactor_x);
  y2 = pixelsPerMeter * y2 * (screenFactor_y);
  //console.log (x1, y1, x2, y2);
  return pg.rect(x1, y1, (x2-x1), (y2-y1));
}

function update_animation(img, pg, th1, th2, xE, yE){
    
    /* object bounding boxes */
    var rec = [];
    for (let i = 0; i < objectdata.length; i++) {
        let ulx = objectdata[i].dimensions[0];
        let uly = objectdata[i].dimensions[1];
        let lrx = objectdata[i].dimensions[2];
        let lry = objectdata[i].dimensions[3];
        pg.stroke(color(255,0,0));
        pg.fill(255, 0);
        rec[i] = create_rect(ulx,uly,lrx,lry);
        

    }
    //pg.fill(255);
    /* centroids */
    for (let i = 0; i < segmentationdata.length; i++) {
      var circs = [];
      pg.stroke(color(0,0,255));
      pg.fill(255,255);    
      let x = segmentationdata[i].centroid[0];
      let y = segmentationdata[i].centroid[1];
      circs[i] = create_circle(x, y, 0.02);
      //console.log(polygons[i]);    
    }
    /* semantic segmentation contour */
    for (let i = 0; i < segmentationdata.length; i++) {
      var polygons = [];
      pg.stroke(color(0,255-i*50, i*50)); 
      pg.fill(255, 0);   
      //polygons[i] = pg.beginShape(LINES);
      //console.log(segmentationdata[i].coords.length);
      for (let j = 0; j < segmentationdata[i].coords.length; j++)  {
        //let x = segmentationdata[i].coords[j][0] * pixelsPerMeter * screenFactor_x;
        //let y = segmentationdata[i].coords[j][1] * pixelsPerMeter * screenFactor_y;

        //console.log(x,y);
        //polygons[i].vertex(x, y);
      }
      //polygons[i].endShape(CLOSE);
      //console.log(polygons[i]);    
    }

    /* End effector */
    th1 = angles.x * (3.14 / 180);
    th2 = angles.y * (3.14 / 180);
    xE = posEE.x;
    yE = posEE.y;

    xE = pixelsPerMeter * -xE;
    yE = pixelsPerMeter * yE;

    th1 = 3.14 - th1;
    th2 = 3.14 - th2;

    var lAni = pixelsPerMeter * l;
    //var LAni = pixelsPerMeter * L;
    var rEEAni = pixelsPerMeter * rEE;

    //joint = ellipse(deviceOrigin.x, deviceOrigin.y, rEEAni, rEEAni)
    //joint.stroke(color(0));

    //var v0x = deviceOrigin.x;
    //var v0y = deviceOrigin.y;
    //var v1x = deviceOrigin.x + lAni*cos(th1);
    //var v1y = deviceOrigin.y + lAni*sin(th1);
    //var v2x = deviceOrigin.x + xE;
    //var v2y = deviceOrigin.y + yE;
    //var v3x = deviceOrigin.x + lAni*cos(th2);
    //var v3y = deviceOrigin.y + lAni*sin(th2);

   // background(255);
    // p5.js doesn't seem to have setVertex, so the coordinates are set in order rather than using an index 
    //this.pGraph = beginShape();
     //this.pGraph.vertex(v0x, v0y);
     //this.pGraph.vertex(v1x, v1y);
     //this.pGraph.vertex(v2x, v2y);
     //this.pGraph.vertex(v3x, v3y);
    
    //this.pGraph.endShape(CLOSE);
    
    curso.clear();
    curso.stroke(color(0));
    //curso.translate(xE, yE);
    curso.background(255, 0);
    curso.fill(255, 255);
    //console.log(xE, yE);
    endEffector = curso.ellipse(deviceOrigin.x+xE, deviceOrigin.y+yE, rEEAni, rEEAni);
    
    endEffector.beginShape();
    endEffector.endShape();
    //pg.fill(255);

    image(img, 0, 150, 950, 600);
    image(pg, 0, 150, 950, 600);
    image(curso, 0, 0);
  }
  
  
function device_to_graphics(deviceFrame){
    return deviceFrame.set(-deviceFrame.x, deviceFrame.y);
  }
  
  
function graphics_to_device(graphicsFrame){
    return graphicsFrame.set(-graphicsFrame.x, graphicsFrame.y);
  }
  /* end helper function ****************************************************************************************/