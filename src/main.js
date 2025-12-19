import Game from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    // Auto-resize canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const game = new Game(canvas);
    game.start();
});
