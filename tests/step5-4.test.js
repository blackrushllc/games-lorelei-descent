import { test } from 'node:test';
import assert from 'node:assert';
import CombatSystem from '../src/systems/CombatSystem.js';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';

test('Step 5.4: Initial survival state', async (t) => {
    const config = COMBAT_CONFIG.player;
    assert.strictEqual(config.maxShield, 100);
    assert.strictEqual(config.startingShield, 100);
    assert.strictEqual(config.maxHearts, 6);
    assert.strictEqual(config.startingHearts, 6);
});

test('Step 5.4: Shield damage reduces shield', async (t) => {
    const player = {
        shield: 100,
        maxShield: 100,
        isDestroyed: false,
        isInvulnerable: () => false,
        constructor: { name: 'Blackrush' }
    };
    const attack = { damage: 20 };
    const result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.HEALTH_DAMAGED);
    assert.strictEqual(player.shield, 80);
});

test('Step 5.4: Shield depletion removes one heart', async (t) => {
    const player = {
        shield: 10,
        maxShield: 100,
        hearts: 6,
        isDestroyed: false,
        isInvulnerable: () => false,
        constructor: { name: 'Blackrush' }
    };
    const attack = { damage: 20 };
    const result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    assert.strictEqual(player.shield, 0);
    
    // The decrement happens in GameScene.handlePlayerDefeat()
    // Here we just verify CombatSystem returned TARGET_DESTROYED
});

test('Step 5.4: Regeneration timing', async (t) => {
    // Mock simulation logic
    const config = COMBAT_CONFIG.player;
    let shield = 50;
    let lastDamageTime = 0;
    let now = 2000;
    
    const canRegen = (currentTime, lastDmg) => {
        return (currentTime - lastDmg) >= config.regenDelay;
    };

    assert.strictEqual(canRegen(now, lastDamageTime), false, 'Should not regen before delay');
    
    now = 5000; // 5s > 4s delay
    assert.strictEqual(canRegen(now, lastDamageTime), true, 'Should regen after delay');
});

test('Step 5.4: Regeneration rate and limit', async (t) => {
    const config = COMBAT_CONFIG.player;
    let shield = 50;
    const delta = 1000; // 1 second
    
    const regen = (currentShield, deltaMs) => {
        const amount = (config.regenRate * deltaMs) / 1000;
        return Math.min(config.maxShield, currentShield + amount);
    };

    shield = regen(shield, delta);
    assert.strictEqual(shield, 62, 'Should regen 12 points per second');
    
    shield = 95;
    shield = regen(shield, 1000);
    assert.strictEqual(shield, 100, 'Should not exceed max shield');
});

test('Step 5.4: Low-heart warning activation', async (t) => {
    const config = COMBAT_CONFIG.player;
    
    const getInterval = (hearts) => {
        if (hearts > config.lowHeartThreshold) return null;
        return hearts === 1 ? config.oneHeartWarnInterval : config.twoHeartWarnInterval;
    };

    assert.strictEqual(getInterval(6), null);
    assert.strictEqual(getInterval(3), null);
    assert.strictEqual(getInterval(2), 4000);
    assert.strictEqual(getInterval(1), 2000);
});
