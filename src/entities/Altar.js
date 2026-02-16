import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class Altar extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = CONFIG.COLLISION_TYPES.PORTAL;
        this.image = new Image();
        this.image.src = "src/mayan_altar.png?v=" + Date.now();

        this.width = 180; // 4.5 Tiles
        this.height = 180;
        this.radius = 80; // Collision size
        this.mass = 1000; // Immovable
    }

    get sortY() {
        return -9999; // Force Floor Layer (Player always on top)
    }

    render(ctx) {
        if (this.image.complete) {
            // Draw centered
            const drawX = this.x - this.width / 2;
            const drawY = this.y - this.height / 2;

            ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
        } else {
            // Placeholder
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        }

        // Optional: Glow effect
        // ctx.shadowBlur = 20;
        // ctx.shadowColor = "cyan";
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, 10, 0, Math.PI*2);
        // ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
        // ctx.fill();
        // ctx.shadowBlur = 0;
    }
}
