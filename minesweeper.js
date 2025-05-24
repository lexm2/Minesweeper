// ==UserScript==
// @name         Minesweeper Hacks
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Userscript for Minesweeper
// @author       Big Chungus
// @match        https://minesweeperonline.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=minesweeperonline.com
// ==/UserScript==

(function() {
    'use strict';
    console.log('Minesweeper userscript loaded!');
    
    function loadExternalScript() {
        const script = document.createElement('script');
        script.src = 'file:///path/to/your/minesweeper.js'; // This won't work directly due to security restrictions
        document.head.appendChild(script);
    }
    
    // Alternative: Copy your minesweeper.js code here
})();
