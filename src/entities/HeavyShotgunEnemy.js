import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';

export default class HeavyShotgunEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, {
            ...CONFIG.ENEMIES.WALKER,
            hp: 8,
            speed: 40,
            dropValue: 50,
            weaponType: 'HEAVY_SHOTGUN',
            assetBase: 'assets/sprites/old_decayed_zombie_with_a_gun'
        });

        this.mass = 3; // Extra heavy
    }
}
