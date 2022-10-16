var http = require('http');
const PORT = 5000;
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

var server = http.createServer(function(req, res){
    console.log('Server request');
    console.log(req.url, req.method);
    if(req.method === 'POST'){
      req.on('data', (move) => {
        makeMove(JSON.parse(move)); //save attack or not
        //res.end();
      })
      console.log('POST')
    }
    if(req.method === 'GET'){
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader('Content-Type', 'application/json');

      res.write(JSON.stringify(board));
      res.end();
    } 
});

server.listen(PORT, 'localhost');

console.log(`Node.js web server at port ${PORT} is running...`);

function makeMove(move){
  let checker = board[move.y][move.x];
  board[move.y][move.x] = 0;
  board[move.currentY][move.currentX] = checker;
}