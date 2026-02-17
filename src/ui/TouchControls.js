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

        // --- Left Joystick Zone (Movement) ---
        this.leftZone = this.createJoystickZone('left');
        this.leftPuck = this.createJoystickPuck(this.leftZone);
        this.container.appendChild(this.leftZone);

        // --- Right Joystick Zone (Aiming) ---
        this.rightZone = this.createJoystickZone('right');
        this.rightPuck = this.createJoystickPuck(this.rightZone);
        this.container.appendChild(this.rightZone);

        // --- Action Buttons ---
        this.createButton('dash', 'DASH', 'dash');
        this.createButton('switchWeapon', '⟳', 'switch-weapon');
        this.createButton('interact', 'HAND', 'interact');

        // --- Mobile HUD Menu Buttons ---
        this.createMenuButton('INV', () => {
            if (this.game.ui) this.game.ui.toggleInventory();
        }, 'inv');

        this.createMenuButton('STATS', () => {
            if (this.game.ui) this.game.ui.toggleStats();
        }, 'stats');

        this.createMenuButton('SKILLS', () => {
            if (this.game.ui) this.game.ui.toggleAbilities();
        }, 'skills');

        document.body.appendChild(this.container);
    }

    createJoystickZone(positionClass) {
        const zone = document.createElement('div');
        zone.className = `touch-zone ${positionClass}`;
        return zone;
    }

    createJoystickPuck(parent) {
        const puck = document.createElement('div');
        puck.className = 'touch-puck';
        parent.appendChild(puck);
        return puck;
    }

    createButton(action, label, typeClass) {
        const btn = document.createElement('div');
        btn.innerText = label;
        btn.className = `touch-btn ${typeClass}`;

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

    createMenuButton(label, onClick, typeClass) {
        const btn = document.createElement('div');
        btn.innerText = label;
        btn.className = `touch-menu-btn ${typeClass}`;

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
