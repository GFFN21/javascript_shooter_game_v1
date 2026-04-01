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

        this.isOpen = false; // Legacy compatibility bind

        // Trap Door FSM
        this.behaviorState = 'LOCKED';
        this.stateTimer = 0;
        this.unlockDelay = 2 + Math.random() * 8; // Random between 2 and 10 seconds

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

    changeState(newState) {
        if (this.behaviorState === newState) return;
        this.behaviorState = newState;
        this.stateTimer = 0;
    }

    update(dt) {
        // TrapDoor now has its own FSM loop like enemies
        this.stateTimer += dt;

        switch (this.behaviorState) {
            case 'LOCKED':
                // Waiting for World.js to trigger open()
                break;

            case 'UNLOCKING':
                // The room is cleared, but door is mechanically unlocking (delay)
                // Rumble effect / anticipation particles
                if (Math.random() < 0.2) {
                    this.game.world.spawnParticles(this.x + (Math.random() * 20 - 10), this.y + (Math.random() * 20 - 10), '#999', 1);
                }
                
                if (this.stateTimer >= this.unlockDelay) {
                    this.changeState('OPEN');
                }
                break;

            case 'OPEN':
                // Door is completely open and interactable
                if (!this.isOpen) {
                    this.isOpen = true; // Sync for World.js
                    this.game.world.spawnParticles(this.x, this.y, '#00ffff', 20); // Big flash
                }
                break;
        }
    }

    open() {
        // Triggered by World.js when the final room is cleared
        if (this.behaviorState === 'LOCKED') {
            this.changeState('UNLOCKING');
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
