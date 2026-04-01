export default class Camera {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.target = null;
    }

    follow(target) {
        this.target = target;
    }

    update(dt) {
        if (this.target) {
            // Simple ease towards target
            // Center the camera on the target
            // Track target center directly
            const targetX = this.target.x;
            const targetY = this.target.y;

            this.x += (targetX - this.x) * 0.1;
            this.y += (targetY - this.y) * 0.1;
        }
    }

    apply(ctx) {
        ctx.translate(this.game.width / 2, this.game.height / 2);
        ctx.scale(1.5, 1.5); // Zoom in
        ctx.translate(-this.x, -this.y);
    }

    screenToWorld(x, y) {
        // Inverse of apply()
        // 1. Translate screen to center relative
        const cx = x - this.game.width / 2;
        const cy = y - this.game.height / 2;
        // 2. Scale
        const sx = cx / 1.5;
        const sy = cy / 1.5;
        // 3. Translate Camera
        return {
            x: sx + this.x,
            y: sy + this.y
        };
    }
}
