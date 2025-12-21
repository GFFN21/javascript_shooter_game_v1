import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';
import MovementComponent from '../components/MovementComponent.js';
import AttackComponent from '../components/AttackComponent.js';

export default class ShotgunEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, CONFIG.ENEMIES.WALKER);

        this.color = '#FFA500'; // Orange
        this.speed = 60; // Slower
        this.hp = 5;
        this.dropValue = 30;

        this.movement = new MovementComponent(this, 'CHASE');
        this.attack = new AttackComponent(this, 'SHOTGUN');
    }
}
