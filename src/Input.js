import TouchControls from './ui/TouchControls.js';

export default class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.keysPressed = new Set(); // For one-shot input
        this.mouse = { x: 0, y: 0, down: false };

        this.touchControls = new TouchControls(game);

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

    // New Abstractions
    getMovement() {
        let x = 0;
        let y = 0;

        // Keyboard
        if (this.isDown('KeyW')) y -= 1;
        if (this.isDown('KeyS')) y += 1;
        if (this.isDown('KeyA')) x -= 1;
        if (this.isDown('KeyD')) x += 1;

        // Joystick Overrides (if active)
        if (this.touchControls && this.touchControls.leftStick.active) {
            x += this.touchControls.leftStick.x;
            y += this.touchControls.leftStick.y;
        }

        // Normalize (Clamping length to 1 is better for analog feel)
        const len = Math.sqrt(x * x + y * y);
        if (len > 1) {
            x /= len;
            y /= len;
        }

        return { x, y };
    }

    getAimVector(playerX, playerY) {
        // 1. Check Touch Aim (Right Joystick)
        if (this.touchControls && this.touchControls.rightStick.active) {
            const rx = this.touchControls.rightStick.x;
            const ry = this.touchControls.rightStick.y;
            // Simple deadzone check
            if (Math.abs(rx) > 0.1 || Math.abs(ry) > 0.1) {
                return { x: rx, y: ry };
            }
        }

        // 2. Fallback to Mouse
        // Calculate vector from Player Screen Pos to Mouse Screen Pos
        const worldPos = this.game.camera.screenToWorld(this.mouse.x, this.mouse.y);
        const dx = worldPos.x - playerX;
        const dy = worldPos.y - playerY;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
            return { x: dx / len, y: dy / len };
        }
        return { x: 1, y: 0 }; // Default right
    }

    isShooting() {
        // Touch: Shoot if Right Stick is pushed far enough
        if (this.touchControls && this.touchControls.rightStick.active) {
            const mag = Math.sqrt(Math.pow(this.touchControls.rightStick.x, 2) + Math.pow(this.touchControls.rightStick.y, 2));
            if (mag > 0.5) return true;
        }

        return this.mouse.down;
    }

    isDashing() {
        return this.isPressed('Space') || this.isPressed('ShiftLeft') || (this.touchControls && this.touchControls.buttons.dash);
    }

    isInteracting() {
        return this.isPressed('KeyE') || (this.touchControls && this.touchControls.buttons.interact);
    }

    isSwitchingWeapon() {
        return this.isPressed('KeyQ') || (this.touchControls && this.touchControls.buttons.switchWeapon);
    }

    update() {
        this.keysPressed.clear(); // Clear one-shot keys at end of frame
        // Touch buttons one-shot? 
        // We'll leave them as "held" for now.
    }
}
