import Enemy from '../entities/Enemy.js';
import Pathfinder from '../utils/Pathfinder.js';
import Bullet from '../entities/Bullet.js';

export default class SmartEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.pathfinder = null; // Lazy init
        this.path = [];
        this.pathTimer = 0;
        this.shootCooldown = 2.0;
        this.color = '#9900ff'; // Purple
        this.hp = 5;
        this.mass = 2;
        this.dropValue = 20;
        this.speed = 75; // Slower, less frenetic
    }

    update(dt) {
        super.update(dt);
        if (!this.game.world || !this.game.world.player) return;

        // Init Pathfinder if needed
        if (!this.pathfinder) {
            this.pathfinder = new Pathfinder(this.game.world);
        }

        // Path Re-calculation
        this.pathTimer -= dt;
        if (this.pathTimer <= 0) {
            this.pathTimer = 0.5; // Every 500ms
            this.path = this.pathfinder.findPath(this.x, this.y, this.game.world.player.x, this.game.world.player.y);
            // Remove first node (current tile)
            if (this.path.length > 0) {
                // Determine if we are "close enough" to the first node to skip it?
                // Actually Pathfinder includes start node usually or closest node.
                // Our reconstruct includes end back to start.
                // The first element is Start. We want the next one.
                this.path.shift();
            }
        }

        // Movement
        if (this.path.length > 0) {
            const targetNode = this.path[0];
            const dx = targetNode.x - this.x;
            const dy = targetNode.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                this.path.shift(); // Reached node, go to next
            } else {
                // Move towards node with collision check
                const moveX = (dx / dist) * this.speed * dt;
                const moveY = (dy / dist) * this.speed * dt;

                // Try X
                this.x += moveX;
                if (this.checkWallCollision()) {
                    this.x -= moveX;
                }

                // Try Y
                this.y += moveY;
                if (this.checkWallCollision()) {
                    this.y -= moveY;
                }
            }
        } else {
            // No path (direct or stuck), fallback to simple follow? 
            // Or just idle.
            // Let's fallback to super.update() logic (direct line) BUT we don't want to call super because it moves position.
            // We'll just stand still or try direct check.
        }

        // Shooting (copy from Enemy or super logic if separated)
        // Since we override update, we must re-implement shooting or call a shared method.
        // Enemy.js has shooting logic inside update. I should have extracted it.
        // I'll just copy it for now.

        const player = this.game.world.player;
        const distToPlayer = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && distToPlayer < 400) {
            this.shoot(player);
            this.shootCooldown = this.fireRate;
        }

        if (this.hp <= 0) this.markedForDeletion = true;
    }

    render(ctx) {
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Debug Path
        // ctx.strokeStyle = 'yellow';
        // ctx.beginPath();
        // ctx.moveTo(this.x, this.y);
        // this.path.forEach(p => ctx.lineTo(p.x, p.y));
        // ctx.stroke();
    }
    shoot(target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const speed = 270; // "Superslightly" slower than base (300)

        const bullet = new Bullet(
            this.game,
            this.x + Math.cos(angle) * 20,
            this.y + Math.sin(angle) * 20,
            Math.cos(angle),
            Math.sin(angle),
            speed,
            true // isEnemy
        );
        this.game.world.addEntity(bullet);
    }
}
