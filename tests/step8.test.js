import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Hack to mock Phaser without importing it in Node
const proxyCode = fs.readFileSync(path.resolve('src/entities/Proxy.js'), 'utf8');
const mockedCode = proxyCode
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace("export default class Proxy", "global.Proxy = class Proxy");

global.MockPhaser = {
    GameObjects: {
        Container: class {
            constructor(scene, x, y) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.visible = true;
            }
            add() {}
            setDepth() {}
            setVisible(v) { this.visible = v; }
        }
    }
};

// Evaluate the mocked code to define global.Proxy
(new Function(mockedCode))();
const Proxy = global.Proxy;

// Import config normally (it doesn't import Phaser)
import { PROXY_CONFIG } from '../src/config/proxyConfig.js';

// Mock classes for testing
class MockScene {
    constructor() {
        this.add = {
            existing: (obj) => obj,
            graphics: () => ({
                fillStyle: () => ({ fillRect: () => ({ lineStyle: () => ({ strokeRect: () => {} }) }) }),
                fillRect: () => {},
                fillCircle: () => {},
                lineStyle: () => {},
                strokeRect: () => {},
                clear: () => {}
            }),
            text: () => ({
                setOrigin: () => ({})
            })
        };
        this.physics = {
            add: {
                existing: () => {}
            }
        };
    }
}

test('Proxy: Existence and initial state', (t) => {
    const scene = new MockScene();
    const proxy = new Proxy(scene, PROXY_CONFIG.opening);
    
    assert.strictEqual(proxy.visible, false, 'Proxy should be initially hidden');
    
    proxy.updateFromTime('SYNTH', 0);
    assert.strictEqual(proxy.visible, true, 'Proxy should be visible at Synth 0:00');
    assert.strictEqual(proxy.x, PROXY_CONFIG.opening.startX);
    assert.strictEqual(proxy.y, PROXY_CONFIG.opening.startY);
});

test('Proxy: Movement over time', (t) => {
    const scene = new MockScene();
    const proxy = new Proxy(scene, PROXY_CONFIG.opening);
    
    proxy.updateFromTime('SYNTH', 1.0);
    assert.strictEqual(proxy.y, PROXY_CONFIG.opening.startY + PROXY_CONFIG.opening.speed, 'Proxy should move downward by speed per second');
    
    proxy.updateFromTime('SYNTH', 2.0);
    assert.strictEqual(proxy.y, PROXY_CONFIG.opening.startY + PROXY_CONFIG.opening.speed * 2, 'Proxy should move downward deterministically');
});

test('Proxy: Disappearance', (t) => {
    const scene = new MockScene();
    const proxy = new Proxy(scene, PROXY_CONFIG.opening);
    
    proxy.updateFromTime('SYNTH', PROXY_CONFIG.opening.endTime - 0.1);
    assert.strictEqual(proxy.visible, true, 'Proxy should be visible just before end time');
    
    proxy.updateFromTime('SYNTH', PROXY_CONFIG.opening.endTime + 0.1);
    assert.strictEqual(proxy.visible, false, 'Proxy should be hidden after end time');
    
    proxy.updateFromTime('CATHEDRAL', 0);
    assert.strictEqual(proxy.visible, false, 'Proxy should be hidden in other tracks');
});

test('Proxy: Seeking reliability', (t) => {
    const scene = new MockScene();
    const proxy = new Proxy(scene, PROXY_CONFIG.opening);
    
    // Forward seek
    proxy.updateFromTime('SYNTH', 2.0);
    assert.strictEqual(proxy.visible, true);
    const posAt2 = proxy.y;
    
    // Seek way past
    proxy.updateFromTime('SYNTH', 10.0);
    assert.strictEqual(proxy.visible, false);
    
    // Seek back
    proxy.updateFromTime('SYNTH', 2.0);
    assert.strictEqual(proxy.visible, true);
    assert.strictEqual(proxy.y, posAt2, 'Seeking back should restore deterministic position');
});

test('Proxy: Player pursuit gap', (t) => {
    // Player max speed is 260. Descent is 75. 
    // Player relative to camera is 185.
    // Proxy relative to camera is ProxySpeed - 75.
    // If ProxySpeed is 400, relative is 325.
    // Gap should increase.
    
    const playerMaxRelativeSpeed = 185;
    const proxyRelativeSpeed = PROXY_CONFIG.opening.speed - 75;
    
    assert.ok(proxyRelativeSpeed > playerMaxRelativeSpeed, 'Proxy must be faster than player max relative speed');
});
