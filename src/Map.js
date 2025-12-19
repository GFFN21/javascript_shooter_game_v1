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

    renderFloor(ctx) {
        if (!this.tilesetLoaded) return;

        const sw = this.game.width;
        const sh = this.game.height;
        const zoom = 1.5;
        const visW = sw / zoom;
        const visH = sh / zoom;
        const left = this.game.camera.x - visW / 2;
        const top = this.game.camera.y - visH / 2;
        const startCol = Math.floor(left / this.tileSize);
        const endCol = Math.floor((left + visW) / this.tileSize) + 1;
        const startRow = Math.floor(top / this.tileSize);
        const endRow = Math.floor((top + visH) / this.tileSize) + 1;

        for (let y = startRow; y <= endRow; y++) {
            if (y < 0 || y >= this.height) continue;
            for (let x = startCol; x <= endCol; x++) {
                if (x < 0 || x >= this.width) continue;

                if (this.tiles[y][x] === 0) {
                    // Pick floor tile based on position to be deterministic
                    const index = (x + y * 57) % this.ids.floors.length;
                    const id = this.ids.floors[index];
                    const src = this.getTileSrc(id);

                    ctx.drawImage(
                        this.tileset,
                        src.x, src.y, 128, 128,
                        x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize
                    );
                }
            }
        }
    }

    renderWalls(ctx) {
        if (!this.tilesetLoaded) return;

        const sw = this.game.width;
        const sh = this.game.height;
        const zoom = 1.5;
        const visW = sw / zoom;
        const visH = sh / zoom;
        const left = this.game.camera.x - visW / 2;
        const top = this.game.camera.y - visH / 2;

        const startCol = Math.floor(left / this.tileSize);
        const endCol = Math.floor((left + visW) / this.tileSize) + 1;
        const startRow = Math.floor(top / this.tileSize);
        const endRow = Math.floor((top + visH) / this.tileSize) + 1;

        for (let y = startRow; y <= endRow; y++) {
            if (y < 0 || y >= this.height) continue;
            for (let x = startCol; x <= endCol; x++) {
                if (x < 0 || x >= this.width) continue;

                if (this.tiles[y][x] === 1) {
                    // Logic: Determine Type based on Floor Neighbors
                    const fLeft = this.isFloor(x - 1, y);
                    const fRight = this.isFloor(x + 1, y);
                    const fDown = this.isFloor(x, y + 1);
                    const fUp = this.isFloor(x, y - 1); // For potential future use or more complex wall types

                    // Skip hidden walls (not touching any floor)
                    if (!fLeft && !fRight && !fDown && !fUp) {
                        // Check diagonals for corner filling?
                        const fDL = this.isFloor(x - 1, y + 1);
                        const fDR = this.isFloor(x + 1, y + 1);
                        const fUL = this.isFloor(x - 1, y - 1);
                        const fUR = this.isFloor(x + 1, y - 1);
                        if (!fDL && !fDR && !fUL && !fUR) continue;
                    }

                    let candidates = this.ids.top; // Default to generic top wall
                    let currentFrontFaceId = this.frontFaceId; // Default front face

                    if (fDown) {
                        if (fRight) {
                            candidates = this.ids.cornerTL; // Floor is South AND East -> Wall is TL of room
                        } else if (fLeft) {
                            candidates = this.ids.cornerTR; // Floor is South AND West -> Wall is TR of room
                        } else {
                            candidates = this.ids.top; // Floor is South -> Top Wall (already default)
                        }
                    } else if (fRight) {
                        candidates = this.ids.left; // Floor is East -> Left Wall
                        currentFrontFaceId = 9; // Use ID 9 for left wall front face
                    } else if (fLeft) {
                        candidates = this.ids.right; // Floor is West -> Right Wall
                        currentFrontFaceId = 8; // Use ID 8 for right wall front face
                    }

                    // Deterministic Random selection from candidates
                    const index = (x + y * 13) % candidates.length;
                    const id = candidates[index];
                    const src = this.getTileSrc(id);

                    const px = x * this.tileSize;
                    const py = y * this.tileSize;

                    // Front Face (Vertical strip)
                    const srcFront = this.getTileSrc(currentFrontFaceId);

                    ctx.drawImage(
                        this.tileset,
                        srcFront.x, srcFront.y, 128, 128,
                        px, py + this.tileSize - 20, this.tileSize, 20
                    );

                    // Top Face
                    ctx.drawImage(
                        this.tileset,
                        src.x, src.y, 128, 128,
                        px, py - 20, this.tileSize, this.tileSize
                    );
                }
            }
        }


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

