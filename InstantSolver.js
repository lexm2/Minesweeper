// ==UserScript==
// @name         Instant Minesweeper Solver
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Solves Minesweeper instantly by clicking all safe cells
// @author       You
// @match        https://minesweeperonline.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    const solveButton = document.createElement('button');
    solveButton.textContent = 'Solve Instantly';
    solveButton.style.position = 'fixed';
    solveButton.style.bottom = '10px';
    solveButton.style.right = '10px';
    solveButton.style.zIndex = '9999';
    solveButton.addEventListener('click', solveInstantly);
    document.body.appendChild(solveButton);
    
    function solveInstantly() {
        document.getElementById('export-link').click();
        
        setTimeout(() => {
            const exportTextarea = document.querySelector('#export textarea');
            if (!exportTextarea || !exportTextarea.value) {
                document.getElementById('export-close').click();
                return;
            }
            
            try {
                const gameState = JSON.parse(atob(exportTextarea.value));
                console.log('Game state obtained', gameState);
                
                document.getElementById('export-close').click();
                
                const mines = {};
                const numRows = gameState.numRows;
                const numCols = gameState.numCols;
                
                for (let row = 1; row <= numRows; row++) {
                    for (let col = 1; col <= numCols; col++) {
                        const cell = gameState.gridObj[row][col];
                        let value;
                        
                        if (Array.isArray(cell)) {
                            value = cell[0];
                        } else if (typeof cell === 'number') {
                            value = cell;
                        } else if (cell && typeof cell.value !== 'undefined') {
                            value = cell.value;
                        }
                        
                        if (value < 0) {
                            mines[`${row}_${col}`] = true;
                        }
                    }
                }
                
                console.log(`Found ${Object.keys(mines).length} mines`);
                let clicksPerformed = 0;

                for (let row = 1; row <= numRows; row++) {
                    for (let col = 1; col <= numCols; col++) {
                        if (mines[`${row}_${col}`]) continue;
                        
                        const cell = gameState.gridObj[row][col];
                        let isRevealed = false;

                        if (Array.isArray(cell)) {
                            isRevealed = cell[1] === 1;
                        } else if (typeof cell === 'object' && cell !== null) {
                            isRevealed = cell.isRevealed === true;
                        }
                        
                        if (isRevealed) continue;
                        
                        const cellElement = document.getElementById(`${row}_${col}`);
                        if (cellElement) {

                            const mouseDown = new MouseEvent('mousedown', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                button: 0
                            });
                            
                            const mouseUp = new MouseEvent('mouseup', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                button: 0
                            });
                            
                            cellElement.dispatchEvent(mouseDown);
                            cellElement.dispatchEvent(mouseUp);
                            clicksPerformed++;
                        }
                    }
                }
                
            } catch (e) {
                console.error('Error solving game:', e);
                alert('Error solving game: ' + e.message);
            }
        }, 100);
    }
})();