import Enemy from '../entities/Enemy.js';
import { CONFIG } from '../Config.js';

export default class StealthEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, {
            ...CONFIG.ENEMIES.WALKER,
            speed: 40,
            assetBase: 'assets/sprites/zombie_decaying_archeologist'
        });
        this.isVisible = false;
        this.detectionRadius = 200;
        this.baseSpeed = 130; // Fast when revealed
        this.color = '#333333'; // Dark Grey
    }

    update(dt) {
        // We bypass Enemy.update to handle custom stealth logic
        this.updatePhysics(dt);

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
                this.game.world.spawnParticles(this.x, this.y, '#ffffff', 5);
            }
        }

        // Custom Stealth Movement & Shooting
        if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            this.x += moveX;
            if (this.checkWallCollision()) this.x -= moveX;

            this.y += moveY;
            if (this.checkWallCollision()) this.y -= moveY;
        }

        // Sync Directional Animations when visible
        if (this.isVisible) {
            this.updateAnimationState();
        }

        // Shooting logic integrated with AttackComponent if needed, 
        // but keeping existing custom shoot logic for stability
        if (this.isVisible && this.attack) {
            this.attack.update(dt);
        }

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            this.handleDeath();
        }
    }

    render(ctx) {
        if (!this.isVisible) {
            // Faint ring when cloaked
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            return;
        }

        // Use standard renderer when visible
        super.render(ctx);
    }
}
