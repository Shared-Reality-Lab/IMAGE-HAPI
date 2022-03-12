import data from "./covid-chart.json" assert { type: "json" };

Array.prototype.hasMin = function (attrib) {
  return (this.length && this.reduce(function (prev, curr) {
    return prev[attrib] < curr[attrib] ? prev : curr;
  })) || null;
}

Array.prototype.hasMax = function (attrib) {
  return (this.length && this.reduce(function (prev, curr) {
    return prev[attrib] > curr[attrib] ? prev : curr;
  })) || null;
}

let raw_x = []
let raw_y = []

const chartData = data;//["highChartsData"]["data"]["series"][0]["data"][0]

let coords = [];
let filt_coords = []

for (let i = 0; i < chartData.length - 1; i += 1) {
  //   rawX.push(chartData[i].x);
  //   rawY.push(chartData[i].y);
  // }
  // //   let ycoord = 0;

  // //   if (chartData[i]["y"]) {
  // //     ycoord = chartData[i]["y"] / 10000;
  // //   } else {
  // //     ycoord = 0;
  // //   }
  // //   raw_x.push(xcoord)
  // //   raw_y.push(ycoord);
  // //   const pos = { x: xcoord, y: ycoord }
  // //   coords.push(pos);
  // // }
  // // // console.table(raw_y);
  // let yFilt = movingAvg(raw_y, 5)
  // for (let i = 0; i < chartData.length; i++) {

  //   const pos = { x: chartData[i].x, y: yFilt[i] };
  //   filt_coords.push(pos)
  // }

  filt_coords.push({ x: chartData[i].x, y: chartData[i].y })
}

console.table(filt_coords)
// get extremes for calibration
const minX = filt_coords.hasMin('x').x;
const maxX = filt_coords.hasMax('x').x;
const minY = filt_coords.hasMin('y').y;
const maxY = filt_coords.hasMax('y').y;
console.log(minX, maxX, minY, maxY);

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
  canvas.width = 700;
  canvas.height = 500;
  canvas.style.zIndex = 8;
  canvas.style.position = "absolute";
  canvas.style.border = "1px solid";
  canvas.style.left = "100px";
  canvas.style.top = "100px";

  var image = new Image();
  image.src = "./covid.jpg";


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
    radius: 9,
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
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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
    //console.log("x: ", xE, "y: ", yE)

    xE = pixelsPerMeter * -xE;
    yE = pixelsPerMeter * yE;



    //update endEffector
    endEffector.x = deviceOrigin.x + xE - 125;
    endEffector.y = deviceOrigin.y + yE - 70;
    endEffector.draw();
  }



  border.draw();
  endEffector.draw();

}


/******worker code******** */
async function workerSetup() {
  const filters = [
    { usbVendorId: 0x2341, usbProductId: 0x804D }
  ];

  let hapticPort = await navigator.serial.requestPort({ filters });
  worker.postMessage({
    coords: filt_coords
  });
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


function movingAvg(array, count) {

  // calculate average for subarray
  var avg = function (array) {

    var sum = 0, count = 0, val;
    for (var i in array) {

      val = array[i];
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
      else {
        sum += 0;
        count++
      }

    }
    // console.log(sum)
    return sum / count;
  };

  var result = [], val;

  // pad beginning of result with null values
  for (var i = 0; i < count - 1; i++)
    result.push(0);

  // calculate average for each subarray and add to result
  for (var i = 0, len = array.length - count; i <= len; i++) {

    val = avg(array.slice(i, i + count));
    // console.log(val)
    if (isNaN(val))
      result.push(null);
    else
      result.push(val);
  }

  return result;
}

