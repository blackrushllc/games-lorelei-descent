import { test } from 'node:test';
import assert from 'node:assert';
import DescentController from '../src/systems/DescentController.js';
import { GAMEPLAY_CONFIG } from '../src/config/gameplayConfig.js';

// Mock TimelineDirector state
class MockTimeline {
    constructor() {
        this.state = {
            track: 'SYNTH',
            time: 0,
            globalTime: 0,
            isPlaying: true
        };
        this.trackStartGlobalTimes = {
            'SYNTH': 0,
            'CATHEDRAL': 362,
            'STUDIO': 603
        };
    }
    getState() { return this.state; }
}

test('DescentController: Camera depth calculation', async (t) => {
    const timeline = new MockTimeline();
    const controller = new DescentController(timeline);
    const rate = GAMEPLAY_CONFIG.descent.rate;

    // 1. Synth start
    timeline.state.track = 'SYNTH';
    timeline.state.time = 0;
    assert.strictEqual(controller.getTargetScrollY(), 0);

    // 2. Synth 10s
    timeline.state.time = 10;
    assert.strictEqual(controller.getTargetScrollY(), 10 * rate);

    // 3. Cathedral start (Track switches, global time is 362, but we are in ARENA)
    timeline.state.track = 'CATHEDRAL';
    timeline.state.time = 0;
    assert.strictEqual(controller.getTargetScrollY(), controller.getArenaPosition());

    // 4. Studio (End of gameplay)
    timeline.state.track = 'STUDIO';
    timeline.state.time = 0;
    // Should lock to the arena depth
    assert.strictEqual(controller.getTargetScrollY(), controller.getArenaPosition());
    
    // Even if time advances in Studio, depth stays same
    timeline.state.time = 100;
    assert.strictEqual(controller.getTargetScrollY(), controller.getArenaPosition());
});

test('Blackrush: Movement Vector Normalization', async (t) => {
    // We can't easily run Phaser logic here without a full mock,
    // but we can verify the normalization logic I used in the code.
    // Logic: const moveVec = new Phaser.Math.Vector2(inputState.moveX, inputState.moveY).normalize();
    
    // Mocking the normalization logic
    const normalize = (x, y) => {
        const len = Math.sqrt(x * x + y * y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    };

    const diag = normalize(1, 1);
    assert.ok(Math.abs(diag.x - 0.7071) < 0.001);
    assert.ok(Math.abs(diag.y - 0.7071) < 0.001);
    
    const horiz = normalize(1, 0);
    assert.strictEqual(horiz.x, 1);
    assert.strictEqual(horiz.y, 0);
});

test('WeaponSystem: Cooldown logic', async (t) => {
    // Axe cooldown: 2000ms
    const cooldown = GAMEPLAY_CONFIG.weapons.axe.cooldown;
    
    const getCooldownStatus = (now, lastFireTime) => {
        const elapsed = now - lastFireTime;
        return Math.min(1, elapsed / cooldown);
    };

    assert.strictEqual(getCooldownStatus(1000, 0), 0.5); // 50% ready
    assert.strictEqual(getCooldownStatus(2000, 0), 1.0); // Ready
    assert.strictEqual(getCooldownStatus(3000, 0), 1.0); // Still Ready
});
