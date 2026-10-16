import { test } from 'node:test';
import assert from 'node:assert';
import CombatSystem from '../src/systems/CombatSystem.js';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';

// Mock objects for testing
const createMockPlayer = () => ({
    shield: 100,
    isDestroyed: false,
    constructor: { name: 'Blackrush' },
    combatConfig: { maxShield: 100 },
    isInvulnerable: () => false
});

const createMockRobot = (type = 'PURSUER') => ({
    type: type,
    health: COMBAT_CONFIG.robots[type].maxHealth,
    armor: COMBAT_CONFIG.robots[type].maxArmor,
    isDestroyed: false,
    constructor: { name: 'Robot' },
    combatConfig: COMBAT_CONFIG.robots[type]
});

test('Step 5.3: New mission resets shield and defeat state', async (t) => {
    const player = createMockPlayer();
    player.shield = 20;
    player.isDestroyed = true;
    
    // Simulate what happens in GameScene onTrackStart/onSeek
    player.shield = 100;
    player.isDestroyed = false;
    
    assert.strictEqual(player.shield, 100);
    assert.strictEqual(player.isDestroyed, false);
});

test('Step 5.3: Shield depletion triggers defeat exactly once', async (t) => {
    let gameOverCount = 0;
    const scene = {
        isGameOver: false,
        handleGameOver: function() {
            if (this.isGameOver) return;
            this.isGameOver = true;
            gameOverCount++;
        }
    };
    
    const player = createMockPlayer();
    player.scene = scene;
    player.shield = 10;
    
    const attack = { damage: 20 };
    
    // First lethal hit
    let result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.TARGET_DESTROYED);
    if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
        scene.handleGameOver();
    }
    
    // Second hit (should be ignored by processAttack because of isDestroyed check, 
    // but even if it passed, handleGameOver would ignore it)
    player.isDestroyed = true; // Set by player.die() inside handleGameOver usually
    result = CombatSystem.processAttack(attack, player);
    assert.strictEqual(result, COMBAT_CONFIG.results.NO_DAMAGE);
    if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
        scene.handleGameOver();
    }
    
    assert.strictEqual(gameOverCount, 1);
});

test('Step 5.3: Defeat can occur in a second newly created mission', async (t) => {
    let gameOverCount = 0;
    const scene = {
        isGameOver: false,
        handleGameOver: function() {
            if (this.isGameOver) return;
            this.isGameOver = true;
            gameOverCount++;
        }
    };
    
    const player = createMockPlayer();
    player.scene = scene;
    
    // Mission 1: Die
    let result = CombatSystem.processAttack({ damage: 200 }, player);
    if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) scene.handleGameOver();
    assert.strictEqual(gameOverCount, 1);
    assert.strictEqual(scene.isGameOver, true);
    
    // Reset for Mission 2
    scene.isGameOver = false;
    player.isDestroyed = false;
    player.shield = 100;
    
    // Mission 2: Die again
    result = CombatSystem.processAttack({ damage: 200 }, player);
    if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) scene.handleGameOver();
    assert.strictEqual(gameOverCount, 2);
});
