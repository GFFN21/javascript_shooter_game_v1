import Input from './Input.js';
import Camera from './Camera.js';
import World from './World.js';
import UIManager from './ui/UIManager.js';
import SaveManager from './utils/SaveManager.js';
import DebugPanel from './ui/DebugPanel.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.step = 1 / 60;

        // Save State
        this.currentSlotId = null;
        SaveManager.checkLegacyMigration();

        this.level = 1;
        this.score = 0;
        this.highScore = 0;
        this.bank = 0;
        this.unlockedStats = new Set();
        this.unlockedSkills = new Set();

        this.isGameOver = false;
        this.isPaused = false; // Inventory Pause

        this.input = new Input(this);
        this.camera = new Camera(this, 0, 0);
        this.world = new World(this);
        this.ui = new UIManager(this);
        this.debugPanel = new DebugPanel(this);

        // Bind loop
        this.loop = this.loop.bind(this);

        // Show Save Selection instead of starting immediately
        this.ui.showSaveSelection();
    }

    loadGame(slotId) {
        this.currentSlotId = slotId;
        const data = SaveManager.loadSlot(slotId);

        if (data && data.gameplay) {
            this.bank = data.gameplay.bank || 0;
            this.unlockedStats = new Set(data.gameplay.unlockedStats || []);
            this.unlockedSkills = new Set(data.gameplay.unlockedSkills || []);
            this.highScore = data.gameplay.highScore || 0;

            // Restore Level and Score for continuity
            this.level = data.gameplay.level || 1;
            this.score = data.gameplay.score || 0;
        }

        // CRITICAL: Recreate World to ensure Player is initialized with loaded stats!
        // The previous world was created in constructor with empty stats.
        this.world = new World(this);

        this.start();
    }

    saveProgress() {
        if (!this.currentSlotId) return;

        const data = {
            metadata: {
                name: `Run #${this.currentSlotId}`,
                lastSaved: Date.now()
            },
            gameplay: {
                bank: this.bank,
                unlockedStats: Array.from(this.unlockedStats),
                unlockedSkills: Array.from(this.unlockedSkills),
                highScore: this.highScore,
                level: this.level,
                score: this.score
            },
            inventory: {
                // Future: save current player backpack/weapons here
            }
        };

        SaveManager.saveSlot(this.currentSlotId, data);
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
        // Score resets, but Bank persists!
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
        if (!this.lastTime) this.lastTime = timestamp;
        let deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (deltaTime > 0.2) deltaTime = 0.2;

        this.accumulatedTime += deltaTime;

        // Measure Update
        const startUpdate = performance.now();
        while (this.accumulatedTime > this.step) {
            this.update(this.step);
            this.accumulatedTime -= this.step;
        }
        const endUpdate = performance.now();

        // Measure Render
        const startRender = performance.now();
        this.render();
        const endRender = performance.now();

        // Update Debug
        if (this.debugPanel && this.debugPanel.visible) {
            const rStats = this.world.renderStats || {};
            this.debugPanel.update({
                fps: 1 / deltaTime,
                frameTime: deltaTime * 1000,
                updateTime: endUpdate - startUpdate,
                renderTime: endRender - startRender,
                entityCount: this.world.entities.length,
                particleCount: this.world.particles.length,
                collisionChecks: this.world.collisionChecks,
                // Breakdown
                rFloor: rStats.floor || 0,
                rEntities: rStats.entities || 0,
                rParticles: rStats.particles || 0,
                rWalls: rStats.walls || 0
            });
        }

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Toggle Inventory
        if (this.input.isPressed('KeyI')) {
            this.ui.toggleInventory();
        }
        // Toggle Stats
        if (this.input.isPressed('KeyP')) {
            this.ui.toggleStats();
        }
        // Toggle Abilities (Skills)
        if (this.input.isPressed('KeyO')) {
            this.ui.toggleAbilities();
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
