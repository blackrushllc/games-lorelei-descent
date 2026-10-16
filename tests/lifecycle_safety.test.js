import { test } from 'node:test';
import assert from 'node:assert';
import EventEmitter from 'eventemitter3';

// Mocking the scenario reported
test('Lifecycle: Stale listener should not crash if guarded', async (t) => {
    const ee = new EventEmitter();
    
    let sceneActive = true;
    let weaponSystemResetCalled = false;
    let errorCaught = null;

    const weaponSystem = {
        energyProjectiles: {
            scene: true,
            clear: () => {
                if (!weaponSystem.energyProjectiles.scene) {
                    throw new TypeError("Cannot read properties of undefined (reading 'size')");
                }
            }
        },
        reset: function() {
            weaponSystemResetCalled = true;
            this.energyProjectiles.clear();
        }
    };

    // main.js listener
    ee.on('trackStart', (trackKey) => {
        if (trackKey === 'STUDIO') {
            // Simulate scene.stop()
            sceneActive = false;
            weaponSystem.energyProjectiles.scene = null; // simulate destruction
        }
    });

    // GameScene.js listener (guarded)
    const onTrackStart = (trackKey) => {
        if (trackKey === 'STUDIO') return;
        if (!sceneActive) return;

        try {
            weaponSystem.reset();
        } catch (e) {
            errorCaught = e;
        }
    };
    ee.on('trackStart', onTrackStart);

    // Act
    ee.emit('trackStart', 'STUDIO');

    // Assert
    assert.strictEqual(sceneActive, false);
    assert.strictEqual(weaponSystemResetCalled, false, 'Weapon reset should not be called for STUDIO');
    assert.strictEqual(errorCaught, null);
});

test('Lifecycle: Active listener should still work for gameplay tracks', async (t) => {
    const ee = new EventEmitter();
    
    let sceneActive = true;
    let weaponSystemResetCalled = false;

    const weaponSystem = {
        energyProjectiles: {
            scene: true,
            clear: () => {}
        },
        reset: function() {
            weaponSystemResetCalled = true;
        }
    };

    // GameScene.js listener (guarded)
    const onTrackStart = (trackKey) => {
        if (trackKey === 'STUDIO') return;
        if (!sceneActive) return;
        weaponSystem.reset();
    };
    ee.on('trackStart', onTrackStart);

    // Act
    ee.emit('trackStart', 'SYNTH');

    // Assert
    assert.strictEqual(weaponSystemResetCalled, true);
});
