import State from './State.js';
import World from '../core/World.js';

/**
 * Handles inter-level transitions (e.g., Level 1 -> Level 2).
 * Displays a loading screen and ensures player weapons/stats persist.
 */
export default class ReloadState extends State {
    constructor() {
        super('RELOAD');
        this.phase = 0;
        this.frameCounter = 0;
        this.timer = 0;
        this.savedPlayerData = null;
    }

    onEnter(game) {
        // Sync legacy flags
        game.isGameOver = false;
        game.isPaused = false;

        this.phase = 0;
        this.frameCounter = 0;
        this.timer = 0;

        // Capture a comprehensive snapshot of the Player's state using the new serialization system
        if (game.world && game.world.player) {
            this.savedPlayerData = game.serializeInventory();
            console.log("[ReloadState] Captured Player Data:", this.savedPlayerData);
        }
    }

    update(game, dt) {
        this.frameCounter++;
        this.timer += dt;

        // Wait 2 frames to ensure the browser paints the black loading screen
        if (this.phase === 0 && this.frameCounter > 2) {
            this.phase = 1;

            // Generate the next floor, injecting the saved data into the new Player
            game.world = new World(game, this.savedPlayerData);

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
