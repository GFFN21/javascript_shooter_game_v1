import Entity from './Entity.js';

export default class Coin extends Entity {
    constructor(game, x, y, value) {
        super(game, x, y);
        this.value = value;
        this.radius = 8;
        this.color = '#FFD700'; // Gold

        // Simple bobbing animation
        this.bobOffset = 0;
        this.bobSpeed = 5;
        this.baseY = y;
    }

    update(dt) {
        this.bobOffset += this.bobSpeed * dt;
        this.y = this.baseY + Math.sin(this.bobOffset) * 3;

        // Magnet effect (move towards player if close)
        if (this.game.world.player) {
            const p = this.game.world.player;
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                // Determine speed based on distance (faster when closer)
                const speed = 200 * dt;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * speed;
                this.y += Math.sin(angle) * speed;
                this.baseY = this.y; // Update base for bobbing
            }
        }
    }


    onCollision(other) {
        if (other === this.game.world.player && !this.markedForDeletion) {
            other.money += this.value;
            this.game.world.spawnParticles(this.x, this.y, '#FFD700', 5);
            this.markedForDeletion = true;
        }
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shine
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();
    }
}
