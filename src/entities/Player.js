import Entity from './Entity.js';
import Bullet from './Bullet.js';
import { CONFIG } from '../Config.js';

export default class Player extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        // Initial Stats from Config
        this.baseStats = CONFIG.PLAYER;
        this.type = CONFIG.COLLISION_TYPES.PLAYER;
        this.alwaysUpdate = true;
        this.applySkills();

        this.shootTimer = 0;
        this.fireRate = 0.15;
        this.mass = 5;

        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashDir = { x: 0, y: 0 };

        // Inventory (8 slots)
        this.inventory = new Array(8).fill(null);

        // Equipment (4 slots: Weapon, Armor, Accessory, etc.)
        this.equipment = new Array(4).fill(null);

        // Weapons (2 slots: Primary, Secondary)
        this.weapons = [null, null]; // 2 Slots
        this.currentWeaponIndex = 0;
        this.weapons[0] = { name: 'Pistol', ...CONFIG.WEAPONS.PISTOL }; // Starter

        this.switchWeaponTimer = 0;

        this.money = 0;

        // Sprite
        this.sprite = new Image();
        this.sprite.src = 'assets/sprites/player_spritesheet_v2.png';

        // Animation State
        this.frameWidth = 64;
        this.frameHeight = 64;
        this.cols = 8;
        this.rows = 16;

        this.frameX = 0;
        this.frameY = 0;
        this.fps = 12; // Smoother
        this.frameTimer = 0;
        this.facing = 0; // 0:S, 1:SE, 2:E, 3:NE, 4:N, 5:NW, 6:W, 7:SW
        this.state = 'idle'; // idle, run
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        this.flashTimer = CONFIG.PLAYER.IFRAME_DURATION;
        if (this.hp <= 0) {
            this.game.gameOver();
        }
    }

    applySkills() {
        const stats = CONFIG.PLAYER;
        let maxHp = stats.HP;
        let speed = stats.SPEED;

        if (this.game.unlockedStats) {
            if (this.game.unlockedStats.has('health_boost_1')) maxHp += 1;
            if (this.game.unlockedStats.has('health_boost_2')) maxHp += 2;
            if (this.game.unlockedStats.has('speed_boost_1')) speed *= 1.10;
            if (this.game.unlockedStats.has('speed_boost_2')) speed *= 1.15;
        }

        // Apply
        this.speed = speed;

        // Handle HP
        const oldMax = this.maxHp || maxHp;
        this.maxHp = maxHp;

        // If first time initialization (undefined hp), set full hp
        if (this.hp === undefined) {
            this.hp = this.maxHp;
        } else if (this.maxHp > oldMax) {
            // Optional: If mid-game upgrade, maybe heal the difference?
            // For now, keep current HP, user just gains POTENTIAL.
            // Actually, if I buy +1 HP, I expect to gain a health slot.
        }

        // Dash defaults
        this.dashSpeed = stats.DASH_SPEED;
        this.dashDuration = stats.DASH_DURATION;
        this.dashCooldown = stats.DASH_COOLDOWN;
    }

    addToInventory(item) {
        // Try Weapons first if it's a weapon
        for (let i = 0; i < this.weapons.length; i++) {
            if (this.weapons[i] === null) {
                this.weapons[i] = item;
                // Switch to it immediately? Optional. Let's not.
                console.warn("Equipped " + item.type + " to slot " + (i + 1));
                return true;
            }
        }

        // Try Backpack
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] === null) {
                this.inventory[i] = item;
                console.warn("Added " + item.type + " to backpack slot " + (i + 1));
                return true;
            }
        }

        return false; // Full
    }

    update(dt) {
        super.update(dt);

        this.updateMovement(dt);

        // Cooldowns
        if (this.dashTimer > 0) this.dashTimer -= dt;
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
        this.shootTimer -= dt;

        this.updateAnimation(dt);
    }

    updateAnimation(dt) {
        // Face aim direction (8-way)
        const aimDir = this.game.input.getAimVector(this.x, this.y);
        const angle = Math.atan2(aimDir.y, aimDir.x);

        // Convert Angle (Radians) to 0-7 index (S, SE, E, NE, N, NW, W, SW)
        const deg = angle * (180 / Math.PI);
        const sector = Math.round(deg / 45);

        const map = {
            2: 0, 1: 1, 0: 2, [-1]: 3, [-2]: 4, [-3]: 5, 4: 6, [-4]: 6, 3: 7
        };
        this.facing = map[sector] !== undefined ? map[sector] : 0;

        // State Determination (uses Input abstraction)
        this.state = this.game.input.isMoving() ? 'run' : 'idle';

        // Animate
        const maxFrames = this.state === 'run' ? 8 : 4;

        this.frameTimer += dt;
        if (this.frameTimer > 1 / this.fps) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % maxFrames;
        }
    }

    startDash() {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;

        // Determine Dash Direction
        const movement = this.game.input.getMovement();
        let dx = movement.x;
        let dy = movement.y;

        // If no input, dash towards mouse? Or forward? 
        // Current logic: normalized vector.
        // If movement is 0,0, maybe dash towards mouse?
        if (dx === 0 && dy === 0) {
            // No movement input — dash toward aim direction
            const aimDir = this.game.input.getAimVector(this.x, this.y);
            dx = aimDir.x;
            dy = aimDir.y;
        }

        this.dashDir = { x: dx, y: dy };
        this.game.world.spawnParticles(this.x, this.y, '#0ff', 10);
    }

    updateMovement(dt) {
        // Dashing
        if (this.game.input.isDashing() && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.startDash();
        }

        // Weapon Switching
        if (this.game.input.isSwitchingWeapon() && this.switchWeaponTimer <= 0) {
            const dir = this.game.input.getSwitchWeaponDirection();
            this.currentWeaponIndex += dir;
            if (this.currentWeaponIndex < 0) this.currentWeaponIndex = this.weapons.length - 1;
            if (this.currentWeaponIndex >= this.weapons.length) this.currentWeaponIndex = 0;
            if (this.game.ui) this.game.ui.updateWeaponHUD();
            this.switchWeaponTimer = 0.2; // Debounce
        }
        if (this.switchWeaponTimer > 0) this.switchWeaponTimer -= dt;

        let moveX = 0;
        let moveY = 0;

        if (this.isDashing) {
            // Dashing Movement
            moveX = this.dashDir.x * this.dashSpeed * dt;
            moveY = this.dashDir.y * this.dashSpeed * dt;
            this.dashTimer -= dt;

            // Trail
            if (Math.random() < 0.5) {
                this.game.world.spawnParticles(this.x, this.y, 'rgba(0, 255, 255, 0.5)', 1);
            }

            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.flashTimer = 0.2; // Slight invincibility after dash
                this.triggerDashKnockback();
            }
        } else {
            // Normal Movement
            const movement = this.game.input.getMovement();
            moveX = movement.x * this.speed * dt;
            moveY = movement.y * this.speed * dt;
        }

        // Apply Movement & Collision
        this.x += moveX;
        if (this.checkWallCollision()) {
            this.x -= moveX;
            if (this.isDashing) {
                this.isDashing = false; // Stop dash on wall hit
            }
        }

        this.y += moveY;
        if (this.checkWallCollision()) {
            this.y -= moveY;
            if (this.isDashing) {
                this.isDashing = false;
            }
        }

        // Shooting
        if (this.game.input.isShooting() && this.shootTimer <= 0) {
            this.shoot();
        }
    }

    checkWallCollision() {
        const r = this.radius * 0.8; // bounding box half-width
        return this.game.world.checkWallCollision(
            this.x - r,
            this.y - r,
            r * 2,
            r * 2
        );
    }

    shoot() {
        // console.log("Shoot Called");
        const aimDir = this.game.input.getAimVector(this.x, this.y);

        // Target point (for bullets that need exact target, usually just Direction is enough)
        // Calculating a fake target point far away based on vector
        const mx = this.x + aimDir.x * 1000;
        const my = this.y + aimDir.y * 1000;

        // Get Current Weapon Stats
        const weapon = this.weapons[this.currentWeaponIndex];

        // Fallback: unarmed melee
        const FISTS = {
            name: 'Fists',
            damage: 1,
            cooldown: 0.5,
            bulletSpeed: 400,
            count: 1,
            spread: 0,
            color: '#fff',
            life: 0.15,
            knockback: 600,
            isMelee: true
        };

        const stats = weapon ? (weapon.stats || weapon) : FISTS;

        this.shootTimer = stats.cooldown;

        const baseAngle = Math.atan2(my - this.y, mx - this.x);

        // Calculate spread
        let startAngle = baseAngle;
        let step = 0;

        if (stats.count > 1) {
            startAngle = baseAngle - stats.spread / 2;
            step = stats.spread / (stats.count - 1);
        }

        for (let i = 0; i < stats.count; i++) {
            const angle = startAngle + (step * i);

            const bullet = new Bullet(
                this.game,
                this.x,
                this.y,
                Math.cos(angle),
                Math.sin(angle),
                stats.bulletSpeed,
                false // isEnemy
            );

            bullet.damage = stats.damage;
            bullet.color = stats.color;
            if (stats.life) bullet.life = stats.life;
            bullet.knockback = stats.knockback || 200; // Default knockback
            bullet.isMelee = stats.isMelee;

            if (stats.isMelee) {
                bullet.radius = 20; // Big hitbox for punch
            } else {
                // Apply Ricochet Skill
                bullet.bounces = this.game.unlockedStats.has('ricochet') ? 1 : 0;
            }

            this.game.world.addEntity(bullet);
        }

        // Recoil?
        // Sound?
    }

    triggerDashKnockback() {
        const range = 150;
        const force = 800; // Strong push

        // Visual
        this.game.world.spawnParticles(this.x, this.y, '#00ffff', 20);

        this.game.world.entities.forEach(e => {
            if (e === this) return;
            // Affect enemies (Checking 'hp' is a good proxy for living things)
            if (e.hp !== undefined && e.constructor.name !== 'Player' && e.constructor.name !== 'Bullet') {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < range) {
                    // Safe normalize
                    const nx = dist > 0 ? dx / dist : 1;
                    const ny = dist > 0 ? dy / dist : 0;

                    if (e.applyKnockback) {
                        e.applyKnockback(nx, ny, force);
                        // Optional: Add Stun logic later if requested
                    }
                }
            }
        });
    }

    render(ctx) {
        if (this.flashTimer > 0) ctx.globalAlpha = 0.5;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 25, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();

        // Render Size (~1.5x of 64)
        const drawW = 96;
        const drawH = 96;
        let drawX = this.x - drawW / 2;
        let drawY = this.y - drawH / 2 - 25;

        // Calculate Row
        const rowOffset = this.state === 'run' ? 8 : 0;
        const row = rowOffset + this.facing;

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(this.sprite,
                this.frameX * 64, row * 64,
                64, 64,
                drawX, drawY,
                drawW, drawH
            );
        } else {
            // Fallback: simple filled circle using default color
            ctx.fillStyle = this.color || 'rgba(200,200,200,0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;

        // Debug Hitbox
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}
