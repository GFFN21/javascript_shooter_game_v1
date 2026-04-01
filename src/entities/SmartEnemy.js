import Enemy from '../entities/Enemy.js';
import { CONFIG } from '../Config.js';

export default class SmartEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, {
            ...CONFIG.ENEMIES.WALKER,
            hp: 5,
            speed: 75,
            dropValue: 20,
            moveType: 'SMART',
            assetBase: 'assets/sprites/old_decayed_zombie_with_a_gun'
        });
    }
}
