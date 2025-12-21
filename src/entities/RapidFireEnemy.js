import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';
import MovementComponent from '../components/MovementComponent.js';
import AttackComponent from '../components/AttackComponent.js';

export default class RapidFireEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, CONFIG.ENEMIES.WALKER);

        this.color = '#FFFF00'; // Yellow
        this.hp = 6;
        this.dropValue = 30;

        this.movement = new MovementComponent(this, 'CHASE');
        this.attack = new AttackComponent(this, 'RAPID');
    }
}
