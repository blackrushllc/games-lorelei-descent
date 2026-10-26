import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock Phaser and Configs for Node.js testing
global.COMBAT_CONFIG = {
    results: {
        NO_DAMAGE: 'NO_DAMAGE',
        ARMOR_HIT: 'ARMOR_HIT',
        ARMOR_BROKEN: 'ARMOR_BROKEN',
        HEALTH_DAMAGED: 'HEALTH_DAMAGED',
        TARGET_DESTROYED: 'TARGET_DESTROYED'
    },
    types: { ENERGY: 'ENERGY', AXE: 'AXE', LASER: 'LASER' },
    robots: {
        SENTINEL: {
            laserConfig: { trackingMs: 650, lockedMs: 300, firingMs: 180, beamWidth: 12 }
        }
    }
};

global.MockPhaser = {
    GameObjects: {
        Container: class {
            constructor(scene, x, y) {
                this.scene = scene;
                this.x = x; this.y = y;
                this.visible = true; this.active = true; this.alpha = 1;
                this.scaleX = 1; this.scaleY = 1;
            }
            add() {}
            setVisible(v) { this.visible = v; }
            setActive(a) { this.active = a; }
            setScale(s) { this.scaleX = s; this.scaleY = s; }
            destroy() { this.active = false; }
        }
    },
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2) },
        Angle: { 
            Between: (x1, y1, x2, y2) => Math.atan2(y2-y1, x2-x1),
            RotateTo: (current, target, step) => target // Simplified for mock
        }
    },
    Geom: {
        Line: class {},
        Circle: class {},
        Intersects: { GetLineToCircle: () => true }
    }
};

class MockScene {
    constructor() {
        const createGraphics = () => {
            const g = {
                clear: () => g,
                lineStyle: () => g,
                moveTo: () => g,
                lineTo: () => g,
                strokePath: () => g,
                strokeCircle: () => g,
                fillStyle: () => g,
                fillCircle: () => g,
                fillRect: () => g,
                strokeRect: () => g,
                setVisible: () => g,
                setAlpha: () => g,
                setDepth: () => g,
                alpha: 1,
                visible: true
            };
            return g;
        };

        this.add = {
            existing: (obj) => obj,
            graphics: createGraphics,
            sprite: () => ({ setScale: () => ({ setVisible: () => ({}) }) }),
            text: () => ({ setOrigin: () => ({}) })
        };
        this.physics = { add: { existing: (obj) => { obj.body = { setCircle: () => {}, setDrag: () => {}, setBounce: () => {}, setVelocity: () => {}, setAcceleration: () => {}, setMaxSpeed: () => {} }; } } };
        this.tweens = { add: () => {} };
        this.time = { now: 0, delayedCall: (ms, cb) => cb() };
        this.registry = { get: () => ({}) };
        this.events = { emit: () => {}, on: () => {} };
        this.getNearestObstacleAlongRay = () => null;
        this.createImpactSparks = () => {};
    }
}

// Load Robot and Boss classes with mocks
const robotCode = fs.readFileSync(path.resolve('src/entities/Robot.js'), 'utf8');
const mockedRobotCode = robotCode
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace("import { COMBAT_CONFIG } from '../config/combatConfig.js';", "const COMBAT_CONFIG = global.COMBAT_CONFIG;")
    .replace("export default class Robot", "global.Robot = class Robot");
(new Function(mockedRobotCode))();

const proxyCode = fs.readFileSync(path.resolve('src/entities/ProxyBoss.js'), 'utf8');
const mockedProxyCode = proxyCode
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace("import { PROXY_BOSS_CONFIG } from '../config/proxyBossConfig.js';", "const PROXY_BOSS_CONFIG = global.PROXY_BOSS_CONFIG;")
    .replace("import { COMBAT_CONFIG } from '../config/combatConfig.js';", "const COMBAT_CONFIG = global.COMBAT_CONFIG;")
    .replace("export default class ProxyBoss", "global.ProxyBoss = class ProxyBoss");
import { PROXY_BOSS_CONFIG } from '../src/config/proxyBossConfig.js';
global.PROXY_BOSS_CONFIG = PROXY_BOSS_CONFIG;
(new Function(mockedProxyCode))();

test('Laser fairing: Sentinel follow -> lock -> fire sequence', () => {
    const scene = new MockScene();
    const sentinel = new global.Robot(scene, 100, 100, 'SENTINEL');
    const player = { x: 200, y: 100 };
    
    sentinel.aiState = 'ACQUIRING_TARGET';
    sentinel.stateTimer = 0;
    
    // 1. Tracking
    sentinel.handleAcquire(player, 100, 100);
    assert.strictEqual(sentinel.aiState, 'ACQUIRING_TARGET');
    assert.ok(Math.abs(sentinel.laserAngle) < 0.01);
    
    // 2. Lock transition
    sentinel.stateTimer = 700;
    sentinel.handleAcquire(player, 100, 100);
    assert.strictEqual(sentinel.aiState, 'LOCKED');
    assert.strictEqual(sentinel.stateTimer, 0);
    
    // 3. Locked (direction should NOT change)
    player.y = 200; // Player moves
    sentinel.handleLocked(player, 100);
    assert.strictEqual(sentinel.aiState, 'LOCKED');
    assert.strictEqual(sentinel.laserAngle, 0, 'Angle should be frozen at 0');
    
    // 4. Firing
    sentinel.stateTimer = 350;
    sentinel.handleLocked(player, 100);
    assert.strictEqual(sentinel.aiState, 'FIRING');
});

test('Laser fairing: Proxy Boss follow -> lock -> fire sequence', () => {
    const scene = new MockScene();
    const boss = new global.ProxyBoss(scene, 100, 100);
    const player = { x: 200, y: 100 };
    
    boss.startLaserAttack(player);
    assert.strictEqual(boss.attackSubState, 'TRACKING');
    
    // 1. Tracking
    boss.updateAttacking(player, 100);
    assert.strictEqual(boss.attackSubState, 'TRACKING');
    
    // 2. Lock
    boss.attackTimer = 1000;
    boss.updateAttacking(player, 100);
    assert.strictEqual(boss.attackSubState, 'LOCKED');
    
    // 3. Fire
    boss.attackTimer = 400;
    boss.updateAttacking(player, 100);
    assert.strictEqual(boss.attackSubState, 'FIRING');
});

test('Boss destruction resets state', () => {
    const scene = new MockScene();
    const boss = new global.ProxyBoss(scene, 100, 100);
    boss.state = 'ATTACKING';
    boss.attackSubState = 'FIRING';
    
    boss.die();
    assert.strictEqual(boss.state, 'DEFEATED');
    assert.strictEqual(boss.attackSubState, 'NONE');
    assert.strictEqual(boss.isDestroyed, true);
});
