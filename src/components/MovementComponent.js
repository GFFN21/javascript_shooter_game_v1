import Pathfinder from '../utils/Pathfinder.js';

export default class MovementComponent {
    constructor(entity, strategy = 'CHASE') {
        this.entity = entity;
        this.strategy = strategy;

        // Pathfinding State
        this.pathfinder = null;
        this.path = [];
        this.pathTimer = 0;
    }

    update(dt) {
        if (!this.entity.game.world.player) return;
        const target = this.entity.game.world.player;

        if (this.strategy === 'SMART') {
            this.handleSmartMovement(dt, target);
        } else if (this.strategy === 'CHASE') {
            this.handleChaseMovement(dt, target);
        }
    }

    handleChaseMovement(dt, target) {
        const dx = target.x - this.entity.x;
        const dy = target.y - this.entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const moveX = (dx / dist) * this.entity.speed * dt;
            const moveY = (dy / dist) * this.entity.speed * dt;
            this.move(moveX, moveY);
        }
    }

    handleSmartMovement(dt, target) {
        // Init Pathfinder if needed
        if (!this.pathfinder) {
            this.pathfinder = new Pathfinder(this.entity.game.world);
        }

        // Path Re-calculation
        this.pathTimer -= dt;
        if (this.pathTimer <= 0) {
            this.pathTimer = 0.5; // Every 500ms
            this.path = this.pathfinder.findPath(this.entity.x, this.entity.y, target.x, target.y);
            // Remove first node (current tile)
            if (this.path.length > 0) this.path.shift();
        }

        // Follow Path
        if (this.path.length > 0) {
            const targetNode = this.path[0];
            const dx = targetNode.x - this.entity.x;
            const dy = targetNode.y - this.entity.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                this.path.shift(); // Reached node
            } else {
                const moveX = (dx / dist) * this.entity.speed * dt;
                const moveY = (dy / dist) * this.entity.speed * dt;
                this.move(moveX, moveY);
            }
        } else {
            // Fallback if no path: Direct Chase
            this.handleChaseMovement(dt, target);
        }
    }

    move(dx, dy) {
        this.entity.x += dx;
        if (this.entity.checkWallCollision()) {
            this.entity.x -= dx;
        }

        this.entity.y += dy;
        if (this.entity.checkWallCollision()) {
            this.entity.y -= dy;
        }
    }
}
