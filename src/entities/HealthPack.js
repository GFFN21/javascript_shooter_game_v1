import Entity from './Entity.js';

export default class HealthPack extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.radius = 10;
        this.healAmount = 1;
        this.floatOffset = 0;
    }

    update(dt) {
        // Simple floating animation
        this.floatOffset += dt * 5;
    }

    render(ctx) {
        const drawY = this.y + Math.sin(this.floatOffset) * 3;

        // Draw Cross
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 3, drawY - 8, 6, 16);
        ctx.fillRect(this.x - 8, drawY - 3, 16, 6);

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff00';
        // ctx.strokeRect(this.x - 10, drawY - 10, 20, 20);
        ctx.shadowBlur = 0;
    }
}
