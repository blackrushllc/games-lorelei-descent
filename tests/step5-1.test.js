import { test } from 'node:test';
import assert from 'node:assert';
import CombatSystem from '../src/systems/CombatSystem.js';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';

test('Step 5.1: Armor prevents energy damage', async (t) => {
    const robot = {
        health: 1,
        armor: 1,
        isDestroyed: false,
        constructor: { name: 'Robot' }
    };
    const attack = {
        type: COMBAT_CONFIG.types.ENERGY,
        damage: 1,
        armorBreaking: false
    };
    
    const result = CombatSystem.processAttack(attack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.ARMOR_HIT);
    assert.strictEqual(robot.health, 1);
});

test('Step 5.1: Axe removes armor exactly once', async (t) => {
    const robot = {
        health: 1,
        armor: 1,
        isDestroyed: false,
        constructor: { name: 'Robot' }
    };
    const axeAttack = {
        type: COMBAT_CONFIG.types.AXE,
        damage: 2,
        armorBreaking: true
    };
    
    // First axe hit
    let result = CombatSystem.processAttack(axeAttack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.ARMOR_BROKEN);
    assert.strictEqual(robot.armor, 0);
    
    // Second axe hit (should damage health now)
    result = CombatSystem.processAttack(axeAttack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(robot.health, 0);
});

test('Step 5.1: Exposed armored robot dies from one energy hit', async (t) => {
    const robot = {
        health: 1,
        armor: 0,
        isDestroyed: false,
        constructor: { name: 'Robot' }
    };
    const attack = {
        type: COMBAT_CONFIG.types.ENERGY,
        damage: 1,
        armorBreaking: false
    };
    
    const result = CombatSystem.processAttack(attack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(robot.health, 0);
});

test('Step 5.1: Robot destruction does not award duplicate score', async (t) => {
    const robot = {
        health: 1,
        armor: 0,
        isDestroyed: true,
        constructor: { name: 'Robot' }
    };
    const attack = { damage: 1 };
    
    const result = CombatSystem.processAttack(attack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.NO_DAMAGE);
    
    const score = CombatSystem.getScoreForResult(result, { score: 100 });
    assert.strictEqual(score, 0);
});

test('Step 5.1: Shield depletion triggers defeat only once', async (t) => {
    const player = {
        shield: 1,
        isDestroyed: false,
        constructor: { name: 'Blackrush' },
        isInvulnerable: () => false
    };
    
    const attack = { damage: 10 };
    
    // First hit -> Destroyed
    let result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    
    // Simulate player.die()
    player.isDestroyed = true;
    
    // Second hit -> No damage (already destroyed)
    result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.NO_DAMAGE);
});
