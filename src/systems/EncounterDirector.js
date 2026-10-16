import { ENCOUNTER_SCORE } from '../config/encounterScore.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * Orchestrates musically choreographed robot encounters.
 * Manages population, formations, and tactical behaviors.
 */
export default class EncounterDirector {
    /**
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.timeline = scene.game.timelineDirector;
        
        this.enabled = true;
        this.activeCues = new Set();
        this.lastTrackTime = 0;
        
        // Population limits
        this.maxActive = 16; 
        this.spectacleHardCap = 36;
        this.isLull = false;
        this.lullEndTime = 0;
        
        // Catch-up burst settings
        this.catchUpEnabled = true;
        this.catchUpMultiplier = 1.8;
        
        // Internal state
        this.pendingFormations = [];
        this.sessionID = scene.sessionID || 0;
        
        // Bind listeners
        this.onEvent = this.onEvent.bind(this);
        this.onSeek = this.onSeek.bind(this);
        this.onTrackStart = this.onTrackStart.bind(this);
        
        this.setupListeners();
    }

    setupListeners() {
        this.timeline.on('event', this.onEvent);
        this.timeline.on('seek', this.onSeek);
        this.timeline.on('trackStart', this.onTrackStart);
    }

    destroy() {
        this.timeline.off('event', this.onEvent);
        this.timeline.off('seek', this.onSeek);
        this.timeline.off('trackStart', this.onTrackStart);
        this.pendingFormations = [];
    }

    onTrackStart(trackKey) {
        if (trackKey === 'SYNTH') {
            this.reset();
        } else {
            // Stop spawning for CATHEDRAL and STUDIO tracks
            this.enabled = false;
            this.clearAll();
        }
    }

    reset() {
        this.activeCues.clear();
        this.pendingFormations = [];
        this.enabled = true;
        this.maxActive = 16;
        this.isLull = false;
        this.lullEndTime = 0;
        this.lastTrackTime = 0;
    }

    onEvent(eventID, eventData) {
        if (!this.enabled || this.timeline.currentTrackKey !== 'SYNTH') return;
        
        // We only handle events defined in ENCOUNTER_SCORE (or those matching our cues)
        const cue = ENCOUNTER_SCORE.find(c => c.id === eventID);
        if (cue) {
            this.executeCue(cue);
        }
    }

    onSeek(newTime) {
        if (this.timeline.currentTrackKey !== 'SYNTH') {
            this.clearAll();
            return;
        }

        console.log(`[ENCOUNTER] Seek to ${newTime}s. Reconstructing state...`);
        
        // 1. Reset state
        this.activeCues.clear();
        this.pendingFormations = [];
        this.isLull = false;
        this.lullEndTime = 0;
        
        // 2. Clear current robots
        this.clearAll();

        // 3. Find all cues that should have fired before this time to set current limits/lulls
        const pastCues = ENCOUNTER_SCORE.filter(c => c.time <= newTime);
        pastCues.forEach(cue => {
            this.activeCues.add(cue.id);
            
            if (cue.maxActive) {
                this.maxActive = cue.maxActive;
            }

            if (cue.type === 'PRESSURE') {
                // maxActive handled above
            } else if (cue.type === 'LULL') {
                const elapsed = newTime - cue.time;
                if (elapsed < cue.duration) {
                    this.isLull = true;
                    this.lullEndTime = cue.time + cue.duration;
                }
            } else if (cue.type === 'CLEAR_FOR_BOSS') {
                this.enabled = false;
            }
        });

        // 4. Create a "representative fixture" if we seek into a swarm
        // Find the most recent SPAWN cue within the last 5 seconds
        const recentSpawn = [...pastCues].reverse().find(c => c.type === 'SPAWN' && (newTime - c.time) <= 5);
        if (recentSpawn && this.enabled) {
            console.log(`[ENCOUNTER] Seeker spawned representative fixture for cue ${recentSpawn.id}`);
            this.executeCue(recentSpawn, true); // Immediate spawn
        }
    }

    isDebug() {
        if (typeof window === 'undefined') return false;
        return window.location.search.includes('debug=1');
    }

    executeCue(cue, immediate = false) {
        if (this.activeCues.has(cue.id) && !immediate) return;
        this.activeCues.add(cue.id);

        if (this.isDebug()) console.log(`[ENCOUNTER] ${this.timeline.audioDirector.getCurrentTime().toFixed(2)}s executing cue: ${cue.id} (${cue.type})`);

        switch (cue.type) {
            case 'SPAWN':
                this.handleSpawnCue(cue, immediate);
                break;
            case 'PRESSURE':
                this.maxActive = cue.maxActive || this.maxActive;
                break;
            case 'RETREAT':
                this.handleRetreatCue(cue);
                break;
            case 'LULL':
                this.isLull = true;
                this.lullEndTime = cue.time + cue.duration;
                break;
            case 'CLEAR_FOR_BOSS':
                this.handleClearForBoss();
                break;
        }
    }

    handleSpawnCue(cue, immediate) {
        if (this.isLull && this.timeline.audioDirector.getCurrentTime() < this.lullEndTime) {
            return;
        }

        const countRequested = Object.values(cue.counts).reduce((a, b) => a + b, 0);
        const currentCount = this.getActiveCount();
        const limit = cue.maxActive || this.maxActive;
        
        let countToSpawn = countRequested;
        if (currentCount + countToSpawn > limit) {
            countToSpawn = Math.max(0, limit - currentCount);
            if (this.isDebug()) {
                console.log(`[ENCOUNTER] Cue ${cue.id} capped: requested=${countRequested} actual=${countToSpawn} (cap=${limit})`);
            }
        }

        if (countToSpawn <= 0) return;

        // Calculate actual robot mix for the capped count
        const spawnList = this.calculateSpawnMix(cue.counts, countToSpawn);
        
        if (immediate) {
            this.spawnFormation(cue.formation, spawnList, cue.spawnRegion, cue.seed);
        } else {
            // Staggered arrival over 1-2 seconds for dramatic effect and performance
            this.pendingFormations.push({
                formation: cue.formation,
                list: spawnList,
                region: cue.spawnRegion,
                seed: cue.seed,
                timer: 0,
                interval: 0.1, // 100ms between robots
                index: 0
            });
        }
    }

    calculateSpawnMix(counts, targetTotal) {
        const totalRequested = Object.values(counts).reduce((a, b) => a + b, 0);
        const list = [];
        
        for (const [type, count] of Object.entries(counts)) {
            const ratio = count / totalRequested;
            const targetCount = Math.round(ratio * targetTotal);
            for (let i = 0; i < targetCount; i++) {
                list.push(type);
            }
        }
        
        // Adjust if rounding error
        while (list.length > targetTotal) list.pop();
        while (list.length < targetTotal) {
            list.push(Object.keys(counts)[0]);
        }
        
        return list;
    }

    handleRetreatCue(cue) {
        const fraction = cue.retreatFraction || 1.0;
        const robots = this.getEligibleRobots();
        
        // Priority selection
        if (cue.priority === 'OLDEST') {
            robots.sort((a, b) => a.creationTime - b.creationTime);
        } else {
            // Default: Deterministic shuffle based on seed or cue ID
            this.deterministicShuffle(robots, cue.id + this.sessionID);
        }

        const countToRetreat = Math.floor(robots.length * fraction);
        const selected = robots.slice(0, countToRetreat);
        
        if (this.isDebug()) {
            console.log(`[ENCOUNTER] RETREAT selected=${selected.length} active=${robots.length}`);
        }

        selected.forEach(r => r.retreat());
    }

    handleClearForBoss() {
        this.enabled = false;
        this.pendingFormations = [];
        
        const robots = this.getEligibleRobots();
        if (this.isDebug()) {
            console.log(`[ENCOUNTER] CLEAR_FOR_BOSS active=${robots.length}`);
        }
        
        robots.forEach(r => r.retreat());
    }

    update(time, delta) {
        if (!this.enabled || this.timeline.currentTrackKey !== 'SYNTH') return;
        
        // 1. Process pending formations (staggered spawning)
        for (let i = this.pendingFormations.length - 1; i >= 0; i--) {
            const f = this.pendingFormations[i];
            f.timer += delta;
            
            if (f.timer >= f.interval) {
                f.timer = 0;
                const type = f.list[f.index];
                const pos = this.calculateSpawnPosition(f.formation, f.index, f.list.length, f.region, f.seed);
                
                this.scene.spawnRobotAt(pos.x, pos.y, type);
                
                f.index++;
                if (f.index >= f.list.length) {
                    this.pendingFormations.splice(i, 1);
                }
            }
        }

        // 2. Catch-up burst logic
        if (this.catchUpEnabled && !this.isLull) {
            this.processCatchUpBursts(delta);
        }
    }

    processCatchUpBursts(delta) {
        const robots = this.getEligibleRobots();
        const camY = this.scene.cameras.main.scrollY;
        
        robots.forEach(r => {
            // If robot is near the bottom trailing edge (top of screen when descending)
            if (r.y < camY + 100 && r.y > camY - 200) {
                // Occasional burst if not already bursting or cooling down
                r.maybeTriggerCatchUp(this.catchUpMultiplier);
            }
        });
    }

    spawnFormation(formation, robotList, region, seed) {
        robotList.forEach((type, index) => {
            const pos = this.calculateSpawnPosition(formation, index, robotList.length, region, seed);
            this.scene.spawnRobotAt(pos.x, pos.y, type);
        });
    }

    calculateSpawnPosition(formation, index, total, region, seed) {
        const cam = this.scene.cameras.main;
        const viewY = cam.scrollY;
        
        // Deterministic offset based on seed/index
        const rand = this.getSeededRandom(seed, index);
        
        let x = 320;
        let y = viewY - 100;

        switch (region) {
            case 'TOP_RANDOM':
                x = 50 + rand * 540;
                y = viewY - 50 - (rand * 150);
                break;
            case 'TOP_FAN':
                x = 100 + (index / (total - 1 || 1)) * 440;
                y = viewY - 100;
                break;
            case 'TOP_ARC':
                const angle = Math.PI + (index / (total - 1 || 1)) * Math.PI;
                x = 320 + Math.cos(angle) * 300;
                y = viewY - 100 + Math.sin(angle) * 100;
                break;
            case 'SIDES':
                const isLeft = index % 2 === 0;
                x = isLeft ? -50 : 690;
                y = viewY + 200 + (index * 50);
                break;
            case 'MIXED':
                if (index % 3 === 0) { // Top
                    x = 100 + rand * 440;
                    y = viewY - 100;
                } else { // Sides
                    x = (index % 2 === 0) ? -50 : 690;
                    y = viewY + 300 + (rand * 400);
                }
                break;
        }

        // Use GameScene's safety check
        return this.scene.findSafeSpawnPosition(x, y);
    }

    getActiveCount() {
        return this.scene.robotGroup.getLength();
    }

    getEligibleRobots() {
        return this.scene.robotGroup.getChildren().filter(r => r.active && !r.isDestroyed && r.aiState !== 'RETREATING');
    }

    clearAll() {
        this.scene.robotGroup.getChildren().forEach(r => {
            r.setActive(false).setVisible(false);
            if (r.body) r.body.enable = false;
            if (r.laserGraphic) r.laserGraphic.clear();
        });
    }

    deterministicShuffle(array, seed) {
        let m = array.length, t, i;
        while (m) {
            i = Math.floor(this.getSeededRandom(seed, m--) * m);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    getSeededRandom(seed, index) {
        // Simple LCG
        const s = (typeof seed === 'string') ? this.hashString(seed) : (seed || 12345);
        const x = Math.sin(s + index) * 10000;
        return x - Math.floor(x);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }
}
