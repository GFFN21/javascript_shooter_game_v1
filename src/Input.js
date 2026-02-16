export default class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.keysPressed = new Set(); // For one-shot input
        this.mouse = { x: 0, y: 0, down: false };

        window.addEventListener('keydown', e => {
            this.keys.add(e.code);
            this.keysPressed.add(e.code);
        });
        window.addEventListener('keyup', e => this.keys.delete(e.code));

        window.addEventListener('mousemove', e => {
            const rect = this.game.canvas.getBoundingClientRect();
            // Calculate scale factor (CSS size vs Logical size)
            const scaleX = this.game.canvas.width / rect.width;
            const scaleY = this.game.canvas.height / rect.height;

            // Remap
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        window.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });
        window.addEventListener('mouseup', () => this.mouse.down = false);
    }

    isDown(code) {
        return this.keys.has(code);
    }

    isPressed(code) {
        return this.keysPressed.has(code);
    }

    update() {
        this.keysPressed.clear(); // Clear one-shot keys at end of frame
    }
}
