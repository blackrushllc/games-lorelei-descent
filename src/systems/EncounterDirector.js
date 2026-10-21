import { ENCOUNTER_SCORE, AMBIENT_POLICY } from '../config/encounterScore.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';
import { ASSISTANCE_CONFIG } from '../config/assistanceConfig.js';

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
        
        // Ambient Resistance State
        this.nextAmbientTime = 0;
        this.ambientSeed = 42;
        
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

        // PART A: Validate encounter score for duplicate IDs
        this.validateEncounterScore();

        // Check if we are already in a track (e.g. initialization after track start)
        if (this.timeline.currentTrackKey) {
            this.onTrackStart(this.timeline.currentTrackKey);
        }
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
        this.cancelAllPending();
    }

    onTrackStart(trackKey) {
        if (!this.scene || !this.scene.scene || !this.scene.scene.isActive()) return;

        if (trackKey === 'SYNTH') {
            this.reset();
        } else {
            // Stop spawning for CATHEDRAL and STUDIO tracks
            this.enabled = false;
            this.cancelAllPending();
            this.clearAll();
        }
    }

    reset() {
        this.activeCues.clear();
        this.cancelAllPending();
        this.enabled = true;
        this.maxActive = 16;
        this.isLull = false;
        this.lullEndTime = 0;
        this.lastTrackTime = 0;
        this.nextAmbientTime = AMBIENT_POLICY.startTime;
        this.ambientSeed = 42 + (this.sessionID * 100);
    }

    cancelNovaFormations() {
        // Cancel robots still queued in the currently deploying formation
        this.pendingFormations = [];
    }

    suspendAmbientSpawning(duration) {
        // Suspend ambient reinforcement for a configurable short period (musical time)
        const currentTime = this.timeline.currentTime;
        this.nextAmbientTime = Math.max(this.nextAmbientTime, currentTime + duration);
    }

    onEvent(eventID, eventData) {
        if (!this.scene || !this.scene.scene || !this.scene.scene.isActive()) return;
        if (this.timeline.currentTrackKey !== 'SYNTH') return;
        
        // We only handle events defined in ENCOUNTER_SCORE (or those matching our cues)
        const cue = ENCOUNTER_SCORE.find(c => c.id === eventID);
        if (cue) {
            this.executeCue(cue);
        }
    }

    validateEncounterScore() {
        const ids = new Set();
        const duplicates = [];

        ENCOUNTER_SCORE.forEach(cue => {
            if (!cue.id) {
                console.warn(`[ENCOUNTER] Cue at time ${cue.time} is missing an ID!`);
                cue.id = `AUTO_ID_${Math.floor(cue.time * 100)}`;
            }

            if (ids.has(cue.id)) {
                const originalID = cue.id;
                let newID = originalID;
                let counter = 1;
                while (ids.has(newID)) {
                    newID = `${originalID}_DUP${counter++}`;
                }
                console.warn(`[ENCOUNTER] Duplicate ID found: "${originalID}". Renaming to "${newID}".`);
                cue.id = newID;
                duplicates.push({ original: originalID, renamed: newID });
            }
            ids.add(cue.id);

            // Validate HEART_DROP fields
            if (cue.type === 'HEART_DROP') {
                if (typeof cue.ifHeartsBelow !== 'number') {
                    console.error(`[ENCOUNTER] HEART_DROP cue "${cue.id}" missing ifHeartsBelow numeric condition!`);
                }
            }
        });

        return duplicates;
    }

    onSeek(newTime) {
        if (!this.scene || !this.scene.scene || !this.scene.scene.isActive()) return;

        if (this.timeline.currentTrackKey !== 'SYNTH') {
            this.clearAll();
            this.cancelAllPending();
            return;
        }

        console.log(`[ENCOUNTER] Seek to ${newTime}s. Reconstructing state...`);
        
        // 1. Reset state
        this.activeCues.clear();
        this.cancelAllPending();
        this.isLull = false;
        this.lullEndTime = 0;
        this.enabled = true;
        
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

        // 4. Ambient state reconstruction
        this.nextAmbientTime = AMBIENT_POLICY.startTime;
        while (this.nextAmbientTime < newTime - 5) {
            const interval = this.getSeededAmbientInterval(this.nextAmbientTime);
            this.nextAmbientTime += interval;
        }

        // 5. Create a "representative fixture" if we seek into a swarm
        // Intensity-aware reconstruction: Find the most recent SPAWN cue in this musical section
        const recentSpawn = [...pastCues].reverse().find(c => c.type === 'SPAWN' && (newTime - c.time) <= 20);
        if (recentSpawn && this.enabled && !this.isLull) {
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
                this.cancelAllPending(); // Lulls clear pending arrivals
                break;
            case 'CLEAR_FOR_BOSS':
                this.handleClearForBoss();
                break;
            case 'HEART_DROP':
                this.handleHeartDrop(cue);
                break;
        }
    }

    handleHeartDrop(cue) {
        const player = this.scene.player;
        if (!player) return;

        if (player.hearts < cue.ifHeartsBelow) {
            if (this.isDebug()) console.log(`[ENCOUNTER] HEART_DROP triggered for ${cue.id} (hearts=${player.hearts} < ${cue.ifHeartsBelow})`);
            
            // Spawn heart below viewport
            const view = this.scene.cameras.main.worldView;
            let x = view.x + 100 + this.getSeededRandom(cue.id, 0) * (view.width - 200);
            
            // Clamp to world bounds
            x = Phaser.Math.Clamp(x, 50, 1230);
            
            const y = view.bottom + 150;
            
            this.scene.spawnHeartAt(x, y);
        } else {
            if (this.isDebug()) console.log(`[ENCOUNTER] HEART_DROP skipped for ${cue.id} (hearts=${player.hearts} >= ${cue.ifHeartsBelow})`);
        }
    }

    handleSpawnCue(cue, immediate) {
        if (this.isLull && this.timeline.audioDirector.getCurrentTime() < this.lullEndTime) {
            return;
        }

        const countRequested = Object.values(cue.counts).reduce((a, b) => a + b, 0);
        
        // PART A: Adaptive Assistance
        let multiplier = 1.0;
        const currentTime = this.timeline.audioDirector.getCurrentTime();
        const missionState = this.scene.game.missionState;
        
        if (missionState && ASSISTANCE_CONFIG.affectsScripted && currentTime < ASSISTANCE_CONFIG.appliesBeforeSynthTime) {
            const level = missionState.assistanceLevel || 0;
            multiplier = ASSISTANCE_CONFIG.spawnMultipliers[Math.min(level, ASSISTANCE_CONFIG.spawnMultipliers.length - 1)];
        }

        let countToSpawn = Math.round(countRequested * multiplier);
        
        // Respect minimum formation count and preserve small encounters
        if (countRequested >= ASSISTANCE_CONFIG.minimumFormationCount) {
            countToSpawn = Math.max(ASSISTANCE_CONFIG.minimumFormationCount, countToSpawn);
        } else if (countRequested > 0) {
            countToSpawn = Math.max(1, countToSpawn);
        }

        const currentCount = this.getActiveCount();
        const limit = cue.maxActive || this.maxActive;
        
        if (currentCount + countToSpawn > limit) {
            countToSpawn = Math.max(0, limit - currentCount);
            if (this.isDebug()) {
                console.log(`[ENCOUNTER] Cue ${cue.id} capped: requested=${countRequested} scaled=${Math.round(countRequested * multiplier)} actual=${countToSpawn} (cap=${limit})`);
            }
        }

        if (countToSpawn <= 0) return;

        // Calculate actual robot mix for the capped count
        const spawnList = this.calculateSpawnMix(cue.counts, countToSpawn);
        
        if (immediate) {
            this.spawnFormation(cue.formation, spawnList, cue.spawnRegion, cue.seed, cue.id);
        } else {
            // Staggered arrival over 1-2 seconds
            this.pendingFormations.push({
                id: cue.id,
                formation: cue.formation,
                list: spawnList,
                region: cue.spawnRegion,
                seed: cue.seed,
                timer: 0,
                interval: 100, 
                index: 0,
                expiresAt: this.timeline.audioDirector.getCurrentTime() + 10 // Expire after 10s if delayed
            });
        }
    }

    calculateSpawnMix(counts, targetTotal) {
        const totalRequested = Object.values(counts).reduce((a, b) => a + b, 0);
        const list = [];
        
        const sortedTypes = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        
        for (const [type, count] of sortedTypes) {
            const ratio = count / totalRequested;
            const targetCount = Math.floor(ratio * targetTotal); // Use floor to avoid over-spawning
            for (let i = 0; i < targetCount; i++) {
                list.push(type);
            }
        }
        
        // Fill remaining with primary type
        while (list.length < targetTotal) {
            list.push(sortedTypes[0][0]);
        }
        
        // Trim if over
        while (list.length > targetTotal) list.pop();
        
        return list;
    }

    handleRetreatCue(cue) {
        const fraction = cue.retreatFraction || 1.0;
        const robots = this.getEligibleRobots();
        
        // Priority selection
        if (cue.priority === 'OLDEST') {
            robots.sort((a, b) => a.creationTime - b.creationTime);
        } else {
            // Default: Deterministic shuffle
            this.deterministicShuffle(robots, cue.id + this.sessionID);
        }

        const countToRetreat = Math.floor(robots.length * fraction);
        const selected = robots.slice(0, countToRetreat);
        
        if (this.isDebug()) {
            console.log(`[ENCOUNTER] RETREAT selected=${selected.length} active=${robots.length}`);
        }

        selected.forEach(r => r.retreat());
        this.cancelAllPending(); // Retreat usually means a lull follows or pressure reduction
    }

    handleClearForBoss() {
        this.enabled = false;
        this.cancelAllPending();
        
        const robots = this.getEligibleRobots();
        if (this.isDebug()) {
            console.log(`[ENCOUNTER] CLEAR_FOR_BOSS active=${robots.length}`);
        }
        
        robots.forEach(r => r.retreat());
    }

    cancelAllPending() {
        this.pendingFormations = [];
    }

    update(time, delta) {
        if (this.timeline.currentTrackKey !== 'SYNTH') return;
        
        const currentTime = this.timeline.audioDirector.getCurrentTime();

        // 1. Process pending formations (staggered spawning)
        for (let i = this.pendingFormations.length - 1; i >= 0; i--) {
            const f = this.pendingFormations[i];
            
            // Expiration check
            if (currentTime > f.expiresAt) {
                if (this.isDebug()) console.log(`[ENCOUNTER] Expired pending formation ${f.id}`);
                this.pendingFormations.splice(i, 1);
                continue;
            }

            f.timer += delta;
            
            if (f.timer >= f.interval) {
                f.timer = 0;
                const type = f.list[f.index];
                const pos = this.calculateSpawnPosition(f.formation, f.index, f.list.length, f.region, f.seed);
                
                if (pos) {
                    this.scene.spawnRobotAt(pos.x, pos.y, type, f.id);
                }
                
                f.index++;
                if (f.index >= f.list.length) {
                    this.pendingFormations.splice(i, 1);
                }
            }
        }

        // 2. Ambient Resistance
        this.updateAmbientResistance(currentTime, delta);

        // 3. Catch-up burst logic
        if (this.catchUpEnabled && !this.isLull) {
            this.processCatchUpBursts(delta);
        }

        this.lastTrackTime = currentTime;
    }

    updateAmbientResistance(currentTime, delta) {
        if (!this.enabled || this.isLull || currentTime < AMBIENT_POLICY.startTime) return;
        
        // Suppress during heavy formations or retreats (if we have many pending)
        if (this.pendingFormations.length > 0) return;

        if (currentTime >= this.nextAmbientTime) {
            let targetCount = AMBIENT_POLICY.targetCount;
            
            // PART A: Adaptive Assistance
            const missionState = this.scene.game.missionState;
            if (missionState && ASSISTANCE_CONFIG.affectsAmbient && currentTime < ASSISTANCE_CONFIG.appliesBeforeSynthTime) {
                const level = missionState.assistanceLevel || 0;
                const multiplier = ASSISTANCE_CONFIG.spawnMultipliers[Math.min(level, ASSISTANCE_CONFIG.spawnMultipliers.length - 1)];
                targetCount = Math.max(1, Math.round(targetCount * multiplier));
            }

            const currentActive = this.getActiveCount();
            if (currentActive < targetCount) {
                this.spawnAmbientRobot(currentTime);
            }
            
            // Schedule next ambient spawn regardless of success (deterministic interval)
            const interval = this.getSeededAmbientInterval(currentTime);
            this.nextAmbientTime = currentTime + interval;
        }
    }

    getSeededAmbientInterval(time) {
        const rand = this.getSeededRandom(this.ambientSeed, Math.floor(time));
        const [min, max] = AMBIENT_POLICY.spawnIntervalRange;
        return min + rand * (max - min);
    }

    spawnAmbientRobot(time) {
        const rand = this.getSeededRandom(this.ambientSeed, Math.floor(time * 10));
        
        let type = 'PURSUER';
        if (time > AMBIENT_POLICY.armoredStartTime && rand > 0.8) {
            type = 'ARMORED_PURSUER';
        } else if (rand > 0.5) {
            type = 'SENTINEL';
        }

        const region = AMBIENT_POLICY.regions[Math.floor(rand * AMBIENT_POLICY.regions.length)];
        const pos = this.calculateSpawnPosition('RANDOM', 0, 1, region, time);
        
        if (pos) {
            if (this.isDebug()) console.log(`[AMBIENT] Spawned ${type} at ${time.toFixed(2)}s`);
            this.scene.spawnRobotAt(pos.x, pos.y, type, null);
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

    spawnFormation(formation, robotList, region, seed, cueID = null) {
        robotList.forEach((type, index) => {
            const pos = this.calculateSpawnPosition(formation, index, robotList.length, region, seed);
            if (pos) {
                this.scene.spawnRobotAt(pos.x, pos.y, type, cueID);
            }
        });
    }

    calculateSpawnPosition(formation, index, total, region, seed) {
        const cam = this.scene.cameras.main;
        const view = cam.worldView;
        const descentSpeed = 75; // px/s
        
        // Deterministic offset
        const rand = this.getSeededRandom(seed, index);
        
        let x = view.centerX;
        let y = view.bottom + 100;

        // Account for camera movement during staggered spawning
        // If we are spawning the 10th robot at 100ms intervals, it will appear 1s later.
        // We should adjust its spawn Y so it feels like it was in place.
        const staggerOffset = (index * 0.1) * descentSpeed;

        switch (region) {
            case 'BOTTOM_APPROACH':
                x = view.x + 50 + rand * (view.width - 100);
                y = view.bottom + 50 + staggerOffset;
                break;
            case 'BOTTOM_FAN':
                x = view.x + 100 + (index / (total - 1 || 1)) * (view.width - 200);
                y = view.bottom + 80 + staggerOffset;
                break;
            case 'BOTTOM_ARC':
                const arcAngle = (index / (total - 1 || 1)) * Math.PI;
                x = view.centerX + Math.cos(arcAngle) * (view.width * 0.4);
                y = view.bottom + 100 + Math.sin(arcAngle) * 150 + staggerOffset;
                break;
            case 'BOTTOM_PINCER':
                const isLeftPincer = index < total / 2;
                x = isLeftPincer ? view.x + 50 : view.right - 50;
                y = view.bottom + 60 + (index % Math.ceil(total/2)) * 40 + staggerOffset;
                break;
            case 'TOP_RANDOM': // Deprecated but preserved for manual debug
                x = view.x + 50 + rand * (view.width - 100);
                y = view.y + 50 + (rand * 400);
                break;
            case 'SIDES':
                x = (index % 2 === 0) ? view.x - 50 : view.right + 50;
                y = view.y + 200 + (index * 50);
                break;
            case 'BOTTOM': // Legacy
                x = view.x + 50 + rand * (view.width - 100);
                y = view.bottom + 100 + staggerOffset;
                break;
            default:
                x = view.centerX;
                y = view.bottom + 100;
        }

        // Use GameScene's safety check with a permitted region just below viewport
        const margin = 200;
        const permitted = new Phaser.Geom.Rectangle(view.x - 100, view.bottom, view.width + 200, margin + 500);
        
        // For debugging manual spawns (TOP_RANDOM / SIDES), we allow spawning inside viewport
        const allowVisible = region.startsWith('TOP') || region === 'SIDES';
        
        return this.scene.findSafeSpawnPosition(x, y, allowVisible ? null : permitted);
    }

    getActiveCount() {
        return this.scene.robotGroup.countActive(true);
    }

    getEligibleRobots() {
        return this.scene.robotGroup.getChildren().filter(r => r.active && !r.isDestroyed && r.aiState !== 'RETREATING');
    }

    clearAll() {
        if (!this.scene || !this.scene.robotGroup || !this.scene.robotGroup.scene) return;
        
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
