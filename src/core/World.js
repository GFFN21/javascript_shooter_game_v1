import Map from './Map.js?v=2';
import Enemy from '../entities/Enemy.js';
import Walker from '../entities/Walker.js';
import SmartEnemy from '../entities/SmartEnemy.js';
import StealthEnemy from '../entities/StealthEnemy.js';
import Player from '../entities/Player.js';
import Particle from '../entities/Particle.js';
import Spawner from '../entities/Spawner.js';
import Door from '../entities/Door.js';
import HealthPack from '../entities/HealthPack.js';
import RapidFireEnemy from '../entities/RapidFireEnemy.js';
import ShotgunEnemy from '../entities/ShotgunEnemy.js';
import HeavyShotgunEnemy from '../entities/HeavyShotgunEnemy.js';
import Coin from '../entities/Coin.js';
import WeaponItem from '../entities/WeaponItem.js';
import Bullet from '../entities/Bullet.js';
import Altar from '../entities/Altar.js';
import TrapDoor from '../entities/TrapDoor.js'; // Replacement for Portal
import SpatialHash from '../utils/SpatialHash.js';
import { CONFIG } from '../Config.js';

export default class World {
    constructor(game, savedInventory = null) {
        this.game = game;
        this.savedInventory = savedInventory;
        this.map = new Map(game);
        this.entities = [];
        this.particles = [];
        this.player = null;
        this.spatialHash = new SpatialHash(CONFIG.SPATIAL_HASH.CELL_SIZE);

        // Debug Stats
        this.collisionChecks = 0;

        this.init();
    }

    init() {
        // Find a valid spawn point
        const rawSpawnX = Math.floor(this.map.startPoint.x / this.map.tileSize);
        const rawSpawnY = Math.floor(this.map.startPoint.y / this.map.tileSize);
        const spawnPos = this.findNearestFloor(rawSpawnX, rawSpawnY);
        const spawnX = spawnPos.x * this.map.tileSize + this.map.tileSize / 2;
        const spawnY = spawnPos.y * this.map.tileSize + this.map.tileSize / 2;

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
            const tx = Math.floor(this.map.endPoint.x / this.map.tileSize);
            const ty = Math.floor(this.map.endPoint.y / this.map.tileSize);
            const pos = this.findNearestFloor(tx, ty);
            const off = this.map.tileSize / 2;
            this.exitDoor = new TrapDoor(this.game, pos.x * this.map.tileSize + off, pos.y * this.map.tileSize + off);
            this.addEntity(this.exitDoor);

            // SYNC coordinate for interaction checks
            this.map.endPoint = { x: this.exitDoor.x, y: this.exitDoor.y };

            // Mark BOSS room as Exit
            const bossRoom = this.map.rooms.find(r => r.type === CONFIG.ROOM_TYPES.BOSS);
            if (bossRoom) {
                bossRoom.isExit = true;
            } else if (this.map.rooms.length > 0) {
                // Fallback to last room if boss type not found (shouldn't happen now)
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

        // Setup Rooms
        for (let i = 0; i < this.map.rooms.length; i++) {
            const r = this.map.rooms[i];
            r.enemiesConfig = [];
            if (!r.doors) r.doors = [];

            r.cleared = false;
            r.triggered = false;

            // 1. Handle Special Room Types
            switch (r.type) {
                case CONFIG.ROOM_TYPES.SPAWN:
                    r.cleared = true;
                    r.triggered = true;
                    continue;

                case CONFIG.ROOM_TYPES.ALTAR: {
                    r.isAltar = true;
                    // Find a valid floor spot for the Altar
                    const pos = this.findNearestFloor(
                        r.x + Math.floor(r.w / 2),
                        r.y + Math.floor(r.h / 2)
                    );
                    this.addEntity(new Altar(this.game, pos.x * this.map.tileSize + this.map.tileSize / 2, pos.y * this.map.tileSize + this.map.tileSize / 2));
                    continue;
                }

                case CONFIG.ROOM_TYPES.LOOT: {
                    // Spawn a random item or chest (TODO: Chest Entity)
                    // For now, spawn 1-2 random enemies as "guards"
                    this.populateRoomEnemies(r, 2);
                    continue;
                }

                case CONFIG.ROOM_TYPES.BOSS: {
                    r.isBoss = true;
                    // Spawn 5-8 hard enemies as a placeholder for Boss
                    this.populateRoomEnemies(r, 6);
                    continue;
                }

                case CONFIG.ROOM_TYPES.ELITE: {
                    this.populateRoomEnemies(r, 6);
                    continue;
                }

                default: // COMBAT
                    this.populateRoomEnemies(r);
                    break;
            }
        }
    }

    populateRoomEnemies(r, overrideCount = null) {
        // Determine Enemy Count based on Room Size and Level
        const area = r.w * r.h;
        let count = overrideCount !== null ? overrideCount : Math.floor(area / 50);

        if (overrideCount === null) {
            count += Math.floor(this.game.level / 3);
            count += Math.floor(Math.random() * 3) - 1;
        }

        const numEnemies = Math.max(1, Math.min(count, 12));

        for (let j = 0; j < numEnemies; j++) {
            let ex, ey, tx, ty;
            let validPos = false;
            let attempts = 0;

            while (!validPos && attempts < 30) {
                attempts++;
                tx = r.x + Math.floor(Math.random() * r.w);
                ty = r.y + Math.floor(Math.random() * r.h);

                // 1. MUST be a floor tile
                if (this.map.tiles[ty][tx] !== 0) continue;

                ex = tx * this.map.tileSize + this.map.tileSize / 2;
                ey = ty * this.map.tileSize + this.map.tileSize / 2;

                // 2. Safe distance from doors
                let safe = true;
                for (const door of r.doors) {
                    const dist = Math.sqrt(Math.pow(ex - door.x, 2) + Math.pow(ey - door.y, 2));
                    if (dist < 120) {
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

    findNearestFloor(tx, ty) {
        if (this.map.tiles[ty][tx] === 0) return { x: tx, y: ty };

        for (let radius = 1; radius < 10; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    const nx = tx + dx;
                    const ny = ty + dy;
                    if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
                        if (this.map.tiles[ny][nx] === 0) return { x: nx, y: ny };
                    }
                }
            }
        }
        return { x: tx, y: ty };
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
        this.updateActiveZones();

        this.entities.forEach(e => {
            if (e.isActive || e.alwaysUpdate) {
                e.update(dt);
            }
        });
        this.particles.forEach(p => p.update(dt));

        // Remove dead entities
        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        this.checkCollisions();
        this.checkExit();
    }

    updateActiveZones() {
        if (!this.player) return;

        // Pixel to Tile
        const tx = Math.floor(this.player.x / this.map.tileSize);
        const ty = Math.floor(this.player.y / this.map.tileSize);

        // 1. Identify Current Room
        let currentRoom = null;
        let currentRoomIndex = -1;
        for (let i = 0; i < this.map.rooms.length; i++) {
            const r = this.map.rooms[i];
            if (tx >= r.x && tx < r.x + r.w &&
                ty >= r.y && ty < r.y + r.h) {
                currentRoom = r;
                currentRoomIndex = i;
                break;
            }
        }

        // 2. Logic Culling: Wake up relevant entities
        // If we are in a corridor (currentRoom is null), we should keep "Active Room" awake?
        // Or keep EVERYTHING awake? Corridors = safe zone?
        // Strategy: 
        // - If in Room X: Wake Room X and connected Neighbors. Sleep others.
        // - If in Corridor: Keep activeRoom awake + neighbors? Or just wake ALL Corridors?
        // - Entities in corridors have roomID = -1 (Always Active? No, defaults to -1).

        // Let's wake:
        // - RoomID == -1 (Global/Corridor entities)
        // - RoomID == currentRoomIndex
        // - RoomID == connected neighbors

        const activeRoomIDs = new Set([-1]);
        if (currentRoomIndex !== -1) {
            activeRoomIDs.add(currentRoomIndex);

            // Add neighbors (connected via doors)
            // We need a graph of rooms. Map.connectRooms connects them.
            // But we didn't store the graph explicitly.
            // Hack: Distance check? Or just wake ALL for now to test?

            // Simpler: Just wake current room. Neighbors will wake when we enter them.
            // Risk: Shooting into next room.
            // Fix: Wake rooms connected by doors in current room tracking?
            // "r.doors" link to Door entities. Door entities don't know "target room".

            // Let's stick to Current Room Only for now (plus Global). 
            // If user shoots into next room, bullets are global, so they travel.
            // Enemies inside next room won't move until player enters. fair enough.
        }

        this.entities.forEach(e => {
            if (e.alwaysUpdate) {
                e.isActive = true;
                return;
            }
            if (activeRoomIDs.has(e.roomID)) {
                e.isActive = true;
            } else {
                e.isActive = false;
            }
        });

        // 3. Trigger & Clear Logic (Original checkRoomStatus)
        if (currentRoom) {
            this.handleRoomLogic(currentRoom);
        }
    }

    handleRoomLogic(currentRoom) {
        // TRIGGER LOGIC
        if (!currentRoom.triggered && !currentRoom.cleared) {
            // Check door overlap (Safety)
            const stuckInDoor = currentRoom.doors.some(d => {
                const pad = 10;
                return (this.player.x + this.player.radius > d.x + pad &&
                    this.player.x - this.player.radius < d.x + d.width - pad &&
                    this.player.y + this.player.radius > d.y + pad &&
                    this.player.y - this.player.radius < d.y + d.height - pad);
            });

            if (stuckInDoor) return;

            // Enter Room Event
            currentRoom.triggered = true;
            this.activeRoom = currentRoom;

            // Trigger Exit Door
            if (currentRoom.isExit && this.exitDoor) this.exitDoor.open();

            // Lock Doors
            currentRoom.doors.forEach(d => d.lock());

            // Spawn Enemies
            currentRoom.enemiesConfig.forEach(cfg => {
                let e;
                const roomIndex = this.map.rooms.indexOf(currentRoom);
                if (cfg.type === Spawner) {
                    e = new Spawner(this.game, cfg.x, cfg.y, SmartEnemy, 1);
                } else {
                    e = new cfg.type(this.game, cfg.x, cfg.y);
                }
                e.roomID = roomIndex;
                this.addEntity(e);
            });
        }

        // CLEAR LOGIC
        if (this.activeRoom === currentRoom) {
            const enemiesAlive = this.entities.some(e =>
                e instanceof Enemy &&
                !e.markedForDeletion &&
                e.roomID === this.map.rooms.indexOf(currentRoom)
            );

            if (!enemiesAlive) {
                console.log("Room Cleared!");
                this.activeRoom.cleared = true;
                this.activeRoom.doors.forEach(d => d.unlock());

                // Force Open Exit Portal if this was the exit room
                if (this.activeRoom.isExit && this.exitDoor) {
                    this.exitDoor.open();
                }

                this.activeRoom = null;
                if (!this.player) return;
                const dx = this.player.x - this.map.endPoint.x;
                const dy = this.player.y - this.map.endPoint.y;
                if (Math.sqrt(dx * dx + dy * dy) < 40) { // Interaction Radius
                    this.nextLevel();
                }
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
        this.collisionChecks = 0;

        // 1. Clear and Rebuild Spatial Hash
        this.spatialHash.clear();

        for (const e of this.entities) {
            if (e.markedForDeletion) continue;
            // Skip particles or non-colliding items to save time?
            // Actually, we need to insert everything that CAN be collided WITH.
            // Bullet vs Enemy: Bullet moves, Enemy is target.
            // So Enemies must be in hash.
            // Player must be in hash.
            // Bullet? Bullet checks collisions. Does anything check Bullet? 
            // Only if we have bullet-bullet collision (rare).
            // So we technically don't need to insert Bullets if they are only "seekers".
            // But for simplicity, let's insert everything except NONE.
            if (e.type !== CONFIG.COLLISION_TYPES.NONE) {
                this.spatialHash.insert(e);
            }
        }

        // 2. Query Collisions
        for (let i = 0; i < this.entities.length; i++) {
            const a = this.entities[i];
            if (a.markedForDeletion) continue;

            // Specific: Bullet Wall Physics (unchanged)
            if (a.constructor.name === 'Bullet') {
                this.checkBulletWallCollision(a);
            }

            // Entity vs Entity (Optimized)
            // Only check if 'a' can collide (e.g. Bullet, Player)
            // If 'a' is a static item, it doesn't "seek" collisions.
            // But let's keep it generic for now.

            const candidates = this.spatialHash.query(a);
            for (const b of candidates) {
                if (a === b) continue; // Self check
                if (b.markedForDeletion) continue;

                this.collisionChecks++;

                if (this.checkCircleCollision(a, b)) {
                    if (a.onCollision) a.onCollision(b);
                    // We don't force b.onCollision(a) here because b will have its own turn loop?
                    // Actually b might be later in 'this.entities'.
                    // So if we do a.onCollision(b), and b.onCollision(a), we cover interaction.
                    // If we WAIT for b's turn, 'a' might be dead.
                    // So we SHOULD do both here?
                    // If we do both here, then when we get to B, we do both again -> Quadruple dispatch?
                    // No. B query A.
                    // Verification:
                    // Loop A:
                    //   Query -> B.
                    //   Collide(A, B) -> A.hit(B), B.hit(A).
                    // Loop B:
                    //   Query -> A.
                    //   Collide(B, A) -> B.hit(A), A.hit(B).
                    // Result: Double execution.
                    // FIX: Only resolve if a.id < b.id ? Or just resolve one-way?
                    // Entity.js doesn't have IDs.
                    // Simple fix: Only process if a index < b index?
                    // But we don't know b's index in spatial hash result.

                    // Pragmatic approach:
                    // Most collisions are One-Way (Bullet -> Enemy).
                    // Bullet.onCollision(Enemy) -> Enemy.takeDamage.
                    // Enemy.onCollision(Bullet) -> (usually nothing).

                    // So redundancy might be okay.
                    // But let's try to minimize.
                    // Actually, if we just call a.onCollision(b), that defines "A hitting B".
                    // When B loops, it calls b.onCollision(a) ("B hitting A").
                    // This creates the symmetry without double-calling per pair.
                    // Existing code: "if (a.onCollision) a.onCollision(b); if (b.onCollision) b.onCollision(a);"
                    // It explicitly called BOTH.
                    // So if I change to just a.onCollision(b), I restore natural order.

                    if (a.onCollision) a.onCollision(b);
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
                if (bullet.isExplosive) {
                    this.explode(bullet.x, bullet.y, 80, bullet.damage || 2);
                }
                bullet.markedForDeletion = true;
                this.spawnParticles(bullet.x, bullet.y, '#aaa', 5);
            }
        }
    }

    explode(x, y, radius, damage) {
        // 1. Visual Effect
        this.spawnParticles(x, y, '#ff8800', 20); // Orange fire
        this.spawnParticles(x, y, '#ffff00', 10); // Yellow spark

        // 2. Query Spatial Hash for nearby enemies
        const dummy = { x, y, radius };
        const candidates = this.spatialHash.query(dummy);

        for (const target of candidates) {
            if (target.type === CONFIG.COLLISION_TYPES.ENEMY) {
                const dx = target.x - x;
                const dy = target.y - y;
                const distSq = dx * dx + dy * dy;
                if (distSq <= radius * radius) {
                    target.takeDamage(damage);
                    // Add knockback away from explosion
                    const dist = Math.sqrt(distSq) || 1;
                    if (target.applyKnockback) {
                        target.applyKnockback(dx / dist, dy / dist, 500);
                    }
                }
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
        // Measure Floor
        const t0 = performance.now();
        this.map.renderFloor(ctx);

        // Measure Entities (Sort + Draw)
        const t1 = performance.now();
        this.entities.sort((a, b) => a.sortY - b.sortY);
        this.entities.forEach(e => e.render(ctx));

        // Measure Particles
        const t2 = performance.now();
        this.particles.forEach(p => p.render(ctx));

        // Measure Walls
        const t3 = performance.now();
        this.map.renderWalls(ctx);
        const t4 = performance.now();

        // Store Stats for Game to read
        this.renderStats = {
            floor: t1 - t0,
            entities: t2 - t1,
            particles: t3 - t2,
            walls: t4 - t3
        };
    }
}
