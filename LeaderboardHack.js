// ==UserScript==
// @name         Minesweeper Leaderboard Hack (Fixed)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Submit fake scores to Minesweeper leaderboard
// @author       You
// @match        https://minesweeperonline.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // Add our control panel
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.bottom = '10px';
    panel.style.right = '10px';
    panel.style.padding = '10px';
    panel.style.backgroundColor = '#f0f0f0';
    panel.style.border = '1px solid #ccc';
    panel.style.zIndex = '9999';
    
    // Create form
    panel.innerHTML = `
        <div style="margin-bottom:5px;">
            <label>Mode: 
                <select id="fake-mode">
                    <option value="1">Beginner</option>
                    <option value="2">Intermediate</option>
                    <option value="3" selected>Expert</option>
                </select>
            </label>
        </div>
        <div style="margin-bottom:5px;">
            <label>Time (seconds): 
                <input type="number" id="fake-time" value="45" min="1" max="999">
            </label>
        </div>
        <div style="margin-bottom:5px;">
            <label>Name: 
                <input type="text" id="fake-name" value="Player" maxlength="25">
            </label>
        </div>
        <button id="hack-button">Submit to Leaderboard</button>
        <div id="hack-status" style="margin-top:5px;"></div>
    `;
    
    document.body.appendChild(panel);
    
    // Add click handler for the button
    document.getElementById('hack-button').addEventListener('click', hackLeaderboard);
    
    function updateStatus(message) {
        document.getElementById('hack-status').textContent = message;
    }
    
    function hackLeaderboard() {
        // Get values from form
        const gameTypeId = parseInt(document.getElementById('fake-mode').value);
        const time = parseInt(document.getElementById('fake-time').value);
        const name = document.getElementById('fake-name').value.trim();
        
        if (!name) {
            updateStatus('Please enter a name');
            return;
        }
        
        updateStatus('Starting process...');
        
        // Send our requests directly without manipulating the game state
        // Generate a valid key and send proper sequence of requests
        sendRequests(gameTypeId, time, name);
    }
    
    function sendRequests(gameTypeId, time, name) {
        // Generate a key using the same algorithm as the game
        const key = generateGameKey(gameTypeId);
        
        updateStatus('Registering game with server...');
        
        // First, register the game start
        fetch('start.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `key=${encodeURIComponent(key)}&s=3`  // 3 = middle area click
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            updateStatus('Game registered, submitting scores...');
            
            // Wait a realistic amount of time based on the desired score
            // For extremely fast times, use a longer delay to appear more legitimate
            const waitTime = Math.max(2000, time * 50);
            
            return new Promise(resolve => setTimeout(() => resolve(), waitTime));
        })
        .then(() => {
            const nameEntryTime = Math.floor(Math.random() * 3) + 1;
            
            // Submit scores to all leaderboards
            const promises = [];
            
            // Daily scores (i=1)
            promises.push(
                fetch('win.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}&time=${time}&s=${nameEntryTime}&i=1&h=0`
                })
            );
            
            // Weekly scores (i=2)
            promises.push(
                fetch('win.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}&time=${time}&s=${nameEntryTime}&i=2&h=0`
                })
            );
            
            // Monthly scores (i=3)
            promises.push(
                fetch('win.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}&time=${time}&s=${nameEntryTime}&i=3&h=0`
                })
            );
            
            // All-time scores (i=4)
            promises.push(
                fetch('win.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}&time=${time}&s=${nameEntryTime}&i=4&h=0`
                })
            );
            
            return Promise.all(promises);
        })
        .then(() => {
            updateStatus('Scores submitted successfully!');
            
            // Refresh the scores display to show new entries
            $('#scores-panes').load('scores-panes.php?interval=1&r=' + Math.random());
            $('#daily-link').click();
        })
        .catch(error => {
            console.error('Error in submission process:', error);
            updateStatus('Error: ' + error.message);
        });
    }
    
    // Generate a valid game key
    function generateGameKey(gameTypeId) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let key = "";
        
        // First 3 random chars
        for (let i = 0; i < 3; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Encode game type
        const randomNum = Math.floor(Math.random() * 225) + 25;
        key += (4 * randomNum + gameTypeId);
        
        // Last 4 random chars
        for (let i = 0; i < 4; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return key;
    }
})();
