import Phaser from 'phaser';

/**
 * Manages audio playback and provides current playback position.
 */
export default class AudioDirector {
    /**
     * @param {Phaser.Game} game 
     */
    constructor(game) {
        this.game = game;
        /** @type {Phaser.Sound.BaseSound} */
        this.currentSound = null;
        this.currentTrackId = null;
        this.onCompleteCallback = null;

        // Procedural Audio Context
        this.ctx = this.game.sound.context;
    }

    /**
     * Plays a procedural survival sound effect.
     * @param {string} type - 'heartLoss' or 'lowLife'
     */
    playSurvivalSound(type) {
        if (!this.ctx) return;

        if (type === 'heartLoss') {
            this.playHeartLossSound();
        } else if (type === 'lowLife') {
            this.playLowLifeWarning();
        } else if (type === 'heartGain') {
            this.playHeartGainSound();
        }
    }

    playHeartGainSound() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Ascending chime: 400Hz to 800Hz
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playHeartLossSound() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        // Descending tone: 400Hz to 100Hz
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playLowLifeWarning() {
        const now = this.ctx.currentTime;
        
        // Two-note electronic warning
        const playNote = (freq, startTime, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Two notes: E5 and C5 approx
        playNote(659.25, now, 0.1);
        playNote(523.25, now + 0.15, 0.1);
    }

    /**
     * Plays a track by its asset key.
     * @param {string} trackId Unique identifier for the track
     * @param {string} assetKey Phaser asset key
     * @param {Function} onComplete Callback when track ends
     */
    play(trackId, assetKey, onComplete = null) {
        this.stop();

        this.currentTrackId = trackId;
        this.onCompleteCallback = onComplete;
        
        this.currentSound = this.game.sound.add(assetKey);
        
        if (onComplete) {
            this.currentSound.once('complete', () => {
                onComplete(trackId);
            });
        }

        this.currentSound.play();
        console.log(`AudioDirector: Playing track ${trackId} (${assetKey})`);
    }

    /**
     * Pauses current playback.
     */
    pause() {
        if (this.currentSound && this.currentSound.isPlaying) {
            this.currentSound.pause();
        }
    }

    /**
     * Resumes current playback.
     */
    resume() {
        if (this.currentSound && this.currentSound.isPaused) {
            this.currentSound.resume();
        }
    }

    /**
     * Stops current playback.
     */
    stop() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.destroy();
            this.currentSound = null;
        }
        this.currentTrackId = null;
        this.onCompleteCallback = null;
    }

    /**
     * Seeks to a specific position in seconds.
     * @param {number} seconds 
     */
    seek(seconds) {
        if (this.currentSound) {
            // Phaser 3.88.2 seek is in seconds
            this.currentSound.setSeek(seconds);
        }
    }

    /**
     * Returns current playback position in seconds.
     * @returns {number}
     */
    getCurrentTime() {
        if (!this.currentSound) return 0;
        
        // In Phaser 3, seek property reflects the current playback position in seconds
        // However, it might not be updated every frame depending on the backend.
        // For Web Audio, it's generally reliable.
        return this.currentSound.seek;
    }

    /**
     * Returns current track duration in seconds.
     * @returns {number}
     */
    getDuration() {
        if (!this.currentSound) return 0;
        return this.currentSound.duration;
    }

    /**
     * Returns whether audio is currently playing.
     * @returns {boolean}
     */
    isPlaying() {
        return this.currentSound ? this.currentSound.isPlaying : false;
    }

    /**
     * Returns whether audio is currently paused.
     * @returns {boolean}
     */
    isPaused() {
        return this.currentSound ? this.currentSound.isPaused : false;
    }
}
