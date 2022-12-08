const express = require('express');
const app = express();
let bodyParser = require('body-parser');
let path = require('path');
let server = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server:server });

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(5000, function() {
    console.log('Server listening on 5000');
});



wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        let dataJSON = JSON.parse(data);
        let indexes = undefined;
        let gameIndex = undefined;
        let playerIndex = undefined;
        switch(dataJSON.function){
            case 'includesUser':
                let obj = includesUser(dataJSON.login);
                if(!obj.includesUser) gameManager(dataJSON.login, ws);
                if(obj.disconnected) restoreGame(obj.login, ws);
                else ws.send(JSON.stringify({includesUser: obj.includesUser}));
                break;

            case 'makeMove':
                indexes = findGameIndexes(ws);
                gameIndex = indexes.i;
                playerIndex = indexes.j;
                makeMove(dataJSON.body, playerIndex, gameIndex);
                break;

            case 'attack':
                indexes = findGameIndexes(ws);
                gameIndex = indexes.i;
                playerIndex = indexes.j;
                attack(dataJSON.body, playerIndex, gameIndex, dataJSON.waitingAttack);
                let game = isGameFinished(gameIndex);
                if(game.gameFinished){
                    sendGameFinished(game);
                }
                break;

            case 'newGame':
                indexes = findGameIndexes(ws);
                newGame(indexes)
                break;
        }
    });

    ws.on('close', () => {
        let flag = false;
        for(let i = 0; i < games.length; ++i){
            games[i].players.forEach(player => {
                if(player.ws === ws){ 
                    player.ws = undefined;
                    player.disconnected = true;
                    flag = true;
                }
                else sendEnemyDisconnected(player.ws);
            });
            if(flag) break;
        }
    });
});

function sendEnemyDisconnected(ws){
    ws.send(JSON.stringify({enemyDisconnected: true}));
}

function sendGameFinished(game){
    let players = game.players;
    players.forEach(player => player.ws.send(JSON.stringify({gameFinished: true, winner: game.winner})));
}

function restoreGame(login, ws){
    for(let i = 0; i < games.length; ++i){
        let game = games[i];
        let players = game.players;
        for(let j = 0; j < players.length; ++j){
            if(players[j].login === login){
                players[j].ws = ws;
                players[j].disconnected = false;
                if(players.length === 1){
                    players[0].includesUser = false;
                    ws.send(JSON.stringify({includesUser: false, waitingPlayer:true}));
                    return;
                }
                let sendWs = players[j].ws;
                let ws1 = game.players[0].ws;
                let ws2 = game.players[1].ws;
                delete game.players[0].ws;
                delete game.players[1].ws;
                let data = {
                    function: "initBoard",
                    game, 
                    login
                };
                sendWs.send(JSON.stringify(data));
                game.players[0].ws = ws1;
                game.players[1].ws = ws2;
            }
            else players[j].ws.send(JSON.stringify({enemyDisconnected: false, login: players[j].login}));
        }
    }
}

function newGame(indexes){
    let gameIndex = indexes.i;
    let playerIndex = indexes.j;
    let game = games[gameIndex];
    let player = game.players[playerIndex];
    player.allowNewGame = true;
    let players = game.players;
    if(players[0].allowNewGame && players[1].allowNewGame){
        resetGame(game)
        startGamesResponses(game, true);
    }
}

function resetGame(game){
    let players = game.players;
    players.forEach(player => player.allowNewGame = false);
    game.startGame = true;
    game.board = [
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
    ];
    game.kings = [];
    game.queue = 'white';
    game.score = undefined;
    game.gameFinished = false;
    game.winner = undefined;
}

let games = [];

function includesUser(login){
    if(games.length === 0) return false;
    else{
        console.log("includesUser")
        for(let i = 0; i < games.length; ++i){
            let game = games[i];
            let players = game.players;
            for(let j = 0; j < players.length; ++j){
                if(players[j].login === login) 
                    return {includesUser: true, ...players[j]}
            }
        }
        return {includesUser: false};
    }
}

function gameManager(login, ws){
    console.log("gameManager");
    if(games.length === 0){ 
        createNewGame(login, ws);
        sendPlayerWaitingFlag(ws);
        return;
    }
    let playersArray = games[games.length - 1].players;
    if(playersArray.length == 1){
        addPlayer(login, ws);
        startGamesResponses(games[games.length - 1], false, login);
    }
    else{ 
        createNewGame(login, ws);
        sendPlayerWaitingFlag(ws);
    }
}

function addPlayer(login, ws){
    console.log("addPlayer")
    games[games.length - 1].players.push({login, ws, disconnected: false, color: 'black', allowNewGame: false});
}

function startGamesResponses(game, newGame = false, login){
    console.log("startGamesResponses")
    game.startGame = true;
    let players = game.players;
    let copiedgame = JSON.parse(JSON.stringify(game));
    delete copiedgame.players[0].ws;
    delete copiedgame.players[1].ws;
    let data = {
        function: "initBoard",
        game: copiedgame,
        newGame
    };
    if(playerDisconnected(game)) return;
    players.forEach(player => {
        if(player.login === login) data.login = login;
        else data.login = player.login;
        player.ws.send(JSON.stringify(data))
    });
}

function playerDisconnected(game){
    let i = undefined;
    let players = game.players;
    for(let j = 0; j < players.length; ++j){
        if(players[j].disconnected){
            if(j === 0) i = 1;
            else i = 0;
            players[i].ws.send(JSON.stringify({includesUser: false, waitingPlayer:true}));
            return true;
        }
    }
}

function createNewGame(login, ws){
    console.log("createNewGame");
    let game = {
        players: [{login, ws, disconnected: false, color: 'white', allowNewGame: false}],
        startGame: false,
        board: [
          [1, 0, 1, 0, 1, 0, 1, 0],
          [0, 1, 0, 1, 0, 1, 0, 1],
          [1, 0, 1, 0, 1, 0, 1, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 2, 0, 2, 0, 2, 0, 2],
          [2, 0, 2, 0, 2, 0, 2, 0],
          [0, 2, 0, 2, 0, 2, 0, 2],
        ],
        kings: [],
        queue: 'white',
        score: undefined,
        gameFinished: false,
        winner: undefined
    };
    games.push(game);
}

function sendPlayerWaitingFlag(ws){
    ws.send(JSON.stringify({waitingPlayer: true}));
}

function findGameIndexes(ws){
    for(let i = 0; i < games.length; ++i){
        let game = games[i];
        let players = game.players;
        for(let j = 0; j < players.length; ++j){
            if(players[j].ws === ws) 
                return {i, j} 
        }
    }
}

function queueControl(gameIndex){
	if(games[gameIndex].queue === "white") games[gameIndex].queue = "black";
	else games[gameIndex].queue = "white";
}

function makeMove(data, playerIndex, gameIndex){
    let board = games[gameIndex].board;
    if(data.king) updateKingPosition(data, gameIndex);
    let checker = board[data.y][data.x];
    board[data.y][data.x] = 0;
    board[data.currentY][data.currentX] = checker;
    queueControl(gameIndex);
    sendUpdatedPosition(data, playerIndex, games[gameIndex]);
}

function sendUpdatedPosition(checker, playerIndex, game, attack = false){
    if(playerIndex === 0) playerIndex = 1;
    else playerIndex = 0;
    let player = game.players[playerIndex];
    let data = {
        function: "makeMove",
        checker,
        queue: game.queue
    };
    if(attack) data.function = "attack";
    player.ws.send(JSON.stringify(data));
}

function attack(data, playerIndex, gameIndex, waitingAttack){
    let board = games[gameIndex].board;
    games[gameIndex].score = data.score;
    if(data.king) updateKingPosition(data, gameIndex, true);
    let checker = board[data.fromY][data.fromX];
    board[data.fromY][data.fromX] = 0;
    board[data.toY][data.toX] = checker;
    board[data.yAttacked][data.xAttacked] = 0;
    if(!waitingAttack) queueControl(gameIndex);
    sendUpdatedPosition(data, playerIndex, games[gameIndex], true);
}

function updateKingPosition(data, gameIndex, attack = false){
    if(attack) {
        data['currentX'] = data['toX'];
        data['currentY'] = data['toY'];
    }
    let king = games[gameIndex].kings.find(king => king.x === data.x && king.y === data.y);
    if(!king) games[gameIndex].kings.push({x: data.currentX, y: data.currentY});
    else {
        king.x = data.currentX;
        king.y = data.currentY;
    }
}

function isGameFinished(gameIndex){
    let whiteCount = games[gameIndex].score.whiteCheckersCount;
    let blackCount = games[gameIndex].score.blackCheckersCount;
    if(whiteCount === 0 || blackCount === 0){
            games[gameIndex].gameFinished = true;
            if(blackCount > whiteCount) determineLoginWinner(gameIndex, "black");
            else determineLoginWinner(gameIndex, "white");
            return games[gameIndex];
    }
    return games[gameIndex];
}

function determineLoginWinner(gameIndex, color){
    let players = games[gameIndex].players;
    players.forEach(player => {
        if(player.color === color) games[gameIndex].winner = player.login;
    });
}