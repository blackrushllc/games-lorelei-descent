import { test } from 'node:test';
import assert from 'node:assert';

// Global mock for Phaser
global.Phaser = {
    Geom: {
        Rectangle: class {
            constructor(x, y, w, h) {
                this.x = x; this.y = y; this.width = w; this.height = h;
                this.bottom = y + h;
            }
            contains(x, y) {
                return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
            }
        }
    }
};

import EncounterDirector from '../src/systems/EncounterDirector.js';
import { ENCOUNTER_SCORE } from '../src/config/encounterScore.js';

// Mocking Phaser and Scene
class MockRobot {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.isDestroyed = false;
        this.aiState = 'IDLE';
        this.creationTime = Date.now();
        this.body = {
            enable: true,
            speed: 0,
            acceleration: { x: 0, y: 0 },
            setVelocity: () => {},
            setAcceleration: () => {},
            setMaxSpeed: () => {}
        };
        this.laserGraphic = { clear: () => {} };
    }
    retreat() { this.aiState = 'RETREATING'; }
    setActive(v) { this.active = v; return this; }
    setVisible(v) { this.visible = v; return this; }
    maybeTriggerCatchUp() {}
}

class MockGroup {
    constructor() {
        this.children = [];
    }
    add(child) { this.children.push(child); }
    getLength() { return this.children.filter(c => c.active).length; }
    countActive(active) { return this.children.filter(c => c.active === active).length; }
    getChildren() { return this.children; }
}

class MockTimeline {
    constructor() {
        this.listeners = {};
        this.currentTrackKey = 'SYNTH';
        this.audioDirector = { getCurrentTime: () => 0 };
    }
    on(event, fn) { this.listeners[event] = fn; }
    off(event, fn) { delete this.listeners[event]; }
    emit(event, ...args) { if (this.listeners[event]) this.listeners[event](...args); }
    getState() { return { isPlaying: true }; }
}

class MockScene {
    constructor() {
        this.scene = { isActive: () => true };
        this.sessionID = 1;
        this.game = {
            timelineDirector: new MockTimeline(),
            loop: { now: Date.now() }
        };
        this.robotGroup = new MockGroup();
        this.cameras = { 
            main: { 
                scrollY: 0,
                worldView: { x: 0, y: 0, width: 1280, height: 960, bottom: 960, right: 1280, centerX: 640 }
            } 
        };
        this.player = { x: 640, y: 450, shield: 100, maxShield: 100, hearts: 6, maxHearts: 6, combatConfig: { lowHeartThreshold: 2 } };
        this.time = { now: Date.now() };
    }
    spawnRobotAt(x, y, type, cueID = null) {
        const robot = new MockRobot(this, x, y, type);
        robot.cueID = cueID;
        this.robotGroup.add(robot);
        return robot;
    }
    findSafeSpawnPosition(x, y, permittedRegion = null) { return { x, y }; }
}

test('EncounterDirector: Initialization and Score Validation', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    assert.strictEqual(ed.enabled, true);
    assert.ok(ENCOUNTER_SCORE.length > 0);
    
    // Check if score is chronologically ordered
    for (let i = 1; i < ENCOUNTER_SCORE.length; i++) {
        assert.ok(ENCOUNTER_SCORE[i].time >= ENCOUNTER_SCORE[i-1].time, `Score not ordered at index ${i}`);
    }
});

test('EncounterDirector: Population Caps', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    ed.maxActive = 5;
    
    // Request 10 robots
    ed.handleSpawnCue({
        id: 'TEST_SWARM',
        counts: { PURSUER: 10 },
        formation: 'PATROL',
        spawnRegion: 'TOP_RANDOM'
    }, true);
    
    // Should only have spawned 5
    assert.strictEqual(scene.robotGroup.getLength(), 5);
});

test('EncounterDirector: Retreat Logic', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    // Spawn 10 robots
    for (let i = 0; i < 10; i++) scene.spawnRobotAt(320, 100 * i, 'PURSUER');
    
    // Retreat 50%
    ed.handleRetreatCue({ retreatFraction: 0.5 });
    
    const retreating = scene.robotGroup.getChildren().filter(r => r.aiState === 'RETREATING');
    assert.strictEqual(retreating.length, 5);
});

test('EncounterDirector: Seeking Reconstructs State', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    // Seek to 130s (First Spectacle is at 125s)
    ed.onSeek(130);
    
    // 1. Should have registered previous cues
    assert.ok(ed.activeCues.has('FIRST_SPECTACLE'));
    assert.ok(ed.activeCues.has('FIRST_PATROL1'));
    
    // 2. Should have adjusted population cap (FIRST_SPECTACLE sets maxActive to 24)
    assert.strictEqual(ed.maxActive, 24);
    
    // 3. Should have spawned representative fixture for FIRST_SPECTACLE
    // FIRST_SPECTACLE requested 14 sentinels.
    const sentinelCount = scene.robotGroup.getChildren().filter(r => r.type === 'SENTINEL').length;
    assert.ok(sentinelCount > 0);
});

test('EncounterDirector: CLEAR_FOR_BOSS', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    // Spawn some robots
    scene.spawnRobotAt(320, 100, 'PURSUER');
    scene.spawnRobotAt(320, 200, 'PURSUER');
    
    ed.handleClearForBoss();
    
    // Robots should be retreating
    const retreating = scene.robotGroup.getChildren().filter(r => r.aiState === 'RETREATING');
    assert.strictEqual(retreating.length, 2);
    
    // Spawning should be disabled
    assert.strictEqual(ed.enabled, false);
});

test('EncounterDirector: Staggered Spawning', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    ed.handleSpawnCue({
        id: 'STAGGERED_TEST',
        counts: { PURSUER: 5 },
        formation: 'PATROL',
        spawnRegion: 'TOP_RANDOM'
    }, false); // Staggered
    
    assert.strictEqual(ed.pendingFormations.length, 1);
    assert.strictEqual(scene.robotGroup.getLength(), 0);
    
    // Update to spawn one
    ed.update(0, 200); // interval is 0.1s (100ms)
    assert.strictEqual(scene.robotGroup.getLength(), 1);
});
