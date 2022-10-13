var square_class = document.getElementsByClassName("square");
var white_checker_class = document.getElementsByClassName("white_checker");
var black_checker_class = document.getElementsByClassName("black_checker");
var moveLength = 80 ;
var moveDeviation = 12;

var board = [
	[1, 0, 1, 0, 1, 0, 1, 0],
	[0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 1, 0, 1, 0, 1, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 2, 0, 2, 0, 2, 0, 2],
	[2, 0, 2, 0, 2, 0, 2, 0],
	[0, 2, 0, 2, 0, 2, 0, 2],
  ];

function square(square, colorId, x, y){
	this.id = square;
	this.colorId = colorId;
	this.ocupied = false;
	this.x = x;
	this.y = y;
	this.id.onclick = () => {
		console.log('x:', this.x, 'y:', this.x);
	}
}

function checker(checker, color, x, y) {
	this.id = checker;
	this.color = color;
	this.king = false;
	this.alive = true;
	this.attack = false;
	this.x = x;
	this.y = y;
	this.id.onclick = () => {
		console.log('x:', this.x, 'y:', this.x);
	}
}

checker.prototype.setCoord = function(){
	let x = this.x * moveLength + moveDeviation;
	let y = this.y * moveLength  + moveDeviation;
	this.id.style.top = y + 'px';
	this.id.style.left = x + 'px';
}


let white_checker = [];
let black_checker = [];
let w_index = 0;
let b_index = 0;
let square_index = 0;

for (let i = 0; i < 8; ++i){
	for (let j = 0; j < 8; ++j){
		board[i][j] = new square(square_class[square_index], board[i][j], j, i);
		++square_index;
		if(board[i][j].colorId === 1){
			white_checker[w_index] = new checker(white_checker_class[w_index], "white", j, i);
			white_checker[w_index].setCoord();
			board[i][j].ocupied = true;
			++w_index;
		}
		if(board[i][j].colorId === 2){
			black_checker[b_index] = new checker(black_checker_class[b_index], "black", j, i);
			black_checker[b_index].setCoord();
			board[i][j].ocupied = true;
			++b_index;
		}
	}
}

