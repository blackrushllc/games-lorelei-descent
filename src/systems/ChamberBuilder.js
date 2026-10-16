import Phaser from 'phaser';
import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';
import { ARENA_CONFIG } from '../config/arenaConfig.js';
import { OBSTACLE_CONFIG } from '../config/obstacleConfig.js';

/**
 * Builds and manages the underground industrial chamber for LORELEI: DESCENT.
 * Handles deterministic chunked obstacle generation and physics bodies.
 */
export default class ChamberBuilder {
    constructor(scene) {
        this.scene = scene;
        this.worldWidth = 640;
        this.worldHeight = 50000; 
        
        this.floor = null;
        this.obstacleGroup = null;
        this.wallGroup = null;
        
        // Deterministic random seed
        this.baseSeed = 12345;

        this.config = GAMEPLAY_CONFIG.descent;
        this.arenaDepth = this.calculateArenaDepth();

        // Chunk tracking
        this.chunkHeight = OBSTACLE_CONFIG.chunkHeight;
        this.loadedChunks = new Set();
        this.activeObstacles = new Map(); // chunkIndex -> [gameSelection]
    }

    calculateArenaDepth() {
        const v0 = this.config.rate;
        const tEntry = this.config.arenaEntryTime;
        const D = this.config.decelerationDuration;
        const tStart = tEntry - D;
        return (tStart * v0) + (0.5 * v0 * D);
    }

    /**
     * Initial setup for the chamber.
     */
    build() {
        this.createFloor();
        
        // Use physics groups for solid obstacles and walls
        this.obstacleGroup = this.scene.physics.add.staticGroup();
        this.wallGroup = this.scene.physics.add.staticGroup();

        return {
            floor: this.floor,
            obstacles: this.obstacleGroup,
            walls: this.wallGroup,
            arenaDepth: this.arenaDepth
        };
    }

    createFloor() {
        const graphics = this.scene.add.graphics();
        
        // Very dark blue-gray floor
        graphics.fillStyle(0x1a1f26, 1);
        graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);

        // Subtle grid lines (every 80 pixels)
        graphics.lineStyle(1, 0x252a33, 1);
        for (let x = 0; x <= this.worldWidth; x += 80) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.worldHeight);
        }
        for (let y = 0; y <= this.worldHeight; y += 80) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.worldWidth, y);
        }
        graphics.strokePath();
        
        this.floor = graphics;
    }

    /**
     * Updates loaded chunks based on camera position.
     * @param {number} cameraY 
     */
    update(cameraY) {
        const activeRange = OBSTACLE_CONFIG.activeRange;
        const startChunk = Math.floor(Math.max(0, cameraY - 500) / this.chunkHeight);
        const endChunk = Math.floor((cameraY + 1500) / this.chunkHeight);

        // 1. Load new chunks
        for (let i = startChunk; i <= endChunk; i++) {
            if (!this.loadedChunks.has(i)) {
                this.loadChunk(i);
            }
        }

        // 2. Unload far away chunks
        for (const chunkIndex of this.loadedChunks) {
            const chunkY = chunkIndex * this.chunkHeight;
            if (chunkY < cameraY - activeRange || chunkY > cameraY + activeRange + 1000) {
                this.unloadChunk(chunkIndex);
            }
        }
    }

    loadChunk(index) {
        this.loadedChunks.add(index);
        const startY = index * this.chunkHeight;
        const endY = startY + this.chunkHeight;

        // Create Walls for this chunk
        this.createWallsForChunk(startY, endY, index);

        // Handle Arena specially
        if (startY >= this.arenaDepth - this.chunkHeight && startY <= this.arenaDepth + 1000) {
            if (startY >= this.arenaDepth && startY < this.arenaDepth + 960) {
                this.createArena(index);
            }
            // Transition area: maybe fewer random obstacles
            return; 
        }

        // Standard procedural obstacles
        if (startY >= 400 && startY < this.arenaDepth - 400) {
            this.generateObstaclesForChunk(startY, index);
        }
    }

    unloadChunk(index) {
        this.loadedChunks.delete(index);
        const obstacles = this.activeObstacles.get(index);
        if (obstacles) {
            obstacles.forEach(obj => {
                if (obj.active) {
                    obj.destroy();
                }
            });
            this.activeObstacles.delete(index);
        }
    }

    createWallsForChunk(startY, endY, chunkIndex) {
        // Only create walls before the arena
        if (startY >= this.arenaDepth) return;

        const h = endY - startY;
        const midY = startY + h / 2;

        // Left wall
        const lw = this.scene.add.rectangle(10, midY, 20, h, 0x0d0f12);
        this.wallGroup.add(lw);
        
        // Right wall
        const rw = this.scene.add.rectangle(this.worldWidth - 10, midY, 20, h, 0x0d0f12);
        this.wallGroup.add(rw);

        // Visual highlights (Graphics added to the rectangles or separate)
        const g = this.scene.add.graphics();
        g.lineStyle(2, 0x333333, 1);
        g.strokeRect(0, startY, 20, h);
        g.strokeRect(this.worldWidth - 20, startY, 20, h);

        this.addActiveObject(chunkIndex, lw);
        this.addActiveObject(chunkIndex, rw);
        this.addActiveObject(chunkIndex, g);
    }

    createArena(chunkIndex) {
        const y = this.arenaDepth;
        const cfg = ARENA_CONFIG.visuals;

        // 1. Arena Floor Markings
        const arenaG = this.scene.add.graphics();
        arenaG.lineStyle(2, cfg.accentColor, 0.5);
        arenaG.strokeRect(100, y + 150, 440, 660);
        arenaG.strokeCircle(320, y + 480, 200);
        this.addActiveObject(chunkIndex, arenaG);

        // 2. Fixed obstacles from config
        OBSTACLE_CONFIG.arena.obstacles.forEach(def => {
            let obj;
            if (def.type === 'MACHINE') {
                obj = this.addMachine(def.x + def.w/2, y + def.y + def.h/2, def.w, def.h);
            } else if (def.type === 'TANK') {
                obj = this.addTank(def.x, y + def.y, def.r);
            }
            if (obj) this.addActiveObject(chunkIndex, obj);
        });

        // 3. Southern boundary (future debris)
        const south = this.scene.add.rectangle(320, y + 930, 640, 60, 0x000000, 0.5);
        this.wallGroup.add(south);
        this.addActiveObject(chunkIndex, south);
    }

    generateObstaclesForChunk(startY, chunkIndex) {
        // Deterministic seed for this chunk
        let seed = this.baseSeed + chunkIndex;
        const nextRand = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };

        const segmentHeight = 480; 
        for (let y = startY; y < startY + this.chunkHeight; y += segmentHeight) {
            const numObstacles = Math.floor(nextRand() * 2) + 1;
            for (let i = 0; i < numObstacles; i++) {
                const randType = nextRand();
                const type = randType > 0.66 ? 'PILLAR' : (randType > 0.33 ? 'MACHINE' : 'TANK');
                const ox = 60 + nextRand() * (this.worldWidth - 160);
                const oy = y + nextRand() * (segmentHeight - 140);
                
                const obj = this.addProceduralObstacle(type, ox, oy, nextRand);
                if (obj) this.addActiveObject(chunkIndex, obj);
            }
        }
    }

    addProceduralObstacle(typeKey, x, y, nextRand) {
        const typeCfg = OBSTACLE_CONFIG.types[typeKey];
        if (typeKey === 'PILLAR') {
            const size = typeCfg.minSize + nextRand() * (typeCfg.maxSize - typeCfg.minSize);
            return this.addMachine(x, y, size, size, typeCfg);
        } else if (typeKey === 'MACHINE') {
            const w = typeCfg.minWidth + nextRand() * (typeCfg.maxWidth - typeCfg.minWidth);
            const h = typeCfg.minHeight + nextRand() * (typeCfg.maxHeight - typeCfg.minHeight);
            return this.addMachine(x, y, w, h, typeCfg);
        } else if (typeKey === 'TANK') {
            const r = typeCfg.minRadius + nextRand() * (typeCfg.maxRadius - typeCfg.minRadius);
            return this.addTank(x, y, r, typeCfg);
        }
    }

    addMachine(x, y, w, h, cfg = OBSTACLE_CONFIG.types.MACHINE) {
        const container = this.scene.add.container(x, y);
        const g = this.scene.add.graphics();
        
        g.fillStyle(cfg.color, 1);
        g.fillRect(-w/2, -h/2, w, h);
        g.lineStyle(2, cfg.strokeColor, 1);
        g.strokeRect(-w/2, -h/2, w, h);
        
        if (cfg.detailColor) {
            g.fillStyle(cfg.detailColor, 1);
            g.fillRect(-w/2 + 5, -h/2 + 5, w - 10, 10);
        }
        
        container.add(g);
        this.scene.physics.add.existing(container, true);
        container.body.setSize(w, h);
        container.body.setOffset(-w/2, -h/2);
        
        this.obstacleGroup.add(container);
        return container;
    }

    addTank(x, y, r, cfg = OBSTACLE_CONFIG.types.TANK) {
        const container = this.scene.add.container(x, y);
        const g = this.scene.add.graphics();
        
        g.fillStyle(cfg.color, 1);
        g.fillCircle(0, 0, r);
        g.lineStyle(2, cfg.strokeColor, 1);
        g.strokeCircle(0, 0, r);
        
        container.add(g);
        this.scene.physics.add.existing(container, true);
        // Use approximate rectangular bounds for tank as requested
        const size = r * 1.8;
        container.body.setSize(size, size);
        container.body.setOffset(-size/2, -size/2);
        
        this.obstacleGroup.add(container);
        return container;
    }

    addActiveObject(chunkIndex, obj) {
        if (!this.activeObstacles.has(chunkIndex)) {
            this.activeObstacles.set(chunkIndex, []);
        }
        this.activeObstacles.get(chunkIndex).push(obj);
    }

    /**
     * Clears all active obstacles. Used for seeking/restarts.
     */
    clear() {
        this.loadedChunks.clear();
        this.activeObstacles.forEach(list => {
            list.forEach(obj => {
                if (obj.active) obj.destroy();
            });
        });
        this.activeObstacles.clear();
        if (this.obstacleGroup) this.obstacleGroup.clear(true, true);
        if (this.wallGroup) this.wallGroup.clear(true, true);
    }
}
