import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class TrapDoor extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = CONFIG.COLLISION_TYPES.PORTAL;
        this.image = new Image();
        this.image.src = 'assets/sprites/new_trap_door.png';
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };

        this.width = 128;
        this.height = 128; // Square
        this.radius = 40; // Interaction radius

        this.isOpen = false;
        this.openTimer = 0;

        // Custom Slicing (out of 1024x1024 image)
        this.slice = {
            sy: 256, // Centered vertically in the greenish section (192 to 832 is 640 high, so (640-512)/2 = 64. 192+64=256)
            sh: 512, // Square slice
            sw: 512  // Half width
        };
    }

    get sortY() {
        return -100000; // Floor Render Layer
    }

    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            this.game.world.spawnParticles(this.x, this.y, '#888', 10);
        }
    }

    render(ctx) {
        if (this.loaded) {
            // Closed (0..512), Open (512..1024)
            const sx = this.isOpen ? 512 : 0;
            const s = this.slice;

            ctx.save();

            // Draw centered
            ctx.translate(this.x, this.y);

            // Rotate 180 degrees if open
            if (this.isOpen) {
                ctx.rotate(Math.PI);
            }

            ctx.drawImage(
                this.image,
                sx, s.sy, s.sw, s.sh,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
            ctx.restore();
        } else {
            // Placeholder - Vibrant Gold/Yellow
            ctx.fillStyle = this.isOpen ? '#ffff00' : '#886600';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
    }
}
