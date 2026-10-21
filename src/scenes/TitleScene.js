import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this.inputActive = false;
        this.time.delayedCall(200, () => { this.inputActive = true; });

        this.createUI();

        // Handle resize
        this.scale.on('resize', this.onResize, this);

        this.events.once('shutdown', () => {
            this.scale.off('resize', this.onResize, this);
        });
    }

    createUI() {
        if (!this.children) return;
        this.children.removeAll();

        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // Title
        this.add.text(centerX, centerY - 120, 'LORELEI: DESCENT', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(centerX, centerY - 60, 'Below Gamora Pharmaceuticals', {
            fontSize: '24px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Control Mode Selection
        this.add.text(centerX, centerY + 20, 'SELECT CONTROL MODE:', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const currentMode = localStorage.getItem('lorelei_descent_control_mode') || 'CLASSIC';
        
        const classicBtn = this.add.text(centerX - 100, centerY + 60, 'CLASSIC', {
            fontSize: '20px',
            fill: currentMode === 'CLASSIC' ? '#00ff00' : '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (!this.inputActive) return;
            localStorage.setItem('lorelei_descent_control_mode', 'CLASSIC');
            classicBtn.setStyle({ fill: '#00ff00' });
            assistedBtn.setStyle({ fill: '#ffffff' });
        });

        const assistedBtn = this.add.text(centerX + 100, centerY + 60, 'ASSISTED', {
            fontSize: '20px',
            fill: currentMode === 'ASSISTED' ? '#00ff00' : '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (!this.inputActive) return;
            localStorage.setItem('lorelei_descent_control_mode', 'ASSISTED');
            assistedBtn.setStyle({ fill: '#00ff00' });
            classicBtn.setStyle({ fill: '#ffffff' });
        });

        this.add.text(centerX, centerY + 100, 'Classic: WASD to move. Assisted: Mouse-follow.', {
            fontSize: '14px',
            fill: '#666666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Start Button
        const startButton = this.add.text(centerX, centerY + 180, 'START GAME', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (!this.inputActive) return;
            this.game.timelineDirector.startTrack('SYNTH');
        })
        .on('pointerover', () => startButton.setStyle({ fill: '#ffffff' }))
        .on('pointerout', () => startButton.setStyle({ fill: '#00ff00' }));

        // Version Indicator
        this.add.text(centerX, height - 40, 'Prototype — Step 9', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    onResize() {
        if (!this.scene.isActive()) return;
        this.createUI();
    }
}
