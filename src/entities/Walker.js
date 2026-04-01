import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';

export default class Walker extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, {
            ...CONFIG.ENEMIES.WALKER,
            weaponType: 'MELEE',
            assetBase: 'assets/sprites/zombie_decaying_archeologist'
        });
    }
}
