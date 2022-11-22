const requestURL = 'http://localhost:5000';
let board = [];

function sendRequest(method, url, body = null){
	if(body !== null){
		return fetch(url, {                
			method  : method,
			headers : {
			   'Content-Type': 'application/JSON'
			},
			body: JSON.stringify(body)
	   }).then(response => {
			if (response.ok){
				if(response.url === requestURL + "/attack") 
					return response.json();
				else return "POST success";
			}
		})
	}
    return fetch(url).then(response => {
        return response.json();
    })
}

let selectedSquare = undefined;
let selectedChecker = undefined;

function queueControl(){
	if(queue === "white") queue = "black";
	else queue = "white";
}

function makeMove(checker, attack = false){
	queueControl();
	let x = selectedChecker.x;
	let y = selectedChecker.y;
	delete board[y][x].checker;
	const body = {
		x: checker.x,
		y: checker.y,
		currentX: selectedSquare.x,
		currentY: selectedSquare.y,
		king: false,
		queue: queue
	}
	checker.x = selectedSquare.x;
	checker.y = selectedSquare.y;
	checker.setCoord();
	checker.ocupiedSquare.ocupied = false;
	checker.ocupiedSquare = selectedSquare;
	if((checker.color === 'black' && checker.y === 0) || 
		(checker.color === 'white' && checker.y === 7)){
			checker.id.classList.add('king_checker');
			checker.king = true;
			body.king = true;
	}
	selectedSquare.ocupied = true;
	selectedSquare.checker = selectedChecker;
	selectedSquare = undefined;
	if(!attack) selectedChecker = undefined;

	if(checker.king) body.king = true;
	if(!attack){
		const router = '/makeMove';
		let url = requestURL + router;
		sendRequest('POST', url, body)
			.then(response => console.log(response))
			.catch(err => console.log(err))
	}
	else {
		if(checker.king) return true;
		else return false;
	}
}

function allowMove(){
	if(selectedSquare.ocupied) return false;
	if(selectedChecker.color === 'white' || selectedChecker.king){
		if(selectedChecker.y < selectedSquare.y && (selectedSquare.y - selectedChecker.y === 1)){
			if(Math.abs(selectedSquare.x - selectedChecker.x) === 1) {
				return true;
			}
		}
	}
	if(selectedChecker.color === 'black' || selectedChecker.king){
		if(selectedChecker.y > selectedSquare.y && (selectedChecker.y - selectedSquare.y === 1)){
			if(Math.abs(selectedSquare.x - selectedChecker.x) === 1) {
				return true;
			}
		}
	}
	return false;
}

function isAttack(){
	if(selectedChecker.color === 'white' || selectedChecker.king){
		let counter = 0;
		while(counter !== 2){
			let x = selectedChecker.x + 2;
			if (counter === 1) x = selectedChecker.x - 2;
			let y = selectedChecker.y + 2;
			if(selectedSquare.x === x && selectedSquare.y === y && !selectedSquare.ocupied){
				let xC = selectedChecker.x + 1;
				if (counter === 1) xC = selectedChecker.x - 1;
				let yC = selectedChecker.y + 1;
				if(board[yC][xC].ocupied && board[yC][xC].checker.color === "black" || selectedChecker.king){
					if(selectedChecker.king) {
						if(selectedChecker.color === board[yC][xC].checker.color) return {flag: false};
					}
					return {x: x, y: y, xAttacked: xC, yAttacked: yC, flag: true};
				}
			}
			x = selectedChecker.x - 2;
			y = selectedChecker.y + 2;
			++counter;
		}
	}
	if(selectedChecker.color === 'black' || selectedChecker.king){
		let counter = 0;
		while(counter !== 2){
			let x = selectedChecker.x - 2;
			if (counter === 1) x = selectedChecker.x + 2;
			let y = selectedChecker.y - 2;
			if(selectedSquare.x === x && selectedSquare.y === y && !selectedSquare.ocupied){
				let xC = selectedChecker.x - 1;
				if (counter === 1) xC = selectedChecker.x + 1;
				let yC = selectedChecker.y - 1;
				if(board[yC][xC].ocupied && board[yC][xC].checker.color === "white" || selectedChecker.king){
					if(selectedChecker.king) {
						if(selectedChecker.color === board[yC][xC].checker.color) return {flag: false};
					}
					return {x: x, y: y, xAttacked: xC, yAttacked: yC, flag: true};
				}
			}
			x = selectedChecker.x - 2;
			y = selectedChecker.y + 2;
			++counter;
		}
	}
	return {flag: false};
}

function incKilledCheckers(color){
	if(color === "black"){
		--blackCheckersCount;
		let score = document.getElementById("white-score");
		score.innerText = 12 - blackCheckersCount;
	}
	else{
		--whiteCheckersCount;
		let score = document.getElementById("black-score");
		score.innerText = 12 - whiteCheckersCount;
	}
}

function attack(coordinates){
	let fromX = selectedChecker.x;
	let fromY = selectedChecker.y;
	let xA = coordinates.xAttacked;
	let yA = coordinates.yAttacked;
	board[yA][xA].checker.id.remove();
	board[yA][xA].ocupied = false;
	incKilledCheckers(board[yA][xA].checker.color);
	delete board[yA][xA].checker;
	let king = makeMove(selectedChecker, true);
	const body = {
		fromX,
		fromY,
		toX: coordinates.x,
		toY: coordinates.y,
		xAttacked: coordinates.xAttacked,
		yAttacked: coordinates.yAttacked,
		king: king,
		queue: queue,
		score: {
			whiteCheckersCount,
			blackCheckersCount
		}
	}
	const router = '/attack';
	let url = requestURL + router;
	sendRequest('POST', url, body)
		.then(response => {
			if(response.gameFinished) gameFinished(response.winner);
			else console.log(response);
		})
		.catch(err => console.log(err))
}

let isGameFinished = false;

function gameFinished(winner){
	createModalWindow(winner)
	isGameFinished = true;
}

function deleteModalWindow(){
	let modal = document.getElementById("modal");
	modal.remove();
}

function createModalWindow(winner){

	let modal = document.createElement("div");
	modal.setAttribute("id", "modal");
	modal.classList.add("modal");

	let modalWrapper = document.createElement("div");
	modalWrapper.classList.add("modal-wrapper");

	let modalBody = document.createElement("div");
	modalBody.classList.add("modal-body");
	if(winner === "black") modalBody.innerText = "Player 1 победил";
	else modalBody.innerText = "Player 2 победил";

	modalWrapper.appendChild(modalBody);
	let button = document.createElement("button");
	button.innerText = "Новая игра";
	button.addEventListener("click", newGame);
	modalWrapper.appendChild(button);

	modal.appendChild(modalWrapper);

	let main = document.getElementById("main");
	main.appendChild(modal);
}

function newGame(){
	board = [];
	selectedSquare = undefined;
	selectedChecker = undefined;
	isGameFinished = false;
	kings = []; 
	queue = undefined;
	const router = '/newGame';
	let url = requestURL + router;
	sendRequest('GET', url) 
		.then(data => initBoard(data, true))
		.catch(err => console.log(err))
}

function deleteCheckers(){
	const elements = document.getElementsByClassName("checker");
	while(elements.length > 0){
        elements[0].remove();
    }
}

function square(square, colorId, x, y){
	this.checker = undefined;
	this.id = square;
	this.colorId = colorId;
	this.ocupied = false;
	this.x = x;
	this.y = y;
	this.id.onclick = () => {
		if(selectedChecker){
			selectedSquare = this;
			let result = isAttack();
			if (result.flag){
				if(selectedChecker.attackCounter === undefined)
					selectedChecker.attackCounter = 0;
				delete result.flag;
				attack(result);
				++selectedChecker.attackCounter;
				if(selectedChecker.attackCounter > 1) 
					queueControl();
			}
			else{
				if(selectedChecker.attackCounter >= 1){
					selectedChecker.attackCounter = 0;
					selectedChecker = undefined;
					return;
				} 
				if(allowMove()) 
					makeMove(selectedChecker);
			}
		} 
	}
}

function checker(checker, color, x, y) {
	this.id = checker;
	this.ocupiedSquare = undefined; 
	this.color = color;
	if(isKing(x, y)){
		this.id.classList.add('king_checker');
		this.king = true;
	}
	else this.king = false;
	this.alive = true;
	this.attack = false;
	this.x = x;
	this.y = y;
	this.id.onclick = () => {
		if(isGameFinished) return;
		if(this.color === queue) selectedChecker = this;
	}
}

checker.prototype.setCoord = function(){
	let moveLength = 80 ;
	let moveDeviation = 12;
	let x = this.x * moveLength + moveDeviation;
	let y = this.y * moveLength  + moveDeviation;
	this.id.style.top = y + 'px';
	this.id.style.left = x + 'px';
}

let kings = []; 
let queue = undefined;
let whiteCheckersCount = 12;
let blackCheckersCount = 12;

function initScore(scoreObj){
	whiteCheckersCount = scoreObj.whiteCheckersCount;
	blackCheckersCount = scoreObj.blackCheckersCount;
	let score = document.getElementById("white-score");
	score.innerText = 12 - scoreObj.blackCheckersCount;
	score = document.getElementById("black-score");
	score.innerText = 12 - scoreObj.whiteCheckersCount;
}

function initBoard(data, newGame = false){
	if(newGame){
		deleteCheckers();
		deleteModalWindow();
	}
	if(data.gameFinished) gameFinished(data.winner);
	if(data.score) initScore(data.score);
	let squareClass = document.getElementsByClassName("square");
	let table = document.getElementById("table");
	let squareIndex = 0;
	kings = data.kings;
	queue = data.queue;

	for (let i = 0; i < 8; ++i){
		board[i] = new Array(8);
		for (let j = 0; j < 8; ++j){
			board[i][j] = new square(squareClass[squareIndex], data.board[i][j], j, i);
			++squareIndex;
			if(board[i][j].colorId === 1){
				let div = document.createElement('div');
				div.classList.add('checker');
				div.classList.add('white_checker');
				table.append(div);
				let whiteChecker = new checker(div, "white", j, i);
				whiteChecker.setCoord();
				board[i][j].checker = whiteChecker;
				whiteChecker.ocupiedSquare = board[i][j];
				board[i][j].ocupied = true;
			}
			if(board[i][j].colorId === 2){
				let div = document.createElement('div');
				div.classList.add('checker');
				div.classList.add('black_checker');
				table.append(div);
				let blackChecker = new checker(div, "black", j, i);
				blackChecker.setCoord();
				board[i][j].checker = blackChecker;
				blackChecker.ocupiedSquare = board[i][j];
				board[i][j].ocupied = true;
			}
		}
	}
}

function isKing(x, y){
	let flag = kings.every(obj => {
		if(obj.x == x && obj.y == y) return false;
		return true;
	});
	if(flag === undefined) return false;
	return !flag;
}

function main(){
	const router = '/initBoard';
	let url = requestURL + router;
	sendRequest('GET', url) 
		.then(data => initBoard(data))
		.catch(err => console.log(err))
}

main();