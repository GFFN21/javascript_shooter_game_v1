import Entity from './Entity.js';

export default class Door extends Entity {
    constructor(game, x, y, isHorizontal) {
        super(game, x, y);
        this.isHorizontal = isHorizontal;
        this.state = 'CLOSED'; // CLOSED, OPENING, OPEN, CLOSING
        this.slideOffset = 0;
        this.maxOffset = 40; // Full tile size
        this.speed = 100;
        this.triggerRadius = 100; // Open earlier

        // Block full tile initially
        this.width = 40;
        this.height = 40;

        this.locked = false; // New property

        // Visual sizing for drawing
        if (isHorizontal) {
            this.drawW = 40;
            this.drawH = 10;
        } else {
            this.drawW = 10;
            this.drawH = 40;
        }
    }

    lock() {
        this.locked = true;
        this.state = 'CLOSING';
    }

    unlock() {
        this.locked = false;
    }

    update(dt) {
        if (!this.game.world.player) return;

        // Control Logic
        if (this.locked || this.state === 'CLOSING') {

            // Safety Push: Only if actively closing/partially open (to prevent trapping)
            // We do NOT push if fully closed (slideOffset <= 0), as standard wall collision handles that.
            if (this.slideOffset > 0) {
                const p = this.game.world.player;
                // Simple AABB overlap check
                if (p.x + p.radius > this.x && p.x - p.radius < this.x + this.width &&
                    p.y + p.radius > this.y && p.y - p.radius < this.y + this.height) {

                    // Calculate push direction (from center of door)
                    const cx = this.x + this.width / 2;
                    const cy = this.y + this.height / 2;
                    const angle = Math.atan2(p.y - cy, p.x - cx);

                    // Force push
                    const force = 200 * dt; // Displacement amount
                    p.x += Math.cos(angle) * force;
                    p.y += Math.sin(angle) * force;
                }
            }

            this.state = 'CLOSING';
            // Fallthrough to animation logic
        } else {
            const p = this.game.world.player;
            const dx = p.x - (this.x + 20); // Center distance (assuming x,y is top-left of tile)
            const dy = p.y - (this.y + 20);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.triggerRadius) {
                this.state = 'OPENING';
            } else {
                this.state = 'CLOSING';
            }
        }

        if (this.state === 'OPENING') {
            this.slideOffset += this.speed * dt;
            if (this.slideOffset > this.maxOffset) {
                this.slideOffset = this.maxOffset;
                this.state = 'OPEN';
            }
        } else if (this.state === 'CLOSING') {
            this.slideOffset -= this.speed * dt;
            if (this.slideOffset < 0) {
                this.slideOffset = 0;
                this.state = 'CLOSED';
            }
        }
    }

    isSolid() {
        return this.locked || this.slideOffset < 30; // Always solid if locked
    }

    render(ctx) {
        // Draw door frame/hole (optional, maybe just floor + door)

        ctx.fillStyle = this.locked ? '#500' : '#444'; // Reddish if locked

        let drawX = this.x;
        let drawY = this.y;

        if (this.isHorizontal) {
            // Door is a horizontal bar moving left/right or splitting?
            // Let's slide RIGHT for simplicity
            drawX += this.slideOffset;

            // Adjust to center within tile
            // Horizontal door usually spans the width, thin height? 
            // Actually walls are full blocks. A horizontal door connects Top to Bottom?
            // "Horizontal Door" usually implies the connection is horizontal (Left-Right corridor).
            // NO, "Horizontal Door" means the DOOR ITSELF is horizontal (width > height), blocking a Vertical path?
            // Let's stick to:
            // Horizontal Wall separates Top/Bottom. Door fills that gap.
            // Vertical Wall separates Left/Right. Door fills that gap.

            // Assuming we placed door on a floor tile that acts as a choke.
            if (this.isHorizontal) {
                // Fills width, thin height (centered vertically in tile?)
                // OR fills full tile, but slides away.
                // Let's fill full tile for blocking purposes, but draw as a thin slab?
                // Let's draw full tile size for now to match 2.5D walls.
                drawX = this.x + this.slideOffset;
                if (this.slideOffset < 40) {
                    ctx.fillRect(drawX, this.y, 40 - this.slideOffset, 40);
                }
            }
        } else {
            // Vertical Door (slides Down? or Up?)
            // Slides Down
            let dY = this.y + this.slideOffset;
            if (this.slideOffset < 40) {
                ctx.fillRect(this.x, dY, 40, 40 - this.slideOffset);
            }
        }

        // Debug
        // ctx.strokeStyle = 'yellow';
        // ctx.strokeRect(this.x, this.y, 40, 40);
    }
}
