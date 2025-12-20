import Entity from './Entity.js';
import Bullet from './Bullet.js';
import { CONFIG } from '../Config.js';

export default class Player extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        const stats = CONFIG.PLAYER;
        this.speed = stats.SPEED;
        this.radius = 15;
        this.hp = stats.HP;
        this.maxHp = stats.HP;
        this.shootTimer = 0; // Fixed from shootCooldown
        this.fireRate = 0.15;
        this.mass = 5; // Heavy

        // Dash Properties
        this.dashSpeed = stats.DASH_SPEED;
        this.dashDuration = stats.DASH_DURATION;
        this.dashCooldown = stats.DASH_COOLDOWN;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashDir = { x: 0, y: 0 };

        // Inventory (8 slots)
        this.inventory = new Array(8).fill(null);

        // Equipment (4 slots: Weapon, Armor, Accessory, etc.)
        this.equipment = new Array(4).fill(null);

        // Weapons (3 slots: Primary, Secondary, Sidearm)
        this.weapons = new Array(3).fill(null);
        this.currentWeaponIndex = 0;

        this.money = 0;
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        this.flashTimer = CONFIG.PLAYER.IFRAME_DURATION;
        if (this.hp <= 0) {
            this.game.gameOver();
        }
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

        // Weapon Switching (Arrow Keys)
        if (this.game.input.isPressed('ArrowLeft')) {
            this.currentWeaponIndex--;
            if (this.currentWeaponIndex < 0) this.currentWeaponIndex = this.weapons.length - 1;
        }
        if (this.game.input.isPressed('ArrowRight')) {
            this.currentWeaponIndex++;
            if (this.currentWeaponIndex >= this.weapons.length) this.currentWeaponIndex = 0;
        }

        this.updateMovement(dt);

        // Cooldowns
        if (this.dashTimer > 0) this.dashTimer -= dt;
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
        this.shootTimer -= dt;

        // Shooting (Disabled while dashing? Or allowed? Let's allow it for style)
        if (this.game.input.mouse.down && this.shootTimer <= 0) {
            this.shoot();
        }
    }

    updateMovement(dt) {
        // --- DASH TRIGGER ---
        if (this.game.input.isDown('Space') && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldown;

            // Determine Dash Direction
            // Use current input if moving, otherwise aim towards mouse
            let dx = 0;
            let dy = 0;
            if (this.game.input.isDown('KeyW')) dy -= 1;
            if (this.game.input.isDown('KeyS')) dy += 1;
            if (this.game.input.isDown('KeyA')) dx -= 1;
            if (this.game.input.isDown('KeyD')) dx += 1;

            if (dx === 0 && dy === 0) {
                // Dash towards mouse
                const worldPos = this.game.camera.screenToWorld(this.game.input.mouse.x, this.game.input.mouse.y);
                const angle = Math.atan2(worldPos.y - this.y, worldPos.x - this.x);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            } else {
                // Normalize input
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
            }
            this.dashDir = { x: dx, y: dy };

            // Initial burst particles
            this.game.world.spawnParticles(this.x, this.y, '#00ffff', 10);
        }

        // --- MOVEMENT ---
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
            let dx = 0;
            let dy = 0;

            if (this.game.input.isDown('KeyW')) dy -= 1;
            if (this.game.input.isDown('KeyS')) dy += 1;
            if (this.game.input.isDown('KeyA')) dx -= 1;
            if (this.game.input.isDown('KeyD')) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
            }
            moveX = dx * this.speed * dt;
            moveY = dy * this.speed * dt;
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

        // Shooting (Disabled while dashing? Or allowed? Let's allow it for style)
        if (this.game.input.mouse.down && this.shootTimer <= 0) {
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
        const rect = this.game.canvas.getBoundingClientRect();
        // Mouse relative to camera view
        // The mouse input logic in Input.js gives coordinates relative to canvas 0,0.
        // But our game world has a Camera.
        // If camera allows scrolling, we need to add camera position.
        // Wait, Input.js returns clientX - rect.left. This is screen space.
        // World objects are in World space.
        // Camera logic: ctx.translate(-camera.x, -camera.y).
        // So MouseWorld = MouseScreen + Camera.

        const worldPos = this.game.camera.screenToWorld(this.game.input.mouse.x, this.game.input.mouse.y);
        const mx = worldPos.x;
        const my = worldPos.y;

        // Get Current Weapon Stats
        const weapon = this.weapons[this.currentWeaponIndex];

        let stats = {
            name: 'Fists',
            damage: 1,
            cooldown: 0.5,
            bulletSpeed: 400,
            count: 1,
            spread: 0,
            color: '#fff',
            life: 0.15, // Short range (0.15 * 400 = 60px)
            knockback: 600,
            isMelee: true
        };

        if (weapon) {
            stats = weapon.stats;
        }

        // if (stats.isMelee) {
        //      console.warn("Player: Melee Attack!");
        // } else {
        //      console.warn(`Player: Shooting ${stats.name}`);
        // }

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
                bullet.bounces = 1; // Ricochet Skill
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
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = '#00ff00';
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator (mouse)
        const worldPos = this.game.camera.screenToWorld(this.game.input.mouse.x, this.game.input.mouse.y);
        const mx = worldPos.x;
        const my = worldPos.y;
        const angle = Math.atan2(my - this.y, mx - this.x);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * 30, this.y + Math.sin(angle) * 30);
        ctx.stroke();
    }
}
