import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const { width, height } = this.game.config;
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

        // RESTART MISSION
        const restartBtn = this.add.text(width / 2, height / 2 + 80, 'RESTART MISSION', {
            fontSize: '28px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.restartGame())
        .on('pointerover', () => restartBtn.setStyle({ fill: '#ffffff' }))
        .on('pointerout', () => restartBtn.setStyle({ fill: '#00ff00' }));

        // BACK TO TITLE
        const titleBtn = this.add.text(width / 2, height / 2 + 160, 'BACK TO TITLE', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.returnToTitle())
        .on('pointerover', () => titleBtn.setStyle({ backgroundColor: '#444444' }))
        .on('pointerout', () => titleBtn.setStyle({ backgroundColor: '#333333' }));
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
        this.scene.start('TitleScene');
    }
}
