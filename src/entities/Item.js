import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

/**
 * Base class for all pickable items (Coins, HealthPacks, Weapons).
 * Consolidates bobbing, glowing, and magnetic/collection logic.
 */
export default class Item extends Entity {
    constructor(game, x, y, options = {}) {
        super(game, x, y);
        this.type = CONFIG.COLLISION_TYPES.ITEM;

        // Apply Item Visuals
        this.visual.bobbing = options.bobbing !== undefined ? options.bobbing : true;
        this.visual.glow = options.glow !== undefined ? options.glow : true;
        this.visual.glowAmount = options.glowAmount || 15;
        this.visual.glowColor = options.glowColor || '#ffffff';
        this.visual.scale = options.scale || 1.5;

        this.magnetic = options.magnetic || false;

        // Hitbox (AABB)
        this.width = 20;
        this.height = 20;

        this.baseY = y;
    }

    update(dt) {
        super.update(dt);

        // Magnetic effect (move towards player if close)
        if (this.magnetic && this.game.world.player) {
            const p = this.game.world.player;
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Distance threshold can be customized per item if needed
            const pullRange = 100;
            if (dist < pullRange) {
                const speed = 250 * dt;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * speed;
                this.y += Math.sin(angle) * speed;
                this.baseY = this.y; // Keep bobbing centered on new position
            }
        }
    }

    onCollision(other) {
        if (other === this.game.world.player && !this.markedForDeletion) {
            this.onCollect(other);
        }
    }

    onCollect(player) {
        // To be overridden by subclasses
        this.game.world.spawnParticles(this.x, this.y, this.visual.glowColor, 10);
        this.markedForDeletion = true;
    }
}
