import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mocking Phaser via string replacement hack to avoid loading real Phaser in Node
const robotCode = fs.readFileSync(path.resolve('src/entities/Robot.js'), 'utf8');
const mockedCode = robotCode
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace("import { COMBAT_CONFIG } from '../config/combatConfig.js';", "const { COMBAT_CONFIG } = global.MockCombatConfig;")
    .replace("import CombatSystem from '../systems/CombatSystem.js';", "const CombatSystem = global.MockCombatSystem;")
    .replace("export default class Robot", "global.Robot = class Robot");

// Mock CombatConfig
global.MockCombatConfig = {
    COMBAT_CONFIG: {
        robots: {
            PURSUER: { maxHealth: 1, maxArmor: 0, speed: 110, score: 100 },
            SENTINEL: { maxHealth: 2, maxArmor: 0, speed: 80, score: 250, laserConfig: { trackingMs: 700, lockedMs: 0, firingMs: 150, beamWidth: 10 } },
            ARMORED_PURSUER: { maxHealth: 1, maxArmor: 1, speed: 90, score: 200, armorScore: 50 }
        },
        geometry: {
            player: { weaponOrigin: { x: 0, y: -45 }, targetCenter: { x: 0, y: -40 }, targetRadius: 22 },
            PURSUER: { weaponOrigin: { x: 0, y: -30 }, targetCenter: { x: 0, y: -30 }, targetRadius: 20 },
            SENTINEL: { weaponOrigin: { x: 0, y: -35 }, targetCenter: { x: 0, y: -35 }, targetRadius: 20 },
            ARMORED_PURSUER: { weaponOrigin: { x: 0, y: -40 }, targetCenter: { x: 0, y: -40 }, targetRadius: 25 }
        }
    }
};

// Mock CombatSystem
global.MockCombatSystem = {
    processAttack: () => 'NO_DAMAGE',
    getScoreForResult: () => 0
};

// Mock Phaser
global.MockPhaser = {
    GameObjects: {
        Container: class {
            constructor(scene, x, y) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.list = [];
                this.visible = true;
                this.active = true;
                this.scaleX = 1;
                this.scaleY = 1;
                this.alpha = 1;
            }
            add(obj) { this.list.push(obj); return obj; }
            setScale(s) { this.scaleX = s; this.scaleY = s; return this; }
            setVisible(v) { this.visible = v; return this; }
            setActive(v) { this.active = v; return this; }
            setAlpha(a) { this.alpha = a; return this; }
            setDepth() { return this; }
            destroy() {}
        },
        Sprite: class {
            constructor(scene, x, y, key) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.texture = { key };
                this.visible = true;
                this.scale = 1;
                this.anims = {
                    play: (key) => { this.currentAnim = { key }; },
                    isPlaying: false,
                    isPaused: false,
                    pause: function() { this.isPaused = true; },
                    resume: function() { this.isPaused = false; },
                    stop: () => {},
                    currentAnim: null
                };
            }
            play(key) { this.anims.play(key); return this; }
            setScale(s) { this.scale = s; return this; }
            setVisible(v) { this.visible = v; return this; }
            setOriginFromFrame() { return this; }
        },
        Graphics: class {
            constructor() {
                this.visible = true;
                this.alpha = 1;
                this.commands = [];
                this.scale = 1;
            }
            clear() { this.commands.push('clear'); return this; }
            fillStyle() { return this; }
            fillRect() { return this; }
            lineStyle() { return this; }
            strokeRect() { return this; }
            strokeCircle() { return this; }
            fillCircle() { return this; }
            moveTo() { return this; }
            lineTo() { return this; }
            strokePath() { return this; }
            setAlpha(a) { this.alpha = a; return this; }
            setVisible(v) { this.visible = v; return this; }
            setDepth() { return this; }
            setScale(s) { this.scale = s; return this; }
            setPosition(x, y) { this.x = x; this.y = y; return this; }
        }
    },
    Math: {
        Distance: {
            Between: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        },
        Angle: {
            Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
            Normalize: (a) => a
        },
        RadToDeg: (r) => r * 180 / Math.PI,
        Vector2: class {
            constructor(x, y) { this.x = x; this.y = y; }
            length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        }
    },
    Geom: {
        Circle: class { constructor(x, y, r) { this.x = x; this.y = y; this.radius = r; } },
        Line: class { constructor(x1, y1, x2, y2) { this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2; } },
        Intersects: {
            GetLineToCircle: () => []
        }
    }
};

// Evaluate the mocked code
(new Function(mockedCode))();
const Robot = global.Robot;

class MockSpriteRegistry {
    constructor() {
        this.manifest = {
            entities: {
                pursuer: { states: { default: {} } },
                sentinel: { states: { default: {} } },
                armored_robot: { states: { default: {} } }
            }
        };
        this.isInitialized = true;
    }
    getAnimationKey(entity, state, direction) {
        return `${entity}__default__${state}__${direction}`;
    }
    get8WayDirection(angle) {
        return 'south'; // simplified for test
    }
}

class MockScene {
    constructor() {
        this.mockSpriteRegistry = new MockSpriteRegistry();
        this.registry = {
            get: () => this.mockSpriteRegistry
        };
        this.add = {
            existing: () => {},
            sprite: (x, y, key) => new global.MockPhaser.GameObjects.Sprite(this, x, y, key),
            graphics: () => new global.MockPhaser.GameObjects.Graphics(),
            text: () => ({ setOrigin: () => ({}) })
        };
        this.physics = {
            add: {
                existing: (obj) => {
                    obj.body = {
                        setCircle: () => {},
                        setDrag: () => {},
                        setBounce: () => {},
                        setVelocity: (x, y) => { 
                            obj.body.velocity.x = x; 
                            obj.body.velocity.y = y; 
                            obj.body.speed = Math.sqrt(x*x + y*y);
                        },
                        setAcceleration: (x, y) => { obj.body.acceleration.x = x; obj.body.acceleration.y = y; },
                        setMaxSpeed: (s) => { obj.body.maxSpeed = s; },
                        velocity: { x: 0, y: 0, length: () => Math.sqrt(obj.body.velocity.x**2 + obj.body.velocity.y**2) },
                        acceleration: { x: 0, y: 0 },
                        speed: 0,
                        enable: true
                    };
                }
            }
        };
        this.registry = {
            get: (key) => {
                if (key === 'spriteAnimationRegistry') return this.mockSpriteRegistry;
                return null;
            }
        };
        this.time = { now: 1000 };
        this.tweens = { add: () => ({ stop: () => {} }) };
        this.events = { emit: () => {} };
        this.timeline = { getState: () => ({ isPlaying: true }) };
        this.cameras = { main: { scrollY: 0 } };
        this.player = { 
            x: 100, y: 100,
            getTargetRegion: () => ({ x: 100, y: 60, radius: 25 })
        };
        this.robotGroup = { getChildren: () => [] };
    }
    getNearestObstacleAlongRay() { return null; }
}

test('Robot: Sentinel Pixel Art Integration', (t) => {
    const scene = new MockScene();
    const robot = new Robot(scene, 0, 0, 'SENTINEL');

    // 1. Check if sprite was created for Sentinel
    assert.strictEqual(robot.hasSprite, true, 'Sentinel should have hasSprite=true');
    assert.ok(robot.sprite, 'Sentinel should have a sprite object');
    assert.strictEqual(robot.sprite.texture.key, 'sentinel', 'Sprite texture key should be sentinel');

    // 2. Check procedural visibility when pixel art is enabled
    robot.setPixelArtEnabled(true);
    assert.strictEqual(robot.sprite.visible, true, 'Sprite should be visible');
    assert.strictEqual(robot.bodyGraphic.visible, false, 'Body graphic should be hidden');
    assert.strictEqual(robot.antenna.visible, false, 'Antenna should be hidden');

    // 3. Check procedural visibility when pixel art is disabled
    robot.setPixelArtEnabled(false);
    assert.strictEqual(robot.sprite.visible, false, 'Sprite should be hidden');
    assert.strictEqual(robot.bodyGraphic.visible, true, 'Body graphic should be visible');
    assert.strictEqual(robot.antenna.visible, true, 'Antenna should be visible');
});

test('Robot: Sentinel Direction Logic (Laser)', (t) => {
    const scene = new MockScene();
    const robot = new Robot(scene, 0, 0, 'SENTINEL');
    robot.setPixelArtEnabled(true);
    
    // Simulate laser acquisition
    robot.aiState = 'ACQUIRING_TARGET';
    robot.laserAngle = 1.5; // Upward-ish
    
    // Override get8WayDirection to verify it's called with laserAngle
    let capturedAngle = null;
    robot.spriteRegistry.get8WayDirection = (a) => {
        capturedAngle = a;
        return 'north';
    };

    robot.update(1000, 16);
    assert.strictEqual(capturedAngle, 1.5, 'Should use laserAngle for orientation during ACQUIRING_TARGET');

    robot.aiState = 'LOCKED';
    robot.laserAngle = 1.5; // Reset it as handleAcquire might have overwritten it
    robot.update(1016, 16);
    assert.strictEqual(capturedAngle, 1.5, 'Should use laserAngle for orientation during LOCKED');

    robot.aiState = 'FIRING';
    robot.laserAngle = 1.5; 
    robot.update(1032, 16);
    assert.strictEqual(capturedAngle, 1.5, 'Should use laserAngle for orientation during FIRING');

    robot.aiState = 'COOLDOWN';
    robot.body.velocity.x = 100; // moving east
    robot.spriteRegistry.get8WayDirection = (a) => {
        capturedAngle = a;
        return 'east';
    };
    robot.update(1048, 16);
    // angle for velocity (100, 0) is 0
    assert.strictEqual(capturedAngle, 0, 'Should return to movement-based orientation during COOLDOWN');
});

test('Robot: Sentinel Animation States', (t) => {
    const scene = new MockScene();
    const robot = new Robot(scene, 0, 0, 'SENTINEL');
    robot.setPixelArtEnabled(true);
    
    // 1. Idle
    robot.aiState = 'IDLE';
    robot.body.velocity.x = 0;
    robot.body.velocity.y = 0;
    robot.update(1000, 16);
    assert.ok(robot.sprite.currentAnim.key.includes('idle'), 'Should play idle animation when stationary');

    // 2. Walk
    robot.aiState = 'PURSUING';
    robot.body.setVelocity(80, 0); // normal speed
    robot.update(1016, 16);
    assert.ok(robot.sprite.currentAnim.key.includes('walk'), 'Should play walk animation when moving at normal speed');

    // 3. Run (Burst)
    robot.isBursting = true;
    robot.body.setVelocity(150, 0); // high speed
    robot.update(1032, 16);
    assert.ok(robot.sprite.currentAnim.key.includes('run'), 'Should play run animation when moving fast (bursting)');
});

test('Robot: Fallback when assets missing', (t) => {
    const scene = new MockScene();
    const robot = new Robot(scene, 0, 0, 'SENTINEL');
    
    // Simulate missing manifest entry
    robot.spriteRegistry.manifest.entities = {};
    // Trigger recreate visuals or just check what happens if we recreate it
    const robot2 = new Robot(scene, 0, 0, 'SENTINEL');
    assert.strictEqual(robot2.hasSprite, false, 'Should fallback to hasSprite=false if manifest missing');
});
