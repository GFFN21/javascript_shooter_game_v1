import Input from './Input.js';
import Camera from './Camera.js';
import World from './World.js';
import { CONFIG } from '../Config.js';
import UIManager from '../ui/UIManager.js';
import SaveManager from '../utils/SaveManager.js';
import DebugPanel from '../ui/DebugPanel.js';
import GameStateMachine from './GameStateMachine.js';
import BootState from '../states/BootState.js';
import SaveSelectState from '../states/SaveSelectState.js';
import LoadingState from '../states/LoadingState.js';
import PlayingState from '../states/PlayingState.js';
import PausedState from '../states/PausedState.js';
import GameOverState from '../states/GameOverState.js';

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
        this.animationFrameId = null;

        // Initialize State Machine
        this.stateMachine = new GameStateMachine(this);
        this.stateMachine.register(new BootState());
        this.stateMachine.register(new SaveSelectState());
        this.stateMachine.register(new LoadingState());
        this.stateMachine.register(new PlayingState());
        this.stateMachine.register(new PausedState('inventory'));
        this.stateMachine.register(new PausedState('skills'));
        this.stateMachine.register(new PausedState('abilities'));
        this.stateMachine.register(new GameOverState());

        // Start in BOOT state (will auto-transition to SAVE_SELECT)
        this.stateMachine.transition('BOOT');
    }

    loadGame(slotId) {
        this.currentSlotId = slotId;
        const data = SaveManager.loadSlot(slotId);

        // Reset to default session state before loading
        this.bank = 0;
        this.unlockedStats = new Set();
        this.unlockedSkills = new Set();
        this.highScore = 0;
        this.level = 1;
        this.score = 0;

        if (data && data.gameplay) {
            this.bank = data.gameplay.bank || 0;
            this.unlockedStats = new Set(data.gameplay.unlockedStats || []);
            this.unlockedSkills = new Set(data.gameplay.unlockedSkills || []);
            this.highScore = data.gameplay.highScore || 0;

            // Restore Level and Score for continuity
            this.level = data.gameplay.level || 1;
            this.score = data.gameplay.score || 0;
        }

        // Transition to LOADING with load payload
        // LoadingState will create the World and start playing
        this.stateMachine.transition('LOADING', { mode: 'load' });
    }

    purchaseUpgrade(upgradeId, type = 'stat') {
        const configSource = type === 'stat' ? CONFIG.STAT_UPGRADES : CONFIG.SKILLS;
        const upgrade = Object.values(configSource).find(u => u.id === upgradeId);

        if (!upgrade) {
            console.error(`[Game] Upgrade ${upgradeId} not found in ${type}`);
            return false;
        }

        // Check availability and bank
        const unlockedSet = type === 'stat' ? this.unlockedStats : this.unlockedSkills;
        if (unlockedSet.has(upgradeId)) {
            console.warn(`[Game] Upgrade ${upgradeId} already unlocked`);
            return false;
        }

        if (this.bank >= upgrade.cost) {
            this.bank -= upgrade.cost;
            unlockedSet.add(upgradeId);
            this.saveProgress();

            console.log(`[Game] Purchased ${type} upgrade: ${upgradeId}. Remaining bank: ${this.bank}`);

            // Refresh Player stats immediately
            if (this.world && this.world.player) {
                this.world.player.applySkills();
            }
            return true;
        }

        console.warn(`[Game] Insufficient funds for ${upgradeId}. Need ${upgrade.cost}, have ${this.bank}`);
        return false;
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

    resize() {
        const targetHeight = 720; // Fixed Vertical Resolution
        const aspect = window.innerWidth / window.innerHeight;

        // Dynamic Width based on Aspect Ratio
        this.width = Math.round(targetHeight * aspect);
        this.height = targetHeight;

        // Update Canvas Logical Size
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // CSS: Fill Window
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.marginTop = '0';
        this.canvas.style.marginLeft = '0'; // Reset centering

        // Update Camera dimensions if needed (Camera reads game.width/height usually)
        if (this.camera) {
            this.camera.width = this.width;
            this.camera.height = this.height;
        }

        console.log(`Resized Game: ${this.width}x${this.height} (Aspect: ${aspect.toFixed(2)})`);
    }

    start() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    restart() {
        // Delegate to FSM: GAME_OVER → LOADING (restart mode)
        this.stateMachine.transition('LOADING', { mode: 'restart' });
    }

    gameOver() {
        // Delegate to FSM: PLAYING → GAME_OVER
        this.stateMachine.transition('GAME_OVER');
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

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Delegate update and input to the FSM
        this.stateMachine.handleInput(this.input);
        this.stateMachine.update(dt);

        // Always clear one-shot keys at end of frame
        this.input.update();
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
