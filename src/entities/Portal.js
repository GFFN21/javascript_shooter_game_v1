import Entity from './Entity.js';

export default class Portal extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.image = new Image();
        this.image.src = 'src/mayan_portal.png?v=' + Date.now();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };

        // Portal is roughly 64x64 or 128x128. Let's assume 128x128 for grandness.
        // We'll scale it if needed.
        this.width = 100;
        this.height = 100;
        this.radius = 40; // Interaction radius

        // Pulse effect
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += dt * 2;
        // Float or glow?
    }

    render(ctx) {
        if (this.loaded) {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';

            // Draw centered
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            ctx.restore();
        } else {
            // Placeholder
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
