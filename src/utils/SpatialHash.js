export default class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.buckets = new Map();
    }

    clear() {
        this.buckets.clear();
    }

    _getKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }

    insert(entity) {
        const startX = Math.floor((entity.x - entity.radius) / this.cellSize);
        const endX = Math.floor((entity.x + entity.radius) / this.cellSize);
        const startY = Math.floor((entity.y - entity.radius) / this.cellSize);
        const endY = Math.floor((entity.y + entity.radius) / this.cellSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const key = `${x},${y}`;
                if (!this.buckets.has(key)) {
                    this.buckets.set(key, []);
                }
                this.buckets.get(key).push(entity);
            }
        }
    }

    query(entity) {
        const candidates = new Set();
        const startX = Math.floor((entity.x - entity.radius) / this.cellSize);
        const endX = Math.floor((entity.x + entity.radius) / this.cellSize);
        const startY = Math.floor((entity.y - entity.radius) / this.cellSize);
        const endY = Math.floor((entity.y + entity.radius) / this.cellSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const key = `${x},${y}`;
                if (this.buckets.has(key)) {
                    const bucket = this.buckets.get(key);
                    for (const other of bucket) {
                        candidates.add(other);
                    }
                }
            }
        }
        return candidates;
    }
}
