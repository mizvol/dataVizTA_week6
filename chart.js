const imageDiv = document.getElementById("image");

const imageSize = {
  width: 900,
  height: 400
}

const histSize = {
  width: 900,
  height: 200
}

//create a Canvas container and add it into a div
//this part is required to store an image as pixels
const canvas = d3.select("#image")
  .append("canvas")
  .attr("width", imageSize.width)
  .attr("height", imageSize.height);

//create an SVG element and add it into a div
//this part is needed to work with d3 tools like 'brush'
const imageSVG = d3.select("#image")
  .append("svg")
  .attr("width", imageSize.width)
  .attr("height", imageSize.height);

//setup a context for canvas. The context is an object.
//It contais all the properties required to draw on the canvas.
const context = canvas.node().getContext("2d");
const width = canvas.width;
const height = canvas.height;

//scales
const x = d3.scaleLinear()
  .domain([0, 256])
  .rangeRound([0, histSize.width]);

const y = d3.scaleLinear()
  .rangeRound([histSize.height * 2, 0]);

//placeholders for R, G, and B values.
//we'll fill them in when we get pixels data from canvas
let r = new Array(257);
let g = new Array(257);
let b = new Array(257);

//area and line for the histogram
const area = d3.area()
    .curve(d3.curveBasis)
    .x(function(d, i) { return x(i); })
    .y0(y(0))
    .y1(y);

const line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d, i) { return x(i); })
    .y(y);


//brush for image segment selection
const brush = d3.brush()
    .on("start brush", onBrush)
    .on("end", brushend);

//create histogram. Assign CSS classes to line and area of the histogram
const histogram = imageSVG.append("g")
    .attr("class", "histogram");

const histoarea = histogram.selectAll(".histogram-area")
    .data([r, g, b])
  .enter().append("path")
    .attr("class", function(d, i) { return "histogram-area histogram-" + "rgb"[i]; });

const histoline = histogram.selectAll(".histogram-line")
    .data([r, g, b])
  .enter().append("path")
    .attr("class", function(d, i) { return "histogram-line histogram-" + "rgb"[i]; });

//load image
const image = new Image;
image.src = "epfl-rolex.jpg";
image.onload = onLoad;


//add image and brush to the SVG
function onLoad() {
  context.drawImage(this, 0, 0);

  imageSVG.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, [[0, 0], [100, 100]]);
}

// brush handler
function onBrush() {
  let s = d3.event.selection,
      x0 = s[0][0],
      y0 = s[0][1],
      dx = s[1][0] - x0,
      dy = s[1][1] - y0,
      max = 0;

//initialize R, G, and B values with 0s
  for (let i = 0; i < 257; ++i) {
    r[i] = g[i] = b[i] = 0;
  }

//get pixel data from a brush selection and fill in R, G, and B arrays with corresponding values
// if there is a selection
  if (dx && dy) {
    let data = context.getImageData(x0, y0, dx, dy).data;
    for (let i = 0; i < dx; ++i) {
      for (let j = 0; j < dy; ++j) {
        let k = j * dx + i << 2;
        max = Math.max(max, ++r[data[k]], ++g[data[k + 1]], ++b[data[k + 2]]);
      }
    }

//draw histogram if there is a selection
    y.domain([0, max]);
    histoarea.attr("d", area);
    histoline.attr("d", line);
  } else {
    histoarea.attr("d", null);
    histoline.attr("d", null);
  }
}

//empty brush if there is no selection
function brushend() {
  if (!d3.event.selection) {
    histoarea.attr("d", null);
    histoline.attr("d", null);
  }
}