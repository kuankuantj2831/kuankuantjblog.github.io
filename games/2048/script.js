// 2048 Game Logic
document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gridSize = 4;
    let grid = [];
    let score = 0;
    let best = localStorage.getItem('2048-best') || 0;
    let gameOver = false;
    let won = false;
    let history = []; // for undo

    // DOM elements
    const gridElement = document.getElementById('grid');
    const scoreElement = document.getElementById('score');
    const bestElement = document.getElementById('best');
    const gameOverElement = document.getElementById('game-over');
    const winElement = document.getElementById('win');
    const finalScoreElement = document.getElementById('final-score');
    const newGameButton = document.getElementById('new-game');
    const undoButton = document.getElementById('undo');
    const howToPlayButton = document.getElementById('how-to-play');
    const closeInstructionsButton = document.getElementById('close-instructions');
    const instructionsElement = document.getElementById('instructions');
    const tryAgainButton = document.getElementById('try-again');
    const continueButton = document.getElementById('continue');

    // Initialize
    initGame();
    updateBest();

    // Initialize a new game
    function initGame() {
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        score = 0;
        gameOver = false;
        won = false;
        history = [];
        updateScore();
        hideGameOver();
        hideWin();
        clearGrid();
        addRandomTile();
        addRandomTile();
        renderGrid();
    }

    // Clear all tiles from the grid
    function clearGrid() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
    }

    // Add a random tile (2 or 4) to an empty cell
    function addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[r][c] = Math.random() < 0.9 ? 2 : 4; // 90% chance of 2, 10% chance of 4
            return true;
        }
        return false;
    }

    // Render the grid with tiles
    function renderGrid() {
        clearGrid();
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const value = grid[r][c];
                if (value !== 0) {
                    createTile(r, c, value);
                }
            }
        }
    }

    // Create a tile element
    function createTile(row, col, value) {
        const tile = document.createElement('div');
        tile.classList.add('tile', `tile-${value}`);
        tile.textContent = value;
        tile.dataset.row = row;
        tile.dataset.col = col;

        // Position
        const cellSize = 100 / gridSize;
        const left = col * cellSize + '%';
        const top = row * cellSize + '%';
        tile.style.left = left;
        tile.style.top = top;
        tile.style.width = `calc(${cellSize}% - 15px)`;
        tile.style.height = `calc(${cellSize}% - 15px)`;

        gridElement.appendChild(tile);
    }

    // Update score display
    function updateScore() {
        scoreElement.textContent = score;
        if (score > best) {
            best = score;
            localStorage.setItem('2048-best', best);
            updateBest();
        }
    }

    // Update best score display
    function updateBest() {
        bestElement.textContent = best;
    }

    // Show game over screen
    function showGameOver() {
        finalScoreElement.textContent = score;
        gameOverElement.classList.add('show');
    }

    // Hide game over screen
    function hideGameOver() {
        gameOverElement.classList.remove('show');
    }

    // Show win screen
    function showWin() {
        winElement.classList.add('show');
    }

    // Hide win screen
    function hideWin() {
        winElement.classList.remove('show');
    }

    // Move tiles in a direction
    function move(direction) {
        if (gameOver) return false;

        // Save current state for undo
        saveHistory();

        const oldGrid = grid.map(row => [...row]);
        let moved = false;

        // Transpose or reverse based on direction to simplify movement logic
        switch (direction) {
            case 'left':
                moved = moveLeft();
                break;
            case 'right':
                moved = moveRight();
                break;
            case 'up':
                moved = moveUp();
                break;
            case 'down':
                moved = moveDown();
                break;
        }

        if (moved) {
            addRandomTile();
            renderGrid();
            updateScore();
            checkWin();
            if (!hasMoves()) {
                gameOver = true;
                showGameOver();
            }
            return true;
        } else {
            // Restore history if no move happened
            history.pop();
            return false;
        }
    }

    // Move left
    function moveLeft() {
        let moved = false;
        for (let r = 0; r < gridSize; r++) {
            const row = grid[r];
            const newRow = slideAndMerge(row);
            for (let c = 0; c < gridSize; c++) {
                if (row[c] !== newRow[c]) {
                    moved = true;
                }
                grid[r][c] = newRow[c];
            }
        }
        return moved;
    }

    // Move right
    function moveRight() {
        let moved = false;
        for (let r = 0; r < gridSize; r++) {
            const row = grid[r];
            const reversed = [...row].reverse();
            const newReversed = slideAndMerge(reversed);
            const newRow = newReversed.reverse();
            for (let c = 0; c < gridSize; c++) {
                if (row[c] !== newRow[c]) {
                    moved = true;
                }
                grid[r][c] = newRow[c];
            }
        }
        return moved;
    }

    // Move up
    function moveUp() {
        transposeGrid();
        const moved = moveLeft();
        transposeGrid();
        return moved;
    }

    // Move down
    function moveDown() {
        transposeGrid();
        const moved = moveRight();
        transposeGrid();
        return moved;
    }

    // Transpose grid (rows become columns)
    function transposeGrid() {
        const newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                newGrid[c][r] = grid[r][c];
            }
        }
        grid = newGrid;
    }

    // Slide and merge a single row/array
    function slideAndMerge(arr) {
        let filtered = arr.filter(val => val !== 0);
        const result = [];
        for (let i = 0; i < filtered.length; i++) {
            if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
                result.push(filtered[i] * 2);
                score += filtered[i] * 2;
                i++;
            } else {
                result.push(filtered[i]);
            }
        }
        while (result.length < gridSize) {
            result.push(0);
        }
        return result;
    }

    // Check if there are any possible moves
    function hasMoves() {
        // Check for empty cells
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) return true;
            }
        }

        // Check adjacent equal values
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const val = grid[r][c];
                if (c + 1 < gridSize && grid[r][c + 1] === val) return true;
                if (r + 1 < gridSize && grid[r + 1][c] === val) return true;
            }
        }

        return false;
    }

    // Check if player has reached 2048
    function checkWin() {
        if (won) return;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 2048) {
                    won = true;
                    showWin();
                    return;
                }
            }
        }
    }

    // Save current grid and score to history
    function saveHistory() {
        history.push({
            grid: grid.map(row => [...row]),
            score: score
        });
        // Keep only last 10 states
        if (history.length > 10) {
            history.shift();
        }
    }

    // Undo last move
    function undo() {
        if (history.length === 0) return;
        const state = history.pop();
        grid = state.grid.map(row => [...row]);
        score = state.score;
        gameOver = false;
        won = false;
        updateScore();
        hideGameOver();
        hideWin();
        renderGrid();
    }

    // Event Listeners

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameOver && !won) return;
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                move('right');
                break;
            case 'ArrowUp':
                e.preventDefault();
                move('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                move('down');
                break;
        }
    });

    // Swipe support for touch devices
    let touchStartX, touchStartY;
    gridElement.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });

    gridElement.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const minSwipe = 30;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (Math.abs(dx) > minSwipe) {
                if (dx > 0) {
                    move('right');
                } else {
                    move('left');
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(dy) > minSwipe) {
                if (dy > 0) {
                    move('down');
                } else {
                    move('up');
                }
            }
        }

        touchStartX = null;
        touchStartY = null;
        e.preventDefault();
    }, { passive: false });

    // Button events
    newGameButton.addEventListener('click', () => {
        initGame();
    });

    undoButton.addEventListener('click', () => {
        undo();
    });

    howToPlayButton.addEventListener('click', () => {
        instructionsElement.classList.add('show');
    });

    closeInstructionsButton.addEventListener('click', () => {
        instructionsElement.classList.remove('show');
    });

    tryAgainButton.addEventListener('click', () => {
        initGame();
    });

    continueButton.addEventListener('click', () => {
        hideWin();
    });

    // Initialize touch support notice
    if ('ontouchstart' in window) {
        console.log('Touch supported');
    }
});