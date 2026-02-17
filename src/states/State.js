/**
 * Base State class. All concrete states extend this.
 * Subclasses override the methods they need.
 */
export default class State {
    constructor(name) {
        this.name = name;
    }

    /** Called when entering this state. */
    onEnter(game, payload) { }

    /** Called when leaving this state. */
    onExit(game) { }

    /** Called every fixed-step tick while this state is active. */
    update(game, dt) { }

    /** Called every tick to check for input-driven transitions. */
    handleInput(game, input) { }
}
