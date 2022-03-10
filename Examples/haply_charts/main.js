// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');
import data from "./highcharts-line-preprocessed.json" assert { type: "json" };

const chartData = data["highChartsData"]["data"]["series"][0]["data"][0]
let x_coords = [];
let y_coords = [];

for (let i = 0; i < chartData.length; i++) {
  x_coords.push(chartData[i]["x"] / 10000000000)
  if (chartData[i]["y"]) {
    y_coords.push(chartData[i]["y"] / 10000)
  } else {
    y_coords.push(0)
  }
}

x_coords = movingAvg(x_coords, 5);
y_coords = movingAvg(y_coords, 5);

// console.log(chartData)

let btn = document.createElement("button");
btn.id = "btn";
btn.innerHTML = "Play Haptic Rendering";
document.body.appendChild(btn);

let btn_com = document.createElement("button");
btn_com.id = "com";
btn_com.innerHTML = "Press Me!";
document.body.appendChild(btn_com);

btn_com.style.display = "none";

document.getElementById("btn").addEventListener("click", function () {
  createCanvas();
  console.log("printed canvas");
});

// var chartJSON = JSON.parse(highcharts-line-preprocessed);
// const chartJSON = JSON.parse('highcharts-line.json');
var raf;
var worker;
const worldPixelWidth = 1000;


var posEE = {
  x: 0,
  y: 0
};

var deviceOrigin = {
  x: worldPixelWidth / 2,
  y: 0
};

var x_trans = 100;


function createCanvas() {
  document.body.removeChild(btn);
  btn_com.style.display = "block";

  var canvas = document.createElement('canvas');

  canvas.id = "main";
  canvas.width = 800;
  canvas.height = 500;
  canvas.style.zIndex = 8;
  canvas.style.position = "absolute";
  canvas.style.border = "1px solid";
  canvas.style.left = "100px";
  canvas.style.top = "100px";


  var body = document.getElementsByTagName("body")[0];
  body.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  /* Screen and world setup parameters */
  var pixelsPerMeter = 4000.0;



  var border = {
    draw: function () {
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
  };

  var endEffector = {
    x: canvas.width / 2,
    y: 0,
    radius: 15,
    color: 'black',
    draw: function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
    }

  };

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateAnimation();
    checkBounds();

    raf = window.requestAnimationFrame(draw);
  }

  canvas.addEventListener('mouseover', function (e) {
    raf = window.requestAnimationFrame(draw);
  });


  // canvas.addEventListener('mouseout', function(e) {
  //   window.cancelAnimationFrame(raf);
  // });

  function checkBounds() {

    if (endEffector.y + endEffector.vy > canvas.height ||
      endEffector.y + endEffector.vy < 0) {
      endEffector.vy = -endEffector.vy;
    }
    if (endEffector.x + endEffector.vx > canvas.width ||
      endEffector.x + endEffector.vx < 0) {
      endEffector.vx = -endEffector.vx;
    }

  }

  function updateAnimation() {
    border.draw();
    let xE = posEE.x;
    let yE = posEE.y;
    console.log("x: ", xE, "y: ", yE)

    xE = pixelsPerMeter * -xE;
    yE = pixelsPerMeter * yE;



    //update endEffector
    endEffector.x = deviceOrigin.x + xE - x_trans;
    endEffector.y = deviceOrigin.y + yE;
    endEffector.draw();
  }



  border.draw();
  endEffector.draw();

}

function movingAvg(array, count) {

  // calculate average for subarray
  var avg = function (array) {

    var sum = 0, count = 0, val;
    for (var i in array) {
      val = array[i];
      sum += val;
      count++;
    }

    return sum / count;
  };

  var result = [], val;

  // pad beginning of result with null values
  for (var i = 0; i < count - 1; i++)
    result.push(null);

  // calculate average for each subarray and add to result
  for (var i = 0, len = array.length - count; i <= len; i++) {

    val = avg(array.slice(i, i + count));
    if (isNaN(val))
      result.push(null);
    else
      result.push(val);
  }

  return result;
}

/******worker code******** */
async function workerSetup() {
  const filters = [
    { usbVendorId: 0x2341, usbProductId: 0x804D }
  ];

  let hapticPort = await navigator.serial.requestPort({ filters });
  worker.postMessage("test");
}

if (window.Worker) {
  worker = new Worker("worker.js");
  document.getElementById("com").addEventListener("click", workerSetup);
  worker.addEventListener("message", function (msg) {
    posEE.x = msg.data.x;
    posEE.y = msg.data.y;
  });

}
else {
  console.log("Workers not supported.");
}
