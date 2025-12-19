import Input from './Input.js';
import Camera from './Camera.js';
import World from './World.js';
import UIManager from './ui/UIManager.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.step = 1 / 60;

        this.level = 1;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('roguelike_highscore')) || 0;
        this.isGameOver = false;
        this.isPaused = false; // Inventory Pause

        this.input = new Input(this);
        this.camera = new Camera(this, 0, 0);
        this.world = new World(this);
        this.ui = new UIManager(this);

        // Bind loop
        this.loop = this.loop.bind(this);
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    restart() {
        // Persist Backpack
        let savedInventory = null;
        if (this.world && this.world.player) {
            savedInventory = this.world.player.inventory;
        }

        this.level = 1;
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.world = new World(this, savedInventory); // Reset world with saved items
        this.start();
    }

    gameOver() {
        this.isGameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('roguelike_highscore', this.highScore);
        }
        this.ui.showGameOver(this.score, this.highScore);
    }

    loop(timestamp) {
        // if (this.isGameOver) return; 

        let deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (deltaTime > 0.2) deltaTime = 0.2;

        this.accumulatedTime += deltaTime;

        while (this.accumulatedTime > this.step) {
            this.update(this.step);
            this.accumulatedTime -= this.step;
        }

        this.render();
        requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Toggle Inventory
        if (this.input.isPressed('KeyI')) {
            this.ui.toggleInventory();
        }
        // Toggle Skills
        if (this.input.isPressed('KeyP')) {
            this.ui.toggleSkills();
        }

        // Always update Input (to clear pressed keys)
        // Note: Input.update() clears keysPressed, so we MUST call it.
        // We checked KeyI above, so it's fine to clear now.

        if (this.isPaused) {
            // Only UI updates?
            this.ui.update();
        } else {
            if (!this.isGameOver) {
                this.world.update(dt);
                this.camera.update(dt);
                this.ui.update();
            }
        }
        this.input.update(); // Clear one-shot keys
    }

    render() {
        // Clear screen
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.camera.apply(this.ctx);

        this.world.render(this.ctx);

        this.ctx.restore();
    }
}
