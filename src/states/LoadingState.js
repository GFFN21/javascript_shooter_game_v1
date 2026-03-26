import State from './State.js';
import World from '../core/World.js';

/**
 * Handles world creation for both fresh loads and restarts.
 * 
 * payload.mode:
 *  - 'load'    → called from slot selection (game.loadGame)
 *  - 'restart' → called from Game Over restart button
 *
 * Uses queueMicrotask to defer the transition to PLAYING,
 * avoiding recursive transition() calls within onEnter().
 */
export default class LoadingState extends State {
    constructor() {
        super('LOADING');
        this.phase = 0;
        this.frameCounter = 0;
        this.mode = 'load';
        this.savedInventory = null;
        this.timer = 0;
    }

    onEnter(game, payload = {}) {
        this.mode = payload.mode || 'load';
        console.log(`[LoadingState] mode=${this.mode}`);

        // Sync legacy flags
        game.isGameOver = false;
        game.isPaused = false;

        this.phase = 0;
        this.frameCounter = 0;
        this.timer = 0;

        if (this.mode === 'restart') {
            if (game.world && game.world.player) {
                this.savedInventory = game.world.player.inventory;
            }
        }

        // CRITICAL FIX: The SaveSelect screen kills the animation loop to save resources.
        // We MUST revive it here, otherwise the engine will hang indefinitely on this loading screen.
        if (!game.animationFrameId) {
            game.start();
        }
    }

    update(game, dt) {
        this.frameCounter++;
        this.timer += dt;

        // Wait 2 frames to ensure the browser has actually painted the screen black
        if (this.phase === 0 && this.frameCounter > 2) {
            this.phase = 1;

            if (this.mode === 'restart') {
                game.level = 1;
                game.score = 0;
                game.world = new World(game, this.savedInventory);
            } else {
                game.world = new World(game);
            }

            this.phase = 2; // Generation done
        }

        // Wait until at least 1 second has passed for visual breathing room
        if (this.phase === 2 && this.timer >= 1.0) {
            game.stateMachine.transition('PLAYING');
        }
    }

    render(game, ctx) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '30px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`GENERATING LEVEL ${game.level || 1}...`, game.canvas.width / 2, game.canvas.height / 2);
    }
}
