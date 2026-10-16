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
    }
    getState() { return this.state; }
}

test('DescentController: Camera Mode Selection', async (t) => {
    const timeline = new MockTimeline();
    const controller = new DescentController(timeline);
    const modes = GAMEPLAY_CONFIG.descent.cameraModes;

    // 1. Synth 0s -> DESCENT
    timeline.state.track = 'SYNTH';
    timeline.state.time = 0;
    assert.strictEqual(controller.getCameraMode('SYNTH', 0), modes.DESCENT);

    // 2. Synth 299s -> DESCENT (Still descending/decelerating)
    assert.strictEqual(controller.getCameraMode('SYNTH', 299), modes.DESCENT);

    // 3. Synth 300s -> ARENA
    assert.strictEqual(controller.getCameraMode('SYNTH', 300), modes.ARENA);

    // 4. Cathedral 0s -> ARENA
    assert.strictEqual(controller.getCameraMode('CATHEDRAL', 0), modes.ARENA);
});

test('DescentController: Position Continuity during Deceleration', async (t) => {
    const timeline = new MockTimeline();
    const controller = new DescentController(timeline);
    const v0 = GAMEPLAY_CONFIG.descent.rate; // 75
    const tEntry = GAMEPLAY_CONFIG.descent.arenaEntryTime; // 300
    const D = GAMEPLAY_CONFIG.descent.decelerationDuration; // 3
    const tStart = tEntry - D; // 297

    // Position at tStart
    const pStart = controller.calculateDescentPosition(tStart);
    assert.strictEqual(pStart, tStart * v0); // 22275

    // Position at tEntry (Arena Position)
    const pEnd = controller.calculateDescentPosition(tEntry);
    const expectedArenaP = (tStart * v0) + (0.5 * v0 * D); // 22275 + 112.5 = 22387.5
    assert.strictEqual(pEnd, expectedArenaP);

    // Verify it matches getArenaPosition()
    assert.strictEqual(controller.getArenaPosition(), expectedArenaP);
});

test('Assisted Movement: Dead Zone and Scaling', async (t) => {
    // We'll mock a simple version of the calculation logic from DesktopControls
    const config = GAMEPLAY_CONFIG.player;
    const deadZone = config.assistedMovementRadius; // 110
    const fullZone = config.assistedMovementFullSpeedRadius; // 160

    const calculateIntensity = (dist) => {
        if (dist <= deadZone) return 0;
        return Math.min(1, (dist - deadZone) / (fullZone - deadZone));
    };

    assert.strictEqual(calculateIntensity(100), 0);
    assert.strictEqual(calculateIntensity(110), 0);
    assert.strictEqual(calculateIntensity(135), 0.5); // Half way between 110 and 160
    assert.strictEqual(calculateIntensity(160), 1);
    assert.strictEqual(calculateIntensity(200), 1);
});
