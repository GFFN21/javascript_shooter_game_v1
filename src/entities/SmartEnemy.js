import Enemy from '../entities/Enemy.js';
import { CONFIG } from '../Config.js';
import MovementComponent from '../components/MovementComponent.js';
import AttackComponent from '../components/AttackComponent.js';

export default class SmartEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, CONFIG.ENEMIES.WALKER);

        // Stats Override
        this.color = '#9900ff';
        this.hp = 5;
        this.dropValue = 20;
        this.speed = 75;

        // Components
        this.movement = new MovementComponent(this, 'SMART');
        this.attack = new AttackComponent(this, 'PISTOL');
    }
}
