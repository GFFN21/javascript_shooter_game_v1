import Entity from './Entity.js';
import Bullet from './Bullet.js';

import { CONFIG } from '../Config.js';
import Coin from './Coin.js';
import HealthPack from './HealthPack.js';
import WeaponItem from './WeaponItem.js';
import MovementComponent from '../components/MovementComponent.js';
import AttackComponent from '../components/AttackComponent.js';

export default class Enemy extends Entity {
    // Static cache for enemy frames to avoid redundant loads
    static frameCache = new Map();

    constructor(game, x, y, stats = CONFIG.ENEMIES.WALKER) {
        super(game, x, y);
        this.speed = stats.speed;
        this.type = CONFIG.COLLISION_TYPES.ENEMY;
        this.radius = 16; // Legacy
        this.width = 28;  // AABB hitbox width
        this.height = 28; // AABB hitbox height
        this.hp = stats.hp;
        this.dropValue = stats.dropValue;
        this.color = stats.color;

        // Visual Config
        this.visual.mode = 'ANIMATED';
        this.visual.fps = 8;
        this.visual.scale = 2.6; // Increased by 1.1x per request
        this.visual.offsetY = -10; // Adjust for feet position

        this.assetBase = stats.assetBase || 'assets/sprites/zombie_decaying_archeologist';
        this.direction = 'south';
        this.animationState = 'walking-4-frames';

        this.movement = new MovementComponent(this, stats.moveType || 'CHASE');
        this.attack = new AttackComponent(this, stats.weaponType || 'PISTOL');

        this.updateDirectionalFrames();
    }

    updateDirectionalFrames() {
        const key = `${this.assetBase}/${this.animationState}/${this.direction}`;

        if (Enemy.frameCache.has(key)) {
            this.visual.frames = Enemy.frameCache.get(key);
            return;
        }

        // Preload frames if not in cache
        const frames = [];
        for (let i = 0; i < 4; i++) {
            const img = new Image();
            img.src = `${this.assetBase}/animations/${this.animationState}/${this.direction}/frame_00${i}.png`;
            frames.push(img);
        }

        Enemy.frameCache.set(key, frames);
        this.visual.frames = frames;
    }

    update(dt) {
        super.update(dt);
        if (this.movement) this.movement.update(dt);
        if (this.attack) this.attack.update(dt);

        // Update direction based on movement
        this.updateAnimationState();

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            this.handleDeath();
        }
    }

    updateAnimationState() {
        // Calculate direction from movement velocity or aim
        const target = this.game.world.player;
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const angle = Math.atan2(dy, dx);

        const deg = (angle * 180 / Math.PI + 360) % 360;
        const sector = Math.round(deg / 45) % 8;

        const directions = [
            'east', 'south-east', 'south', 'south-west',
            'west', 'north-west', 'north', 'north-east'
        ];

        const newDir = directions[sector];
        if (newDir !== this.direction) {
            this.direction = newDir;
            this.updateDirectionalFrames();
        }
    }

    handleDeath() {
        // Score & Money
        this.game.score += this.dropValue * 10;
        if (this.game.world.player) this.game.world.player.money += this.dropValue;

        // Drop Coins
        const coinCount = Math.max(1, Math.floor(this.dropValue / 5));
        for (let k = 0; k < coinCount; k++) {
            this.game.world.addEntity(new Coin(this.game, this.x, this.y, 10));
        }

        // Drop HealthPack
        if (Math.random() < CONFIG.DROPS.CHANCE_HEALTH) {
            this.game.world.addEntity(new HealthPack(this.game, this.x, this.y));
        }

        // Drop Weapons
        const type = this.constructor.name;
        if (type === 'ShotgunEnemy') {
            if (Math.random() < 0.2) this.game.world.addEntity(new WeaponItem(this.game, this.x, this.y, 'Shotgun'));
        } else if (type === 'HeavyShotgunEnemy') {
            if (Math.random() < 0.3) this.game.world.addEntity(new WeaponItem(this.game, this.x, this.y, 'Heavy Shotgun'));
        } else {
            // Default chance for Pistol
            if (Math.random() < 0.25) this.game.world.addEntity(new WeaponItem(this.game, this.x, this.y, 'Pistol'));
        }
    }

    onCollision(other) {
        if (other === this.game.world.player) {
            if (other.isDashing) {
                this.takeDamage(1);
                this.applyKnockback(other.dashDir.x, other.dashDir.y, 800);
                this.game.world.spawnParticles(this.x, this.y, '#ffffff', 5); // Reduced from 10
                const hitAngle = Math.atan2(this.y - other.y, this.x - other.x);
                this.x += Math.cos(hitAngle) * 20;
                this.y += Math.sin(hitAngle) * 20;
            } else {
                const angle = Math.atan2(other.y - this.y, other.x - this.x);
                other.applyKnockback(Math.cos(angle), Math.sin(angle), 300);
                if (other.flashTimer <= 0) {
                    other.takeDamage(1);
                    this.game.world.spawnParticles(other.x, other.y, '#ff0000', 3); // Reduced from 5
                }
            }
        }
    }
}
