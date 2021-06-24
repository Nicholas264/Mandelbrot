// Web worker that renders the Mandelbrot fractal in a different thread from the main one
var fractal;

// Handler for messages from the main script
this.onmessage = async m => {
	m = m.data;
	let data = m.data;
	switch (m.name) {
		case "create":
			fractal = new Mandelbrot(data.w, data.h);
		break;
		case "resize":
			fractal.resize(data.w, data.h);
			fractal.draw();
		break;
		case "zoom":
			fractal.zoom(data.x, data.y, data.m);
			if (fractal.win.scale < 5e-14) {
				post("tooSmall");
			} else {
				post("justRight");
			}
			fractal.draw();
		break;
		case "drawFractal":
			fractal.draw();
		break;
		default:
			return;
	}
}
function post(n, d) {
	postMessage({name: n, data: d});
}

class Mandelbrot {

	static ESCAPE_RADIUS = 2;
	static MAX_ITER = 1000;

	/**
	 * 
	 * @param w Width of canvas that is being drawn to
	 * @param h Height of canvas that is being drawn to
	 */
	constructor(w, h) {
		this.win = {
			w: w,
			h: h,
			scale: 3
		};
		this.focus = {
			x: -3,
			y: -1.5
		};
		this.pixelBuffer = [];
		this.bufferIndex = 0;
	}
	/**
	 * Iterates over every pixel of the canvas and checks if the respective coordinate at that
	 * pixel is going to escape the ESCAPE_RADIUS, and then fills that pixel in accordingly with
	 * the color returned by the coloring function
	 */
	async draw() {
		for (let x = 0; x < this.win.w; x++) {
			if (x % 100 === 0 || x === 0) post("progress", x / this.win.w);
			for (let y = 0; y < this.win.h; y++) {
				let c = new Complex(...this.pixelToCoord(x, y));
				let z = new Complex(0, 0);
				let i;
				for (i = 0; i < Mandelbrot.MAX_ITER; i++) {
					if (z.abs() > Mandelbrot.ESCAPE_RADIUS) {
						break;
					}
					z = z.square().add(c);
				}
				this.fillPixel(x, y, this.colorFunc4(i, z));
			}
		}
		this.fillPixel(null, null, null, true);
		post("done");
	}
	/**
	 * Colors the fractal in grayscale
	 * @param {*} i the number of iterations taken before the point escapes
	 * @param {*} z the final value of the complex number after i iterations
	 */
	colorFunc1(i, z) {
		if (i == Mandelbrot.MAX_ITER) return "white";
		let color = Math.log(Math.log(z.abs()) / Math.log(Mandelbrot.ESCAPE_RADIUS));
		return `hsl(${color * 40 + 200 }, ${color}%, ${Math.cbrt(i / Mandelbrot.MAX_ITER)*100}%)`;
	}
	colorFunc2(i, z) {
		if (i == Mandelbrot.MAX_ITER) return "white";
		//let a = ((i / Mandelbrot.MAX_ITER) * 1.9) - 1.55;
		let h = ((i + 1) - Math.log(Math.log(z.abs()) / Math.log(2))) / (i + 1);
		return `hsl(${((1 / this.win.scale) % 360) + (Math.sin(h * 2 * Math.PI) + 1) * 145}, 100%, ${30 + Math.tan(i) * 50}%)`;
	}
	colorFunc3(i, z) {
		if (i == Mandelbrot.MAX_ITER) return "white";
		let color = ((i + 1) - Math.log(Math.log(z.abs()) / Math.log(2))) / (i + 1);
		if (Math.random() < 0.0001) {
			post("log", color);
		}
	}
	colorFunc4(i, z) {
		if (i == Mandelbrot.MAX_ITER) return "white";
		//let a = ((i / Mandelbrot.MAX_ITER) * 1.9) - 1.55;
		let h = ((i + 1) - Math.log(Math.log(z.abs()) / Math.log(2))) / (i + 1);
		return `hsl(${((1 / this.win.scale) % 360) + 250 + (Math.sin(h * 2 * Math.PI) + 1) * 145}, 100%, ${30 + ((i % 30) / 30) * 50}%)`;
	}
	/**
	 * Fills a pixel at (x, y) with the specified color on the offscreen canvas
	 * @param x the x coordinate on the canvas
	 * @param y the y coordinate on the canvas
	 * @param color any valid css color string that the pixel will be set to
	 * @param sendBuffer if true, sends the buffer to the main script regardless of how large it is
	 */
	fillPixel(x, y, color, sendBuffer) {
		if (!sendBuffer) {
			this.pixelBuffer[this.bufferIndex] = {x: x, y: y, c: color};
			this.bufferIndex++;
		}
		if (this.bufferIndex === 10000 || sendBuffer) {
			post("pixels", this.pixelBuffer);
			this.pixelBuffer = [];
			this.bufferIndex = 0;
		}
	}
	/**
	 * Zooms in or out of the fractal at a position [x, y] with a multiplier
	 * @param x the x coordinate on the screen being zoomed into
	 * @param y the y coordinate on the screen being zoomed into
	 * @param percent the value being multiplied to the scale to zoom in or out, where numbers less than one zoom in
	 */
	zoom(x, y, percent) {
		let point = this.pixelToCoord(x, y);
		this.win.scale *= percent;
		this.focus.x = point[0] - (this.win.scale / 2) * (this.win.w / this.win.h);
		this.focus.y = point[1] - (this.win.scale / 2);
		post("log", point);
	}
	/**
	 * Converts a [x, y] coordinate on the screen to an [x, y] coordinate on the fractal
	 * @param xstep the screen x coordinate
	 * @param ystep the screen y coordinate
	 */
	pixelToCoord(xstep, ystep) {
		return [
			(this.focus.x + ((this.win.scale / this.win.h) * xstep)),
			(this.focus.y + ((this.win.scale / this.win.h) * ystep))
		];
	}
	/**
	 * Recreates the canvas at the new window size
	 * @param w the new window width
	 * @param h the new window height
	 */
	resize(w, h) {
		this.scale *= w / this.win.w;
		this.win.w = w;
		this.win.h = h;
	}
}

// Class that represents a complex number
class Complex {
	constructor(real, imaginary) {
		this.real = real;
		this.imag = imaginary;
	}
	conj(num) {
		return new Complex(num.real, -num.imag);
	}
	add(num) {
		return new Complex(this.real + num.real, this.imag + num.imag);
	}
	subtract(num) {
		return new Complex(this.real - num.real, this.imag - num.imag);
	}
	divide(num) {
		let numerator = this.multiply(num.conj());
		let denominator = num.multiply(num.conj());
		return new Complex(numerator.real / denominator.real, numerator.imag / denominator.imag);
	}
	multiply(num) {
		return new Complex((this.real * num.real) - (this.imag * num.imag), (this.imag * num.real) + (this.real * num.imag));
	}
	abs() {
		return Math.sqrt((this.real ** 2) + (this.imag ** 2))
	}
	square() {
		return new Complex((this.real ** 2) - (this.imag ** 2), 2 * (this.imag * this.real));
	}
	toString() {
		return `${this.real}${this.imaginary}i`;
	}
}