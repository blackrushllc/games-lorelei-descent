import Phaser from 'phaser';
import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';
import { ARENA_CONFIG } from '../config/arenaConfig.js';

/**
 * Builds the underground industrial chamber for LORELEI: DESCENT.
 */
export default class ChamberBuilder {
    constructor(scene) {
        this.scene = scene;
        this.worldWidth = 640;
        this.worldHeight = 50000; 
        
        this.floor = null;
        this.leftWall = null;
        this.rightWall = null;
        this.obstacleGroup = null;
        
        // Deterministic random seed for obstacle generation
        this.seed = 12345;

        this.config = GAMEPLAY_CONFIG.descent;
        this.arenaDepth = this.calculateArenaDepth();
    }

    calculateArenaDepth() {
        const v0 = this.config.rate;
        const tEntry = this.config.arenaEntryTime;
        const D = this.config.decelerationDuration;
        const tStart = tEntry - D;
        return (tStart * v0) + (0.5 * v0 * D);
    }

    /**
     * Builds the repeating chamber environment.
     */
    build() {
        this.createFloor();
        this.createWalls();
        
        this.obstacleGroup = this.scene.add.group();
        
        // Generate obstacles up to just before the arena
        this.generateObstacles(0, this.arenaDepth - 400);

        // Generate the Arena
        this.createArena();

        return {
            floor: this.floor,
            walls: [this.leftWall, this.rightWall],
            obstacles: this.obstacleGroup,
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

    createWalls() {
        const walls = this.scene.add.graphics();
        walls.fillStyle(0x0d0f12, 1);
        
        // Left wall (20px wide) - only until arena
        walls.fillRect(0, 0, 20, this.arenaDepth);
        // Right wall (20px wide) - only until arena
        walls.fillRect(this.worldWidth - 20, 0, 20, this.arenaDepth);
        
        // Industrial highlights
        walls.lineStyle(2, 0x333333, 1);
        walls.strokeRect(0, 0, 20, this.arenaDepth);
        walls.strokeRect(this.worldWidth - 20, 0, 20, this.arenaDepth);

        this.leftWall = walls;
    }

    createArena() {
        const arena = this.scene.add.graphics();
        const y = this.arenaDepth;
        const cfg = ARENA_CONFIG.visuals;

        // 1. Arena Floor (slightly different shade or markings)
        arena.fillStyle(cfg.floorColor, 1);
        arena.fillRect(0, y, 640, 960);
        
        // 2. Large Central Combat Area Markings
        arena.lineStyle(2, cfg.accentColor, 0.5);
        arena.strokeRect(100, y + 150, 440, 660);
        arena.strokeCircle(320, y + 480, 200);

        // 3. Heavy structural supports along the sides
        arena.fillStyle(0x2d3436, 1);
        // Left supports
        for(let i=0; i<3; i++) {
            arena.fillRect(0, y + 200 + i*300, 40, 60);
            arena.lineStyle(2, 0x636e72, 1);
            arena.strokeRect(0, y + 200 + i*300, 40, 60);
        }
        // Right supports
        for(let i=0; i<3; i++) {
            arena.fillRect(600, y + 200 + i*300, 40, 60);
            arena.lineStyle(2, 0x636e72, 1);
            arena.strokeRect(600, y + 200 + i*300, 40, 60);
        }

        // 4. Machinery near boundaries
        this.addObstacle('machine', 50, y + 50, () => 0.1);
        this.addObstacle('machine', 500, y + 50, () => 0.1);
        this.addObstacle('tank', 80, y + 850, () => 0.1);
        this.addObstacle('tank', 560, y + 850, () => 0.1);

        // 5. Southern boundary (future debris)
        arena.fillStyle(0x000000, 0.5);
        arena.fillRect(0, y + 900, 640, 60);
    }

    /**
     * Generates deterministic obstacles for a given Y range.
     */
    generateObstacles(startY, endY) {
        // Use a simple LCG for deterministic placement
        let seed = this.seed;
        const nextRand = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };

        const segmentHeight = 400;
        for (let y = startY; y < endY; y += segmentHeight) {
            // Skip the very first area where player starts
            if (y < 400) continue;

            const numObstacles = Math.floor(nextRand() * 2) + 1; // 1-2 obstacles per segment
            for (let i = 0; i < numObstacles; i++) {
                const type = nextRand() > 0.5 ? 'pillar' : (nextRand() > 0.5 ? 'machine' : 'tank');
                const ox = 40 + nextRand() * (this.worldWidth - 120);
                const oy = y + nextRand() * (segmentHeight - 100);
                
                this.addObstacle(type, ox, oy, nextRand);
            }
        }
    }

    addObstacle(type, x, y, nextRand) {
        const g = this.scene.add.graphics();
        
        if (type === 'pillar') {
            const size = 30 + nextRand() * 20;
            g.fillStyle(0x444444, 1);
            g.fillRect(x, y, size, size);
            g.lineStyle(2, 0x666666, 1);
            g.strokeRect(x, y, size, size);
        } else if (type === 'machine') {
            const w = 60 + nextRand() * 40;
            const h = 80 + nextRand() * 60;
            g.fillStyle(0x333a44, 1);
            g.fillRect(x, y, w, h);
            g.lineStyle(2, 0x555e6b, 1);
            g.strokeRect(x, y, w, h);
            g.fillStyle(0x222222, 1);
            g.fillRect(x + 5, y + 5, w - 10, 10);
        } else if (type === 'tank') {
            const radius = 25 + nextRand() * 20;
            g.fillStyle(0x2d3436, 1);
            g.fillCircle(x, y, radius);
            g.lineStyle(2, 0x636e72, 1);
            g.strokeCircle(x, y, radius);
        }
        
        this.obstacleGroup.add(g);
    }
}
