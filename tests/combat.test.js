import { test } from 'node:test';
import assert from 'node:assert';
import CombatSystem from '../src/systems/CombatSystem.js';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';

test('CombatSystem: Pursuer takes one energy hit and dies', async (t) => {
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

test('CombatSystem: Sentinel survives one energy hit, dies after second', async (t) => {
    const robot = {
        health: 2,
        armor: 0,
        isDestroyed: false,
        constructor: { name: 'Robot' }
    };
    const attack = {
        type: COMBAT_CONFIG.types.ENERGY,
        damage: 1,
        armorBreaking: false
    };
    
    // First hit
    let result = CombatSystem.processAttack(attack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.HEALTH_DAMAGED);
    assert.strictEqual(robot.health, 1);
    assert.strictEqual(robot.isDestroyed, false);
    
    // Second hit
    result = CombatSystem.processAttack(attack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(robot.health, 0);
});

test('CombatSystem: Ordinary robot dies instantly from an axe', async (t) => {
    const robot = {
        health: 2,
        armor: 0,
        isDestroyed: false,
        constructor: { name: 'Robot' }
    };
    const attack = {
        type: COMBAT_CONFIG.types.AXE,
        damage: 2,
        armorBreaking: true
    };
    const result = CombatSystem.processAttack(attack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(robot.health, 0);
});

test('CombatSystem: Armored robot resists energy damage', async (t) => {
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
    assert.strictEqual(robot.armor, 1);
});

test('CombatSystem: Axe removes armored robot armor and energy destroys core', async (t) => {
    const robot = {
        health: 1,
        armor: 1,
        isDestroyed: false,
        constructor: { name: 'Robot' }
    };
    
    // 1. Axe hits
    const axeAttack = {
        type: COMBAT_CONFIG.types.AXE,
        damage: 2,
        armorBreaking: true
    };
    let result = CombatSystem.processAttack(axeAttack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.ARMOR_BROKEN);
    assert.strictEqual(robot.armor, 0);
    assert.strictEqual(robot.health, 1); // Health preserved on armor break
    
    // 2. Energy hits
    const energyAttack = {
        type: COMBAT_CONFIG.types.ENERGY,
        damage: 1,
        armorBreaking: false
    };
    result = CombatSystem.processAttack(energyAttack, robot);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(robot.health, 0);
});

test('CombatSystem: Player shield depletion', async (t) => {
    const player = {
        shield: 100,
        isDestroyed: false,
        constructor: { name: 'Blackrush' },
        isInvulnerable: () => false
    };
    
    const attack = {
        type: COMBAT_CONFIG.types.LASER,
        damage: 15
    };
    
    let result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.HEALTH_DAMAGED);
    assert.strictEqual(player.shield, 85);
    
    // Massive attack
    const lethal = { damage: 100 };
    result = CombatSystem.processAttack(lethal, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(player.shield, 0);
});

test('CombatSystem: Invulnerability prevents damage', async (t) => {
    const player = {
        shield: 100,
        isDestroyed: false,
        constructor: { name: 'Blackrush' },
        isInvulnerable: () => true
    };
    
    const attack = { damage: 50 };
    const result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.NO_DAMAGE);
    assert.strictEqual(player.shield, 100);
});
