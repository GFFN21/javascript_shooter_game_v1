import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class Bullet extends Entity {
    constructor(game, x, y, dx, dy, speed, isEnemy = false) {
        super(game, x, y);
        this.dx = dx;
        this.dy = dy;
        this.speed = speed;
        this.radius = 4;
        this.type = CONFIG.COLLISION_TYPES.PROJECTILE;
        this.isEnemy = isEnemy;
        this.life = 2.0;
        this.markedForDeletion = false;
        this.bounces = 0; // Number of times it can bounce
        this.alwaysUpdate = true; // Bullets fly across rooms
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

        // Optimization: Early exit if colliding with non-combat variants
        if (other.type === CONFIG.COLLISION_TYPES.ITEM ||
            other.type === CONFIG.COLLISION_TYPES.PORTAL ||
            other.type === CONFIG.COLLISION_TYPES.PROJECTILE ||
            other.type === CONFIG.COLLISION_TYPES.NONE) {
            return;
        }

        // Enemy Bullet hitting Player
        if (this.isEnemy) {
            if (other.type === CONFIG.COLLISION_TYPES.PLAYER) {
                if (other.isDashing || other.flashTimer > 0) return;
                other.takeDamage(this.damage || 1);
                this.game.world.spawnParticles(other.x, other.y, '#00ff00', 10);
                this.markedForDeletion = true;
            }
            return;
        }

        // Player Bullet hitting Enemy
        if (!this.isEnemy) {
            if (other.type === CONFIG.COLLISION_TYPES.ENEMY) {
                other.takeDamage(this.damage || 1);
                if (other.applyKnockback) other.applyKnockback(this.dx, this.dy, this.knockback || 400);
                this.game.world.spawnParticles(other.x, other.y, '#ff0000', 8);
                this.markedForDeletion = true;
            }
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
