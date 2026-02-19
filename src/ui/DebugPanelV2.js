export default class DebugPanel {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.history = [];
        this.maxHistory = 1000;
        this.criticalLogs = [];
        this.spikeThreshold = 33.3; // ms (target 30fps drop)

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'debug-panel';
        const isMobile = window.innerWidth < 800;

        this.container.style.position = 'fixed';
        this.container.style.top = isMobile ? '60px' : '70px';
        this.container.style.left = '10px';
        this.container.style.right = 'auto';
        this.container.style.width = isMobile ? '180px' : '240px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.container.style.color = '#00ff00';
        this.container.style.fontFamily = "'Courier New', monospace";
        this.container.style.fontSize = isMobile ? '10px' : '12px';
        this.container.style.padding = '8px';
        this.container.style.border = '2px solid #00ff00';
        this.container.style.borderRadius = '0px';
        this.container.style.pointerEvents = 'auto';
        this.container.style.display = 'none';
        this.container.style.zIndex = '10000';
        this.container.style.whiteSpace = 'pre';
        this.container.style.boxShadow = '5px 5px 15px rgba(0,0,0,0.5)';

        document.getElementById('game-container').appendChild(this.container);

        // Bind Toggle Key (F3)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                this.toggle();
                console.log("[DEBUG] Panel toggled:", this.visible);
            }
        });

        // Add Export Logic to double-click
        this.container.addEventListener('dblclick', () => {
            console.log("[DEBUG] Exporting...");
            this.exportLog();
        });
    }

    toggle() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'block' : 'none';
    }

    update(stats) {
        // Log to history even if not visible
        this.captureFrame(stats);

        if (!this.visible) return;

        const {
            fps, frameTime, updateTime, renderTime,
            entityCount, particleCount, collisionChecks,
            entityBreakdown, rFloor, rEntities, rParticles, rWalls
        } = stats;

        // Peak History (Last 100 frames)
        const recentHistory = this.history.slice(-100);
        const avgFrame = recentHistory.reduce((a, b) => a + b.frameTime, 0) / (recentHistory.length || 1);
        const maxFrame = Math.max(...recentHistory.map(h => h.frameTime));

        let breakdownStr = '';
        if (entityBreakdown && Object.keys(entityBreakdown).length > 0) {
            breakdownStr = '\n-- ENTITIES --\n';
            Object.entries(entityBreakdown).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
                breakdownStr += `${type.padEnd(12)}: ${count}\n`;
            });
        } else {
            breakdownStr = '\n(No entity breakdown available)\n';
        }

        this.container.innerHTML = `
<div style="color: #0ff; font-weight: bold; border-bottom: 2px solid #0ff; margin-bottom: 5px;">DEBUG MONITOR</div>
PERF:
  FPS: ${fps.toFixed(1)}
  FT:  ${frameTime.toFixed(2)}ms
  MAX: ${maxFrame.toFixed(2)}ms
  UPD: ${updateTime.toFixed(2)}ms
  RND: ${renderTime.toFixed(2)}ms
----------------
Ents:  ${entityCount}
Parts: ${particleCount}
Coll:  ${collisionChecks || 0}
${breakdownStr}
<div style="color: #aaa; margin-top: 5px; font-size: 10px;">DBL-CLICK TO SAVE LOG</div>
        `;
    }

    captureFrame(stats) {
        const frameData = {
            timestamp: Date.now(),
            ...stats
        };

        this.history.push(frameData);
        if (this.history.length > this.maxHistory) this.history.shift();

        // Detect Spikes
        if (stats.frameTime > this.spikeThreshold) {
            console.warn(`[DEBUG] Performance Spike Detected: ${stats.frameTime.toFixed(1)}ms`);
            this.criticalLogs.push({ ...frameData, type: 'spike' });
        }
    }

    exportLog() {
        const logData = {
            sessionStartTime: this.history[0]?.timestamp,
            exportTime: Date.now(),
            totalFramesTracked: this.history.length,
            spikesDetected: this.criticalLogs.length,
            criticalLogs: this.criticalLogs,
            recentHistory: this.history.slice(-100)
        };

        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game_log_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log("Session diagnostic log exported!");
    }
}
