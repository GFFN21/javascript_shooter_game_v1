export default class GameStateMachine {
    constructor(game) {
        this.game = game;
        this.currentState = null;
        this.previousStateName = null;
        this.states = new Map();
        this.history = [];

        // Valid transitions map – prevents invalid state jumps
        this.validTransitions = {
            'BOOT': ['SAVE_SELECT'],
            'SAVE_SELECT': ['LOADING'],
            'LOADING': ['PLAYING'],
            'PLAYING': ['PAUSED_INVENTORY', 'PAUSED_SKILLS', 'PAUSED_ABILITIES', 'GAME_OVER', 'LEVEL_TRANSITION', 'SAVE_SELECT'],
            'PAUSED_INVENTORY': ['PLAYING', 'SAVE_SELECT'],
            'PAUSED_SKILLS': ['PLAYING', 'SAVE_SELECT'],
            'PAUSED_ABILITIES': ['PLAYING', 'SAVE_SELECT'],
            'LEVEL_TRANSITION': ['PLAYING'],
            'GAME_OVER': ['LOADING', 'SAVE_SELECT']
        };
    }

    register(state) {
        this.states.set(state.name, state);
    }

    transition(stateName, payload = null) {
        const newState = this.states.get(stateName);
        if (!newState) {
            console.error(`[FSM] State "${stateName}" not found`);
            return false;
        }

        // Validate transition
        if (this.currentState) {
            const allowed = this.validTransitions[this.currentState.name];
            if (allowed && !allowed.includes(stateName)) {
                console.warn(`[FSM] Invalid transition: ${this.currentState.name} → ${stateName}`);
                return false;
            }
        }

        // Exit current state
        if (this.currentState) {
            console.log(`[FSM] ${this.currentState.name} → ${stateName}`);
            this.previousStateName = this.currentState.name;
            this.history.push(this.currentState.name);
            this.currentState.onExit(this.game);
        } else {
            console.log(`[FSM] (init) → ${stateName}`);
        }

        // Enter new state
        this.currentState = newState;
        this.currentState.onEnter(this.game, payload);

        return true;
    }

    update(dt) {
        if (this.currentState) {
            this.currentState.update(this.game, dt);
        }
    }

    handleInput(input) {
        if (this.currentState) {
            this.currentState.handleInput(this.game, input);
        }
    }

    is(stateName) {
        return this.currentState?.name === stateName;
    }

    isAny(...stateNames) {
        return stateNames.includes(this.currentState?.name);
    }

    get name() {
        return this.currentState?.name || null;
    }
}
