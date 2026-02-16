import TouchControls from './ui/TouchControls.js';
import { Platform } from './Platform.js';

export default class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.keysPressed = new Set(); // For one-shot input
        this.mouse = { x: 0, y: 0, down: false };

        // Only create touch controls on mobile
        this.touchControls = null;

        if (Platform.isMobile) {
            this.touchControls = new TouchControls(game);
        } else {
            // PC-only: bind keyboard and mouse
            window.addEventListener('keydown', e => {
                this.keys.add(e.code);
                this.keysPressed.add(e.code);
            });
            window.addEventListener('keyup', e => this.keys.delete(e.code));

            window.addEventListener('mousemove', e => {
                const rect = this.game.canvas.getBoundingClientRect();
                const scaleX = this.game.canvas.width / rect.width;
                const scaleY = this.game.canvas.height / rect.height;
                this.mouse.x = (e.clientX - rect.left) * scaleX;
                this.mouse.y = (e.clientY - rect.top) * scaleY;
            });

            window.addEventListener('mousedown', () => this.mouse.down = true);
            window.addEventListener('mouseup', () => this.mouse.down = false);
        }
    }

    isDown(code) {
        return this.keys.has(code);
    }

    isPressed(code) {
        return this.keysPressed.has(code);
    }

    // ---- Movement ----
    getMovement() {
        if (Platform.isMobile) {
            // Joystick only
            const stick = this.touchControls.leftStick;
            if (stick.active) {
                return { x: stick.x, y: stick.y };
            }
            return { x: 0, y: 0 };
        }

        // PC: keyboard only
        let x = 0, y = 0;
        if (this.isDown('KeyW')) y -= 1;
        if (this.isDown('KeyS')) y += 1;
        if (this.isDown('KeyA')) x -= 1;
        if (this.isDown('KeyD')) x += 1;

        const len = Math.sqrt(x * x + y * y);
        if (len > 1) { x /= len; y /= len; }

        return { x, y };
    }

    // ---- Aiming ----
    getAimVector(playerX, playerY) {
        if (Platform.isMobile) {
            // Right joystick only
            const rs = this.touchControls.rightStick;
            if (rs.active && (Math.abs(rs.x) > 0.1 || Math.abs(rs.y) > 0.1)) {
                return { x: rs.x, y: rs.y };
            }
            return { x: 1, y: 0 }; // Default right
        }

        // PC: mouse only
        const worldPos = this.game.camera.screenToWorld(this.mouse.x, this.mouse.y);
        const dx = worldPos.x - playerX;
        const dy = worldPos.y - playerY;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
            return { x: dx / len, y: dy / len };
        }
        return { x: 1, y: 0 };
    }

    // ---- Shooting ----
    isShooting() {
        if (Platform.isMobile) {
            const rs = this.touchControls.rightStick;
            if (rs.active) {
                const mag = Math.sqrt(rs.x * rs.x + rs.y * rs.y);
                return mag > 0.5;
            }
            return false;
        }
        return this.mouse.down;
    }

    // ---- Dash ----
    isDashing() {
        if (Platform.isMobile) {
            return this.touchControls && this.touchControls.buttons.dash;
        }
        return this.isPressed('Space') || this.isPressed('ShiftLeft');
    }

    // ---- Interact ----
    isInteracting() {
        if (Platform.isMobile) {
            return this.touchControls && this.touchControls.buttons.interact;
        }
        return this.isPressed('KeyE');
    }

    // ---- Weapon Switching ----
    isSwitchingWeapon() {
        if (Platform.isMobile) {
            return this.touchControls && this.touchControls.buttons.switchWeapon;
        }
        return this.isPressed('KeyQ') || this.isPressed('ArrowLeft') || this.isPressed('ArrowRight');
    }

    getSwitchWeaponDirection() {
        if (Platform.isMobile) return 1; // Touch button always cycles forward
        if (this.isPressed('ArrowLeft')) return -1;
        return 1;
    }

    // ---- Utility ----
    isMoving() {
        const m = this.getMovement();
        return (m.x * m.x + m.y * m.y) > 0.01;
    }

    update() {
        this.keysPressed.clear();
        if (this.touchControls) {
            this.touchControls.update();
        }
    }
}
