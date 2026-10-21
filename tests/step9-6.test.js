import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { COMBAT_CONFIG } from '../src/config/combatConfig.js';
import { GAMEPLAY_CONFIG } from '../src/config/gameplayConfig.js';

// Setup Mock Phaser for evaluation
global.MockPhaser = {
    Scene: class {
        constructor() {
            this.scene = { key: 'scene' };
            this.cameras = { main: { scrollY: 0 } };
            this.add = { graphics: () => ({ lineStyle: () => {}, strokeCircle: () => {}, setPosition: () => {} }) };
            this.tweens = { add: () => {} };
        }
    },
    GameObjects: {
        Container: class {
            constructor(scene) { 
                this.scene = scene; 
                this.visible = true;
                this.alpha = 1;
                this.x = 0;
                this.y = 0;
            }
            add() {}
            setAlpha(a) { this.alpha = a; }
            setVisible(v) { this.visible = v; }
            setPosition(x, y) { this.x = x; this.y = y; }
        }
    },
    Input: {
        Keyboard: {
            JustDown: (key) => key.isDown,
            KeyCodes: { SPACE: 32 }
        }
    },
    Math: {
        Vector2: class {
            constructor(x, y) { this.x = x; this.y = y; }
            length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
            normalize() { const l = this.length(); if(l>0){this.x /= l; this.y /= l;} return this; }
        },
        Distance: { Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2) },
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2-y1, x2-x1) },
        Clamp: (v, min, max) => Math.max(min, Math.min(max, v))
    }
};
global.COMBAT_CONFIG = COMBAT_CONFIG;
global.GAMEPLAY_CONFIG = GAMEPLAY_CONFIG;
global.window = { location: { search: '' } };

// Evaluate Blackrush
const brCode = fs.readFileSync(path.resolve('src/entities/Blackrush.js'), 'utf8')
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace("import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';", "const GAMEPLAY_CONFIG = global.GAMEPLAY_CONFIG;")
    .replace("import { COMBAT_CONFIG } from '../config/combatConfig.js';", "const COMBAT_CONFIG = global.COMBAT_CONFIG;")
    .replace("export default class Blackrush", "global.Blackrush = class Blackrush");
(new Function(brCode))();
const Blackrush = global.Blackrush;

// Evaluate DesktopControls
const dcCode = fs.readFileSync(path.resolve('src/controls/DesktopControls.js'), 'utf8')
    .replace("import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';", "const GAMEPLAY_CONFIG = global.GAMEPLAY_CONFIG; const Phaser = global.MockPhaser;")
    .replace("export default class DesktopControls", "global.DesktopControls = class DesktopControls");
(new Function(dcCode))();
const DesktopControls = global.DesktopControls;

// Evaluate EncounterDirector
const edCode = fs.readFileSync(path.resolve('src/systems/EncounterDirector.js'), 'utf8')
    .replace("import { ENCOUNTER_SCORE, AMBIENT_POLICY } from '../config/encounterScore.js';", "const AMBIENT_POLICY = { startTime: 0 }; const ENCOUNTER_SCORE = [];")
    .replace("import { COMBAT_CONFIG } from '../config/combatConfig.js';", "const COMBAT_CONFIG = global.COMBAT_CONFIG;")
    .replace("export default class EncounterDirector", "global.EncounterDirector = class EncounterDirector");
(new Function(edCode))();
const EncounterDirector = global.EncounterDirector;

// Evaluate GameScene (minimal for triggerNova)
const gsCode = fs.readFileSync(path.resolve('src/scenes/GameScene.js'), 'utf8')
    .replace("import Phaser from 'phaser';", "const Phaser = global.MockPhaser;")
    .replace(/import .* from .*/g, "") // Remove all imports
    .replace("export default class GameScene", "global.GameScene = class GameScene");
(new Function(gsCode))();
const GameScene = global.GameScene;

// Mock Scene
class MockScene {
    constructor() {
        this.time = { now: 0 };
        this.add = {
            sprite: () => ({ setScale: () => {}, setVisible: () => {} }),
            graphics: () => ({ 
                fillStyle: () => {}, fillRect: () => {}, lineStyle: () => {}, strokeRect: () => {}, 
                fillCircle: () => {}, fillTriangle: () => {}, clear: () => {}, setVisible: () => {},
                setAlpha: () => {}
            }),
            text: () => ({ setOrigin: () => ({}) }),
            existing: () => {}
        };
        this.registry = { get: () => ({ getAnimationKey: () => 'key', get8WayDirection: () => 'south' }) };
        this.physics = {
            add: {
                existing: (obj) => {
                    obj.body = { 
                        setCircle: () => {}, setCollideWorldBounds: () => {}, setMaxSpeed: () => {}, 
                        setDrag: () => {}, setAcceleration: () => {}, setVelocity: () => {}, 
                        velocity: { x: 0, y: 0, length: () => 0 } 
                    };
                }
            }
        };
        this.events = { emit: () => {}, on: () => {} };
        this.game = { 
            events: { on: () => {} },
            timelineDirector: {
                on: () => {},
                off: () => {},
                emit: () => {},
                currentTrackKey: 'SYNTH'
            }
        };
        this.timelineDirector = this.game.timelineDirector;
        this.input = {
            keyboard: {
                addKeys: () => ({
                    up: { isDown: false }, down: { isDown: false }, left: { isDown: false }, right: { isDown: false },
                    arrowUp: { isDown: false }, arrowDown: { isDown: false }, arrowLeft: { isDown: false }, arrowRight: { isDown: false },
                    nova: { isDown: false }
                }),
                resetKeys: () => {}
            },
            mouse: { disableContextMenu: () => {} },
            on: () => {}
        };
    }
}

test('Blackrush: spendHeartForNova logic', (t) => {
    const scene = new MockScene();
    const player = new Blackrush(scene, 0, 0);
    
    player.hearts = 6;
    assert.strictEqual(player.spendHeartForNova(), true, 'Should spend heart at 6');
    assert.strictEqual(player.hearts, 5, 'Should have 5 hearts left');
    assert.strictEqual(player.invulnerabilityTimer, 1000, 'Should have 1s invulnerability');
    
    player.hearts = 1;
    assert.strictEqual(player.spendHeartForNova(), false, 'Should not spend heart at 1');
    assert.strictEqual(player.hearts, 1, 'Should still have 1 heart');
});

test('DesktopControls: SPACE key detection', (t) => {
    const scene = new MockScene();
    scene.input.activePointer = { x: 0, y: 0, worldX: 0, worldY: 0, leftButtonDown: () => false, rightButtonDown: () => false };
    const controls = new DesktopControls(scene);
    
    controls.keys.nova.isDown = true;
    controls.update();
    assert.strictEqual(controls.getState().isFiringNova, true, 'isFiringNova should be true when SPACE is down');
});

test('EncounterDirector: NOVA coordination', (t) => {
    const scene = new MockScene();
    scene.scene = { isActive: () => true };
    const ed = new EncounterDirector(scene);
    ed.timeline = { currentTime: 100, currentTrackKey: 'SYNTH' };
    
    ed.pendingFormations = [{ id: 1 }, { id: 2 }];
    ed.cancelNovaFormations();
    assert.strictEqual(ed.pendingFormations.length, 0, 'Should clear pending formations');
    
    ed.nextAmbientTime = 100;
    ed.suspendAmbientSpawning(2.0);
    assert.strictEqual(ed.nextAmbientTime, 102, 'Should suspend ambient spawning by 2s');
});

test('GameScene: triggerNova logic flow', (t) => {
    const gs = new GameScene();
    gs.isGameOver = false;
    gs.player = {
        isDestroyed: false,
        isRespawning: false,
        hearts: 6,
        maxHearts: 6,
        x: 100,
        y: 200,
        spendHeartForNova: function() {
            if (this.hearts >= 2) {
                this.hearts--;
                return true;
            }
            return false;
        }
    };
    gs.hud = { setHearts: () => {} };
    gs.playSurvivalSound = () => {};
    gs.createNovaEffect = () => {};
    gs.clearOrdinaryRobots = () => {};
    gs.encounterDirector = { 
        cancelNovaFormations: () => { gs.formationsCancelled = true; },
        suspendAmbientSpawning: () => { gs.ambientSuspended = true; }
    };
    gs.sessionID = 1;

    gs.triggerNova();
    
    assert.strictEqual(gs.player.hearts, 5, 'Should consume heart');
    assert.strictEqual(gs.formationsCancelled, true, 'Should cancel formations');
    assert.strictEqual(gs.ambientSuspended, true, 'Should suspend ambient');
});
