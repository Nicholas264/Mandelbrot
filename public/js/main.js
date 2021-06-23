// The amount that is added or subtracted to the multiplier on every scroll event
const ZOOM_SPEED = 0.05;
// The amount of milliseconds the script should wait before acting on a user scroll or resize event
const RESIZE_DELAY = 1000;

const canvas = document.getElementById("plane");
const progress = document.getElementById("progress");
const ctx = canvas.getContext("2d");

// Sets the initial canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// The last received image from the worker script. Used for preliminary zooms
var canvasCache;
// Tracks whether the worker is rendering a fractal or not
var rendering = true;

// The number that is multiplied by the current zoom level to zoom in or out.
var multiplier = 1;
var tempZoomCoords = [0, 0];

// Loads a web worker that renders a Mandelbrot fractal in a separate thread
const fractal = new Worker("js/mandelbrot.js");
fractal.onmessage = (m) => {
	m = m.data;
	switch (m.name) {
		case "canvasData":
			canvasCache = m.data;
			ctx.drawImage(m.data, 0, 0);
		break;
		case "log":
			console.log(m);
		break;
		case "progress":
			rendering = true;
			progress.parentElement.style.display = "initial";
			progress.textContent = Math.round(m.data * 1000) / 10;
		break;
		case "done":
			progress.parentElement.style.display = "none";
			rendering = false;
		break;
		default:
			return;
	}
}
Worker.prototype.post = function (n, d) {
	this.postMessage({
		name: n,
		data: d ? d : ""
	});
}
/**
 * When the user resizes the window, wait RESIZE_DELAY milliseconds and instruct the worker
 * to generate a new image of the fractal that fits the newly resized canvas. Since this event
 * can be fired multiple times in quick succession, a delay is added to prevent the worker from
 * being excessively queued for rendering.
 */
let resizeTimeout;
window.onresize = (e) => {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		fractal.post("resize", {w: window.innerWidth, h: window.innerHeight});
	}, RESIZE_DELAY);
}

/**
 * Allows the user to zoom the fractal by scrolling up and down. Scrolling up zooms in
 * and scrolling down zooms out. In between zoom events, temporary images reflecting the
 * future state of the canvas will be drawn. Since this event can be fired multiple times in quick 
 * succession, a delay is added to prevent the worker from being excessively queued for rendering.
 */
let zoomTimeout = -1;
document.addEventListener("wheel", e => {
	if (rendering) return;
	if (zoomTimeout === -1) {
		tempZoomCoords = [e.x, e.y];
	} else {
		clearTimeout(zoomTimeout);
	}
	drawPreliminaryZoom(tempZoomCoords[0], tempZoomCoords[1], multiplier);
	if (e.deltaY > 0) {
		multiplier *= 1 + ZOOM_SPEED;
	} else {
		multiplier *= 1 - ZOOM_SPEED;
	}
	zoomTimeout = setTimeout(function (x, y) {
		fractal.post("zoom", {
			x: x,
			y: y,
			m: multiplier
		});
		multiplier = 1;
		zoomTimeout = -1;
	}, RESIZE_DELAY, tempZoomCoords[0], tempZoomCoords[1]);
});

// Instructs the worker to zoom in on the point the user clicks
document.addEventListener("click", e => {
	if (rendering) return;
	drawPreliminaryZoom(e.x, e.y, multiplier * 0.5);
	fractal.post("zoom", {
		x: e.x,
		y: e.y,
		m: multiplier
	});
});

// Instructs the worker to zoom out on the point the user clicks
document.addEventListener("contextmenu", e => {
	e.preventDefault();
	drawPreliminaryZoom(e.x, e.y, multiplier * 2);
	fractal.post("zoom", {
		x: e.x,
		y: e.y,
		m: multiplier
	});
});

/**
 * Uses the previous state of the canvas to show a rough preview of the zoomed fractal while
 * the worker script generates a new full-quality image of the fractal.
 * @param x the x coordinate you are zooming in to
 * @param y the y coordinate you are zooming in to
 * @param zoomLevel the multiplier at which you are zooming into the fractal
 */
function drawPreliminaryZoom(x, y, zoomLevel) {
	if (canvasCache) {
		multiplier = zoomLevel;
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(
			canvasCache,
			-(x / zoomLevel - 0.5 * canvas.width),
			-(y / zoomLevel - 0.5 * canvas.height),
			canvasCache.width / zoomLevel,
			canvasCache.height / zoomLevel
		);
		ctx.restore();
	}
}

// Initializes the canvas and instructs the worker to draw the fractal
(function init() {
	fractal.post("create", {w: window.innerWidth, h: window.innerHeight});
	fractal.post("getCanvas");
})();

//this.ctx.drawImage(canvas, 0, -y + (this.win.h * percent / 2), this.win.w * percent, this.win.h * percent);
//https://www.math.univ-toulouse.fr/~cheritat/wiki-draw/index.php/Mandelbrot_set
//http://davidbau.com/mandelbrot/