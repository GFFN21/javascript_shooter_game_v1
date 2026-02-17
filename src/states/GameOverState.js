import State from './State.js';

/**
 * Game Over state. Shows score, updates high score, saves progress.
 * Restart button transitions to LOADING. Exit would go to SAVE_SELECT.
 */
export default class GameOverState extends State {
    constructor() {
        super('GAME_OVER');
    }

    onEnter(game) {
        // Sync legacy flag
        game.isGameOver = true;

        // Update high score
        if (game.score > game.highScore) {
            game.highScore = game.score;
        }

        // Save progress
        game.saveProgress();

        // Show game over screen
        game.ui.showGameOver(game.score, game.highScore);
    }

    onExit(game) {
        game.isGameOver = false;
        game.ui.hideGameOver();
    }
}
