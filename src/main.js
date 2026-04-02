import Game from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    const game = new Game(canvas);

    // Responsive Resize Logic (canvas size only, NOT platform switching)
    window.addEventListener('resize', () => game.resize());

    game.resize();
    game.start();
});
