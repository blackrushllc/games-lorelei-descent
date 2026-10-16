import { test } from 'node:test';
import assert from 'node:assert';
import { GAMEPLAY_CONFIG } from '../src/config/gameplayConfig.js';

// Mock Phaser globally
global.Phaser = {
    Input: {
        Keyboard: {
            KeyCodes: { 
                W: 87, S: 83, A: 65, D: 68, 
                UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 
            }
        }
    },
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2) },
        Clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2-y1, x2-x1) }
    }
};

import DesktopControls from '../src/controls/DesktopControls.js';

function createMockScene() {
    return {
        input: {
            keyboard: {
                addKeys: () => ({
                    up: { isDown: false }, down: { isDown: false }, left: { isDown: false }, right: { isDown: false },
                    arrowUp: { isDown: false }, arrowDown: { isDown: false }, arrowLeft: { isDown: false }, arrowRight: { isDown: false }
                })
            },
            mouse: {
                disableContextMenu: () => {}
            },
            activePointer: {
                x: 320, y: 480, worldX: 320, worldY: 480,
                leftButtonDown: () => false,
                rightButtonDown: () => false
            }
        },
        player: { x: 320, y: 480 },
        game: {
            config: { width: 640, height: 960 }
        }
    };
}

test('Step 4.3: Valid pointer inside canvas', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Pointer outside dead zone (110px). Player at 320,480. Pointer at 320, 640 (dist 160).
    scene.input.activePointer.y = 640;
    scene.input.activePointer.worldY = 640;
    
    controls.update();
    const state = controls.getState();
    assert.ok(Math.abs(state.moveX) < 0.001, 'moveX should be near 0');
    assert.ok(state.moveY > 0, 'Should move down');
    assert.ok(Math.abs(state.moveY - 1) < 0.001, 'Should move at full speed (dist 160)');
});

test('Step 4.3: Pointer outside canvas', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Pointer outside canvas (x < 0)
    scene.input.activePointer.x = -10;
    scene.input.activePointer.worldX = -10;
    scene.input.activePointer.y = 640;
    scene.input.activePointer.worldY = 640;
    
    controls.update();
    const state = controls.getState();
    assert.strictEqual(state.moveX, 0);
    assert.strictEqual(state.moveY, 0, 'Should not move when pointer is outside canvas');
});

test('Step 4.3: Pointer inside the dead zone', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Pointer inside dead zone (dist 50 < 110)
    scene.input.activePointer.y = 530;
    scene.input.activePointer.worldY = 530;
    
    controls.update();
    const state = controls.getState();
    assert.strictEqual(state.moveX, 0);
    assert.strictEqual(state.moveY, 0, 'Should not move when pointer is inside dead zone');
});

test('Step 4.3: Pointer outside the dead zone (partial speed)', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Pointer at 135px distance (exactly half way between 110 and 160)
    scene.input.activePointer.y = 480 + 135;
    scene.input.activePointer.worldY = 480 + 135;
    
    controls.update();
    const state = controls.getState();
    assert.ok(Math.abs(state.moveX) < 0.001, 'moveX should be near 0');
    assert.ok(Math.abs(state.moveY - 0.5) < 0.01, 'Should move at half speed');
});

test('Step 4.3: Keyboard override', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Pointer outside dead zone
    scene.input.activePointer.y = 640;
    scene.input.activePointer.worldY = 640;
    
    // Keyboard pressing UP
    controls.keys.up.isDown = true;
    
    controls.update();
    const state = controls.getState();
    assert.strictEqual(state.moveX, 0);
    assert.strictEqual(state.moveY, -1, 'Keyboard should override mouse assisted movement');
});

test('Step 4.3: Right-button movement suppression', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Pointer outside dead zone
    scene.input.activePointer.y = 640;
    scene.input.activePointer.worldY = 640;
    
    // Right button down
    scene.input.activePointer.rightButtonDown = () => true;
    // We need to bypass initial click protection
    controls.ignoreInitialClick = false;
    
    controls.update();
    const state = controls.getState();
    assert.ok(Math.abs(state.moveX) < 0.001, 'moveX should be near 0');
    assert.strictEqual(state.moveY, 0, 'Right button should suppress assisted movement');
});

test('Step 4.3: Missing or uninitialized pointer information', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Force pointer to be null in update (simulated)
    // We have to mock the activePointer property access
    Object.defineProperty(scene.input, 'activePointer', { get: () => null });
    
    try {
        controls.update();
        const state = controls.getState();
        // State should be 0 because we returned early
        assert.strictEqual(state.moveX, 0);
        assert.strictEqual(state.moveY, 0, 'Should not crash when pointer is missing');
    } catch (e) {
        assert.fail('Should not throw when pointer is missing: ' + e.message);
    }
});

test('Step 4.3: Camera offset and coordinate conversion', () => {
    const scene = createMockScene();
    const controls = new DesktopControls(scene);
    controls.setControlMode('ASSISTED');
    
    // Simulate camera scroll
    const scrollY = 1000;
    scene.player.y = 1000 + 480;
    
    // Pointer at logical screen coordinates 320, 640
    scene.input.activePointer.x = 320;
    scene.input.activePointer.y = 640;
    // World coordinates would be screen + scroll
    scene.input.activePointer.worldX = 320;
    scene.input.activePointer.worldY = 1000 + 640;
    
    controls.update();
    const state = controls.getState();
    assert.ok(Math.abs(state.moveX) < 0.001, 'moveX should be near 0');
    assert.ok(Math.abs(state.moveY - 1) < 0.001, 'Should use world coordinates for distance calculation');
});
