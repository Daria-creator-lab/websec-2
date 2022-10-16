const requestURL = 'http://localhost:5000';

function sendRequest(method, url, body = null){
	if(body !== null){
		return fetch(url, {
			method: method,
			body: JSON.stringify(body)
		}).then(response => {
			if (response.ok){
				return response.json();
			}
			console.log("Error");
			//////error
		})
	}
    return fetch(url).then(response => {
        return response.json();
    })
}

checker.prototype.setCoord = function(){
	let moveLength = 80 ;
	let moveDeviation = 12;
	let x = this.x * moveLength + moveDeviation;
	let y = this.y * moveLength  + moveDeviation;
	this.id.style.top = y + 'px';
	this.id.style.left = x + 'px';
}

let selectedSquare = undefined;
let selectedChecker = undefined;

function makeMove (checker){
	const body = {
		x: checker.x,
		y: checker.y,
		currentX: selectedSquare.x,
		currentY: selectedSquare.y,
	}
	checker.x = selectedSquare.x;
	checker.y = selectedSquare.y;
	checker.setCoord();
	checker.ocupiedSquare.ocupied = false;
	checker.ocupiedSquare = selectedSquare;
	selectedSquare.ocupied = true;
	selectedSquare.checker = selectedChecker;
	selectedSquare = undefined;
	selectedChecker = undefined;

	sendRequest('POST', requestURL, body) 
		.then(data => console.log(data))
		.catch(err => console.log(err))
}

function allowMove(king){
	if(selectedSquare.ocupied) return false;
	// if(king){
	// 	if(Math.abs(selectedSquare.y - selectedChecker.y) === 1){
	// 		if(Math.abs(selectedSquare.x - selectedChecker.x) === 1) {
	// 			return true;
	// 		}
	// 	}
	// }
	if(selectedChecker.color === 'white'){
		if(selectedChecker.y < selectedSquare.y && (selectedSquare.y - selectedChecker.y === 1)){
			if(Math.abs(selectedSquare.x - selectedChecker.x) === 1) {
				return true;
			}
		}
	}
	else{
		if(selectedChecker.y > selectedSquare.y && (selectedChecker.y - selectedSquare.y === 1)){
			if(Math.abs(selectedSquare.x - selectedChecker.x) === 1) {
				return true;
			}
		}
	}
	return false;
}

function square(square, colorId, x, y){
	this.checker = undefined;
	this.id = square;
	this.colorId = colorId;
	this.ocupied = false;
	this.x = x;
	this.y = y;
	this.id.onclick = () => {
		console.log(this.ocupied)
		if(selectedChecker){
			selectedSquare = this;
			if(allowMove()){
				makeMove(selectedChecker);
			}
		} 
	}
}

function checker(checker, color, x, y) {
	this.id = checker;
	this.ocupiedSquare = undefined; 
	this.color = color;
	this.king = false;
	this.alive = true;
	this.attack = false;
	this.x = x;
	this.y = y;
	this.id.onclick = () => {
		selectedChecker = this;
	}
}

function setCheckers(board){
	let squareClass = document.getElementsByClassName("square");
	let whiteCheckerClass = document.getElementsByClassName("white_checker");
	let blackCheckerClass = document.getElementsByClassName("black_checker");
	let whiteIndex = 0;
	let blackIndex = 0;
	let squareIndex = 0;

	for (let i = 0; i < 8; ++i){
		for (let j = 0; j < 8; ++j){
			board[i][j] = new square(squareClass[squareIndex], board[i][j], j, i);
			++squareIndex;
			if(board[i][j].colorId === 1){
				let whiteChecker = new checker(whiteCheckerClass[whiteIndex], "white", j, i);
				whiteChecker.setCoord();
				board[i][j].checker = whiteChecker;
				whiteChecker.ocupiedSquare = board[i][j];
				board[i][j].ocupied = true;
				++whiteIndex;
			}
			if(board[i][j].colorId === 2){
				let blackChecker = new checker(blackCheckerClass[blackIndex], "black", j, i);
				blackChecker.setCoord();
				board[i][j].checker = blackChecker;
				blackChecker.ocupiedSquare = board[i][j];
				board[i][j].ocupied = true;
				++blackIndex;
			}
		}
	}

	//localStorage.setItem('isBoardSet', true);
	//localStorage.setItem('board', JSON.stringify(board));
}

function main(){
	sendRequest('GET', requestURL) 
		.then(data => setCheckers(data))
		.catch(err => console.log(err))
	// if(localStorage.getItem('isBoardSet') != "true"){
	// 	sendRequest('GET', requestURL) 
	// 		.then(data => setCheckers(data))
	// 		.catch(err => console.log(err))
	// }
	// else {
	// 	let board = JSON.parse(localStorage.getItem('board'));
	// 	console.log(board)
	// 	setCheckers([
	// 		[1, 0, 1, 0, 1, 0, 1, 0],
	// 		[0, 1, 0, 1, 0, 1, 0, 1],
	// 		[1, 0, 1, 0, 1, 0, 1, 0],
	// 		[0, 0, 0, 0, 0, 0, 0, 0],
	// 		[0, 0, 0, 0, 0, 0, 0, 0],
	// 		[0, 2, 0, 2, 0, 2, 0, 2],
	// 		[2, 0, 2, 0, 2, 0, 2, 0],
	// 		[0, 2, 0, 2, 0, 2, 0, 2],
	// 	  ]);
	// }
}

main();