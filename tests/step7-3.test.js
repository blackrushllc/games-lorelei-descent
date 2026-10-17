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
    },
    Math: {
        Distance: {
            Between: (x1, y1, x2, y2) => Math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        }
    }
};

// Mocking Phaser and other dependencies
class MockTimeline {
    constructor() {
        this.currentTrackKey = 'SYNTH';
        this.audioDirector = {
            getCurrentTime: () => this.currentTime,
        };
        this.currentTime = 0;
        this.events = [];
        this.on = (ev, cb) => {};
        this.off = (ev, cb) => {};
    }
}

class MockGroup {
    constructor() {
        this.children = [];
    }
    add(child) { this.children.push(child); }
    getLength() { return this.children.length; }
    countActive(active) { return this.children.filter(c => c.active === active).length; }
    getChildren() { return this.children; }
}

class MockScene {
    constructor() {
        this.scene = { isActive: () => true };
        this.game = {
            timelineDirector: new MockTimeline()
        };
        this.cameras = {
            main: {
                scrollY: 0,
                worldView: { x: 0, y: 0, width: 1280, height: 960, bottom: 960, centerX: 640 }
            }
        };
        this.robotGroup = new MockGroup();
        this.environment = {
            obstacles: new MockGroup(),
            walls: new MockGroup()
        };
        this.player = { x: 640, y: 500 };
        this.spawned = [];
    }
    spawnRobotAt(x, y, type, cueID) {
        const robot = { x, y, type, cueID, active: true, isDestroyed: false, aiState: 'IDLE' };
        this.robotGroup.add(robot);
        this.spawned.push(robot);
        return robot;
    }
    findSafeSpawnPosition(x, y, permittedRegion) {
        if (permittedRegion && !permittedRegion.contains(x, y)) return null;
        return { x, y };
    }
}

// We need to dynamic import or mock the config files to avoid path issues in Node test runner
// For this test, I'll manually define parts of the config that EncounterDirector uses.
const MockEncounterScore = [
    { id: 'CUE1', time: 10, type: 'SPAWN', formation: 'PATROL', counts: { PURSUER: 2 }, spawnRegion: 'BOTTOM_APPROACH' },
    { id: 'LULL1', time: 50, type: 'LULL', duration: 20 },
    { id: 'BOSS', time: 100, type: 'CLEAR_FOR_BOSS' }
];

const MockAmbientPolicy = {
    startTime: 5,
    targetCount: 2,
    spawnIntervalRange: [2, 4],
    types: ['PURSUER'],
    armoredStartTime: 999,
    regions: ['BOTTOM_APPROACH']
};

// Instead of importing, I'll use a modified EncounterDirector for testing or just mock the imports.
// Actually, since I'm in an environment where I can read the file, I'll try to just import it.

import EncounterDirector from '../src/systems/EncounterDirector.js';

test('EncounterDirector: Ambient Spawning', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    ed.reset();
    // Use values that align with the real AMBIENT_POLICY
    ed.nextAmbientTime = 45;
    
    // Simulate time passing
    scene.game.timelineDirector.currentTime = 46;
    ed.update(46, 1000); // 1s delta
    
    const ambientRobots = scene.spawned.filter(r => r.cueID === null);
    assert.strictEqual(ambientRobots.length, 1, 'Should spawn one ambient robot');
    assert.ok(ambientRobots[0].y >= 960, 'Should spawn below viewport');
});

test('EncounterDirector: Lull suppresses ambient', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    ed.reset();
    
    ed.executeCue({ id: 'LULL1', type: 'LULL', time: 10, duration: 20 });
    assert.strictEqual(ed.isLull, true);
    
    scene.game.timelineDirector.currentTime = 15;
    ed.nextAmbientTime = 12;
    ed.update(15, 1000);
    
    const ambientRobots = scene.spawned.filter(r => r.cueID === null);
    assert.strictEqual(ambientRobots.length, 0, 'Should not spawn ambient during lull');
});

test('EncounterDirector: Population Cap', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    ed.reset();
    ed.maxActive = 2;
    
    // Fill population
    scene.spawnRobotAt(100, 100, 'PURSUER', 'MANUAL');
    scene.spawnRobotAt(110, 110, 'PURSUER', 'MANUAL');
    
    scene.game.timelineDirector.currentTime = 10;
    ed.nextAmbientTime = 8;
    ed.update(10, 1000);
    
    const ambientRobots = scene.spawned.filter(r => r.cueID === null);
    assert.strictEqual(ambientRobots.length, 0, 'Should not exceed population cap');
});

test('EncounterDirector: Offscreen Spawning', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    
    const pos = ed.calculateSpawnPosition('PATROL', 0, 1, 'BOTTOM_APPROACH', 123);
    assert.ok(pos.y >= scene.cameras.main.worldView.bottom, 'Spawn Y should be at or below viewport bottom');
    assert.ok(pos.x >= 0 && pos.x <= 1280, 'Spawn X should be within horizontal bounds');
});

test('EncounterDirector: Staggered Spawn Expiration', async (t) => {
    const scene = new MockScene();
    const ed = new EncounterDirector(scene);
    ed.reset();
    
    ed.pendingFormations.push({
        id: 'DELAYED',
        formation: 'PATROL',
        list: ['PURSUER'],
        region: 'BOTTOM_APPROACH',
        seed: 1,
        timer: 0,
        interval: 100,
        index: 0,
        expiresAt: 10
    });
    
    scene.game.timelineDirector.currentTime = 15;
    ed.update(15, 1000);
    
    assert.strictEqual(ed.pendingFormations.length, 0, 'Pending formation should have expired');
    assert.strictEqual(scene.spawned.length, 0, 'No robot should have spawned from expired formation');
});
