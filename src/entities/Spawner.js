import Entity from './Entity.js';
import Enemy from './Enemy.js';
import SmartEnemy from './SmartEnemy.js';

export default class Spawner extends Entity {
    constructor(game, x, y, enemyType = Enemy, count = 1) {
        super(game, x, y);
        this.enemyType = enemyType;
        this.count = count;
        this.triggerRadius = 150;
        this.visible = false; // Invisible to player
    }

    update(dt) {
        if (!this.game.world.player) return;

        const p = this.game.world.player;
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.triggerRadius) {
            this.spawn();
        }
    }

    spawn() {
        for (let i = 0; i < this.count; i++) {
            // Slight offset for multiple enemies
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            const enemy = new this.enemyType(this.game, this.x + offsetX, this.y + offsetY);
            this.game.world.addEntity(enemy);

            // Spawn Effect
            this.game.world.spawnParticles(this.x + offsetX, this.y + offsetY, '#ff00ff', 10);
        }
        this.markedForDeletion = true;
    }

    render(ctx) {
        // Debug view: render faint circle if needed, or nothing.
        // ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, 10, 0, Math.PI*2);
        // ctx.stroke();
    }
}
