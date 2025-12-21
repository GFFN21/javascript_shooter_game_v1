import Bullet from '../entities/Bullet.js';

export default class AttackComponent {
    constructor(entity, type = 'PISTOL') {
        this.entity = entity;
        this.type = type;
        this.cooldownTimer = 0;

        // Default Stats (can be overridden)
        this.fireRate = 1.5;
        this.range = 400;
        this.bulletSpeed = 300;
        this.damage = 1;

        this.configureType(type);
    }

    configureType(type) {
        switch (type) {
            case 'RAPID':
                this.fireRate = 0.5;
                this.bulletSpeed = 350;
                break;
            case 'SHOTGUN':
                this.fireRate = 2.0;
                this.bulletSpread = Math.PI / 4;
                this.bulletCount = 3;
                break;
            case 'HEAVY_SHOTGUN':
                this.fireRate = 2.5;
                this.bulletSpread = Math.PI / 3;
                this.bulletCount = 5;
                this.bulletSpeed = 250;
                break;
            case 'MELEE':
                this.range = 0; // Does not shoot
                break;
            default: // PISTOL
                this.fireRate = 1.5;
                break;
        }
        // Inherit from entity if set? No, entity stats usually set this.
        // Actually, Enemy.js sets this.fireRate. We should probably use that if passed.
        // For now, hardcoded types or use Entity stats.
        // Better: Use stats passed in, or read from Entity.
    }

    update(dt) {
        if (this.type === 'MELEE') return;
        if (!this.entity.game.world.player) return;

        const target = this.entity.game.world.player;
        const dx = target.x - this.entity.x;
        const dy = target.y - this.entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0 && dist < this.range) {
            this.shoot(target);
            this.cooldownTimer = this.fireRate;
        }
    }

    shoot(target) {
        const angle = Math.atan2(target.y - this.entity.y, target.x - this.entity.x);

        const count = this.bulletCount || 1;
        const spread = this.bulletSpread || 0;

        let startAngle = angle;
        let step = 0;

        if (count > 1) {
            startAngle = angle - spread / 2;
            step = spread / (count - 1);
        }

        for (let i = 0; i < count; i++) {
            const fireAngle = startAngle + (step * i);
            const bullet = new Bullet(
                this.entity.game,
                this.entity.x + Math.cos(fireAngle) * 20,
                this.entity.y + Math.sin(fireAngle) * 20,
                Math.cos(fireAngle),
                Math.sin(fireAngle),
                this.bulletSpeed,
                true // isEnemy
            );
            this.entity.game.world.addEntity(bullet);
        }
    }
}
