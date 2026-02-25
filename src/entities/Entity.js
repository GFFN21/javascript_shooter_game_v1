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
        this.radius = 15; // Legacy fallback for any remaining circle checks
        this.width = 30; // Default Rectangular Hitbox
        this.height = 30; // Default Rectangular Hitbox

        // Visual Defaults
        this.visual = {
            mode: 'PRIMITIVE', // PRIMITIVE, SPRITE, ANIMATED
            sprite: null,      // Image object
            frames: null,      // Array of Images or source rectangles
            fps: 10,
            frameTimer: 0,
            currentFrame: 0,
            scale: 1.0,
            offsetY: 0,
            bobbing: false,
            bobAmount: 5,
            bobSpeed: 3,
            glow: false,
            glowColor: '#ffffff',
            glowAmount: 10
        };
    }

    takeDamage(amount) {
        if (this.hp === undefined) return;
        this.hp -= amount;
        this.flashTimer = 0.15;
    }

    applyKnockback(dx, dy, force) {
        if (this.mass === 0) return; // Immovable
        this.kx += (dx * force) / this.mass;
        this.ky += (dy * force) / this.mass;
    }

    updatePhysics(dt) {
        // Flash Timer
        if (this.flashTimer > 0) this.flashTimer -= dt;

        // Visual Clock
        if (this.visual.mode === 'ANIMATED' && this.visual.frames) {
            this.visual.frameTimer += dt;
            if (this.visual.frameTimer > 1 / this.visual.fps) {
                this.visual.frameTimer = 0;
                this.visual.currentFrame = (this.visual.currentFrame + 1) % this.visual.frames.length;
            }
        }

        // Friction & Knockback Application
        this.kx -= this.kx * this.friction * dt;
        this.ky -= this.ky * this.friction * dt;
        if (Math.abs(this.kx) < 1) this.kx = 0;
        if (Math.abs(this.ky) < 1) this.ky = 0;

        if (this.game && this.game.world && this.game.world.map) {
            const hW = this.width / 2;
            const hH = this.height / 2;

            const moveX = this.kx * dt;
            this.x += moveX;
            if (this.game.world.checkWallCollision(this.x - hW, this.y - hH, this.width, this.height)) {
                this.x -= moveX;
                this.kx = 0;
            }

            const moveY = this.ky * dt;
            this.y += moveY;
            if (this.game.world.checkWallCollision(this.x - hW, this.y - hH, this.width, this.height)) {
                this.y -= moveY;
                this.ky = 0;
            }
        } else {
            this.x += this.kx * dt;
            this.y += this.ky * dt;
        }
    }

    update(dt) {
        this.updatePhysics(dt);
    }

    onCollision(other) {
        // Default: Do nothing
    }

    checkWallCollision() {
        if (!this.game || !this.game.world) return false;
        const hW = this.width / 2;
        const hH = this.height / 2;
        return this.game.world.checkWallCollision(this.x - hW, this.y - hH, this.width, this.height);
    }

    render(ctx) {
        if (this.flashTimer > 0) ctx.globalAlpha = 0.5;

        const v = this.visual;
        let drawX = this.x;
        let drawY = this.y + v.offsetY;

        // Apply Bobbing logic
        if (v.bobbing) {
            const bob = Math.sin(performance.now() * 0.001 * v.bobSpeed) * v.bobAmount;
            drawY += bob;
        }

        if (v.mode === 'SPRITE' && v.sprite && v.sprite.complete) {
            const w = v.sprite.naturalWidth * v.scale;
            const h = v.sprite.naturalHeight * v.scale;
            ctx.drawImage(v.sprite, drawX - w / 2, drawY - h / 2, w, h);
        } else if (v.mode === 'ANIMATED' && v.frames && v.frames.length > 0) {
            const img = v.frames[v.currentFrame];
            if (img && img.complete) {
                const w = img.naturalWidth * v.scale;
                const h = img.naturalHeight * v.scale;
                ctx.drawImage(img, drawX - w / 2, drawY - h / 2, w, h);
            }
        } else {
            // Fallback: simple filled circle
            ctx.fillStyle = this.color || 'rgba(200,200,200,0.8)';
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }


        ctx.globalAlpha = 1.0;
    }

    getBoundingBox() {
        return {
            minX: this.x - this.width / 2,
            maxX: this.x + this.width / 2,
            minY: this.y - this.height / 2,
            maxY: this.y + this.height / 2
        };
    }
}
