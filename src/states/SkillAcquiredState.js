import State from './State.js';

/**
 * Triggered when a player interacts with an Altar.
 * Displays a modal showing the name and description of the acquired skill.
 */
export default class SkillAcquiredState extends State {
    constructor() {
        super('SKILL_ACQUIRED');
        this.skill = null;
    }

    onEnter(game, params) {
        this.skill = params.skill;
        game.isPaused = true;

        this.showUI(game);
    }

    showUI(game) {
        const container = document.getElementById('abilities-screen');
        const list = document.getElementById('abilities-list');
        if (!container || !list) return;

        container.classList.remove('hidden');
        list.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h1 style="color: #00ffff; font-size: 32px; margin-bottom: 10px;">DIVINE BLESSING</h1>
                <div style="font-size: 24px; color: #fff; margin-bottom: 20px; font-weight: bold;">
                    ${this.skill.name}
                </div>
                <div style="font-size: 18px; color: #ccc; margin-bottom: 30px; font-style: italic;">
                    "${this.skill.description}"
                </div>
                <button id="skill-continue-btn" style="
                    padding: 10px 30px;
                    font-size: 20px;
                    background: #00ffff;
                    color: #000;
                    border: none;
                    cursor: pointer;
                    font-family: 'Courier New';
                    font-weight: bold;
                ">CONTINUE</button>
            </div>
        `;

        const btn = document.getElementById('skill-continue-btn');
        if (btn) {
            btn.onclick = () => {
                container.classList.add('hidden');
                game.stateMachine.transition('PLAYING');
            };
        }
    }

    handleInput(game, input) {
        if (input.isPressed('Enter') || input.isPressed('Space') || input.isPressed('KeyE')) {
             const container = document.getElementById('abilities-screen');
             if (container) container.classList.add('hidden');
             game.stateMachine.transition('PLAYING');
        }
    }

    onExit(game) {
        game.isPaused = false;
    }

    render(game, ctx) {
        // Dim the background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }
}
