
var snapToGrid = true;
var canvas = document.getElementById('myCanvas')
// canvas.width = window.width;


var audioContext = new (window.AudioContext || window.webkitAudioContext);

var masterGain = audioContext.createGain();
masterGain.value = 0.5;
masterGain.connect(audioContext.destination);

var notes = [];
var currentNote;

pause = false;

function toggleSnap() {
	snapToGrid = !snapToGrid;
	console.log(snapToGrid)
}

function switchTo(tone, synth) {
	return function(){
		synth.setTone(tone);
	}
}

// MAIN

var synth = new Synth(canvas, audioContext);

var sine = new Tone('sine', 16, 'red', 0.99, synth);
var triangle = new Tone('triangle', 12, 'yellow', 0.5, synth);
var square = new Tone('square', 12, 'blue', 0.5, synth);
var sawtooth = new Tone('sawtooth', 12, 'green', 0.5, synth);



synth.setTone(sine);

var grid = new Grid(2, 32, synth, 40);
var timer = new Timer(3, grid);
var regButtonSize = new Size(60,20)
var toggleSnap = new Button(new Point(10,10), new Size(90, 20), 'gray', 'snap to grid', function(event) {grid.toggleSnap()})
var switchToSine = new Button(new Point(110,10), regButtonSize, sine.color, 'sine', switchTo(sine, synth))
var switchToSquare = new Button(new Point(180,10), regButtonSize, square.color, 'square', switchTo(square, synth))
var switchToTriangle = new Button(new Point(250,10), regButtonSize, triangle.color, 'triangle', switchTo(triangle, synth))
var switchToSawtooth = new Button(new Point(320,10), regButtonSize, sawtooth.color, 'sawtooth', switchTo(sawtooth, synth))

var helloText =  new PointText(new Point(canvas.width/2, 20))

helloText.content = "Welcome to SillySynth. work in progess, things might break, or not work as you expect!"

var infoText = new PointText(new Point(50, canvas.height - 20))
infoText.content = "click and drag to draw a note. Click it again to delete. play with the buttons up top. Have fun!";



function onFrame() {
	if (! pause) {
		timer.step();	
	}
}


var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

function handleVisibilityChange(){
	if (document[hidden]){
		grid.pause();
	} else {
		// should happen automagically
		
	}
}

document.addEventListener(visibilityChange, handleVisibilityChange, false);