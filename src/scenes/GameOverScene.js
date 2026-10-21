import Phaser from 'phaser';
import { ARENA_CHECKPOINTS } from '../config/assistanceConfig.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.inputActive = false;
        this.time.delayedCall(500, () => { this.inputActive = true; });

        this.createUI();
        this.scale.on('resize', this.onResize, this);
        
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.onResize, this);
        });
    }

    createUI() {
        if (!this.children) return;
        this.children.removeAll();
        const { width, height } = this.scale;
        this.timeline = this.game.timelineDirector;

        // Overlay background
        this.add.graphics()
            .fillStyle(0x000000, 0.8)
            .fillRect(0, 0, width, height);

        this.add.text(width / 2, height / 2 - 80, 'SHIELD DEPLETED', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 20, 'BLACKRUSH DOWN', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // CONTINUE FROM ARENA (if available)
        const missionState = this.game.missionState;
        if (missionState && missionState.arenaCheckpoint) {
            const cp = ARENA_CHECKPOINTS[missionState.arenaCheckpoint];
            const continueBtn = this.add.text(width / 2, height / 2 + 20, cp.label, {
                fontSize: '28px',
                fill: '#00ffff',
                fontFamily: 'Arial',
                backgroundColor: '#222222',
                padding: { x: 20, y: 10 }
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (!this.inputActive) return;
                this.continueFromArena();
            })
            .on('pointerover', () => continueBtn.setStyle({ fill: '#ffffff' }))
            .on('pointerout', () => continueBtn.setStyle({ fill: '#00ffff' }));
        }

        // RESTART MISSION
        const restartBtn = this.add.text(width / 2, height / 2 + 100, 'RESTART MISSION', {
            fontSize: '28px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (!this.inputActive) return;
            this.restartGame();
        })
        .on('pointerover', () => restartBtn.setStyle({ fill: '#ffffff' }))
        .on('pointerout', () => restartBtn.setStyle({ fill: '#00ff00' }));

        // BACK TO TITLE
        const titleBtn = this.add.text(width / 2, height / 2 + 180, 'BACK TO TITLE', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (!this.inputActive) return;
            this.returnToTitle();
        })
        .on('pointerover', () => titleBtn.setStyle({ backgroundColor: '#444444' }))
        .on('pointerout', () => titleBtn.setStyle({ backgroundColor: '#333333' }));
    }

    onResize() {
        if (!this.scene.isActive()) return;
        this.createUI();
    }

    continueFromArena() {
        const missionState = this.game.missionState;
        if (!missionState || !missionState.arenaCheckpoint) return;
        
        const cp = ARENA_CHECKPOINTS[missionState.arenaCheckpoint];
        if (!cp) return;

        missionState.retryCount++;
        console.log(`[SESSION ${this.game.sessionID}] CONTINUE_FROM_ARENA: ${cp.id} (Retry #${missionState.retryCount})`);
        
        this.timeline.stop();
        this.timeline.startTrack(cp.track, cp.time);
        
        // The trackStart event will handle the rest in main.js and GameScene.js
        this.scene.stop('GameOverScene');
    }

    restartGame() {
        console.log(`[SESSION ${this.game.sessionID}] SESSION_RESTART`);
        const state = this.timeline.getState();
        const lastTrack = state.track || 'SYNTH';
        this.timeline.stop();
        this.timeline.startTrack(lastTrack);
        // The trackStart event will be caught by the global listener in main.js,
        // which will handle switching to GameScene.
        // We also need to stop the GameOverScene itself.
        this.scene.stop('GameOverScene');
    }

    returnToTitle() {
        console.log(`[SESSION ${this.game.sessionID}] SESSION_STOP`);
        this.timeline.stop();
        // Crucial: GameScene was launched parallel, so we must stop it explicitly
        this.scene.stop('GameScene');
        this.scene.start('TitleScene');
    }
}
