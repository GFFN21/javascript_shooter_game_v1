import Enemy from './Enemy.js';

export default class Walker extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 90; // Just slightly faster than shooter (85)
        this.radius = 15;
        this.hp = 2; // Weaker than shooter
        this.damage = 1;

        this.mass = 2;
        this.dropValue = 5; // Less loot
        this.color = '#FFA500'; // Orange
    }

    update(dt) {
        // Use Entity physics (knockback/friction) but SKIP Enemy logic (shooting/movement)
        this.updatePhysics(dt);

        if (!this.game.world.player) return;

        const target = this.game.world.player;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Simple Chase Behavior
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

        if (this.hp <= 0) {
            this.markedForDeletion = true;
        }
    }

    shoot(target) {
        // Melee unit - does not shoot
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
