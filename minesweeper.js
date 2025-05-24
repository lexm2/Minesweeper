// ==UserScript==
// @name         Minesweeper Auto-Solver
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically solves Minesweeper on minesweeperonline.com
// @author       You
// @match        https://minesweeperonline.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/lexm2/Minesweeper/refs/heads/master/minesweeper.js
// @downloadURL  https://raw.githubusercontent.com/lexm2/Minesweeper/refs/heads/master/minesweeper.js
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const SOLVE_DELAY = 300; // Milliseconds between moves
    let isSolving = false;
    let solverInterval = null;

    // Add solver UI
    function addSolverUI() {
        const controlPanel = document.createElement('div');
        controlPanel.style.position = 'fixed';
        controlPanel.style.bottom = '10px';
        controlPanel.style.right = '10px';
        controlPanel.style.padding = '10px';
        controlPanel.style.backgroundColor = '#f0f0f0';
        controlPanel.style.border = '1px solid #ccc';
        controlPanel.style.zIndex = '9999';

        const solveButton = document.createElement('button');
        solveButton.textContent = 'Auto Solve';
        solveButton.style.marginRight = '5px';
        solveButton.addEventListener('click', toggleSolver);

        const stepButton = document.createElement('button');
        stepButton.textContent = 'Single Step';
        stepButton.addEventListener('click', () => solveSingleStep());

        controlPanel.appendChild(solveButton);
        controlPanel.appendChild(stepButton);
        document.body.appendChild(controlPanel);
    }

    // Toggle continuous solving
    function toggleSolver() {
        if (isSolving) {
            stopSolver();
        } else {
            startSolver();
        }
    }

    function startSolver() {
        isSolving = true;
        solverInterval = setInterval(solveSingleStep, SOLVE_DELAY);
        console.log('Minesweeper solver started');
    }

    function stopSolver() {
        isSolving = false;
        clearInterval(solverInterval);
        console.log('Minesweeper solver stopped');
    }

    // Board state functions
    function getBoardState() {
        const board = [];
        const gameDiv = document.getElementById('game');
        const rows = gameDiv.querySelectorAll('div.square');
        
        // Determine board dimensions
        let width = 0;
        let height = 0;
        
        // Get width by finding the first row
        let firstRowY = null;
        if (rows.length > 0) {
            firstRowY = rows[0].getBoundingClientRect().top;
            // Count squares in first row
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].getBoundingClientRect().top === firstRowY) {
                    width++;
                } else {
                    break;
                }
            }
            height = rows.length / width;
        }
        
        // Initialize board
        for (let y = 0; y < height; y++) {
            board[y] = [];
            for (let x = 0; x < width; x++) {
                board[y][x] = {
                    x: x,
                    y: y,
                    element: rows[y * width + x],
                    state: getCellState(rows[y * width + x]),
                    value: getCellValue(rows[y * width + x])
                };
            }
        }
        
        return board;
    }

    function getCellState(element) {
        if (element.classList.contains('blank')) return 'hidden';
        if (element.classList.contains('bombflagged')) return 'flagged';
        if (element.classList.contains('bombrevealed')) return 'bomb';
        return 'revealed';
    }

    function getCellValue(element) {
        // Return numeric value for revealed cells
        if (element.classList.contains('open0')) return 0;
        if (element.classList.contains('open1')) return 1;
        if (element.classList.contains('open2')) return 2;
        if (element.classList.contains('open3')) return 3;
        if (element.classList.contains('open4')) return 4;
        if (element.classList.contains('open5')) return 5;
        if (element.classList.contains('open6')) return 6;
        if (element.classList.contains('open7')) return 7;
        if (element.classList.contains('open8')) return 8;
        return null;
    }

    // Solver logic
    function solveSingleStep() {
        const board = getBoardState();
        if (!board.length) return;
        
        // First move - click in the middle if no cells are revealed
        if (isFirstMove(board)) {
            makeFirstMove(board);
            return;
        }
        
        // Basic solving strategy
        const move = findNextMove(board);
        if (move) {
            executeMove(move);
            return true;
        }
        
        // No obvious moves found
        console.log('No obvious moves found');
        stopSolver();
        return false;
    }

    function isFirstMove(board) {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x].state === 'revealed') {
                    return false;
                }
            }
        }
        return true;
    }

    function makeFirstMove(board) {
        // Click in the middle of the board
        const middleY = Math.floor(board.length / 2);
        const middleX = Math.floor(board[0].length / 2);
        clickCell(board[middleY][middleX].element);
    }

    function findNextMove(board) {
        // First, look for obvious flags (cells where all adjacent mines are accounted for)
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const cell = board[y][x];
                
                if (cell.state === 'revealed' && cell.value > 0) {
                    const neighbors = getNeighbors(board, x, y);
                    const hiddenNeighbors = neighbors.filter(n => n.state === 'hidden');
                    const flaggedNeighbors = neighbors.filter(n => n.state === 'flagged');
                    
                    // If the number of flags equals the cell value, reveal hidden neighbors
                    if (flaggedNeighbors.length === cell.value && hiddenNeighbors.length > 0) {
                        return {
                            type: 'reveal',
                            cells: hiddenNeighbors
                        };
                    }
                    
                    // If the number of hidden cells equals remaining bombs, flag them all
                    if (hiddenNeighbors.length + flaggedNeighbors.length === cell.value && 
                        hiddenNeighbors.length > 0) {
                        return {
                            type: 'flag',
                            cells: hiddenNeighbors
                        };
                    }
                }
            }
        }
        
        // Try probability-based approach for more complex scenarios
        // This is a simplified approach - for a complete solver, more complex patterns would be needed
        return findProbabilisticMove(board);
    }

    function getNeighbors(board, x, y) {
        const neighbors = [];
        const height = board.length;
        const width = board[0].length;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    neighbors.push(board[ny][nx]);
                }
            }
        }
        
        return neighbors;
    }

    function findProbabilisticMove(board) {
        // Simple probabilistic approach: find cell with lowest mine probability
        let bestCell = null;
        let lowestProbability = 1.0;
        
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const cell = board[y][x];
                
                if (cell.state === 'hidden') {
                    const probability = calculateMineProbability(board, x, y);
                    
                    if (probability < lowestProbability) {
                        lowestProbability = probability;
                        bestCell = cell;
                    }
                    
                    // If we find a cell with zero probability, use it immediately
                    if (probability === 0) {
                        return {
                            type: 'reveal',
                            cells: [bestCell]
                        };
                    }
                }
            }
        }
        
        // If we found a cell with probability < 0.3, try it
        if (bestCell && lowestProbability < 0.3) {
            return {
                type: 'reveal',
                cells: [bestCell]
            };
        }
        
        // As a last resort, pick a random hidden cell
        const hiddenCells = [];
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x].state === 'hidden') {
                    hiddenCells.push(board[y][x]);
                }
            }
        }
        
        if (hiddenCells.length > 0) {
            const randomCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
            return {
                type: 'reveal',
                cells: [randomCell]
            };
        }
        
        return null;
    }

    function calculateMineProbability(board, x, y) {
        const neighbors = getNeighbors(board, x, y);
        let totalProbability = 0;
        let contributingNeighbors = 0;
        
        for (const neighbor of neighbors) {
            if (neighbor.state === 'revealed' && neighbor.value > 0) {
                const neighborNeighbors = getNeighbors(board, neighbor.x, neighbor.y);
                const hiddenNeighborNeighbors = neighborNeighbors.filter(n => n.state === 'hidden');
                const flaggedNeighborNeighbors = neighborNeighbors.filter(n => n.state === 'flagged');
                
                // Calculate local probability
                const remainingMines = neighbor.value - flaggedNeighborNeighbors.length;
                const remainingCells = hiddenNeighborNeighbors.length;
                
                if (remainingCells > 0) {
                    totalProbability += remainingMines / remainingCells;
                    contributingNeighbors++;
                }
            }
        }
        
        // Return average probability from all contributing neighbors
        return contributingNeighbors > 0 ? totalProbability / contributingNeighbors : 0.5;
    }

    // UI interaction
    function executeMove(move) {
        if (!move || !move.cells || move.cells.length === 0) return;
        
        const cell = move.cells[0]; // Just use the first cell for simplicity
        
        if (move.type === 'reveal') {
            clickCell(cell.element);
        } else if (move.type === 'flag') {
            rightClickCell(cell.element);
        }
    }

    function clickCell(element) {
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0
        });
        element.dispatchEvent(event);
        
        const upEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0
        });
        element.dispatchEvent(upEvent);
    }

    function rightClickCell(element) {
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2
        });
        element.dispatchEvent(event);
        
        const upEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2
        });
        element.dispatchEvent(upEvent);
    }

    // Initialize the solver when the page is fully loaded
    window.addEventListener('load', function() {
        // Add a slight delay to ensure the game is properly initialized
        setTimeout(function() {
            addSolverUI();
            console.log('Minesweeper Solver Ready!');
        }, 1000);
    });
})();
