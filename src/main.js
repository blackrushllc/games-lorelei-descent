import Phaser from 'phaser';
import { GAME_CONFIG } from './config/gameConfig.js';
import AudioDirector from './systems/AudioDirector.js';
import TimelineDirector from './systems/TimelineDirector.js';
import TimelineDebugPanel from './ui/TimelineDebugPanel.js';

/**
 * Entry point for LORELEI: DESCENT.
 */
window.addEventListener('load', () => {
    const game = new Phaser.Game(GAME_CONFIG);
    
    // Initialize global systems
    game.audioDirector = new AudioDirector(game);
    game.timelineDirector = new TimelineDirector(game.audioDirector);
    game.timelineDebugPanel = new TimelineDebugPanel(game);
    game.sessionID = 0;
    game.isTransitioning = false;

    // Global update loop for timeline and debug panel
    // This ensures they update regardless of which scene is active.
    game.events.on('poststep', () => {
        game.timelineDirector.update();
        if (game.timelineDebugPanel) {
            game.timelineDebugPanel.update();
        }
    });

    // Scene reconciliation: ensure the correct scene is active for the current track
    game.timelineDirector.on('trackStart', (trackKey) => {
        if (game.isTransitioning) return;
        game.isTransitioning = true;

        // Reset transitioning flag in next frame to allow trackStart to propagate
        setTimeout(() => { game.isTransitioning = false; }, 100);

        // Increment session ID for new missions (Synth start)
        if (trackKey === 'SYNTH') {
            game.sessionID++;
            console.log(`[SESSION ${game.sessionID}] SESSION_START`);
        }

        const activeScenes = game.scene.getScenes(true);
        const currentScene = activeScenes.length > 0 ? activeScenes[0] : null;
        const currentKey = currentScene ? currentScene.scene.key : null;

        const isGameplayTrack = (trackKey === 'SYNTH' || trackKey === 'CATHEDRAL');

        if (trackKey === 'STUDIO') {
            if (currentKey !== 'EndingScene') {
                console.log(`[SESSION ${game.sessionID}] Switching to EndingScene`);
                if (currentKey) game.scene.stop(currentKey);
                game.scene.start('EndingScene');
            }
        } else if (isGameplayTrack) {
            // We want to start/restart GameScene if:
            // 1. We are not in GameScene
            // 2. OR it is the SYNTH track (start of mission/restart)
            // 3. OR it is a developer-initiated track restart (even if CATHEDRAL)
            
            // To distinguish automatic transition from explicit restart, 
            // we can check if currentKey was already GameScene.
            // But let's keep it simple: SYNTH always restarts. CATHEDRAL only starts if not already there.
            
            if (trackKey === 'SYNTH' || currentKey !== 'GameScene') {
                console.log(`[SESSION ${game.sessionID}] Starting GameScene for track: ${trackKey}`);
                if (currentKey) game.scene.stop(currentKey);
                game.scene.start('GameScene', { sessionID: game.sessionID, trackKey });
            }
        }
    });

    // Make game instance available for debugging if needed
    window.game = game;
});
