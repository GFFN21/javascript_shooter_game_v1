import Entity from './Entity.js';
import Bullet from './Bullet.js';

export default class Enemy extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 85;
        this.radius = 15;
        this.hp = 3;

        this.shootCooldown = 2.0;
        this.fireRate = 1.5;
        this.mass = 2; // Medium
        this.dropValue = 10;
        this.color = '#ff0000'; // Default Red
    }

    update(dt) {
        super.update(dt);
        if (!this.game.world.player) return;

        const target = this.game.world.player;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            this.x += moveX;
            if (this.checkWallCollision()) {
                this.x -= moveX;
            }

            this.y += moveY;
            if (this.checkWallCollision()) {
                this.y -= moveY;
            }
        }

        // Shooting
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && dist < 400) { // Range check
            this.shoot(target);
            this.shootCooldown = this.fireRate;
        }

        if (this.hp <= 0) {
            this.markedForDeletion = true;
        }
    }

    checkWallCollision() {
        const r = this.radius * 0.8;
        return this.game.world.checkWallCollision(
            this.x - r,
            this.y - r,
            r * 2,
            r * 2
        );
    }

    shoot(target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = 300;

        const bullet = new Bullet(
            this.game,
            this.x + Math.cos(angle) * 20,
            this.y + Math.sin(angle) * 20,
            Math.cos(angle),
            Math.sin(angle),
            speed,
            true // isEnemy
        );
        this.game.world.addEntity(bullet);
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
    }
}
