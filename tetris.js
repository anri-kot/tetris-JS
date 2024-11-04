const gameBoardDisplay = document.getElementById('tetris');
const ctx = gameBoardDisplay.getContext('2d');
const nextPieceDisplay = document.getElementById("nextPieceDisplay");
const nxtCtx = nextPieceDisplay.getContext('2d');

const canvasDisplay = document.getElementById('canvasDisplay');
const image = document.getElementById('image');
const scoreDisplay = document.querySelector("span#score");
scoreDisplay.textContent = 0;

const BOARD_WIDTH = 350;
const BOARD_HEIGHT = 700;
const ROWS = 20;
const COLS = 10;
const SQ_SIZE = BOARD_WIDTH / COLS;
const PIECES = [Z, T, S, L, J, I, O];

const EMPTY = "rgba(255, 99, 71, 0)";
const COLORS = ["#66C5CC", "#F6CF71", "#F89C74", "#DCB0F2", "#87C55F", "#9EB9F3", "#FE88B1", "#8BE0A4"];

gameBoardDisplay.width = BOARD_WIDTH;
gameBoardDisplay.height = BOARD_HEIGHT;

canvasDisplay.style.width = `${BOARD_WIDTH}px`;
canvasDisplay.style.height = `${BOARD_HEIGHT}px`;

/*
    FIX PIECE.FILL METHOD, REFACTORING PARAMETERS
*/

let score;
let level;
let gameOver = false;
let dropStart = Date.now();
let fallSpeed;
let currentPiece; // current piece object
let nextPiece; // next piece object


// ---- Draw ----

let board = [];
for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
        board[r][c] = EMPTY;
    }
}

function drawSquare(x, y, color, squareSize, context) {
    context.fillStyle = color;
    context.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
    context.strokeStyle = "white";
    context.strokeRect(x * squareSize, y * squareSize, squareSize, squareSize);
}

function undrawBoardSquare(x, y) {
    ctx.clearRect(x * SQ_SIZE, y * SQ_SIZE, SQ_SIZE, SQ_SIZE);
    drawBoard();
}

function drawBoard() {
    ctx.drawImage(image, 0, 0, gameBoardDisplay.width, gameBoardDisplay.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, gameBoardDisplay.width, gameBoardDisplay.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawSquare(c, r, board[r][c], SQ_SIZE, ctx);
        }
    }
}

let displaySqrSize = Math.floor(150 / 4);
const DISPLAY_SIZE = parseInt(nextPieceDisplay.width);
let displayGridSize = Math.floor(DISPLAY_SIZE / displaySqrSize);
let pieceDisplay = [];
for (let r = 0; r < displayGridSize; r++) {
    pieceDisplay[r] = [];
    for (let c = 0; c < displayGridSize; c++) {
        pieceDisplay[r][c] = EMPTY;
    }
}

function undrawDisplayquare(x, y) {
    ctx.clearRect(x * displaySqrSize, y * displaySqrSize, displaySqrSize, displaySqrSize);
    drawPieceDisplay();
}

function drawPieceDisplay() {
    if (nextPiece) {
        displaySqrSize = DISPLAY_SIZE / nextPiece.activeTetromino.length;
        displayGridSize = nextPiece.activeTetromino.length;
        pieceDisplay = []
        for (let r = 0; r < displayGridSize; r++) {
            pieceDisplay[r] = []
            for (let c = 0; c < displayGridSize; c++) {
                if (nextPiece.activeTetromino[r][c]) {
                    pieceDisplay[r][c] = nextPiece.color;
                } else {
                    pieceDisplay[r][c] = EMPTY;
                }
            }
        }
    }
    console.log(pieceDisplay);
    nxtCtx.fillStyle = "black";
    nxtCtx.fillRect(0, 0, nextPieceDisplay.width, nextPieceDisplay.height);
    for (let r = 0; r < displayGridSize; r++) {
        for (let c = 0; c < displayGridSize; c++) {
            drawSquare(c, r, pieceDisplay[r][c], displaySqrSize, nxtCtx);
        }
    }
}

drawPieceDisplay();
drawBoard();

// ---- Pieces ----

class Piece {
    constructor(tetromino, color) {
        this.tetromino = tetromino;
        this.color = color;

        this.tetrominoN = 0; // start from the first pattern
        this.activeTetromino = this.tetromino[this.tetrominoN];

        // piece start position
        this.x = 3;
        this.y = -Math.abs(tetromino[0].length);
    }

    fill(color, squareSize, context) {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                if (this.activeTetromino[r][c]) {
                    drawSquare(this.x + c, this.y + r, color, squareSize, context);
                }
            }
        }
    }

    remove() {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                if (this.activeTetromino[r][c]) {
                    undrawBoardSquare(this.x + c, this.y + r);
                }
            }
        }
    }

    draw() {
        this.fill(this.color, SQ_SIZE, ctx);
    }

    unDraw() {
        this.remove();
    }

    // ---- Movement ----

    moveDown() {
        if (!this.collision(0, 1, this.activeTetromino)) {
            this.unDraw();
            this.y++;
            this.draw();
        } else {
            // lock piece and generate a new one
            this.lock();
            currentPiece = nextPiece;
            nextPiece = randomPiece();
            drawPieceDisplay();
        }
    }

    // Move Right

    moveRight() {
        if (!this.collision(1, 0, this.activeTetromino)) {
            this.unDraw();
            this.x++;
            this.draw();
        }

    }

    // Move Left

    moveLeft() {
        if (!this.collision(-1, 0, this.activeTetromino)) {
            this.unDraw();
            this.x--;
            this.draw();
        }
    }

    // Rotate

    rotate() {
        let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
        let kick = 0;

        if (this.collision(0, 0, nextPattern)) {
            if (this.x > COLS / 2) {
                //right wall
                kick = -1;
            } else {
                //left wall
                kick = 1;
            }
        }

        if (!this.collision(kick, 0, nextPattern)) {
            this.unDraw();
            this.x += kick;
            this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length; // (0 + 1) % 4 = 1
            this.activeTetromino = this.tetromino[this.tetrominoN];
            this.draw();
        }
    }

    // ---- Core Mechanics ----

    // Lock piece

    lock() {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                if (!this.activeTetromino[r][c]) {
                    continue;
                }
                if (this.y + r < 0) {
                    gameOver = true;
                    break;
                }
                board[this.y + r][this.x + c] = this.color;
            }
        }
        //clear rows
        this.clear();
    }

    // Clear rows and calculate score

    clear() {
        for (let r = 0; r < ROWS; r++) {
            let isRowFull = true;
            for (let c = 0; c < COLS; c++) {
                isRowFull = isRowFull && (board[r][c] != EMPTY);
            }
            if (isRowFull) {
                for (let y = r; y > 1; y--) {
                    for (let c = 0; c < COLS; c++) {
                        board[y][c] = board[y - 1][c];
                    }
                }
                for (let c = 0; c < COLS; c++) {
                    board[0][c] = EMPTY;
                }
                score += 10;
                level++;
                if (level % 2 === 0 && score <= 200) {
                    fallSpeed = 1000 - 75 * (level);
                    console.log(fallSpeed);
                }
                scoreDisplay.textContent = score;
            }
        }
        drawBoard();
    }

    // Collision

    collision(x, y, piece) {
        for (let r = 0; r < piece.length; r++) {
            for (let c = 0; c < piece.length; c++) {
                // Empty square
                if (!piece[r][c]) {
                    continue;
                }
                // coordinates after movement
                let newX = this.x + c + x;
                let newY = this.y + r + y;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                if (newY < 0) {
                    continue;
                }
                if (board[newY][newX] != EMPTY) {
                    return true;
                }
            }
        }
        return false;
    }
}

// random piece

function randomPiece() {
    let r = Math.floor(Math.random() * PIECES.length);
    let c = Math.floor(Math.random() * COLORS.length);
    return new Piece(PIECES[r], COLORS[c]);
}

// ---- Control ----

function CONTROL(event) {
    if (event.keyCode == 37) {
        currentPiece.moveLeft();
        dropStart = Date.now();
    } else if (event.keyCode == 38) {
        currentPiece.rotate();
        dropStart = Date.now();
    } else if (event.keyCode == 39) {
        currentPiece.moveRight();
        dropStart = Date.now();
    } else if (event.keyCode == 40) {
        currentPiece.moveDown();
        dropStart = Date.now();
    }
}

//---- Game ----

function drop() {
    let now = Date.now();
    let delta = now - dropStart;
    if (delta > fallSpeed) {
        currentPiece.moveDown();
        dropStart = Date.now();
    }
    if (!gameOver) {
        requestAnimationFrame(drop);
    } else {
        alert("Game Over. Press Restart to try again.");
    }
}

function gameStart() {
    document.addEventListener("keydown", CONTROL);
    const btn = document.getElementById('start');
    btn.innerText = "Restart Game";

    board = [];
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            board[r][c] = EMPTY;
        }
    }
    
    pieceDisplay = [];
    for (let r = 0; r < displaySqrSize; r++) {
        pieceDisplay[r] = [];
        for (let c = 0; c < displaySqrSize; c++) {
            pieceDisplay[r][c] = EMPTY;
        }
    }

    drawBoard();
    score = 0;
    level = 0;
    fallSpeed = 1000;
    scoreDisplay.innerText = 0;
    gameOver = false;
    dropStart = Date.now();
    currentPiece = randomPiece();
    nextPiece = randomPiece();
    drawPieceDisplay();
    drop();
}