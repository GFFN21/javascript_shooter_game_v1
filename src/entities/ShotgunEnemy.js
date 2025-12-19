import Enemy from './Enemy.js';
import Bullet from './Bullet.js';

export default class ShotgunEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#FFA500'; // Orange
        this.speed = 60; // Slower
        this.hp = 5;
        this.fireRate = 1.5;
        this.shootCooldown = Math.random() * 2;
        this.dropValue = 30;
    }

    shoot(target) {
        const baseAngle = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = 250; // Slightly slower bullets?

        // Angles: Center, +45deg (PI/4), -45deg
        const angles = [baseAngle, baseAngle + Math.PI / 4, baseAngle - Math.PI / 4];

        angles.forEach(angle => {
            const bullet = new Bullet(
                this.game,
                this.x + Math.cos(angle) * 20,
                this.y + Math.sin(angle) * 20,
                Math.cos(angle),
                Math.sin(angle),
                speed,
                true // isEnemy
            );
            this.game.world.addEntity(bullet);
        });
    }
}
