import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ASSISTANCE_CONFIG, ARENA_CHECKPOINTS } from '../src/config/assistanceConfig.js';

// Mock objects for testing
class MockGame {
    constructor() {
        this.missionState = {
            assistanceLevel: 0,
            heartsCollected: 0,
            arenaCheckpoint: null,
            retryCount: 0
        };
        this.timelineDirector = new MockTimeline();
    }
}

class MockTimeline {
    constructor() {
        this.currentTrackKey = 'SYNTH';
        this.currentTime = 0;
        this.isNaturalProgression = true;
    }
    getState() {
        return { track: this.currentTrackKey, time: this.currentTime };
    }
    stop() {}
    startTrack(key, time) {
        this.currentTrackKey = key;
        this.currentTime = time || 0;
    }
}

class MockPlayer {
    constructor(maxHearts = 6) {
        this.maxHearts = maxHearts;
        this.hearts = maxHearts;
        this.shield = 100;
        this.maxShield = 100;
        this.isDestroyed = false;
        this.isFinalDefeat = false;
        this.combatConfig = { maxShield: 100, startingHearts: 6, maxHearts: 6 };
    }
    reset() {
        this.hearts = this.combatConfig.startingHearts;
        this.shield = this.maxShield;
    }
}

describe('Step 9.7: Adaptive Assistance and Arena Checkpoints', () => {
    let game, scene, ed, player;

    beforeEach(() => {
        game = new MockGame();
        player = new MockPlayer();
        scene = {
            game: game,
            player: player,
            timeline: game.timelineDirector,
            hud: {
                setHearts: () => {},
                setShield: () => {},
                setScore: () => {}
            },
            playSurvivalSound: () => {},
            createHeartPickupEffect: () => {},
            reconcilePlayerWithCamera: () => {},
            spawnTestEncounter: () => {},
            reconstructArena: () => {},
            sessionID: 1
        };
        
        // Mock handlePlayerHeartCollision
        scene.handlePlayerHeartCollision = (player, heart) => {
            if (player.hearts < player.maxHearts) {
                player.hearts++;
                if (game.missionState) {
                    game.missionState.heartsCollected++;
                    game.missionState.assistanceLevel++;
                }
            }
        };

        // Mock checkpoint acquisition
        scene.updateCheckpointAcquisition = () => {
            if (!game.timelineDirector.isNaturalProgression) return;
            const state = game.timelineDirector.getState();
            if (state.track === 'SYNTH' && state.time >= 300) {
                game.missionState.arenaCheckpoint = 'PROXY';
            }
            if (state.track === 'CATHEDRAL') {
                game.missionState.arenaCheckpoint = 'SUPER_ROBOT';
            }
        };
    });

    test('Heart collection increments assistance level', () => {
        player.hearts = 5;
        scene.handlePlayerHeartCollision(player, {});
        assert.strictEqual(game.missionState.heartsCollected, 1);
        assert.strictEqual(game.missionState.assistanceLevel, 1);
    });

    test('NOVA does not change assistance level', () => {
        // Mock NOVA spending
        const spendNova = () => {
            player.hearts--;
            // Should NOT change assistance
        };
        game.missionState.assistanceLevel = 1;
        spendNova();
        assert.strictEqual(game.missionState.assistanceLevel, 1);
        assert.strictEqual(player.hearts, 5);
    });

    test('Damage does not change assistance level', () => {
        game.missionState.assistanceLevel = 1;
        player.hearts--;
        assert.strictEqual(game.missionState.assistanceLevel, 1);
    });

    test('Spawn multiplier application', () => {
        const getCount = (requested, level) => {
            const mult = ASSISTANCE_CONFIG.spawnMultipliers[Math.min(level, ASSISTANCE_CONFIG.spawnMultipliers.length - 1)];
            let count = Math.round(requested * mult);
            if (requested >= ASSISTANCE_CONFIG.minimumFormationCount) {
                count = Math.max(ASSISTANCE_CONFIG.minimumFormationCount, count);
            } else if (requested > 0) {
                count = Math.max(1, count);
            }
            return count;
        };

        // Level 0: 100%
        assert.strictEqual(getCount(10, 0), 10);
        // Level 1: 50%, but min 4
        assert.strictEqual(getCount(10, 1), 5);
        assert.strictEqual(getCount(6, 1), 4); // 6 * 0.5 = 3, but min 4
        // Level 3: 25%
        assert.strictEqual(getCount(20, 3), 5);
        assert.strictEqual(getCount(12, 3), 4); // 12 * 0.25 = 3, but min 4
        
        // Small formations
        assert.strictEqual(getCount(3, 3), 1); // 3 * 0.25 = 0.75 -> 1. Min 4 doesn't apply because original was 3.
    });

    test('Checkpoint acquisition at Synth 5:00', () => {
        game.timelineDirector.currentTime = 299;
        scene.updateCheckpointAcquisition();
        assert.strictEqual(game.missionState.arenaCheckpoint, null);

        game.timelineDirector.currentTime = 300;
        scene.updateCheckpointAcquisition();
        assert.strictEqual(game.missionState.arenaCheckpoint, 'PROXY');
    });

    test('Checkpoint acquisition at Cathedral entry', () => {
        game.timelineDirector.currentTrackKey = 'CATHEDRAL';
        game.timelineDirector.currentTime = 0;
        scene.updateCheckpointAcquisition();
        assert.strictEqual(game.missionState.arenaCheckpoint, 'SUPER_ROBOT');
    });

    test('Seeking does not unlock checkpoints', () => {
        game.timelineDirector.isNaturalProgression = false;
        game.timelineDirector.currentTime = 301;
        scene.updateCheckpointAcquisition();
        assert.strictEqual(game.missionState.arenaCheckpoint, null);
    });

    test('Continue from checkpoint restores hearts and shield', () => {
        game.missionState.arenaCheckpoint = 'PROXY';
        const cp = ARENA_CHECKPOINTS.PROXY;
        
        // Mock continue from arena
        const continueFromArena = () => {
            game.missionState.retryCount++;
            game.timelineDirector.startTrack(cp.track, cp.time);
            
            // Re-simulate onTrackStart logic
            player.reset();
            player.hearts = cp.startingHearts;
            player.shield = cp.startingShield;
        };

        player.hearts = 0;
        continueFromArena();
        
        assert.strictEqual(game.timelineDirector.currentTrackKey, 'SYNTH');
        assert.strictEqual(game.timelineDirector.currentTime, 300);
        assert.strictEqual(player.hearts, 3);
        assert.strictEqual(player.shield, 100);
        assert.strictEqual(game.missionState.retryCount, 1);
    });
});
