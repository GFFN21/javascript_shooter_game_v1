import Item from './Item.js';
import { CONFIG } from '../Config.js';

export default class Coin extends Item {
    constructor(game, x, y, value) {
        // Gold glow
        super(game, x, y, {
            glowColor: '#FFD700',
            glowAmount: 10,
            scale: (24 * 4.5) / 512, // The PNG is 512x512, scaled to ~120x120 size (5x larger)
            magnetic: true
        });

        this.value = value;
        this.radius = 8;

        // Add Sprite
        this.visual.mode = 'SPRITE';
        this.visual.sprite = new Image();
        this.visual.sprite.src = 'assets/sprites/coin sprites/Coin-Sprite-0001.png';

        this.color = '#FFD700'; // Fallback
    }

    onCollect(player) {
        player.money += this.value; // Run money
        this.game.bank += this.value; // Persistent Bank
        this.game.saveProgress();

        super.onCollect(player);
    }
}
