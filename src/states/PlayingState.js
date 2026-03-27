import State from './State.js';

/**
 * Active gameplay. World, Camera, and UI all update.
 * Listens for pause keys (I/P/O) to transition to PAUSED states.
 */
export default class PlayingState extends State {
    constructor() {
        super('PLAYING');
        this.fadeAlpha = 1.0;
    }

    onEnter(game) {
        // Sync legacy flags
        game.isPaused = false;
        game.isGameOver = false;

        // Start fade in from black only for major transitions
        // We SKIP the fade when returning from simple UI/Pause menus
        const source = game.stateMachine.previousStateName;
        const transitionsNeedingFade = ['LOADING', 'RELOAD', 'LEVEL_TRANSITION', 'SAVE_SELECT', null];
        
        if (transitionsNeedingFade.includes(source)) {
            this.fadeAlpha = 1.0;
        } else {
            this.fadeAlpha = 0.0;
        }

        // Start the game loop if it isn't running
        if (!game.animationFrameId) {
            game.start();
        }
    }

    update(game, dt) {
        if (this.fadeAlpha > 0) {
            this.fadeAlpha -= dt * 1.5; // ~0.66s fade
            if (this.fadeAlpha < 0) this.fadeAlpha = 0;
        }

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
        } else if (input.isPressed('KeyE')) {
            const nearestAltar = game.world.entities.find(e => 
                e.constructor.name === 'Altar' && e.canInteract
            );
            if (nearestAltar) {
                nearestAltar.interact();
            }
        }
    }

    render(game, ctx) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        game.camera.apply(ctx);

        if (game.world) {
            game.world.render(ctx);
        }

        ctx.restore();

        // Draw Fade overlay
        if (this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        }
    }
}
