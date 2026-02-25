import Item from './Item.js';
import { CONFIG } from '../Config.js';

export default class WeaponItem extends Item {
    constructor(game, x, y, type) {
        // Initialize with visual settings
        const stats = WeaponItem.getStats(type);
        super(game, x, y, {
            glowColor: stats.color,
            scale: 1.5
        });

        this.weaponType = type;
        this.stats = stats;
        this.radius = 12;

        // Set Sprite
        this.visual.mode = 'SPRITE';
        this.visual.sprite = new Image();
        this.visual.sprite.src = this.getSpriteSrc(type);
    }

    getSpriteSrc(type) {
        switch (type) {
            case 'Shotgun':
            case 'Heavy Shotgun':
                return 'assets/sprites/Guns/SawedOffShotgun.png';
            case 'Pistol':
                return 'assets/sprites/Guns/Luger.png';
            default:
                return null;
        }
    }

    static getStats(type) {
        switch (type) {
            case 'Shotgun':
                return {
                    name: 'Shotgun',
                    damage: 1,
                    cooldown: 0.8,
                    bulletSpeed: 250,
                    count: 3,
                    spread: Math.PI / 4,
                    color: '#FFA500'
                };
            case 'Pistol':
                return {
                    name: 'Pistol',
                    damage: 1,
                    cooldown: 0.4,
                    bulletSpeed: 500,
                    count: 1,
                    spread: 0,
                    color: '#FFFF00'
                };
            case 'Heavy Shotgun':
                return {
                    name: 'Heavy Shotgun',
                    damage: 2,
                    cooldown: 1.2,
                    bulletSpeed: 250,
                    count: 5,
                    spread: Math.PI / 3,
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

    onCollect(player) {
        if (player.addToInventory(this)) {
            super.onCollect(player);
        }
    }
}
