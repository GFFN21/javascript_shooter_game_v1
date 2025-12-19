import Entity from './Entity.js';

export default class Particle extends Entity {
    constructor(game, x, y, color) {
        super(game, x, y);
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 100 + 50;
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
        this.life = 0.5; // seconds
    }

    update(dt) {
        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;
        this.life -= dt;
        this.size -= dt * 2;

        if (this.life <= 0 || this.size <= 0) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
    }
}
