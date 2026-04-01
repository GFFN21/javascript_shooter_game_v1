import State from './State.js';

/**
 * Initial state on page load.
 * Platform has already been detected by main.js before Game is constructed.
 * Immediately transitions to SAVE_SELECT.
 */
export default class BootState extends State {
    constructor() {
        super('BOOT');
    }

    onEnter(game) {
        console.log('[BootState] Platform ready, moving to save select');
        game.stateMachine.transition('SAVE_SELECT');
    }
}
