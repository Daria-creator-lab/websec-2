const express = require('express');
const app = express();
let bodyParser = require('body-parser');
let path = require('path');

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/initBoard', (request, response) => {
    response.send(dataContainer);
});

app.post('/makeMove', (request, response) => {
    makeMove(request.body);
    response.sendStatus(200);
});

app.post('/attack', (request, response) => {
    attack(request.body);
    if(isGameFinished()){
        response.status(200);
        return response.send({gameFinished: true, winner: dataContainer.winner});
    }
    response.sendStatus(200);
});

app.get('/newGame', (request, response) => {
    dataContainer.board = [
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
    ];
    dataContainer.kings = [];
    dataContainer.queue = 'white';
    dataContainer.score = {
        whiteCheckersCount: 12, 
        blackCheckersCount: 12
    };
    dataContainer.gameFinished = false;
    dataContainer.winner = undefined;
    response.send(dataContainer);
});

app.listen(5000);

let board = [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
];

let kings = [];
let queue = 'white';
let score = undefined;
let gameFinished = false;
let winner = undefined;

let dataContainer = {
    board,
    kings,
    queue,
    score,
    gameFinished,
    winner
};

function makeMove(data){
    dataContainer.queue = data.queue;
    let board = dataContainer.board;
    if(data.king) updateKingPosition(data);
    let checker = board[data.y][data.x];
    board[data.y][data.x] = 0;
    board[data.currentY][data.currentX] = checker;
}

function attack(data){
    let board = dataContainer.board;
    dataContainer.score = data.score;
    dataContainer.queue = data.queue;
    if(data.king) updateKingPosition(data, true);
    let checker = board[data.fromY][data.fromX];
    board[data.fromY][data.fromX] = 0;
    board[data.toY][data.toX] = checker;
    board[data.yAttacked][data.xAttacked] = 0;
}

function updateKingPosition(data, attack = false){
    if(attack) {
        data['currentX'] = data['toX'];
        data['currentY'] = data['toY'];
    }
    let king = kings.find(king => king.x === data.x && king.y === data.y);
    if(!king) kings.push({x: data.currentX, y: data.currentY});
    else {
        king.x = data.currentX;
        king.y = data.currentY;
    }
}

function isGameFinished(){
    let whiteCount = dataContainer.score.whiteCheckersCount;
    let blackCount = dataContainer.score.blackCheckersCount;
    if(whiteCount === 0 || blackCount === 0){
            dataContainer.gameFinished = true;
            if(blackCount > whiteCount) dataContainer.winner = 'black';
            else dataContainer.winner = 'white';
            return true;
    }
    return false;
}