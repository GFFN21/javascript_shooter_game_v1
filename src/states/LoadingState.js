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
    }

    onEnter(game, payload = {}) {
        const mode = payload.mode || 'load';
        console.log(`[LoadingState] mode=${mode}`);

        // Sync legacy flags
        game.isGameOver = false;
        game.isPaused = false;

        if (mode === 'restart') {
            // Persist backpack across restarts
            let savedInventory = null;
            if (game.world && game.world.player) {
                savedInventory = game.world.player.inventory;
            }

            game.level = 1;
            game.score = 0;
            game.world = new World(game, savedInventory);
        } else {
            // 'load' — Game.loadGame() has already restored bank/level/stats.
            // Create a fresh World with those stats applied.
            game.world = new World(game);
        }

        // Defer transition to PLAYING to avoid recursive transition() calls
        queueMicrotask(() => {
            game.stateMachine.transition('PLAYING');
        });
    }
}
