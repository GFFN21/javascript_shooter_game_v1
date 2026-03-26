export default class DebugRenderer {
    static renderHitboxes(ctx, entities) {
        ctx.save();
        ctx.lineWidth = 2;

        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            
            // Skip non-colliding entities
            if (e.type === 0 && e.constructor.name !== 'Player') continue;

            const w = e.width || 30;
            const h = e.height || 30;
            const hW = w / 2;
            const hH = h / 2;

            if (e.constructor.name === 'Player') {
                ctx.strokeStyle = '#00ff00'; // Green for Player
            } else if (e.type === 1) { // ENEMY
                ctx.strokeStyle = '#ff0000'; // Red for Enemies
            } else if (e.type === 2) { // PROJECTILE
                ctx.strokeStyle = '#ffff00'; // Yellow for Bullets
            } else {
                ctx.strokeStyle = '#0000ff'; // Blue for others
            }

            ctx.strokeRect(e.x - hW, e.y - hH, w, h);
        }

        ctx.restore();
    }
}
