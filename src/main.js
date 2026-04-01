import Game from './core/Game.js';
import { Platform } from './Platform.js';

window.addEventListener('DOMContentLoaded', () => {
    // Detect platform once — commits to PC or Mobile for the session
    Platform.detect();

    const canvas = document.getElementById('gameCanvas');

    const game = new Game(canvas);

    // Responsive Resize Logic (canvas size only, NOT platform switching)
    function resize() {
        game.resize();
    }
    window.addEventListener('resize', resize);

    game.resize();
    game.start();
});
