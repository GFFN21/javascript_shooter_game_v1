import State from './State.js';

/**
 * Save slot selection screen.
 * Shows the save selection UI. When a slot is clicked,
 * UIManager calls game.loadGame(slotId) which transitions to LOADING.
 */
export default class SaveSelectState extends State {
    constructor() {
        super('SAVE_SELECT');
    }

    onEnter(game) {
        // Stop the game loop if it was running
        if (game.animationFrameId) {
            cancelAnimationFrame(game.animationFrameId);
            game.animationFrameId = null;
        }

        // Sync legacy flags
        game.isPaused = true;
        game.isGameOver = false;

        // Show save selection UI
        game.ui.showSaveSelection();
    }

    onExit(game) {
        game.ui.hideSaveSelection();
    }
}
