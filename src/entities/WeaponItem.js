import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class WeaponItem extends Entity {
    constructor(game, x, y, type) {
        super(game, x, y);
        this.type = type; // This is weapon type (PISTOL etc), careful conflict?
        // Ah, this.type was already used for weapon kind? 
        // Let's check WeaponItem.js usage.
        // It uses this.type to store 'PISTOL', 'SHOTGUN'.
        // We should rename the existing property or use a different property for collision type.
        // But Entity.js now has this.type. 
        // Let's look at WeaponItem.js again.

        this.weaponType = type; // Rename local type to weaponType
        this.type = CONFIG.COLLISION_TYPES.ITEM; // Collision type
        this.radius = 10;
        this.color = '#888'; // Grey steel

        // Define stats based on type
        this.stats = this.getStats(this.weaponType);

        // Animation
        this.bobOffset = Math.random() * Math.PI;
        this.baseY = y;
    }

    getStats(type) {
        switch (type) {
            case 'Shotgun':
                return {
                    name: 'Shotgun',
                    damage: 1,
                    cooldown: 0.8,
                    bulletSpeed: 250,
                    count: 3, // 3 bullets
                    spread: Math.PI / 4, // 45 degrees
                    color: '#FFA500'
                };
            case 'Pistol':
                return {
                    name: 'Pistol',
                    damage: 1,
                    cooldown: 0.4,
                    bulletSpeed: 500, // Faster
                    count: 1,
                    spread: 0,
                    color: '#FFFF00'
                };
            case 'Heavy Shotgun':
                return {
                    name: 'Heavy Shotgun',
                    damage: 2, // Higher damage
                    cooldown: 1.2,
                    bulletSpeed: 250,
                    count: 5, // 5 bullets
                    spread: Math.PI / 3, // 60 degrees
                    color: '#800080'
                };
            default:
                return {
                    name: 'Unknown',
                    damage: 1,
                    cooldown: 1,
                    count: 1,
                    spread: 0,
                    color: '#FFF'
                };
        }
    }

    update(dt) {
        this.bobOffset += 3 * dt;
        this.y = this.baseY + Math.sin(this.bobOffset) * 3;
    }

    onCollision(other) {
        if (other === this.game.world.player && !this.markedForDeletion) {
            if (other.addToInventory(this)) {
                this.game.world.spawnParticles(this.x, this.y, '#FFF', 10);
                this.markedForDeletion = true;
            }
        }
    }

    render(ctx) {
        // Draw Gun Sprite (Simple Rectangle for now)
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.stats.color;

        ctx.fillStyle = '#444';
        ctx.fillRect(-8, -4, 16, 8); // Body
        ctx.fillStyle = '#222';
        ctx.fillRect(-8, 0, 4, 6); // Handle

        // Accent
        ctx.fillStyle = this.stats.color;
        ctx.fillRect(4, -4, 4, 8); // Barrel tip

        ctx.restore();
    }
}
