import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';

/**
 * Controls the automatic music-synchronized descent.
 * Calculates the target camera depth based on the musical timeline.
 */
export default class DescentController {
    /**
     * @param {TimelineDirector} timelineDirector 
     */
    constructor(timelineDirector) {
        this.timeline = timelineDirector;
        this.config = GAMEPLAY_CONFIG.descent;
        this.descentRate = this.config.rate;
    }

    /**
     * Returns the target camera scrollY for the current musical position.
     * @returns {number}
     */
    getTargetScrollY() {
        const state = this.timeline.getState();
        const track = state.track;

        // 1. Determine Camera Mode
        const mode = this.getCameraMode(track, state.time);

        // 2. Calculate Position based on Mode
        if (mode === this.config.cameraModes.ARENA) {
            return this.getArenaPosition();
        }

        if (track === 'STUDIO') {
            // Ending track: Lock to arena position
            return this.getArenaPosition();
        }

        if (track === 'SYNTH') {
            return this.calculateDescentPosition(state.time);
        }

        // If no track is playing (e.g. TitleScene), depth is 0
        return 0;
    }

    /**
     * Determines whether the camera is in DESCENT or ARENA mode.
     */
    getCameraMode(track, trackTime) {
        if (track === 'SYNTH') {
            if (trackTime >= this.config.arenaEntryTime) {
                return this.config.cameraModes.ARENA;
            }
            return this.config.cameraModes.DESCENT;
        }
        
        if (track === 'CATHEDRAL') {
            return this.config.cameraModes.ARENA;
        }

        return this.config.cameraModes.DESCENT;
    }

    /**
     * Calculates position during the Synth descent, including deceleration.
     */
    calculateDescentPosition(time) {
        const tStart = this.config.arenaEntryTime - this.config.decelerationDuration;
        
        if (time <= tStart) {
            // Constant velocity
            return time * this.descentRate;
        }

        // Deceleration interval
        const dt = time - tStart;
        const v0 = this.descentRate;
        const D = this.config.decelerationDuration;
        const a = v0 / D;

        // p(t) = p(tStart) + v0*dt - 0.5*a*dt^2
        return (tStart * v0) + (v0 * dt) - (0.5 * a * dt * dt);
    }

    /**
     * Returns the final fixed arena position.
     */
    getArenaPosition() {
        // Derived from calculateDescentPosition at exactly arenaEntryTime
        const v0 = this.descentRate;
        const tStart = this.config.arenaEntryTime - this.config.decelerationDuration;
        const D = this.config.decelerationDuration;
        
        return (tStart * v0) + (0.5 * v0 * D);
    }
}
