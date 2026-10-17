import { test } from 'node:test';
import assert from 'node:assert';
import TimelineDirector from '../src/systems/TimelineDirector.js';

// Mock AudioDirector
class MockAudioDirector {
    constructor() {
        this.currentTime = 0;
        this.playing = false;
        this.paused = false;
        this.duration = 362;
    }
    isPlaying() { return this.playing; }
    isPaused() { return this.paused; }
    getCurrentTime() { return this.currentTime; }
    getDuration() { return this.duration; }
    play() { this.playing = true; }
    stop() { this.playing = false; }
    pause() { this.playing = false; this.paused = true; }
    resume() { this.playing = true; this.paused = false; }
    seek(t) { this.currentTime = t; }
}

test('TimelineDirector: Phase selection', async (t) => {
    const mockAudio = new MockAudioDirector();
    const director = new TimelineDirector(mockAudio);
    
    director.startTrack('SYNTH');
    
    // 0s should be CHASE
    mockAudio.currentTime = 0;
    director.update();
    assert.strictEqual(director.currentPhase.id, 'CHASE');
    
    // 45s should be ROBOT_SWARM
    mockAudio.currentTime = 45;
    director.update();
    assert.strictEqual(director.currentPhase.id, 'ROBOT_SWARM');
    
    // 300s should be PROXY_BATTLE
    mockAudio.currentTime = 300;
    director.update();
    assert.strictEqual(director.currentPhase.id, 'PROXY_BATTLE');
});

test('TimelineDirector: Event dispatch', async (t) => {
    const mockAudio = new MockAudioDirector();
    const director = new TimelineDirector(mockAudio);
    
    const events = [];
    director.on('event', (id) => events.push(id));
    
    director.startTrack('SYNTH');
    
    // CHASE_START (0s) should have fired during startTrack -> update
    assert.ok(events.includes('CHASE_START'));
    
    // Advance past next event (45s)
    mockAudio.currentTime = 45.1;
    director.update();
    assert.ok(events.includes('SWARM_START'));
});

test('TimelineDirector: Skipping events in a delayed frame', async (t) => {
    const mockAudio = new MockAudioDirector();
    const director = new TimelineDirector(mockAudio);
    
    const events = [];
    director.on('event', (id) => events.push(id));
    
    director.startTrack('SYNTH');
    
    // Jump from 0 to 50s instantly (delayed frame)
    mockAudio.currentTime = 50;
    director.update();
    
    // Both 0s and 45s events should have fired
    assert.ok(events.includes('CHASE_START'));
    assert.ok(events.includes('SWARM_START'));
    assert.ok(events.includes('FIRST_PATROL1'));
    // There are actually more events now: FIRST_PATROL1, FIRST_PATROL2, REINFORCEMENTS_1, REINFORCEMENTS_2, REINFORCEMENTS_3, SWARM_START
    assert.ok(events.length >= 3);
});

test('TimelineDirector: Seeking', async (t) => {
    const mockAudio = new MockAudioDirector();
    const director = new TimelineDirector(mockAudio);
    
    const events = [];
    director.on('event', (id) => events.push(id));
    
    director.startTrack('SYNTH');
    assert.ok(events.includes('CHASE_START'));
    
    // Seek to 310s
    director.seek(310);
    mockAudio.currentTime = 310;
    director.update();
    
    assert.strictEqual(director.currentPhase.id, 'PROXY_BATTLE');
    
    // Seek back to 40s
    director.seek(40);
    mockAudio.currentTime = 40;
    director.update();
    
    assert.strictEqual(director.currentPhase.id, 'CHASE');
    
    // Now move to 46s, SWARM_START (45s) should fire again
    mockAudio.currentTime = 46;
    director.update();
    
    // SWARM_START should be in events (it wasn't fired before seek because we seeked past it)
    assert.ok(events.includes('SWARM_START'));
});

test('TimelineDirector: Global time calculation', async (t) => {
    const mockAudio = new MockAudioDirector();
    const director = new TimelineDirector(mockAudio);
    
    // Initial global time should be 0
    assert.strictEqual(director.globalTime, 0);
    
    // Start SYNTH
    director.startTrack('SYNTH');
    mockAudio.currentTime = 10;
    director.update();
    assert.strictEqual(director.globalTime, 10);
    
    // Start CATHEDRAL (SYNTH is 362s)
    director.startTrack('CATHEDRAL');
    mockAudio.currentTime = 5;
    director.update();
    // 362 + 5 = 367
    assert.strictEqual(director.globalTime, 367);
    
    // Start STUDIO (SYNTH 362 + CATHEDRAL 241 = 603)
    director.startTrack('STUDIO');
    mockAudio.currentTime = 0;
    director.update();
    assert.strictEqual(director.globalTime, 603);
});
