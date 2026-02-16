// TouchControls — only instantiated on mobile.
// No dynamic show/hide. If this class exists, it's always active.
export default class TouchControls {
    constructor(game) {
        this.game = game;
        this.visible = true;

        // Joysticks
        this.leftStick = { x: 0, y: 0, active: false, id: null };
        this.rightStick = { x: 0, y: 0, active: false, id: null };

        // Action Buttons (held state)
        this.buttons = {
            dash: false,
            switchWeapon: false,
            interact: false
        };

        // One-shot buttons (cleared each frame)
        this._buttonsPressed = {
            dash: false,
            switchWeapon: false,
            interact: false
        };

        this.createUI();
        this.bindEvents();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'touch-controls';
        Object.assign(this.container.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: '100'
        });

        // --- Left Joystick Zone (Movement) ---
        this.leftZone = this.createJoystickZone('bottom: 50px; left: 50px;');
        this.leftPuck = this.createJoystickPuck(this.leftZone);
        this.container.appendChild(this.leftZone);

        // --- Right Joystick Zone (Aiming) ---
        this.rightZone = this.createJoystickZone('bottom: 50px; right: 50px;');
        this.rightPuck = this.createJoystickPuck(this.rightZone);
        this.container.appendChild(this.rightZone);

        // --- Action Buttons ---
        this.createButton('dash', 'DASH', 'bottom: 220px; right: 60px; background: rgba(0, 255, 255, 0.5); width: 70px; height: 70px;');
        this.createButton('switchWeapon', '⟳', 'bottom: 220px; right: 150px; background: rgba(255, 255, 0, 0.5); width: 60px; height: 60px; font-size: 30px;');
        this.createButton('interact', 'HAND', 'bottom: 120px; right: 180px; background: rgba(0, 255, 0, 0.5); width: 60px; height: 60px;');

        // --- Mobile HUD Menu Buttons (top-left, below HUD) ---
        this.createMenuButton('INV', () => {
            if (this.game.ui) this.game.ui.toggleInventory();
        }, 'top: 100px; left: 20px;');

        this.createMenuButton('STATS', () => {
            if (this.game.ui) this.game.ui.toggleStats();
        }, 'top: 100px; left: 90px;');

        this.createMenuButton('SKILLS', () => {
            if (this.game.ui) this.game.ui.toggleAbilities();
        }, 'top: 100px; left: 175px;');

        document.body.appendChild(this.container);
    }

    createJoystickZone(style) {
        const zone = document.createElement('div');
        Object.assign(zone.style, {
            position: 'absolute', width: '150px', height: '150px',
            borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.3)',
            pointerEvents: 'auto', touchAction: 'none'
        });
        zone.style.cssText += style;
        return zone;
    }

    createJoystickPuck(parent) {
        const puck = document.createElement('div');
        Object.assign(puck.style, {
            position: 'absolute', top: '50%', left: '50%',
            width: '50px', height: '50px', borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none'
        });
        parent.appendChild(puck);
        return puck;
    }

    createButton(action, label, style) {
        const btn = document.createElement('div');
        btn.innerText = label;
        btn.style.cssText = `
            position: absolute; border-radius: 50%; display: flex;
            align-items: center; justify-content: center;
            color: white; font-family: sans-serif; font-weight: bold; font-size: 14px;
            pointer-events: auto; user-select: none; touch-action: none;
            ${style}
        `;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.buttons[action] = true;
            this._buttonsPressed[action] = true;
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.buttons[action] = false;
        });

        this.container.appendChild(btn);
    }

    createMenuButton(label, onClick, style) {
        const btn = document.createElement('div');
        btn.innerText = label;
        btn.style.cssText = `
            position: absolute; border-radius: 8px; display: flex;
            align-items: center; justify-content: center;
            color: white; font-family: sans-serif; font-weight: bold; font-size: 12px;
            pointer-events: auto; user-select: none; touch-action: none;
            background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3);
            width: 60px; height: 35px; cursor: pointer;
            ${style}
        `;

        // Use both touchstart and click for maximum compatibility
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });

        this.container.appendChild(btn);
    }

    bindEvents() {
        this.bindJoystick(this.leftZone, this.leftStick, this.leftPuck);
        this.bindJoystick(this.rightZone, this.rightStick, this.rightPuck);
    }

    bindJoystick(zone, data, puck) {
        const handleStart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            data.id = touch.identifier;
            data.active = true;
            this.updateStick(touch.clientX, touch.clientY, zone, data, puck);
        };

        const handleMove = (e) => {
            if (!data.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === data.id) {
                    e.preventDefault();
                    const t = e.changedTouches[i];
                    this.updateStick(t.clientX, t.clientY, zone, data, puck);
                    break;
                }
            }
        };

        const handleEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === data.id) {
                    e.preventDefault();
                    data.active = false;
                    data.x = 0;
                    data.y = 0;
                    puck.style.transform = `translate(-50%, -50%)`;
                    break;
                }
            }
        };

        zone.addEventListener('touchstart', handleStart);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    updateStick(clientX, clientY, zone, data, puck) {
        const maxDist = 50;
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        data.x = dx / maxDist;
        data.y = dy / maxDist;

        puck.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    // Called at end of frame by Input.update()
    update() {
        // Clear one-shot button states
        this._buttonsPressed.dash = false;
        this._buttonsPressed.switchWeapon = false;
        this._buttonsPressed.interact = false;
    }
}
