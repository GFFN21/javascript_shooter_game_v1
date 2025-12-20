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
        for (let i = 0; i < this.entities.length; i++) {
            const a = this.entities[i];
            if (a.markedForDeletion) continue;

            // Specific: Bullet Wall Physics
            if (a.constructor.name === 'Bullet') {
                this.checkBulletWallCollision(a);
            }

            // Entity vs Entity
            for (let j = i + 1; j < this.entities.length; j++) {
                const b = this.entities[j];
                if (b.markedForDeletion) continue;

                // Quick Distance Check
                if (this.checkCircleCollision(a, b)) {
                    // Two-way dispatch
                    if (a.onCollision) a.onCollision(b);
                    if (b.onCollision) b.onCollision(a);
                }
            }
        }

        // Player Wall Check
        this.resolveMapCollision(this.player);
    }

    checkBulletWallCollision(bullet) {
        if (this.checkWallCollision(bullet.x - 2, bullet.y - 2, 4, 4)) {
            if (bullet.bounces > 0) {
                bullet.bounces--;
                // Bounce Logic
                const backX = bullet.x - bullet.dx * 10;
                const backY = bullet.y - bullet.dy * 10;

                if (!this.checkWallCollision(backX - 2, bullet.y - 2, 4, 4)) {
                    bullet.dx = -bullet.dx;
                    bullet.x = backX;
                } else {
                    bullet.dy = -bullet.dy;
                    bullet.y = backY;
                }
                this.spawnParticles(bullet.x, bullet.y, '#fff', 3);
            } else {
                bullet.markedForDeletion = true;
                this.spawnParticles(bullet.x, bullet.y, '#aaa', 5);
            }
        }
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
