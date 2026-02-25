import Enemy from './Enemy.js';
import { CONFIG } from '../Config.js';

export default class ShotgunEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, {
            ...CONFIG.ENEMIES.WALKER,
            hp: 5,
            speed: 60,
            dropValue: 30,
            weaponType: 'SHOTGUN',
            assetBase: 'assets/sprites/old_decayed_zombie_with_a_gun'
        });
    }
}
