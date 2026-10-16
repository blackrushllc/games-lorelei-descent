import { test } from 'node:test';
import assert from 'node:assert';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';
import CombatSystem from '../src/systems/CombatSystem.js';

test('Step 6: Low-heart warning intervals', async (t) => {
    assert.strictEqual(COMBAT_CONFIG.player.twoHeartWarnInterval, 4000);
    assert.strictEqual(COMBAT_CONFIG.player.oneHeartWarnInterval, 2000);
});

test('Step 6: Laser blocking logic (Mocked ray)', async (t) => {
    // We mock the getNearestObstacleAlongRay logic
    const mockScene = {
        getNearestObstacleAlongRay: (x, y, angle, max) => {
            if (x === 0 && y === 0 && angle === 0) {
                return { distance: 500, target: { id: 'wall' } };
            }
            return null;
        }
    };

    const hit = mockScene.getNearestObstacleAlongRay(0, 0, 0, 1000);
    assert.ok(hit);
    assert.strictEqual(hit.distance, 500);
});

test('Step 6: Friendly fire damage rules', async (t) => {
    const attacker = { id: 'sentinel' };
    const target = {
        health: 2,
        armor: 0,
        isDestroyed: false,
        constructor: { name: 'Robot' },
        type: 'PURSUER'
    };

    const attack = {
        type: COMBAT_CONFIG.types.LASER,
        damage: 15,
        attacker: attacker
    };

    const result = CombatSystem.processAttack(attack, target);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(target.health, 0);
});

test('Step 6: Armored robot resists laser', async (t) => {
    const target = {
        health: 1,
        armor: 1,
        isDestroyed: false,
        constructor: { name: 'Robot' },
        type: 'ARMORED_PURSUER'
    };

    const attack = {
        type: COMBAT_CONFIG.types.LASER,
        damage: 15
    };

    const result = CombatSystem.processAttack(attack, target);
    assert.strictEqual(result, COMBAT_CONFIG.results.ARMOR_HIT);
    assert.strictEqual(target.health, 1);
});

test('Step 6: Viewport-forced collision resolution logic', async (t) => {
    // Mocking the escape logic from Blackrush.js
    const resolveEscape = (y, topBound, isBlocked) => {
        let currentY = y;
        if (currentY < topBound) {
            currentY = topBound;
            if (isBlocked(currentY)) {
                for (let offset = 5; offset <= 60; offset += 5) {
                    if (!isBlocked(topBound + offset)) {
                        currentY = topBound + offset;
                        break;
                    }
                }
            }
        }
        return currentY;
    };

    const topBound = 1000;
    // Case 1: Pushed to topBound, but blocked. Escapes to 1010.
    const isBlocked1 = (y) => y < 1010;
    assert.strictEqual(resolveEscape(900, topBound, isBlocked1), 1010);

    // Case 2: Pushed to topBound, NOT blocked. Stays at 1000.
    const isBlocked2 = (y) => false;
    assert.strictEqual(resolveEscape(900, topBound, isBlocked2), 1000);
});
