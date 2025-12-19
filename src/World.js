import Map from './Map.js?v=2';
import Enemy from './entities/Enemy.js';
import Walker from './entities/Walker.js';
import SmartEnemy from './entities/SmartEnemy.js';
import StealthEnemy from './entities/StealthEnemy.js';
import Player from './entities/Player.js';
import Particle from './entities/Particle.js';
import Spawner from './entities/Spawner.js';
import Door from './entities/Door.js';
import HealthPack from './entities/HealthPack.js';
import RapidFireEnemy from './entities/RapidFireEnemy.js';
import ShotgunEnemy from './entities/ShotgunEnemy.js';
import HeavyShotgunEnemy from './entities/HeavyShotgunEnemy.js';
import Coin from './entities/Coin.js';
import WeaponItem from './entities/WeaponItem.js';
import Bullet from './entities/Bullet.js';
import Altar from './entities/Altar.js';
import TrapDoor from './entities/TrapDoor.js'; // Replacement for Portal

export default class World {
    constructor(game, savedInventory = null) {
        this.game = game;
        this.savedInventory = savedInventory;
        this.map = new Map(game);
        this.entities = [];
        this.particles = [];
        this.player = null;

        this.init();
    }

    init() {
        // Find a valid spawn point
        const spawnX = this.map.startPoint.x;
        const spawnY = this.map.startPoint.y;

        if (!this.player) {
            this.player = new Player(this.game, spawnX, spawnY);
            // Restore inventory if exists
            if (this.savedInventory) {
                console.warn("Restoring Inventory:", this.savedInventory);
                this.player.inventory = this.savedInventory;
            }
        } else {
            this.player.x = spawnX;
            this.player.y = spawnY;
            // Health persists
        }

        this.addEntity(this.player);
        this.game.camera.follow(this.player);

        // Spawn Doors
        if (this.map.doorSpots) {
            this.map.doorSpots.forEach(d => {
                this.addEntity(new Door(this.game, d.x * this.map.tileSize, d.y * this.map.tileSize, d.isHorizontal));
            });
        }

        // Spawn Trap Door at Exit
        if (this.map.endPoint) {
            const off = this.map.tileSize / 2;
            this.exitDoor = new TrapDoor(this.game, this.map.endPoint.x + off, this.map.endPoint.y + off);
            this.addEntity(this.exitDoor);

            // Mark last room as Exit
            if (this.map.rooms.length > 0) {
                this.map.rooms[this.map.rooms.length - 1].isExit = true;
            }
        }

        this.activeRoom = null;

        // Post-link doors (Link doors to rooms immediately)
        this.entities.forEach(e => {
            if (e instanceof Door) {
                const tx = Math.floor(e.x / this.map.tileSize);
                const ty = Math.floor(e.y / this.map.tileSize);

                this.map.rooms.forEach(r => {
                    // Ensure r.doors is initialized
                    if (!r.doors) r.doors = [];

                    // Check adjacency (inclusive of border)
                    if (tx >= r.x - 1 && tx <= r.x + r.w &&
                        ty >= r.y - 1 && ty <= r.y + r.h) {
                        r.doors.push(e);
                    }
                });
            }
        });

        // Determine Altar Room (Odd Levels Only)
        let altarRoomIndex = -1;
        if (this.game.level % 2 !== 0) {
            // Pick a random room excluding Spawn (0) and Exit (Last)
            if (this.map.rooms.length > 2) {
                // Range: 1 to length-2
                // (length - 2) gives count of middle rooms
                altarRoomIndex = 1 + Math.floor(Math.random() * (this.map.rooms.length - 2));
                console.log(`Altar Room chosen: Room ${altarRoomIndex}`);
            }
        }

        // Setup Rooms
        for (let i = 0; i < this.map.rooms.length; i++) {
            const r = this.map.rooms[i];
            r.enemiesConfig = [];
            if (!r.doors) r.doors = [];

            r.cleared = false;
            r.triggered = false;

            // Skip Spawn Room (i=0)
            if (i === 0) {
                r.cleared = true;
                r.triggered = true;
                continue;
            }

            // Altar Room Logic
            if (i === altarRoomIndex) {
                r.isAltar = true;
                // No Enemies!
                // Spawn Altar Entity
                const cx = (r.x + r.w / 2) * this.map.tileSize;
                const cy = (r.y + r.h / 2) * this.map.tileSize;
                this.addEntity(new Altar(this.game, cx, cy));

                // Mark as effectively "cleared" so doors don't lock? 
                // Or let it trigger but with 0 enemies it clears immediately?
                // Logic checkRoomStatus checks: "if (!enemiesAlive) room.cleared = true"
                // If 0 enemies spawn, enemiesAlive is false immediately?
                // Yes. But we should probably prevent it from "triggering" a lock-and-unlock sequence just for style.
                // Or maybe we want the "Room Cleared" event to pop?
                // Let's rely on standard logic: 0 enemies -> Room Cleared immediately.
                continue;
            }

            // Determine Enemy Count based on Room Size and Level
            const area = r.w * r.h; // in tiles
            let count = Math.floor(area / 50);
            count += Math.floor(this.game.level / 3);
            count += Math.floor(Math.random() * 3) - 1;

            const numEnemies = Math.max(1, Math.min(count, 10));

            for (let j = 0; j < numEnemies; j++) {
                let ex, ey, tx, ty;
                let validPos = false;
                let attempts = 0;

                while (!validPos && attempts < 15) {
                    attempts++;
                    tx = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
                    ty = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
                    ex = tx * this.map.tileSize + this.map.tileSize / 2;
                    ey = ty * this.map.tileSize + this.map.tileSize / 2;

                    let safe = true;
                    for (const door of r.doors) {
                        const dist = Math.sqrt(Math.pow(ex - door.x, 2) + Math.pow(ey - door.y, 2));
                        if (dist < 150) {
                            safe = false;
                            break;
                        }
                    }
                    if (safe) validPos = true;
                }

                const enemyType = this.pickEnemyType(this.game.level);
                r.enemiesConfig.push({ type: enemyType, x: ex, y: ey });
            }
        }
    }

    pickEnemyType(level) {
        // Weights based on level
        const weights = []; // { type, weight }

        // Core Enemies
        weights.push({ type: Walker, weight: 150 }); // Very Common
        weights.push({ type: Enemy, weight: 50 });  // Uncommon base shooter

        if (level >= 2) {
            weights.push({ type: SmartEnemy, weight: 40 + (level * 5) });
            weights.push({ type: Spawner, weight: 10 + (level * 2) });
        }
        if (level >= 3) {
            weights.push({ type: RapidFireEnemy, weight: 30 + (level * 5) });
        }
        if (level >= 4) {
            weights.push({ type: ShotgunEnemy, weight: 20 + (level * 5) });
            weights.push({ type: StealthEnemy, weight: 15 + (level * 3) });
        }
        if (level >= 6) {
            weights.push({ type: HeavyShotgunEnemy, weight: 10 + (level * 4) });
        }

        // Normalize and Pick
        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of weights) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }
        return Walker; // Fallback
    }


    nextLevel() {
        this.game.level++; // Increment Level
        this.entities = []; // clear all
        this.map = new Map(this.game); // regen map
        this.init(); // re-init (reuses player)
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.game, x, y, color));
        }
    }

    update(dt) {
        this.entities.forEach(e => e.update(dt));
        this.particles.forEach(p => p.update(dt));

        // Remove dead entities
        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        this.checkCollisions();
        this.checkRoomStatus();
        this.checkExit();
    }

    checkRoomStatus() {
        if (!this.player) return;

        // Pixel to Tile
        const tx = Math.floor(this.player.x / this.map.tileSize);
        const ty = Math.floor(this.player.y / this.map.tileSize);

        // Check if inside any room
        let currentRoom = null;
        for (const r of this.map.rooms) {
            if (tx >= r.x && tx < r.x + r.w &&
                ty >= r.y && ty < r.y + r.h) {
                currentRoom = r;
                break;
            }
        }

        // TRIGGER LOGIC
        if (currentRoom && !currentRoom.triggered && !currentRoom.cleared) {
            // Check if player is overlapping any door (Safety delay)
            const stuckInDoor = currentRoom.doors.some(d => {
                // AABB Check (Player radius approx)
                const pad = 10; // Grace margin
                return (this.player.x + this.player.radius > d.x + pad &&
                    this.player.x - this.player.radius < d.x + d.width - pad &&
                    this.player.y + this.player.radius > d.y + pad &&
                    this.player.y - this.player.radius < d.y + d.height - pad);
            });

            if (stuckInDoor) {
                // console.log("Waiting for player to clear door...");
                return;
            }


            // Enter Room Event
            // console.warn(`Entering Room! Enemies Configured: ${currentRoom.enemiesConfig.length}`);
            currentRoom.triggered = true;
            this.activeRoom = currentRoom;

            // Trigger Exit Door if in Exit Room
            if (currentRoom.isExit && this.exitDoor) {
                this.exitDoor.open();
                console.log("Exit Trap Door Opened!");
            }

            // Lock Doors
            currentRoom.doors.forEach(d => d.lock());

            // Spawn Enemies
            currentRoom.enemiesConfig.forEach(cfg => {
                if (cfg.type === Spawner) {
                    // Spawner usually spawns others.
                    // Spawner argument is (game, x, y, enemyType, count)
                    // But here I pushed { type: Spawner }
                    // I need to be careful about Spawner constructor arguments.
                    // Previous logic: new Spawner(game, ex, ey, SmartEnemy, 1)
                    // I should have stored the specific arguments or handle it here.
                    // Let's assume standard handling or custom based on type.
                    this.addEntity(new Spawner(this.game, cfg.x, cfg.y, SmartEnemy, 1));
                } else {
                    this.addEntity(new cfg.type(this.game, cfg.x, cfg.y));
                }
            });

            // console.warn(`Entities after spawn: ${this.entities.length}`);
        }

        // CLEAR LOGIC
        if (this.activeRoom) {
            // Check if enemies are alive
            const enemiesAlive = this.entities.some(e => e instanceof Enemy && !e.markedForDeletion && !(e instanceof Spawner));
            // Note: Spawner itself counts as Entity? Spawner extends Entity. But isEnemy?
            // Enemy.js extends Entity.
            // Spawner extends Entity. Spawner is NOT Enemy instance (unless Spawner extends Enemy).
            // Check Spawner.js: "export default class Spawner extends Entity"
            // So Spawner is NOT Enemy.
            // But we want to kill spawned enemies.
            // Wait, if I check GLOBAL enemies, I might count enemies from other rooms?
            // "Spawn on Entry" means ONLY current room enemies exist! 
            // (Unless enemies followed from elsewhere? But doors were locked).

            if (!enemiesAlive) {
                // Check why?
                // const enemyCount = this.entities.filter(e => e instanceof Enemy).length;
                // console.warn(`Room Cleared Check: Enemies Alive? ${enemiesAlive}. Total Entities: ${this.entities.length}`);
                console.log("Room Cleared!");
                this.activeRoom.cleared = true;
                this.activeRoom.doors.forEach(d => d.unlock());
                this.activeRoom = null;
                // Add Notification / Sound?
            }
        }
    }

    checkExit() {
        if (!this.player) return;
        // Check if Exit Door is open
        if (this.exitDoor && !this.exitDoor.isOpen) return;

        const dx = this.player.x - this.map.endPoint.x;
        const dy = this.player.y - this.map.endPoint.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) { // Interaction Radius
            this.nextLevel();
        }
    }

    checkCollisions() {
        // Bullet vs Entity
        for (let i = 0; i < this.entities.length; i++) {
            const a = this.entities[i];

            if (a.constructor.name === 'Bullet') {
                // Check Wall Collision (Map + Doors)
                if (this.checkWallCollision(a.x - 2, a.y - 2, 4, 4)) {
                    if (a.bounces > 0) {
                        a.bounces--;
                        // Bounce Logic: Determine Axis
                        // Backtrack X to see if it clears
                        const backX = a.x - a.dx * 10;
                        const backY = a.y - a.dy * 10;

                        // If we move back X but keep Y, is it clear?
                        // If clear, then X movement caused the collision -> Reflect X
                        if (!this.checkWallCollision(backX - 2, a.y - 2, 4, 4)) {
                            a.dx = -a.dx;
                            a.x = backX; // Reset position
                        } else {
                            // Otherwise it must be Y
                            a.dy = -a.dy;
                            a.y = backY;
                        }
                        this.spawnParticles(a.x, a.y, '#fff', 3);
                        // Do not delete
                    } else {
                        a.markedForDeletion = true;
                        this.spawnParticles(a.x, a.y, '#aaa', 5);
                    }
                    continue;
                }

                for (let j = 0; j < this.entities.length; j++) {
                    const b = this.entities[j];
                    if (a === b) continue;
                    if (b.constructor.name === 'Bullet') continue;

                    if (a.isEnemy && b === this.player) {
                        if (this.checkCircleCollision(a, b)) {
                            // Dash Invincibility (Bullets pass through)
                            if (b.isDashing) return;

                            // I-Frames (Flash Timer)
                            if (b.flashTimer > 0) return; // Ignore hit if invincible

                            a.markedForDeletion = true;
                            b.takeDamage(a.damage || 1);
                            this.spawnParticles(b.x, b.y, '#00ff00', 10);
                            // console.log('Player hit!');
                        }
                    } else if (!a.isEnemy && b instanceof Enemy) {
                        if (this.checkCircleCollision(a, b)) {
                            a.markedForDeletion = true;
                            b.takeDamage(a.damage || 1);
                            b.applyKnockback(a.dx, a.dy, a.knockback || 400); // Apply impulse
                            this.spawnParticles(b.x, b.y, '#ff0000', 8);
                            // Enemy Death
                            if (b.hp <= 0) {
                                b.markedForDeletion = true;
                                this.game.score += b.dropValue * 10;
                                this.player.money += b.dropValue;

                                // console.warn(`Enemy Died: ${b.constructor.name}. Drop Value: ${b.dropValue}`);

                                // Drop Coins
                                for (let k = 0; k < Math.max(1, Math.floor(b.dropValue / 5)); k++) {
                                    this.addEntity(new Coin(this.game, b.x, b.y, 10));
                                }

                                // Drop HealthPack (20% chance)
                                if (Math.random() < 0.2) {
                                    this.addEntity(new HealthPack(this.game, b.x, b.y));
                                }

                                // Drop Weapons (Chance)
                                if (b.constructor.name === 'ShotgunEnemy') {
                                    if (Math.random() < 0.2) {
                                        console.warn("Dropping Shotgun!");
                                        this.addEntity(new WeaponItem(this.game, b.x, b.y, 'Shotgun'));
                                    }
                                } else if (b.constructor.name === 'HeavyShotgunEnemy') {
                                    if (Math.random() < 0.3) {
                                        console.warn("Dropping Heavy Shotgun!");
                                        this.addEntity(new WeaponItem(this.game, b.x, b.y, 'Heavy Shotgun'));
                                    }
                                } else {
                                    // Default / Red Enemy -> Pistol (25% chance)
                                    if (Math.random() < 0.25) {
                                        // console.log("Dropping Pistol!");
                                        this.addEntity(new WeaponItem(this.game, b.x, b.y, 'Pistol'));
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (a instanceof Coin) {
                if (this.player && !this.player.markedForDeletion) {
                    if (this.checkCircleCollision(a, this.player)) {
                        this.player.money += a.value;
                        this.spawnParticles(a.x, a.y, '#FFD700', 5);
                        a.markedForDeletion = true;
                    }
                }
            } else if (a instanceof WeaponItem) {
                if (this.player && !this.player.markedForDeletion) {
                    if (this.checkCircleCollision(a, this.player)) {
                        if (this.player.addToInventory(a)) {
                            // Picked up
                            this.spawnParticles(a.x, a.y, '#FFF', 10);
                            a.markedForDeletion = true;
                            // console.log("Picked up " + a.type);
                        } else {
                            // Inventory full
                            // console.log("Inventory Full!");
                        }
                    }
                }
            } else if (a instanceof HealthPack) {
                if (this.player && !this.player.markedForDeletion) {
                    if (this.checkCircleCollision(a, this.player)) {
                        if (this.player.hp < this.player.maxHp) {
                            this.player.hp = Math.min(this.player.maxHp, this.player.hp + a.healAmount);
                            a.markedForDeletion = true;
                            this.spawnParticles(a.x, a.y, '#00ff00', 10);
                            // Sound?
                        }
                    }
                }
            } else if (a instanceof Enemy) {
                // Enemy vs Player (Body Collision)
                if (this.player && !this.player.markedForDeletion) {
                    // Check distance to spawn grace?
                    if (this.checkCircleCollision(a, this.player)) {

                        // DASH ATTACK
                        if (this.player.isDashing) {
                            // Hit Enemy
                            a.takeDamage(1); // Reduced damage
                            a.applyKnockback(this.player.dashDir.x, this.player.dashDir.y, 800); // Huge knockback
                            this.spawnParticles(a.x, a.y, '#ffffff', 10);

                            // Visual shake or impact
                            // Prevent multi-hit? Add invulnerability timer to enemy?
                            // For now, raw collision might trigger every frame.
                            // We need to knock them back fast enough or add a cooldown.
                            // Simple hack: push them away significantly so they escape collision radius immediately.
                            const hitAngle = Math.atan2(a.y - this.player.y, a.x - this.player.x);
                            a.x += Math.cos(hitAngle) * 20;
                            a.y += Math.sin(hitAngle) * 20;

                        } else {
                            // Valid Collision

                            // Apply Knockback (Always push apart)
                            const angle = Math.atan2(this.player.y - a.y, this.player.x - a.x);
                            const force = 300;
                            this.player.applyKnockback(Math.cos(angle), Math.sin(angle), force);

                            // Damage with I-Frames
                            if (this.player.flashTimer <= 0) {
                                this.player.takeDamage(1);
                                this.spawnParticles(this.player.x, this.player.y, '#ff0000', 5);
                            }
                        }
                    }
                }
            }
        }

        // Player vs Wall Collision (Simple resolution)
        this.resolveMapCollision(this.player);
    }

    resolveMapCollision(entity) {
        // 1. Tilemap Collision
        const pad = entity.radius * 0.8;
        const x = entity.x;
        const y = entity.y;

        if (this.map.checkCollision(x - pad, y - pad, pad * 2, pad * 2)) {
            // Push back or something?
            // Actually, Player handles physics reversion.
            // But we need to return "Yes collided".
            // The current code logic is weird (empty if block).
            // Ah, Player.js calls `checkWallCollision` which calls MAP directly.
            // So modifying World.resolveMapCollision doesn't affect Player!
            // I need to update Player.js checkWallCollision OR update Map.checkCollision to accept dynamic checks?
            // OR update Player.js to ask World "isFree(x,y)".

            // Player.js calls `this.game.world.map.checkCollision`.
            // Enemy.js calls `this.game.world.map.checkCollision`.

            // Implementation Change:
            // Since Map.checkCollision is the choke point for entities checking walls,
            // I should modify MAP.checkCollision (or the caller) to also check Doors.
            // But MAP doesn't know about Entities (Doors).

            // So I should update Player.js and Enemy.js `checkWallCollision` to call `world.checkWallCollision` instead of `map`.
            // Then `world.checkWallCollision` checks map AND doors.
        }
    }

    // New unified check
    checkWallCollision(x, y, w, h) {
        // 1. Map Tiles
        if (this.map.checkCollision(x, y, w, h)) return true;

        // 2. Entities (Doors, Altar)
        for (const e of this.entities) {
            const isDoor = e.constructor.name === 'Door' && e.isSolid();
            const isAltar = e.constructor.name === 'Altar';

            if (isDoor || isAltar) {
                let bx = e.x;
                let by = e.y;
                let bw = 40;
                let bh = 40;

                if (isAltar) {
                    // Altar uses radius for collision box
                    const r = e.radius || 80;
                    bx = e.x - r;
                    by = e.y - r;
                    bw = r * 2;
                    bh = r * 2;
                } else if (isDoor) {
                    // Door uses width/height (Top-Left)
                    bw = e.width || 40;
                    bh = e.height || 40;
                }

                // AABB Check
                if (x < bx + bw && x + w > bx &&
                    y < by + bh && y + h > by) {
                    return true;
                }
            }
        }
        return false;
    }

    checkCircleCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (a.radius + b.radius);
    }

    render(ctx) {
        this.map.renderFloor(ctx);

        // Sort entities by Y
        this.entities.sort((a, b) => a.sortY - b.sortY);
        this.entities.forEach(e => e.render(ctx));

        // Draw Particles (on top of entities but below walls? or on top of everything?)
        // Usually particles are on top of world.
        this.particles.forEach(p => p.render(ctx));

        // Draw Walls on top (Simple 2.5D hack)
        // Note: This makes walls always appear "above" entities (occluding them).
        // If an entity is "in front" (South) of a wall, it should be drawn AFTER the wall.
        // But renderWalls draws ALL walls.
        // We'll trust the plan for now. Improvement: Y-sort walls.
        this.map.renderWalls(ctx);
    }
}
