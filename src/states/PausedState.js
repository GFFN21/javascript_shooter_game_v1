import State from './State.js';

/**
 * Paused state - parameterized by menu type.
 * Creates three instances: PAUSED_INVENTORY, PAUSED_SKILLS, PAUSED_ABILITIES.
 * 
 * World does NOT update while paused. Only UI updates.
 */
export default class PausedState extends State {
    constructor(menuType) {
        super(`PAUSED_${menuType.toUpperCase()}`);
        this.menuType = menuType; // 'inventory', 'skills', 'abilities'
    }

    onEnter(game) {
        // Sync legacy flag
        game.isPaused = true;

        // Show the appropriate menu
        switch (this.menuType) {
            case 'inventory':
                game.ui.toggleInventory();
                break;
            case 'skills':
                game.ui.toggleStats();
                break;
            case 'abilities':
                game.ui.toggleAbilities();
                break;
        }
    }

    update(game, dt) {
        // Only UI updates while paused (trash keybind, etc.)
        game.ui.update();
    }

    handleInput(game, input) {
        // Each menu closes with the same key that opened it
        const closeKeys = {
            'inventory': 'KeyI',
            'skills': 'KeyP',
            'abilities': 'KeyO'
        };

        if (input.isPressed(closeKeys[this.menuType])) {
            game.stateMachine.transition('PLAYING');
        }
    }

    onExit(game) {
        // Sync legacy flag
        game.isPaused = false;

        // Hide whichever menu is open
        game.ui.hideAllMenus();
    }
}
