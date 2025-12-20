export default class Map {
    constructor(game) {
        console.warn("--- MAP MODULE V2 LOADED ---");
        this.game = game;
        this.tileSize = 40;
        this.width = 50; // in tiles
        this.height = 50;
        this.tiles = []; // 2D array, column-major or row-major? Row-major: [y][x]
        this.rooms = [];

        // Tileset Loading
        this.tileset = new Image();
        // Add timestamp to force reload
        this.tileset.src = 'mayan_tileset.png?v=' + Date.now();
        this.tilesetLoaded = false;
        this.tileset.onload = () => {
            this.tilesetLoaded = true;
            console.log("Tileset Loaded. Dim:", this.tileset.naturalWidth, this.tileset.naturalHeight);
            this.preRenderMap();
        };
        this.tileset.onerror = () => {
            console.error("Tileset Failed to Load");
        };

        // Tile IDs mapped to User Request
        this.ids = {
            left: [1, 9],
            right: [0, 8],
            cornerTL: [24],
            cornerTR: [25, 21],
            top: [2, 4, 10, 11, 18, 19, 26],
            floors: []
        };

        // Populate floors: 32-37, 40-45, 48-53
        const floorRows = [4, 5, 6];
        for (let r of floorRows) {
            for (let i = 0; i < 6; i++) {
                this.ids.floors.push(r * 8 + i);
            }
        }

        // Generic Front Face (Use ID 8 as a placeholder for vertical strip)
        this.frontFaceId = 8;

        this.debugLogged = false;

        this.generate();
    }

    // Check if a tile is out of bounds (Void)
    isVoid(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    // Check if tile is floor
    isFloor(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height && this.tiles[y][x] === 0;
    }

    getTileSrc(id) {
        return {
            x: (id % 8) * 128,
            y: Math.floor(id / 8) * 128
        };
    }

    // ... (Generate methods unchanged) ...

    preRenderMap() {
        if (!this.tilesetLoaded) return;

        // Initialize Canvases
        if (!this.floorCanvas) {
            this.floorCanvas = document.createElement('canvas');
            this.floorCanvas.width = this.width * this.tileSize;
            this.floorCanvas.height = this.height * this.tileSize;
            this.floorCtx = this.floorCanvas.getContext('2d');

            this.wallCanvas = document.createElement('canvas');
            this.wallCanvas.width = this.width * this.tileSize;
            this.wallCanvas.height = this.height * this.tileSize;
            this.wallCtx = this.wallCanvas.getContext('2d');
        }

        const fCtx = this.floorCtx;
        const wCtx = this.wallCtx;

        // Clear
        fCtx.clearRect(0, 0, this.floorCanvas.width, this.floorCanvas.height);
        wCtx.clearRect(0, 0, this.wallCanvas.width, this.wallCanvas.height);

        // Loop ALL tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                // Floor
                if (this.tiles[y][x] === 0) {
                    const index = (x + y * 57) % this.ids.floors.length;
                    const id = this.ids.floors[index];
                    const src = this.getTileSrc(id);
                    fCtx.drawImage(this.tileset, src.x, src.y, 128, 128, px, py, this.tileSize, this.tileSize);
                }

                // Walls
                if (this.tiles[y][x] === 1) {
                    // Wall Logic
                    const fLeft = this.isFloor(x - 1, y);
                    const fRight = this.isFloor(x + 1, y);
                    const fDown = this.isFloor(x, y + 1);
                    const fUp = this.isFloor(x, y - 1);

                    if (!fLeft && !fRight && !fDown && !fUp) {
                        const fDL = this.isFloor(x - 1, y + 1);
                        const fDR = this.isFloor(x + 1, y + 1);
                        const fUL = this.isFloor(x - 1, y - 1);
                        const fUR = this.isFloor(x + 1, y - 1);
                        if (!fDL && !fDR && !fUL && !fUR) continue;
                    }

                    let candidates = this.ids.top;
                    let currentFrontFaceId = this.frontFaceId;

                    if (fDown) {
                        if (fRight) candidates = this.ids.cornerTL;
                        else if (fLeft) candidates = this.ids.cornerTR;
                        else candidates = this.ids.top;
                    } else if (fRight) {
                        candidates = this.ids.left;
                        currentFrontFaceId = 9;
                    } else if (fLeft) {
                        candidates = this.ids.right;
                        currentFrontFaceId = 8;
                    }

                    const index = (x + y * 13) % candidates.length;
                    const id = candidates[index];
                    const src = this.getTileSrc(id);
                    const srcFront = this.getTileSrc(currentFrontFaceId);

                    // Draw to Wall Canvas
                    wCtx.drawImage(this.tileset, srcFront.x, srcFront.y, 128, 128, px, py + this.tileSize - 20, this.tileSize, 20);
                    wCtx.drawImage(this.tileset, src.x, src.y, 128, 128, px, py - 20, this.tileSize, this.tileSize);
                }
            }
        }
        console.log("Static Cache Regenerated");
    }

    renderFloor(ctx) {
        if (!this.floorCanvas) {
            // Lazy init logic or fallback
            // Currently relies on loading. 
            return;
        }
        this.renderLayer(ctx, this.floorCanvas);
    }

    renderWalls(ctx) {
        if (!this.wallCanvas) return;
        this.renderLayer(ctx, this.wallCanvas);
    }

    renderLayer(ctx, canvas) {
        // Viewport Culling
        const tl = this.game.camera.screenToWorld(0, 0);
        const br = this.game.camera.screenToWorld(this.game.width, this.game.height);

        const margin = this.tileSize * 2;
        let sx = tl.x - margin;
        let sy = tl.y - margin;
        let w = (br.x - tl.x) + margin * 2;
        let h = (br.y - tl.y) + margin * 2;

        // Clamp to Canvas Bounds
        if (sx < 0) { w += sx; sx = 0; }
        if (sy < 0) { h += sy; sy = 0; }
        if (sx + w > canvas.width) w = canvas.width - sx;
        if (sy + h > canvas.height) h = canvas.height - sy;

        if (w <= 0 || h <= 0) return;

        // Draw Cached Slice
        // Since ctx is transformed to World Space, dx/dy match sx/sy (World Coords)
        ctx.drawImage(canvas, sx, sy, w, h, sx, sy, w, h);
    }

    generate() {
        // Initialize with walls (1)
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 1;
            }
        }

        // Room Generation
        const roomCount = 10;
        for (let i = 0; i < roomCount; i++) {
            const w = Math.floor(Math.random() * 8) + 7; // 7-14 (Was 5-10)
            const h = Math.floor(Math.random() * 8) + 7;
            const x = Math.floor(Math.random() * (this.width - w - 2)) + 1;
            const y = Math.floor(Math.random() * (this.height - h - 2)) + 1;

            const room = { x, y, w, h };

            // Check overlap
            let overlap = false;
            for (const r of this.rooms) {
                if (x < r.x + r.w + 1 && x + w + 1 > r.x &&
                    y < r.y + r.h + 1 && y + h + 1 > r.y) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                this.createRoom(room);
                if (this.rooms.length > 0) {
                    const prev = this.rooms[this.rooms.length - 1];
                    this.connectRooms(prev, room);
                }
                this.rooms.push(room);
            }
        }

        // Set points
        if (this.rooms.length > 0) {
            const start = this.rooms[0];
            this.startPoint = {
                x: (start.x + Math.floor(start.w / 2)) * this.tileSize,
                y: (start.y + Math.floor(start.h / 2)) * this.tileSize
            };

            const end = this.rooms[this.rooms.length - 1];
            this.endPoint = {
                x: (end.x + Math.floor(end.w / 2)) * this.tileSize,
                y: (end.y + Math.floor(end.h / 2)) * this.tileSize
            };
        }

        // Find Door Spots - At Room Entrances Only
        this.doorSpots = [];
        // Helper to add unique spots
        const addSpot = (x, y, isHoriz) => {
            // Check bounds
            if (x < 1 || x >= this.width - 1 || y < 1 || y >= this.height - 1) return;
            // Check if already exists? (Optional, but good practice)
            if (!this.doorSpots.find(d => d.x === x && d.y === y)) {
                this.doorSpots.push({ x, y, isHorizontal: isHoriz });
            }
        };

        for (const r of this.rooms) {
            // Check Top Edge
            let y = r.y - 1;
            for (let x = r.x; x < r.x + r.w; x++) {
                if (this.tiles[y][x] === 0) addSpot(x, y, true);
            }
            // Check Bottom Edge
            y = r.y + r.h;
            for (let x = r.x; x < r.x + r.w; x++) {
                if (this.tiles[y][x] === 0) addSpot(x, y, true);
            }
            // Check Left Edge
            let x = r.x - 1;
            for (let y = r.y; y < r.y + r.h; y++) {
                if (this.tiles[y][x] === 0) addSpot(x, y, false);
            }
            // Check Right Edge
            x = r.x + r.w;
            for (let y = r.y; y < r.y + r.h; y++) {
                if (this.tiles[y][x] === 0) addSpot(x, y, false);
            }
        }

        console.log("Door Spots Found:", this.doorSpots.length);
        if (this.tilesetLoaded) this.preRenderMap();
    }

    createRoom(r) {
        for (let y = r.y; y < r.y + r.h; y++) {
            for (let x = r.x; x < r.x + r.w; x++) {
                this.tiles[y][x] = 0; // Floor
            }
        }
    }

    connectRooms(r1, r2) {
        // Center points
        let cx1 = Math.floor(r1.x + r1.w / 2);
        let cy1 = Math.floor(r1.y + r1.h / 2);
        let cx2 = Math.floor(r2.x + r2.w / 2);
        let cy2 = Math.floor(r2.y + r2.h / 2);

        // Horizontal then Vertical
        if (Math.random() < 0.5) {
            this.createHCorridor(cx1, cx2, cy1);
            this.createVCorridor(cy1, cy2, cx2);
        } else {
            this.createVCorridor(cy1, cy2, cx1);
            this.createHCorridor(cx1, cx2, cy2);
        }
    }

    createHCorridor(x1, x2, y) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        for (let x = start; x <= end; x++) {
            this.tiles[y][x] = 0;
            this.tiles[y + 1][x] = 0; // Wide corridors
        }
    }

    createVCorridor(y1, y2, x) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        for (let y = start; y <= end; y++) {
            this.tiles[y][x] = 0;
            this.tiles[y][x + 1] = 0;
        }
    }

    isWall(x, y) {
        const tx = Math.floor(x / this.tileSize);
        const ty = Math.floor(y / this.tileSize);

        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true; // Treat out of bounds as wall
        return this.tiles[ty][tx] === 1;
    }

    // Check rectangle collision against walls
    checkCollision(x, y, w, h) {
        const left = Math.floor(x / this.tileSize);
        const right = Math.floor((x + w) / this.tileSize);
        const top = Math.floor(y / this.tileSize);
        const bottom = Math.floor((y + h) / this.tileSize);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (this.tiles[ty] && this.tiles[ty][tx] === 1) {
                    return true;
                }
            }
        }
        return false;
    }


}

