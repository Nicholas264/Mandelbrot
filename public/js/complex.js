class Complex {
	constructor(real, imaginary) {
		this.real = real;
		this.imag = imaginary;
	}
	static conj(num) {
		return new Complex(num.real, -num.imag);
	}
	static add(num1, num2) {
		return new Complex(num1.real + num2.real, num1.imag + num2.imag);
	}
	static subtract(num1, num2) {
		return new Complex(num1.real - num2.real, num1.imag - num2.imag);
	}
	static divide(num1, num2) {
		let numerator = Complex.multiply(num1, Complex.conj(num2));
		let denominator = Complex.multiply(num2, Complex.conj(num2));
		return new Complex(numerator.real / denominator.real, numerator.imag / denominator.imag);
	}
	static multiply(num1, num2) {
		let real = (num1.real * num2.real) - (num1.imag * num2.imag);
		let imag = (num1.imag * num2.real) + (num1.real * num2.imag);
		return new Complex(real, imag);
	}
	static abs(num) {
		return Math.sqrt((num.real ** 2) + (num.imag ** 2))
	}
	toString() {
		return `${this.real}${this.imaginary}i`;
	}
}