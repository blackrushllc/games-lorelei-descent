import { TIMELINE_CONFIG } from '../config/timeline.js';
import EventEmitter from 'eventemitter3';

/**
 * Orchestrates the music-driven game timeline.
 * Dispatches one-shot events and tracks current phase.
 */
export default class TimelineDirector extends EventEmitter {
    /**
     * @param {AudioDirector} audioDirector 
     */
    constructor(audioDirector) {
        super();
        this.audioDirector = audioDirector;
        
        this.currentTrackKey = null; // Key in TIMELINE_CONFIG.tracks (e.g., 'SYNTH')
        this.currentPhase = null;
        this.passedEvents = new Set();
        this.lastTime = 0;
        this.isExplicitSeeking = false;
        
        // Global time tracking
        this.globalTime = 0;
        this.trackStartGlobalTimes = {}; // Stores global start time for each track
        this.calculateGlobalTrackStarts();
    }

    /**
     * Calculates the cumulative start time for each track in the sequence.
     * Note: This uses durations from config as a fallback, but will be 
     * updated with actual audio durations when tracks load.
     */
    calculateGlobalTrackStarts() {
        let total = 0;
        TIMELINE_CONFIG.sequence.forEach(key => {
            this.trackStartGlobalTimes[key] = total;
            total += this.getEstimatedDuration(key);
        });
    }

    /**
     * Starts the timeline for a specific track.
     * @param {string} trackKey 
     */
    startTrack(trackKey) {
        const track = TIMELINE_CONFIG.tracks[trackKey];
        if (!track) return;

        this.currentTrackKey = trackKey;
        this.passedEvents.clear();
        this.lastTime = 0;
        
        this.audioDirector.play(
            track.id, 
            track.id, // assetKey should match track.id in BootScene
            () => this.onTrackComplete(trackKey)
        );
        
        this.update();
        this.emit('trackStart', trackKey);
    }

    /**
     * Handles track completion and automatic transition.
     */
    onTrackComplete(trackKey) {
        const index = TIMELINE_CONFIG.sequence.indexOf(trackKey);
        if (index !== -1 && index < TIMELINE_CONFIG.sequence.length - 1) {
            const nextTrackKey = TIMELINE_CONFIG.sequence[index + 1];
            this.startTrack(nextTrackKey);
        } else {
            this.emit('timelineComplete');
        }
    }

    /**
     * Main update loop. Must be called every frame.
     */
    update() {
        if (!this.audioDirector.isPlaying() && !this.audioDirector.isPaused()) return;
        
        const currentTime = this.audioDirector.getCurrentTime();
        
        // Handle seeking or time jumps
        if (this.isExplicitSeeking || Math.abs(currentTime - this.lastTime) > 1.0) {
            // If it's not an explicit seek, it might be a huge frame drop.
            // Requirement 7: "A delayed rendering frame must not cause scheduled events to be silently skipped."
            // Requirement 8: "Seeking forward does not fire skipped events."
            
            if (this.isExplicitSeeking) {
                this.handleSeek(currentTime);
                this.isExplicitSeeking = false;
            } else {
                // Large delta but not explicit seek -> Process as delayed frame (fire events)
                this.processTimeline(this.lastTime, currentTime);
            }
        } else {
            this.processTimeline(this.lastTime, currentTime);
        }
        
        this.lastTime = currentTime;
        this.updateGlobalTime();
    }

    /**
     * Processes events and phase changes between two points in time.
     */
    processTimeline(startTime, endTime) {
        const track = TIMELINE_CONFIG.tracks[this.currentTrackKey];
        if (!track) return;

        // 1. Dispatch Events
        // Sort events to ensure chronological order even if multiple fire in one frame
        const pendingEvents = track.events
            .filter(e => !this.passedEvents.has(e.id))
            .filter(e => e.time >= startTime && e.time <= endTime)
            .sort((a, b) => a.time - b.time);

        pendingEvents.forEach(event => {
            this.passedEvents.add(event.id);
            this.emit('event', event.id, event);
            console.log(`Timeline: Event ${event.id} fired at ${event.time}s`);
        });

        // 2. Update Phase
        const newPhase = this.findPhaseAtTime(track, endTime);
        if (newPhase && (!this.currentPhase || newPhase.id !== this.currentPhase.id)) {
            const oldPhase = this.currentPhase;
            this.currentPhase = newPhase;
            this.emit('phaseChange', newPhase, oldPhase);
            console.log(`Timeline: Phase changed to ${newPhase.id}`);
        }
    }

    /**
     * Reconstructs state after a seek.
     */
    handleSeek(newTime) {
        const track = TIMELINE_CONFIG.tracks[this.currentTrackKey];
        if (!track) return;

        console.log(`Timeline: Seeking to ${newTime}s`);

        // Update passed events: all events before newTime are marked as passed
        this.passedEvents.clear();
        track.events.forEach(e => {
            if (e.time < newTime) {
                this.passedEvents.add(e.id);
            }
        });

        // Update phase
        const newPhase = this.findPhaseAtTime(track, newTime);
        if (newPhase) {
            this.currentPhase = newPhase;
            this.emit('phaseChange', newPhase);
        }
        
        this.emit('seek', newTime);
    }

    findPhaseAtTime(track, time) {
        // Phases are defined by start and end. end: null means until track end.
        return track.phases.find(p => {
            const start = p.start;
            const end = p.end === null ? Infinity : p.end;
            return time >= start && time < end;
        });
    }

    updateGlobalTime() {
        // Simple global time: Sum of previous track durations + current track time.
        // For now using rough estimates, but ideally would use actual durations.
        let elapsed = 0;
        const index = TIMELINE_CONFIG.sequence.indexOf(this.currentTrackKey);
        for (let i = 0; i < index; i++) {
            const prevKey = TIMELINE_CONFIG.sequence[i];
            // In a full implementation, we'd get the actual duration from AudioDirector
            // after the track has loaded.
            elapsed += this.getEstimatedDuration(prevKey);
        }
        this.globalTime = elapsed + this.audioDirector.getCurrentTime();
    }

    getEstimatedDuration(trackKey) {
        if (trackKey === 'SYNTH') return 362;
        if (trackKey === 'CATHEDRAL') return 241;
        if (trackKey === 'STUDIO') return 187;
        return 0;
    }

    // Public API for developer controls
    seek(seconds) {
        this.isExplicitSeeking = true;
        this.audioDirector.seek(seconds);
        // update() will catch the jump in the next frame
    }

    pause() {
        this.audioDirector.pause();
    }

    resume() {
        this.audioDirector.resume();
    }

    stop() {
        this.audioDirector.stop();
        this.currentTrackKey = null;
        this.currentPhase = null;
        this.passedEvents.clear();
        this.lastTime = 0;
        this.globalTime = 0;
        this.isExplicitSeeking = false;
    }

    getState() {
        return {
            track: this.currentTrackKey,
            phase: this.currentPhase ? this.currentPhase.label : 'NONE',
            time: this.audioDirector.getCurrentTime(),
            duration: this.audioDirector.getDuration(),
            globalTime: this.globalTime,
            isPlaying: this.audioDirector.isPlaying(),
            isPaused: this.audioDirector.isPaused()
        };
    }
}
