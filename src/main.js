import Game from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    // Fixed Logical Resolution (HD 720p)
    const GAME_WIDTH = 1280;
    const GAME_HEIGHT = 720;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const game = new Game(canvas);

    // Responsive Resize Logic
    function resize() {
        game.resize();
    }
    window.addEventListener('resize', resize);

    // Initial size
    // We need to wait for game to be created so resize can be called?
    // Actually game constructor is synchronous.
    // game.resize() is safe to call immediately after.
    game.resize();

    game.start();
});
