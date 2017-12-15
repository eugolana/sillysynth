
var snapToGrid = true;

function Tone(type, octave, color, volume) {
	this.type = type;
	this.octave = octave;
	this.color = color;
	this.volume = volume;
}

function Button(pos, size, color, text, func) {
	this.pos = pos;
	this.size = size;
	this.color = color;
	this.text = text;
	this.func = func;
	this.rect = new Rectangle(this.pos, this.size)
	this.button = new Path.Rectangle(this.rect);
	console.log('got button')
	console.log(this.button)
	this.button.fillColor = color;
	this.button.onClick = func;
	this.text = new PointText(this.rect.center)
	this.text.content = text;
}

var sine = new Tone('sine', 16, 'red', 0.99);
var triangle = new Tone('triangle', 12, 'yellow', 0.5);
var square = new Tone('square', 12, 'blue', 0.5);
var sawtooth = new Tone('sawtooth', 12, 'green', 0.5);



var canvas = document.getElementById('myCanvas')
// canvas.width = window.width;

var width = canvas.width;
var height = canvas.height;
backrect = new Rectangle(new Point(0,0), new Size(width, height));
// (this is necessary for transparent layers to work)
background = new Path.Rectangle(backrect)
background.fillColor = "#CCCCEE";

var audioContext = new (window.AudioContext || window.webkitAudioContext);

var masterGain = audioContext.createGain();
masterGain.value = 0.5;
masterGain.connect(audioContext.destination);

var notes = [];
var currentNote;

var selectedTone = sine;

tool.onKeyDown = function(event) {
	if (event.key == 't') {
		selectedTone = triangle;
		return;
	} 
	if (event.key == 'w') {
		selectedTone = sawtooth;
		return;
	};
	if (event.key == 'q') {
		selectedTone = square;
		return
	}
	if (event.key == 'e') {
		selectedTone = sine;
		return
	}
	if (event.key == 'space') {
		pause = !pause;
	}
}





function Note( tone, destination) {
	this.octave = tone.octave;
	this.volume = tone.volume;
	this.tone = tone;
	this.osc = audioContext.createOscillator();
	this.osc.type = tone.type;

	this.gain = audioContext.createGain();
	this.gain.gain.value = 0;
	this.gain.connect(destination)
	this.osc.connect(this.gain)
	this.osc.start();
}

Note.prototype.initPath = function(point, grid) {
	if (snapToGrid) {
		point = grid.snap(point);
	}
	console.log('in init path')
	this.path = new Path(point);
	this.path.strokeWidth = 3;
	this.path.strokeColor = this.tone.color;
}

Note.prototype.addPoint = function(point, grid) {
	if (snapToGrid) {
		point = grid.snap(point)
	}
	console.log('in add point')
	if (this.path.lastSegment.point.x == point.x && this.path.lastSegment.point.y == point.y) {
		console.log('point already added')
	} else {
		this.path.add(point);
	}

};

Note.prototype.play = function(timer) {
	var intersections = this.path.getIntersections(timer.line)
	if (intersections.length > 0) {
		// only concerned with first intersection (should only really be one)
		var intersection = intersections[0];
		var pos = canvas.height - intersection.point.y;
		pos /= timer.grid.y_interval;
		// 	if snaptogrid:
		// 		pos = Math.floor(pos/this.grid.y_interval) * this.grid.y_interval;
		this.osc.frequency.value = Math.pow(2, pos/12) * 220;
		this.gain.gain.value = this.volume;
		this.path.strokeWidth = 4;
	} else {
		this.gain.gain.value = 0.0;
		this.path.strokeWidth = 2;
		this.path.opacity = 0.7;
	}
}

function onMouseDown(event) {
	// If we produced a path before, deselect it: 
	
	currentNote = new Note(selectedTone, masterGain)

	currentNote.initPath(event.point, grid);
	notes.push(currentNote)
}


// While the user drags the mouse, points are added to the path
// at the position of the mouse:
function onMouseDrag(event) {
	currentNote.addPoint(event.point, grid)

}

// When the mouse is released, we simplify the path:
function onMouseUp(event) {
	path = currentNote.path;

	if (! snapToGrid) {
		path.simplify(10);
	}
	// When the mouse is released, simplify it:

	// Select the path, so we can see its segments:
	// path.fullySelected = true;
}

function Grid(octaves, steps) {
	this.otaves = octaves;
	this.steps = steps;
	this.x_interval = canvas.width / steps;
	this.y_interval = canvas.height / (octaves * 12);
	this.x_lines = new Group()
	for (var i = 0; i < this.x_interval; i++) {
		var path = new Path(new Point(i * this.x_interval, 0), new Point(i * this.x_interval, canvas.height))
		this.x_lines.addChild(path);
	}
	this.x_lines.strokeColor = 'black';
	this.x_lines.strokeWidth = 2;
	this.x_lines.opacity = 0.4

	this.y_lines = new Group()
	for (var i = 0; i < this.y_interval; i++) {
		var path = new Path(new Point(0, i * this.y_interval), new Point(canvas.width, i * this.y_interval))
		this.y_lines.addChild(path);
	}
	this.y_lines.strokeColor = 'black';
	this.y_lines.strokeWidth = 2;
	this.y_lines.opacity = 0.4
}

Grid.prototype.snap = function(point) {
	var x = Math.floor((point.x / this.x_interval) + 0.5) * this.x_interval;
	var y = Math.floor(point.y / this.y_interval) * this.y_interval;
	console.log('in snap')
	console.log(x)
	console.log(y)
	return new Point(x, y);
}





function Timer(x, speed, grid) {
	this.grid = grid;
	this.x = x;
	this.speed = speed;
	this.line = new Path(new Point(x,0), new Point(x, canvas.height));
	// this.line.fullySelected = true;
	this.line.strokeColor = 'blue';
	this.line.strokeWidth = 4;
	this.line.opacity = 0.6;
}

Timer.prototype.step = function() {
	this.x += this.speed;
	this.x %= canvas.width;
	this.line.translate(new Point(this.x - this.line.firstSegment.point.x,0))
	for (var i = 0; i < notes.length; i++) {
		notes[i].play(timer);
	}
}
pause = false;

function toggleSnap() {
	snapToGrid = !snapToGrid;
	console.log(snapToGrid)
}

function switchTo(tone) {
	return function() {
		console.log('switching to ' + tone.type)
		selectedTone = tone;
	}
}

// MAIN

var grid = new Grid(2, 32);
var timer = new Timer(0, 3, grid);
var regButtonSize = new Size(50,20)
var toggleSnap = new Button(new Point(20,10), regButtonSize, 'red', 'red', toggleSnap)
var switchToSine = new Button(new Point(80,10), regButtonSize, sine.color, 'sine', switchTo(sine))
var switchToSquare = new Button(new Point(140,10), regButtonSize, square.color, 'square', switchTo(square))

function onFrame() {
	if (! pause) {
		timer.step();	
	}
}
