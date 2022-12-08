let ws = new WebSocket("ws://localhost:5000");

ws.addEventListener('message', (event) => {
	let data = JSON.parse(event.data);
    console.log('Message from server ', data);
	if(data.includesUser) updateLoginWindow();
	if(data.waitingPlayer){
		hideLoginWindow();
		createWaitingPlayerWindow("Ожидание игрока...");
	}
	if(data.gameFinished) gameFinished(data.winner);
	if(data.enemyDisconnected) createWaitingPlayerWindow("Игрок отключился. Ожидайте...");
	if(data.enemyDisconnected === false){
		login = data.login;
		deleteWindow("waiting");
	} 
	switch(data.function){
		case 'initBoard':
			loginIdentification(data.game, data.login);
			let string = "login";
			if(data.newGame){ 
				makeNewGame();
				string = 'modal';
			}
			deleteWindow(string);
			deleteWaitingWindow();
			initBoard(data.game);
			queueControl(data.game.queue);
			break;

		case 'makeMove':
			updatePosition(data.checker);
			queueControl(data.queue);
			break;
			
		case 'attack':
			updatePosition(data.checker, true);
			queueControl(data.queue);
			break;
	}
});

function updateLoginWindow(){
	let label = document.getElementById("userExists");
	label.innerText = "Имя пользователя занято";
}

function hideLoginWindow(){
	let login = document.getElementById("login");
	login.style.display = "none";
}

function deleteWaitingWindow(){
	let waitingWindow = document.getElementById("waiting");
	if(waitingWindow) waitingWindow.remove();
	else return;
}

function createWaitingPlayerWindow(string){
	let waitingWindow = document.createElement("div");
	waitingWindow.setAttribute("id", "waiting");
	waitingWindow.classList.add("login");
	waitingWindow.style.height = "50px";

	let label = document.createElement("label");
	label.innerText = string;

	waitingWindow.appendChild(label);

	document.body.appendChild(waitingWindow);
}

function makeNewGame(){
	deleteCheckers();
	selectedChecker = undefined;
	selectedSquare = undefined;
	board = [];
	kings = []; 
	player = undefined;
	game = undefined;
	whiteCheckersCount = 12;
	blackCheckersCount = 12;
	isGameFinished = false;
	let score = document.getElementById("white-score");
	score.innerText = 0;
	score = document.getElementById("black-score");
	score.innerText = 0;
}

let board = [];

let selectedSquare = undefined;
let selectedChecker = undefined;

function queueControl(queue){
	game.queue = queue;
	let field = document.getElementById("queue-body");
	field.innerText = queue;
}

function changeQueue(){
	if(game.queue === "white") game.queue = "black";
	else game.queue = "white";
}

function makeMove(checker, attack = false, updatePosition = false){
	if(!attack){
		changeQueue();
		queueControl(game.queue);
	}
	let x = selectedChecker.x;
	let y = selectedChecker.y;
	delete board[y][x].checker;
	const body = {
		x: checker.x,
		y: checker.y,
		currentX: selectedSquare.x,
		currentY: selectedSquare.y,
		king: false
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
		if(!updatePosition) ws.send(JSON.stringify({function: "makeMove", body}));
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

function isAttack(withoutSelectedSquare = false){
	if(selectedChecker.color === 'white' || selectedChecker.king){
		let counter = 0;
		while(counter !== 2){
			let x = selectedChecker.x + 2;
			if (counter === 1) x = selectedChecker.x - 2;
			let y = selectedChecker.y + 2;
			if(withoutSelectedSquare){
				if(x < 0 || y < 0 || x > 8 || y > 8){
					x = selectedChecker.x - 2;
					y = selectedChecker.y + 2;
					++counter;
					continue;
				} 
				selectedSquare = board[y][x];
			}
			if(selectedSquare === undefined) break;
			if(selectedSquare.x === x && selectedSquare.y === y && !selectedSquare.ocupied){
				let xC = selectedChecker.x + 1;
				if (counter === 1) xC = selectedChecker.x - 1;
				let yC = selectedChecker.y + 1;
				if(board[yC][xC].checker === undefined) break;
				if(board[yC][xC].ocupied && board[yC][xC].checker.color === "black" || selectedChecker.king){
					if(selectedChecker.king) {
						if(selectedChecker.color === board[yC][xC].checker.color) return {flag: false};
					}
					if(withoutSelectedSquare) return {waitingAttack: true}
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
			if(withoutSelectedSquare){
				if(x < 0 || y < 0 || x > 8 || y > 8){
					x = selectedChecker.x - 2;
					y = selectedChecker.y + 2;
					++counter;
					continue;
				}
				selectedSquare = board[y][x];
			}
			if(selectedSquare === undefined) break;
			if(selectedSquare.x === x && selectedSquare.y === y && !selectedSquare.ocupied){
				let xC = selectedChecker.x - 1;
				if (counter === 1) xC = selectedChecker.x + 1;
				let yC = selectedChecker.y - 1;
				if(board[yC][xC].checker === undefined) break;
				if(board[yC][xC].ocupied && board[yC][xC].checker.color === "white" || selectedChecker.king){
					if(selectedChecker.king) {
						if(selectedChecker.color === board[yC][xC].checker.color) return {flag: false};
					}
					if(withoutSelectedSquare) return {waitingAttack: true}
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

function attack(coordinates, updatePosition = false){
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
		score: {
			whiteCheckersCount,
			blackCheckersCount
		}
	}
	let waitingAttack = isAttack(true).waitingAttack;
	if(waitingAttack === undefined){
		changeQueue();
		queueControl(game.queue);
	}
	if(!updatePosition) ws.send(JSON.stringify({function: "attack", body, waitingAttack}));
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
	modalBody.innerText = `Победил: ${winner}`;

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
	ws.send(JSON.stringify({function: "newGame"}));
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
				delete result.flag;
				attack(result);
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
		if(player.color === game.queue && this.color === game.queue) selectedChecker = this;
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
let player = undefined;
let game = undefined;
let login = undefined;
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

function playerIdentification(players){
	for(let j = 0; j < players.length; ++j){
		if(players[j].login === login) return players[j];
	}
}

function loginIdentification(game, log){
	login = log;
	let players = game.players;
	players.forEach(player => {
		if(player.color === 'white'){
			let div = document.getElementById("white-login-name");
			div.innerText = player.login;
		}
		else{
			let div = document.getElementById("black-login-name");
			div.innerText = player.login;
		}
	});
}

function updatePosition(checker, isAttack = false){
	if(isAttack){
		checker.x = checker.fromX;
		checker.y = checker.fromY;
		checker.currentX = checker.toX;
		checker.currentY = checker.toY;
	}
	let square = board[checker.y][checker.x];
	selectedChecker = square.checker;
	selectedSquare = board[checker.currentY][checker.currentX];
	if(isAttack) attack({xAttacked: checker.xAttacked, yAttacked: checker.yAttacked}, true);
	else makeMove(selectedChecker, false, true);
}

function initBoard(data){
	if(data.gameFinished) gameFinished(data.winner);
	if(data.score) initScore(data.score);
	let squareClass = document.getElementsByClassName("square");
	let table = document.getElementById("table");
	let squareIndex = 0;
	kings = data.kings;
	player = playerIdentification(data.players);
	game = data;

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

function createLoginWindow(){
	let loginWindow = document.createElement("div");
	loginWindow.setAttribute("id", "login");
	loginWindow.classList.add("login");

	let label = document.createElement("label");
	label.innerText = "Enter Username";

	let input = document.createElement("input");
	input.setAttribute("id", "input_login");

	let labelInf = document.createElement("label");
	labelInf.setAttribute("id", "userExists");

	let button = document.createElement("button");
	button.innerText = "Log In";
	button.addEventListener("click", () => {
		includesUser(input.value);
	});

	loginWindow.appendChild(label);
	loginWindow.appendChild(input);
	loginWindow.appendChild(labelInf);
	loginWindow.appendChild(button);
	document.body.appendChild(loginWindow);
}

function deleteWindow(id){
	let window = document.getElementById(id);
	window.remove();
}

function includesUser(login){
    ws.send(JSON.stringify({function: "includesUser", login}));
}

createLoginWindow()