import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Hack to mock Phaser for ProxyBoss
const bossCode = fs.readFileSync(path.resolve('src/entities/ProxyBoss.js'), 'utf8');
const mockedCode = bossCode
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace("import { PROXY_BOSS_CONFIG } from '../config/proxyBossConfig.js';", "const PROXY_BOSS_CONFIG = global.PROXY_BOSS_CONFIG;")
    .replace("import { COMBAT_CONFIG } from '../config/combatConfig.js';", "const COMBAT_CONFIG = global.COMBAT_CONFIG;")
    .replace("export default class ProxyBoss", "global.ProxyBoss = class ProxyBoss");

import { PROXY_BOSS_CONFIG } from '../src/config/proxyBossConfig.js';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';

global.PROXY_BOSS_CONFIG = PROXY_BOSS_CONFIG;
global.COMBAT_CONFIG = COMBAT_CONFIG;

global.MockPhaser = {
    GameObjects: {
        Container: class {
            constructor(scene, x, y) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.visible = true;
                this.active = true;
                this.alpha = 1;
                this.scaleX = 1;
                this.scaleY = 1;
            }
            add() {}
            setVisible(v) { this.visible = v; }
            setActive(a) { this.active = a; }
            setScale(s) { this.scaleX = s; this.scaleY = s; }
        }
    },
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2) },
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2-y1, x2-x1) }
    }
};

// Evaluate the mocked code
(new Function(mockedCode))();
const ProxyBoss = global.ProxyBoss;

// Mock Scene
class MockScene {
    constructor() {
        this.add = {
            existing: (obj) => obj,
            graphics: () => ({
                clear: () => {},
                fillStyle: () => {},
                fillCircle: () => {},
                lineStyle: () => {},
                strokeCircle: () => {},
                alpha: 1
            }),
            text: () => ({ setOrigin: () => ({}) })
        };
        this.physics = {
            add: {
                existing: (obj) => {
                    obj.body = {
                        setCircle: () => {},
                        enable: true
                    };
                }
            }
        };
        this.tweens = { add: () => {} };
        this.events = { emit: () => {} };
        this.time = { delayedCall: () => {} };
        this.descentController = { getArenaPosition: () => 22000 };
    }
}

test('ProxyBoss initializes with correct components', () => {
    const scene = new MockScene();
    const boss = new ProxyBoss(scene, 640, 22300);
    
    assert.strictEqual(boss.components.size, 4);
    assert.ok(boss.components.has('HEAD'));
    assert.ok(boss.components.has('CORE'));
    
    const core = boss.components.get('CORE');
    assert.strictEqual(core.visible, false, 'Core should be hidden initially');
});

test('Boss damage and core exposure', () => {
    const scene = new MockScene();
    const boss = new ProxyBoss(scene, 640, 22300);
    
    const head = boss.components.get('HEAD');
    const leftArm = boss.components.get('LEFT_ARM');
    const core = boss.components.get('CORE');
    
    const axeAttack = { damage: 10, armorBreaking: true };
    const energyAttack = { damage: 1, armorBreaking: false };
    
    // 1. Hit head with axe (Armor 2, Health 15)
    let res = boss.onComponentHit(head, axeAttack);
    assert.strictEqual(res, COMBAT_CONFIG.results.ARMOR_BROKEN);
    assert.strictEqual(head.armor, 1);
    
    // 2. Destroy head and left arm to expose core
    head.hp = 0;
    boss.checkExposeCore();
    assert.strictEqual(core.visible, false, 'Core still hidden with 1 broken component');
    
    leftArm.hp = 0;
    boss.checkExposeCore();
    assert.strictEqual(core.visible, true, 'Core exposed with 2 broken components');
});

test('Boss staggered state and defeat', () => {
    const scene = new MockScene();
    const boss = new ProxyBoss(scene, 640, 22300);
    
    boss.state = 'IDLE';
    boss.die();
    assert.strictEqual(boss.state, 'DEFEATED');
    assert.strictEqual(boss.isDestroyed, true);
});
