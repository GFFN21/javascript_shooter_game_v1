export default class Pathfinder {
    constructor(world) {
        this.world = world;
        this.map = world.map;
    }

    findPath(startX, startY, endX, endY) {
        // Inputs are World Coordinates. Convert to Tile Coordinates.
        const startNode = {
            x: Math.floor(startX / this.map.tileSize),
            y: Math.floor(startY / this.map.tileSize),
            g: 0,
            h: 0,
            f: 0,
            parent: null
        };

        const endNode = {
            x: Math.floor(endX / this.map.tileSize),
            y: Math.floor(endY / this.map.tileSize)
        };

        // If target is inside a wall (e.g. player is sliding), A* will fail.
        // We could search neighbor, but simple A* first.

        let openList = [];
        let closedList = new Set();

        openList.push(startNode);

        while (openList.length > 0) {
            // Sort by F cost (lowest first)
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();

            // Reached destination?
            if (current.x === endNode.x && current.y === endNode.y) {
                return this.reconstructPath(current);
            }

            closedList.add(`${current.x},${current.y}`);

            const neighbors = [
                { x: 0, y: -1 }, { x: 0, y: 1 },
                { x: -1, y: 0 }, { x: 1, y: 0 }
            ];

            for (let offset of neighbors) {
                const nx = current.x + offset.x;
                const ny = current.y + offset.y;

                // Bounds Check & Wall Check
                if (nx < 0 || nx >= this.map.width || ny < 0 || ny >= this.map.height) continue;
                if (this.map.tiles[ny][nx] === 1) continue; // Wall

                // Check Doors
                let blocked = false;
                for (const e of this.world.entities) {
                    if (e.constructor.name === 'Door' && e.isSolid()) {
                        // Door is typically at e.x, e.y (pixel coords)
                        // Convert tile coords to check
                        const tx = Math.floor(e.x / this.map.tileSize);
                        const ty = Math.floor(e.y / this.map.tileSize);
                        if (tx === nx && ty === ny) {
                            blocked = true;
                            break;
                        }
                    }
                }
                if (blocked) continue;
                if (closedList.has(`${nx},${ny}`)) continue;

                const g = current.g + 1;
                const h = Math.abs(nx - endNode.x) + Math.abs(ny - endNode.y); // Manhattan
                const f = g + h;

                // Check if already in open with lower cost
                const existing = openList.find(n => n.x === nx && n.y === ny);
                if (existing && existing.g <= g) continue;

                const neighbor = {
                    x: nx,
                    y: ny,
                    g, h, f,
                    parent: current
                };

                if (!existing) {
                    openList.push(neighbor);
                } else {
                    // Update existing
                    // Actually simpler to just not add if existing is better.
                    // If we are here, we found a better path to existing, but we just push new object?
                    // Standard A*: update existing.
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                }
            }
        }

        return []; // No path found
    }

    reconstructPath(node) {
        const path = [];
        let curr = node;
        while (curr) {
            path.push({
                x: curr.x * this.map.tileSize + this.map.tileSize / 2, // Center of tile
                y: curr.y * this.map.tileSize + this.map.tileSize / 2
            });
            curr = curr.parent;
        }
        return path.reverse();
    }
}
