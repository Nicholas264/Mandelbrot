# Mandelbrot Fractal Explorer
This app allows you to zoom into the [Mandelbrot Set](https://en.wikipedia.org/wiki/Mandelbrot_set)¹. It colors the points that are not contained in the set based on the zoom level and number of iterations it takes for the point to escape. This app only zooms to a scale of around 5e-14 before floating point numbers become too imprecise to display the rest of the zoomed in fractal.
## How to Use

### Zooming in:
You can zoom in to a spot on the fractal by left clicking on it. You can also zoom in by scrolling upwards continuously. After 500 milliseconds of no scrolling or after a click, the fractal will start to render. **When the fractal is rendering, zooming is disabled**
### Zooming out:
You can zoom out by right clicking a spot or scrolling downwards. Like zooming in, after 500 milliseconds of no scrolling or after the click, the fractal will start to render and zooming will be disabled.
### Panning:
By holding shift and left clicking anywhere on the site, the fractal can be panned to the location of the click.
## Running the Webserver
While this can just be run as a statically served html file, it can also be run as an electron webserver

 1. Open terminal/cmd and clone this repository
 2. Enter the cloned repository directory and run `npm i`
 3. Run `node .` and the website will be available at `http://localhost:8080`

---
¹ The Mandelbrot Set is a collection of complex numbers that don't escape a circle of radius 2 when iterated using the function f(z) = z² + c 
