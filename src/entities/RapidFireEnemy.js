import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';

export default class RapidFireEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, {
            ...CONFIG.ENEMIES.WALKER,
            hp: 6,
            dropValue: 30,
            weaponType: 'RAPID',
            assetBase: 'assets/sprites/zombie_decaying_archeologist'
        });
    }
}
