import Entity from './Entity.js';

export default class Bullet extends Entity {
    constructor(game, x, y, dx, dy, speed, isEnemy = false) {
        super(game, x, y);
        this.dx = dx;
        this.dy = dy;
        this.speed = speed;
        this.radius = 4;
        this.isEnemy = isEnemy;
        this.life = 2.0;
        this.markedForDeletion = false;
        this.bounces = 0; // Number of times it can bounce
    }

    update(dt) {
        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;

        this.life -= dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.fillStyle = this.isEnemy ? '#ff4d4d' : (this.color || '#ffff00');

        if (this.isMelee) {
            // Draw Slash Trace
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.dx * 30, this.y - this.dy * 30);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
