import { CONFIG } from '../Config.js';

export default class Entity {
    get sortY() {
        return this.y;
    }

    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = CONFIG.COLLISION_TYPES.NONE;
        this.markedForDeletion = false;

        // Hybrid Optimization
        this.roomID = -1; // -1 = Corridor/Global
        this.isActive = true; // Default to true, World will cull
        this.alwaysUpdate = false; // Player/Projectiles override this

        this.flashTimer = 0;

        // Physics
        this.mass = 1;
        this.kx = 0;
        this.ky = 0;
        this.friction = 5; // Drag
        this.radius = 15; // Ensure radius is here for collision
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 0.1;
    }

    applyKnockback(dx, dy, force) {
        if (this.mass === 0) return; // Immovable
        this.kx += (dx * force) / this.mass;
        this.ky += (dy * force) / this.mass;
    }

    updatePhysics(dt) {
        // Flash Timer
        if (this.flashTimer > 0) this.flashTimer -= dt;

        // Friction
        this.kx -= this.kx * this.friction * dt;
        this.ky -= this.ky * this.friction * dt;
        if (Math.abs(this.kx) < 1) this.kx = 0;
        if (Math.abs(this.ky) < 1) this.ky = 0;

        // Apply Knockback (Separated Axes for sliding)
        if (this.game && this.game.world && this.game.world.map) {
            const r = this.radius * 0.8;

            // Step X
            const moveX = this.kx * dt;
            this.x += moveX;
            if (this.game.world.checkWallCollision(this.x - r, this.y - r, r * 2, r * 2)) {
                this.x -= moveX;
                this.kx = 0;
            }

            // Step Y
            const moveY = this.ky * dt;
            this.y += moveY;
            if (this.game.world.checkWallCollision(this.x - r, this.y - r, r * 2, r * 2)) {
                this.y -= moveY;
                this.ky = 0;
            }
        } else {
            // Fallback if no map (shouldn't happen)
            this.x += this.kx * dt;
            this.y += this.ky * dt;
        }

        // Friction
        this.kx -= this.kx * this.friction * dt;
        this.ky -= this.ky * this.friction * dt;

        // Stop very small movement
        if (Math.abs(this.kx) < 1) this.kx = 0;
        if (Math.abs(this.ky) < 1) this.ky = 0;
    }

    update(dt) {
        this.updatePhysics(dt);
    }

    onCollision(other) {
        // Default: Do nothing
    }

    checkWallCollision() {
        if (!this.game || !this.game.world) return false;
        const r = this.radius * 0.8;
        return this.game.world.checkWallCollision(
            this.x - r,
            this.y - r,
            r * 2,
            r * 2
        );
    }

    render(ctx) {
        // If a sprite image is assigned and loaded, draw it centered.
        if (this.sprite && this.sprite.complete) {
            // Use explicit frame dimensions if defined (for animated sprites), otherwise use radius.
            const w = this.frameWidth || this.radius * 2;
            const h = this.frameHeight || this.radius * 2;
            const drawX = this.x - w / 2;
            const drawY = this.y - h / 2;
            ctx.drawImage(this.sprite, 0, 0, w, h, drawX, drawY, w, h);
        } else {
            // Fallback: simple filled circle.
            ctx.fillStyle = this.color || 'rgba(200,200,200,0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
