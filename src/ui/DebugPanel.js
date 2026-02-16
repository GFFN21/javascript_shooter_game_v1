export default class DebugPanel {
    constructor(game) {
        this.game = game;
        this.visible = false;

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'debug-panel';
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.color = '#00ff00';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '12px';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.pointerEvents = 'none'; // Click through
        this.container.style.display = 'none';
        this.container.style.zIndex = '1000';
        this.container.style.whiteSpace = 'pre'; // Preserve formatting

        document.getElementById('game-container').appendChild(this.container);

        // Bind Toggle Key (F3)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'block' : 'none';
    }

    update(stats) {
        if (!this.visible) return;

        const {
            fps,
            frameTime,
            updateTime,
            renderTime,
            entityCount,
            particleCount,
            collisionChecks,
            rFloor, rEntities, rParticles, rWalls
        } = stats;

        this.container.textContent =
            `FPS: ${fps.toFixed(1)}
Frame: ${frameTime.toFixed(2)} ms
Update: ${updateTime.toFixed(2)} ms
Render: ${renderTime.toFixed(2)} ms
  - Floor: ${rFloor.toFixed(2)} ms
  - Ents:  ${rEntities.toFixed(2)} ms
  - Parts: ${rParticles.toFixed(2)} ms
  - Walls: ${rWalls.toFixed(2)} ms
----------------
Entities: ${entityCount}
Particles: ${particleCount}
Collisions: ${collisionChecks || 'N/A'}`;
    }
}
