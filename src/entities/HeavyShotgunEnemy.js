import Enemy from './Enemy.js';
import Bullet from './Bullet.js';

export default class HeavyShotgunEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#800080'; // Purple
        this.speed = 40; // Very slow tank
        this.hp = 8;
        this.fireRate = 2.0;
        this.shootCooldown = Math.random() * 2;
        this.dropValue = 50;
    }
    shoot(target) {
        const baseAngle = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = 130; // Slower bullets

        // Angles: Center, +/- 60deg (PI/3), +/- 30deg (PI/6)
        // Amplified spread as requested
        const angles = [
            baseAngle,
            baseAngle + Math.PI / 3,
            baseAngle - Math.PI / 3,
            baseAngle + Math.PI / 6,
            baseAngle - Math.PI / 6
        ];

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
