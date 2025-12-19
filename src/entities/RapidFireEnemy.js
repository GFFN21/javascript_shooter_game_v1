import Enemy from './Enemy.js';

export default class RapidFireEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#FFFF00'; // Yellow
        this.hp = 6; // Slightly tougher
        this.fireRate = 0.5; // Shoots every 0.5s (Vs default 2s)
        this.shootCooldown = Math.random() * this.fireRate;
        this.bulletSpeed = 350; // Faster bullets too?
        this.dropValue = 30;
    }

    // Reuse Enemy update/render logic
}
