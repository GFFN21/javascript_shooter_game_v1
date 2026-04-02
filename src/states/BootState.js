import State from './State.js';
import { Platform } from '../Platform.js';

/**
 * Initial state on page load.
 * Routes to PLATFORM_SELECT (first time) or SAVE_SELECT (returning user).
 */
export default class BootState extends State {
    constructor() {
        super('BOOT');
    }

    onEnter(game) {
        if (Platform.restore()) {
            // Returning user — platform preference already saved
            console.log('[BootState] Saved platform found, going to SAVE_SELECT');
            game.input.reinitialise();
            game.stateMachine.transition('SAVE_SELECT');
        } else {
            // First run — ask the user
            console.log('[BootState] No saved platform, going to PLATFORM_SELECT');
            game.stateMachine.transition('PLATFORM_SELECT');
        }
    }
}
