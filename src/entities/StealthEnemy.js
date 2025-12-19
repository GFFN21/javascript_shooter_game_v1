import Enemy from '../entities/Enemy.js';

export default class StealthEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.isVisible = false;
        this.detectionRadius = 200;
        this.speed = 40; // Slower when stalking
        this.baseSpeed = 130; // Fast when revealed
        this.color = '#333333'; // Dark Grey
        this.mass = 1; // Light
    }

    update(dt) {
        this.updatePhysics(dt); // Physics + Flash
        // Wait, StealthEnemy extends Enemy. Enemy extends Entity.
        // If StealthEnemy extends Enemy, does it call Enemy.update or override it?
        // It overrides it.
        // But StealthEnemy logic needs Enemy logic?
        // Ah, StealthEnemy implementation was a full override of update logic?
        // Let's check StealthEnemy.js content via view_file or memory.
        // In previous turn I wrote StealthEnemy.js fully. It overrides update.
        // So I need to call super.update(dt) if I want Entity logic (flashTimer).
        // BUT calling super.update(dt) calls Enemy.update(dt) which does movement logic!
        // CAUTION: Enemy.update has movement/shooting logic. I probably DON'T want to call Enemy.update from StealthEnemy if StealthEnemy has custom logic.
        // I want Entity.update.
        // Javascript doesn't support super.super.update.
        // So for StealthEnemy, I should manually decrement flashTimer OR ensure Enemy.update is compatible.
        // StealthEnemy update IS custom.
        // So I'll just manually decrement flashTimer in StealthEnemy to avoid side effects of Enemy.update.

        if (!this.game.world.player) return;

        const target = this.game.world.player;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detection Logic
        if (!this.isVisible) {
            if (dist < this.detectionRadius) {
                this.isVisible = true;
                this.speed = this.baseSpeed; // Enrage
                // Optional: Spawn particles on reveal
                this.game.world.spawnParticles(this.x, this.y, '#ffffff', 5);
            }
        }

        // Movement
        if (dist > 0) {
            // Standard Follow
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            this.x += moveX;
            if (this.checkWallCollision()) this.x -= moveX;

            this.y += moveY;
            if (this.checkWallCollision()) this.y -= moveY;
        }

        // Shooting - Only if visible
        if (this.isVisible) {
            this.shootCooldown -= dt;
            if (this.shootCooldown <= 0 && dist < 400) {
                this.shoot(target);
                this.shootCooldown = this.fireRate;
            }
        }

        if (this.hp <= 0) {
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        if (!this.isVisible) {
            // Optional: Draw faint shadow or nothing?
            // Nothing for true stealth.
            // Maybe a slight distortion or alpha?
            // ctx.globalAlpha = 0.1;
            // super.render(ctx); // Draw red? No

            // Faint ring
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            // ctx.globalAlpha = 1.0;
            return;
        }

        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
