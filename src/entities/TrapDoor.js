import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class TrapDoor extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = CONFIG.COLLISION_TYPES.PORTAL;
        this.image = new Image();
        this.image.src = 'src/trap_door_sheet.png';
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };

        this.width = 64;
        this.height = 64;
        this.radius = 30; // Interaction radius

        this.isOpen = false;
        this.openTimer = 0;
    }

    get sortY() {
        return -100000; // Floor Render Layer
    }

    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            // Play sound?
            // Particle dust?
            this.game.world.spawnParticles(this.x, this.y, '#888', 10);
        }
    }

    render(ctx) {
        if (this.loaded) {
            // Frame 0: Closed (0,0), Frame 1: Open (64,0)
            const sx = this.isOpen ? 64 : 0;

            ctx.drawImage(
                this.image,
                sx, 0, 64, 64,
                this.x - 32, this.y - 32, 64, 64
            );
        } else {
            // Placeholder
            ctx.fillStyle = this.isOpen ? '#000' : '#555';
            ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        }
    }
}
