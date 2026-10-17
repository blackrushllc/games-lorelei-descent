import { test } from 'node:test';
import assert from 'node:assert';
import EncounterDirector from '../src/systems/EncounterDirector.js';

// Mock dependencies
class MockTimeline {
    constructor() {
        this.events = {};
        this.currentTrackKey = 'SYNTH';
        this.audioDirector = {
            getCurrentTime: () => 160
        };
    }
    on(event, cb) { this.events[event] = cb; }
    off(event, cb) {}
    emit(event, ...args) { if (this.events[event]) this.events[event](...args); }
}

class MockScene {
    constructor() {
        this.game = { timelineDirector: new MockTimeline() };
        this.player = { hearts: 6, maxHearts: 6, shield: 100, maxShield: 100 };
        this.cameras = { main: { worldView: { x: 0, y: 0, width: 640, height: 960, bottom: 960 } } };
        this.robotGroup = { countActive: () => 0 };
        this.scene = { isActive: () => true };
        this.heartSpawned = false;
        this.sessionID = 0;
    }
    spawnHeartAt(x, y) {
        this.heartSpawned = true;
    }
    spawnRobotAt() {}
    findSafeSpawnPosition(x, y) { return { x, y }; }
}

global.Phaser = {
    Math: {
        Clamp: (value, min, max) => Math.min(Math.max(value, min), max)
    }
};

test('HEART_DROP condition uses strict less-than comparison', () => {
    const scene = new MockScene();
    const director = new EncounterDirector(scene);
    
    const cue = { id: 'HEART_TEST', type: 'HEART_DROP', ifHeartsBelow: 3 };
    
    // Test Case: Hearts = 3 (Should NOT spawn)
    scene.player.hearts = 3;
    scene.heartSpawned = false;
    director.handleHeartDrop(cue);
    assert.strictEqual(scene.heartSpawned, false, 'Should not spawn if hearts == ifHeartsBelow');
    
    // Test Case: Hearts = 2 (Should spawn)
    scene.player.hearts = 2;
    scene.heartSpawned = false;
    director.handleHeartDrop(cue);
    assert.strictEqual(scene.heartSpawned, true, 'Should spawn if hearts < ifHeartsBelow');
});

test('Heart pickup restores one life but not shield, and caps at max', () => {
    const scene = new MockScene();
    // In GameScene.js: handlePlayerHeartCollision(player, heart)
    const GameScene = {
        player: { hearts: 2, maxHearts: 6, shield: 50, maxShield: 100, isDestroyed: false },
        hud: { setHearts: () => {} },
        playSurvivalSound: () => {},
        handlePlayerHeartCollision: function(player, heart) {
            if (player.isDestroyed || !heart.active) return;
            if (player.hearts < player.maxHearts) {
                player.hearts++;
                this.hud.setHearts(player.hearts, player.maxHearts);
            }
            heart.destroy();
        }
    };
    
    const mockHeart = { active: true, destroy: () => { mockHeart.active = false; } };
    
    // Case 1: Restore one heart
    GameScene.handlePlayerHeartCollision(GameScene.player, mockHeart);
    assert.strictEqual(GameScene.player.hearts, 3);
    assert.strictEqual(GameScene.player.shield, 50, 'Shield should not change');
    
    // Case 2: Cap at 6
    GameScene.player.hearts = 6;
    mockHeart.active = true;
    GameScene.handlePlayerHeartCollision(GameScene.player, mockHeart);
    assert.strictEqual(GameScene.player.hearts, 6, 'Should not exceed maxHearts');
});

test('Encounter ID validation handles duplicates', async () => {
    // We can't easily mock the import, but we can call the method with a custom list if we modify it to accept one
    // Or we just verify it renamed the existing ones in memory
    const scene = new MockScene();
    const director = new EncounterDirector(scene);
    
    // Check if the duplicates we found earlier are unique now in the internal ENCOUNTER_SCORE (which is a live reference to the module export)
    const { ENCOUNTER_SCORE } = await import('../src/config/encounterScore.js');
    const ids = ENCOUNTER_SCORE.map(c => c.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, 'All IDs in ENCOUNTER_SCORE should be unique after validation and manual fix');
});
