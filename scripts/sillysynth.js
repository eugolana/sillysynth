function Synth(canvas, audioContext) {
	this.canvas = canvas;
	this.height = canvas.height;
	this.width = canvas.width;
	this.audioContext = audioContext;
	this.masterGain = this.audioContext.createGain();
	this.masterGain.value = 0.5;
	this.masterGain.connect(this.audioContext.destination);
	this.selectedTone;
}

Synth.prototype.setTone = function(tone) {
	this.selectedTone = tone;
};

function Grid(octaves, steps, synth) {
	this.synth = synth;
	this.otaves = octaves;
	this.steps = steps;
	this.x_interval = this.synth.width / steps;
	this.y_interval = this.synth.height / (octaves * 12);

	this.currentNote;
	this.selectedTone;
	this.notes = [];
	this.snapToGrid = true;
	this.initUI();

	this.grid.onMouseDown = this.initNote();
	this.grid.onMouseDrag = this.addPoint();
	this.grid.onMouseUp = this.endNote();
}

Grid.prototype.initUI = function() {
	var rectangle = new paper.Rectangle(new paper.Point(0,0), 
		new paper.Size(this.synth.width, this.synth.height))
	this.background = new paper.Path.Rectangle(rectangle);
	this.background.fillColor = '#CCCCCC';
	this.x_lines = new paper.Group()
	for (var i = 0; i < this.x_interval; i++) {
		var path = new paper.Path(new paper.Point(i * this.x_interval, 0), new paper.Point(i * this.x_interval, this.synth.height))
		this.x_lines.addChild(path);
	}
	this.x_lines.strokeColor = 'black';
	this.x_lines.strokeWidth = 2;
	this.x_lines.opacity = 0.4

	this.y_lines = new paper.Group()
	for (var i = 0; i < this.y_interval; i++) {
		var path = new paper.Path(new paper.Point(0, i * this.y_interval), new paper.Point(this.synth.width, i * this.y_interval))
		this.y_lines.addChild(path);
	}
	this.y_lines.strokeColor = 'black';
	this.y_lines.strokeWidth = 2;
	this.y_lines.opacity = 0.4;

	this.grid = new paper.Group();

	this.grid.addChild(this.background);
	this.grid.addChild(this.x_lines);
	this.grid.addChild(this.y_lines);
}

Grid.prototype.initNote = function(){
	var grid = this;
	return function(event){
		grid.currentNote = new Note(grid.synth.selectedTone, grid);
		grid.currentNote.initPath(event.point, grid);
		grid.notes.push(grid.currentNote);
	}
}

Grid.prototype.addPoint = function(event) {
	var grid = this;
	return function(event){
		if (grid.currentNote) {
			grid.currentNote.addPoint(event.point, grid);
		}
	}
}

Grid.prototype.endNote = function() {
	var grid = this;
	return function(event){
		if (grid.currentNote) {
			grid.currentNote.endNote();	
			grid.currentNote = false;	
		}
	}
}

Grid.prototype.snap = function(point) {
	var x = Math.floor((point.x / this.x_interval) + 0.5) * this.x_interval;
	var y = Math.floor(point.y / this.y_interval) * this.y_interval;
	return new paper.Point(x, y);
}

function Tone(type, octave, color, volume, synth) {
	this.type = type;
	this.octave = octave;
	this.color = color;
	this.volume = volume;
	this.synth = synth;
}

function Button(pos, size, color, text, func) {
	this.pos = pos;
	this.size = size;
	this.color = color;
	this.text = text;
	this.func = func;
	this.rect = new paper.Rectangle(this.pos, this.size)
	this.button = new paper.Path.Rectangle(this.rect);
	// console.log('got button')
	// console.log(this.button)
	this.button.fillColor = color;
	this.button.opacity = 0.5;
	console.log(this.rect.bottomLeft)
	this.text = new paper.PointText(this.rect.bottomLeft.add(new paper.Point(5, -5)))
	this.text.content = text;
	this.clickable = new paper.Group()
	this.clickable.addChild(this.button)
	this.clickable.addChild(this.text)
	this.clickable.onClick = func;
	this.on = false;
}

Button.prototype.turnOn = function() {
	this.button.opacity = 1.0;
}

Button.prototype.turnOff = function() {
	this.button.opacity = 0.5;
}

function Note( tone, grid) {
	this.grid = grid;
	console.log(this.grid)
	this.octave = tone.octave;
	this.volume = tone.volume;
	this.tone = tone;
	this.osc = this.tone.synth.audioContext.createOscillator();
	this.osc.type = tone.type;

	this.gain = this.tone.synth.audioContext.createGain();
	this.gain.gain.value = 0;
	this.gain.connect(this.tone.synth.masterGain)
	this.osc.connect(this.gain)
	this.osc.start();
}

Note.prototype.initPath = function(point) {
	if (this.grid.snapToGrid) {
		point = this.grid.snap(point);
	}
	this.path = new paper.Path(point);
	this.path.strokeWidth = 3;
	this.path.strokeColor = this.tone.color;

}

Note.prototype.addPoint = function(point) {
	if (this.grid.snapToGrid) {
		point = this.grid.snap(point)
	}
	if (this.path.lastSegment.point.x == point.x && this.path.lastSegment.point.y == point.y) {
		// duplicate of previous point
	} else {
		if (this.path.lastSegment.point.x <= point.x) {
		this.path.add(point);
		}
	}

};

Note.prototype.endNote = function() {
	if (!this.grid.snapToGrid){
		this.path.simplify(10);
	}
}

Note.prototype.play = function(timer) {
	var intersections = this.path.getIntersections(timer.line)
	if (intersections.length > 0) {
		// only concerned with first intersection (should only really be one)
		var intersection = intersections[0];
		var pos = timer.grid.synth.height - intersection.point.y;
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

function Timer(x, speed, grid) {
	this.grid = grid;
	this.x = x;
	this.speed = speed;
	this.line = new paper.Path(new paper.Point(x,0), new paper.Point(x, this.grid.synth.height));
	// this.line.fullySelected = true;
	this.line.strokeColor = 'blue';
	this.line.strokeWidth = 4;
	this.line.opacity = 0.6;
}

Timer.prototype.step = function() {
	this.x += this.speed;
	this.x %= this.grid.synth.width;
	this.line.translate(new paper.Point(this.x - this.line.firstSegment.point.x,0))
	for (var i = 0; i < this.grid.notes.length; i++) {
		this.grid.notes[i].play(this);
	}
}
