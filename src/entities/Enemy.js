import Entity from './Entity.js';
import Bullet from './Bullet.js';

import { CONFIG } from '../Config.js';
import Coin from './Coin.js';
import HealthPack from './HealthPack.js';
import WeaponItem from './WeaponItem.js';
import MovementComponent from '../components/MovementComponent.js';
import AttackComponent from '../components/AttackComponent.js';

export default class Enemy extends Entity {
    constructor(game, x, y, stats = CONFIG.ENEMIES.WALKER) {
        super(game, x, y);
        this.speed = stats.speed;
        this.type = CONFIG.COLLISION_TYPES.ENEMY;
        this.radius = 15;
        this.hp = stats.hp;
        // this.mass = 2; // In Entity
        this.dropValue = stats.dropValue;
        this.color = stats.color;

        this.movement = new MovementComponent(this, 'CHASE');
        this.attack = new AttackComponent(this, 'PISTOL');
    }

    update(dt) {
        super.update(dt);
        if (this.movement) this.movement.update(dt);
        if (this.attack) this.attack.update(dt);

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            this.handleDeath();
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
                this.game.world.spawnParticles(this.x, this.y, '#ffffff', 10);
                const hitAngle = Math.atan2(this.y - other.y, this.x - other.x);
                this.x += Math.cos(hitAngle) * 20;
                this.y += Math.sin(hitAngle) * 20;
            } else {
                const angle = Math.atan2(other.y - this.y, other.x - this.x);
                other.applyKnockback(Math.cos(angle), Math.sin(angle), 300);
                if (other.flashTimer <= 0) {
                    other.takeDamage(1);
                    this.game.world.spawnParticles(other.x, other.y, '#ff0000', 5);
                }
            }
        }
    }




    render(ctx) {
        // If a sprite is assigned and fully loaded, draw it centered.
        if (this.sprite && this.sprite.complete) {
            const w = this.frameWidth || this.radius * 2;
            const h = this.frameHeight || this.radius * 2;
            const drawX = this.x - w / 2;
            const drawY = this.y - h / 2;
            ctx.drawImage(this.sprite, 0, 0, w, h, drawX, drawY, w, h);
        } else {
            // Fallback: simple colored circle.
            ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : (this.color || '#ff0000');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
