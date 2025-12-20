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

    onCollision(other) {
        if (this.markedForDeletion) return;

        // Enemy Bullet hitting Player
        if (this.isEnemy && other === this.game.world.player) {
            if (other.isDashing || other.flashTimer > 0) return;
            other.takeDamage(this.damage || 1);
            this.game.world.spawnParticles(other.x, other.y, '#00ff00', 10);
            this.markedForDeletion = true;
            return;
        }

        // Player Bullet hitting Enemy (has takeDamage, is not Player, is not Bullet)
        if (!this.isEnemy && other.takeDamage && other !== this.game.world.player && other.constructor.name !== 'Bullet') {
            other.takeDamage(this.damage || 1);
            if (other.applyKnockback) other.applyKnockback(this.dx, this.dy, this.knockback || 400);
            this.game.world.spawnParticles(other.x, other.y, '#ff0000', 8);
            this.markedForDeletion = true;
        }
    }
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
