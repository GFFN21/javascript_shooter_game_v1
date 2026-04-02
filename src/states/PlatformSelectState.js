import State from './State.js';
import { Platform } from '../Platform.js';

/**
 * PlatformSelectState
 *
 * First-run screen drawn entirely on the canvas.
 * Two side-by-side buttons: "COMPUTER" and "MOBILE".
 * Saves the choice to localStorage so it never shows again on the same device.
 * Transitions to BOOT → SAVE_SELECT after the choice is made.
 */
export default class PlatformSelectState extends State {
    constructor() {
        super('PLATFORM_SELECT');
        this._onMove  = null;
        this._onClick = null;
        this._hovered = null; // 'left' | 'right' | null
    }

    onEnter(game) {
        this._hovered = null;

        // Hide all DOM HUD elements — this is a pre-game state
        game.ui.hideHUD();

        // Mouse hover
        this._onMove = (e) => {
            const pos = this._clientToCanvas(e.clientX, e.clientY, game);
            const { left, right } = this._getRects(game);
            this._hovered = this._hitTest(pos.x, pos.y, left, right);
        };

        // Mouse / touch click
        this._onClick = (e) => {
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const pos = this._clientToCanvas(cx, cy, game);
            const { left, right } = this._getRects(game);
            const hit = this._hitTest(pos.x, pos.y, left, right);
            if (hit === 'left')  this._choose(game, false); // Desktop
            if (hit === 'right') this._choose(game, true);  // Mobile
        };

        game.canvas.addEventListener('mousemove',  this._onMove);
        game.canvas.addEventListener('click',      this._onClick);
        game.canvas.addEventListener('touchstart', this._onClick, { passive: true });
    }

    onExit(game) {
        game.canvas.removeEventListener('mousemove',  this._onMove);
        game.canvas.removeEventListener('click',      this._onClick);
        game.canvas.removeEventListener('touchstart', this._onClick);

        // Restore HUD for gameplay states
        game.ui.showHUD();
    }

    // ── private helpers ────────────────────────────────────────────────────

    _choose(game, isMobile) {
        Platform.setMobile(isMobile);
        game.input.reinitialise();
        game.stateMachine.transition('BOOT');
    }

    /** Compute button rects fresh each frame from live canvas dimensions. */
    _getRects(game) {
        const W  = game.canvas.width;
        const H  = game.canvas.height;
        const bw = Math.min(220, W * 0.28);
        const bh = 70;
        const gap = W * 0.06;
        const by  = H * 0.55;

        return {
            left:  { x: W / 2 - gap / 2 - bw, y: by, w: bw, h: bh },
            right: { x: W / 2 + gap / 2,       y: by, w: bw, h: bh }
        };
    }

    _hitTest(x, y, left, right) {
        const inside = (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
        if (inside(left))  return 'left';
        if (inside(right)) return 'right';
        return null;
    }

    _clientToCanvas(cx, cy, game) {
        const rect   = game.canvas.getBoundingClientRect();
        const scaleX = game.canvas.width  / rect.width;
        const scaleY = game.canvas.height / rect.height;
        return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
    }

    // ── FSM hooks ──────────────────────────────────────────────────────────

    update(game, dt) { /* event-driven, nothing to update */ }
    handleInput(game, input) { /* handled by DOM events */ }

    render(game, ctx) {
        const W = game.canvas.width;
        const H = game.canvas.height;
        const { left, right } = this._getRects(game);

        // ── Background ────────────────────────────────────────────────────
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, W, H);

        // Subtle grid overlay
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // ── Title ─────────────────────────────────────────────────────────
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ffffff';
        ctx.font      = `bold ${Math.round(H * 0.05)}px "Courier New", monospace`;
        ctx.fillText('SELECT YOUR PLATFORM', W / 2, H * 0.38);

        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font      = `${Math.round(H * 0.025)}px "Courier New", monospace`;
        ctx.fillText('Your choice will be remembered on this device.', W / 2, H * 0.46);

        // ── Buttons ───────────────────────────────────────────────────────
        this._drawButton(ctx, left,  '💻  COMPUTER', this._hovered === 'left',  '#1a6fff');
        this._drawButton(ctx, right, '📱  MOBILE',   this._hovered === 'right', '#00c896');
    }

    _drawButton(ctx, btn, label, hovered, accentColor) {
        const { x, y, w, h } = btn;

        this._roundRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = hovered ? accentColor : 'rgba(255,255,255,0.07)';
        ctx.fill();

        ctx.strokeStyle = hovered ? accentColor : 'rgba(255,255,255,0.22)';
        ctx.lineWidth   = hovered ? 2.5 : 1.5;
        this._roundRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.fillStyle    = hovered ? '#ffffff' : 'rgba(255,255,255,0.7)';
        ctx.font         = `${hovered ? 'bold' : 'normal'} ${Math.round(h * 0.3)}px "Courier New", monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

