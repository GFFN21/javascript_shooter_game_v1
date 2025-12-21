import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';
import MovementComponent from '../components/MovementComponent.js';
import AttackComponent from '../components/AttackComponent.js';

export default class Walker extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, CONFIG.ENEMIES.WALKER);
        // Override components
        this.movement = new MovementComponent(this, 'CHASE');
        this.attack = new AttackComponent(this, 'MELEE');
    }

    render(ctx) {
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Debug: Eyes to show direction?
        // ctx.fillStyle = 'black';
        // ctx.beginPath();
        // ctx.arc(this.x, this.y - 5, 2, 0, Math.PI*2);
        // ctx.fill();
    }
}
