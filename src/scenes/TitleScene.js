import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        const { width, height } = this.game.config;

        // Title
        this.add.text(width / 2, height / 2 - 120, 'LORELEI: DESCENT', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 - 60, 'Below Gamora Pharmaceuticals', {
            fontSize: '24px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Control Mode Selection
        this.add.text(width / 2, height / 2 + 20, 'SELECT CONTROL MODE:', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const currentMode = localStorage.getItem('lorelei_descent_control_mode') || 'CLASSIC';
        
        const classicBtn = this.add.text(width / 2 - 100, height / 2 + 60, 'CLASSIC', {
            fontSize: '20px',
            fill: currentMode === 'CLASSIC' ? '#00ff00' : '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            localStorage.setItem('lorelei_descent_control_mode', 'CLASSIC');
            classicBtn.setStyle({ fill: '#00ff00' });
            assistedBtn.setStyle({ fill: '#ffffff' });
        });

        const assistedBtn = this.add.text(width / 2 + 100, height / 2 + 60, 'ASSISTED', {
            fontSize: '20px',
            fill: currentMode === 'ASSISTED' ? '#00ff00' : '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            localStorage.setItem('lorelei_descent_control_mode', 'ASSISTED');
            assistedBtn.setStyle({ fill: '#00ff00' });
            classicBtn.setStyle({ fill: '#ffffff' });
        });

        this.add.text(width / 2, height / 2 + 100, 'Classic: WASD to move. Assisted: Mouse-follow.', {
            fontSize: '14px',
            fill: '#666666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Start Button
        const startButton = this.add.text(width / 2, height / 2 + 180, 'START GAME', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            // Start the timeline with the first track. 
            // The trackStart listener in main.js will handle starting GameScene.
            this.game.timelineDirector.startTrack('SYNTH');
        })
        .on('pointerover', () => startButton.setStyle({ fill: '#ffffff' }))
        .on('pointerout', () => startButton.setStyle({ fill: '#00ff00' }));

        // Version Indicator
        this.add.text(width / 2, height - 40, 'Prototype — Step 4.2', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
}
