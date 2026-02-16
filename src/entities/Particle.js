import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class Particle extends Entity {
    constructor(game, x, y, options = {}) {
        super(game, x, y);
        this.dx = (Math.random() - 0.5) * (options.speed || 100);
        this.dy = (Math.random() - 0.5) * (options.speed || 100);
        this.life = options.life || 0.5;
        this.maxLife = this.life;
        this.color = options.color || '#fff';
        this.size = options.size || 3;
        this.alpha = 1;

        // Particles don't collide
        this.type = CONFIG.COLLISION_TYPES.NONE;
    }

    update(dt) {
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.life -= dt;

        this.alpha = this.life / this.maxLife;

        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
