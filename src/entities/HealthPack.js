import Item from './Item.js';
import { CONFIG } from '../Config.js';

export default class HealthPack extends Item {
    constructor(game, x, y) {
        // Green glow
        super(game, x, y, {
            glow: false, // Explicitly disable glow
            glowColor: '#00ff00',
            glowAmount: 15,
            scale: 1.0
        });

        this.radius = 10;
        this.healAmount = 1;
        this.color = '#00ff00'; // Fallback
    }

    onCollect(player) {
        if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + this.healAmount);
            super.onCollect(player); // Spawns particles and deletes
        }
    }

    render(ctx) {
        const v = this.visual;
        let drawY = this.y + v.offsetY;
        if (v.bobbing) {
            drawY += Math.sin(performance.now() * 0.001 * v.bobSpeed) * v.bobAmount;
        }

        ctx.save();
        ctx.translate(this.x, drawY);

        if (v.glow) {
            ctx.shadowBlur = v.glowAmount;
            ctx.shadowColor = v.glowColor;
        }

        // Draw Cross
        ctx.fillStyle = this.color;
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillRect(-8, -3, 16, 6);

        ctx.restore();
    }
}
