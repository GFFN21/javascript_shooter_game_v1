import State from './State.js';

/**
 * Active gameplay. World, Camera, and UI all update.
 * Listens for pause keys (I/P/O) to transition to PAUSED states.
 */
export default class PlayingState extends State {
    constructor() {
        super('PLAYING');
    }

    onEnter(game) {
        // Sync legacy flags
        game.isPaused = false;
        game.isGameOver = false;

        // Start the game loop if it isn't running
        if (!game.animationFrameId) {
            game.start();
        }
    }

    update(game, dt) {
        if (!game.isGameOver) {
            game.world.update(dt);
            game.camera.update(dt);
            game.ui.update();
        }
    }

    handleInput(game, input) {
        // Pause keys
        if (input.isPressed('KeyI')) {
            game.stateMachine.transition('PAUSED_INVENTORY');
        } else if (input.isPressed('KeyP')) {
            game.stateMachine.transition('PAUSED_SKILLS');
        } else if (input.isPressed('KeyO')) {
            game.stateMachine.transition('PAUSED_ABILITIES');
        }
    }
}
