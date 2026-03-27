import Entity from './Entity.js';
import { CONFIG } from '../Config.js';

export default class Altar extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = CONFIG.COLLISION_TYPES.PORTAL;
        this.image = new Image();
        this.image.src = "assets/sprites/new_altar.png?v=" + Date.now();

        this.width = 180; // 4.5 Tiles
        this.height = 180;
        this.radius = 80; // Collision size
        this.mass = 1000; // Immovable
    }

    get sortY() {
        return -9999; // Force Floor Layer (Player always on top)
    }

    update(dt) {
        super.update(dt);
        
        // Check proximity to player
        this.canInteract = false;
        if (this.game.world.player) {
            const p = this.game.world.player;
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 100) { // Interaction Range
                this.canInteract = true;
            }
        }
    }

    interact() {
        // Triggered by PlayingState when E is pressed
        this.game.grantRandomSkill();
        
        // Spawn particles on interaction
        this.game.world.spawnParticles(this.x, this.y, '#00ffff', 30);
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

        // Interaction Prompt
        if (this.canInteract) {
            ctx.save();
            ctx.fillStyle = "white";
            ctx.font = "bold 16px 'Courier New'";
            ctx.textAlign = "center";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "black";
            ctx.fillText("PRESS [E] TO PRAY", this.x, this.y - this.height/2 - 20);
            ctx.restore();
        }
    }
}
