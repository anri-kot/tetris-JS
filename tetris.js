const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const canvasDisplay = document.getElementById('canvasDisplay');
const image = document.getElementById('image');
const scoreDisplay = document.querySelector("span#score");
scoreDisplay.textContent = 0;

const BOARD_WIDTH = 350;
const BOARD_HEIGHT = 700;
const ROWS = 20;
const COLS = 10;
const SQ_SIZE = BOARD_WIDTH / COLS;
const EMPTY = "rgba(255, 99, 71, 0)";
const COLORS = ["#66C5CC", "#F6CF71", "#F89C74", "#DCB0F2", "#87C55F", "#9EB9F3", "#FE88B1", "#8BE0A4"];

canvas.width = BOARD_WIDTH;
canvas.height = BOARD_HEIGHT;

canvasDisplay.style.width = `${BOARD_WIDTH}px`;
canvasDisplay.style.height = `${BOARD_HEIGHT}px`;

let score = 0;
let gameOver = false;
let dropStart = Date.now();

// ---- Draw ----

let board = [];
for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
        board[r][c] = EMPTY;
    }
}

function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SQ_SIZE, y * SQ_SIZE, SQ_SIZE, SQ_SIZE);
    ctx.strokeStyle = "white";
    ctx.strokeRect(x * SQ_SIZE, y * SQ_SIZE, SQ_SIZE, SQ_SIZE);
}

function undrawSquare(x, y) {
    ctx.clearRect(x * SQ_SIZE, y * SQ_SIZE, SQ_SIZE, SQ_SIZE);
    drawBoard();
}

function drawBoard() {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

drawBoard();

// ---- Pieces ----

const PIECES = [Z,T,S,L,J,I,O];

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
    fill(color) {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                if (this.activeTetromino[r][c]) {
                    drawSquare(this.x + c, this.y + r, color);
                }
            }
        }
    }
    remove() {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                if (this.activeTetromino[r][c]) {
                    undrawSquare(this.x + c, this.y + r);
                }
            }
        }
    }
    draw() {
        this.fill(this.color);
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
            p = randomPiece();
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
                    alert("Game Over. Press Restart to try again.")
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

let p = randomPiece(); // piece object generator

// ---- Control ----

function CONTROL(event) {
    if(event.keyCode == 37) {
        p.moveLeft();
        dropStart = Date.now();
    } else if(event.keyCode == 38) {
        p.rotate();
        dropStart = Date.now();
    } else if(event.keyCode == 39) {
        p.moveRight();
        dropStart = Date.now();
    } else if(event.keyCode == 40) {
        p.moveDown();
        dropStart = Date.now();
    }
}

//---- Game ----

function drop() {
    let now = Date.now();
    let delta = now - dropStart;
    if (delta > 1000) {
        p.moveDown();
        dropStart = Date.now();
    }
    if (!gameOver) {
        requestAnimationFrame(drop);
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

    drawBoard();
    score = 0;
    scoreDisplay.innerText = 0;
    gameOver = false;
    dropStart = Date.now();
    drop();
}