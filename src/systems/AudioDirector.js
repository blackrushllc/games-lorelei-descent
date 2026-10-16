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
