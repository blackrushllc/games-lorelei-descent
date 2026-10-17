import Phaser from 'phaser';

export default class EndingScene extends Phaser.Scene {
    constructor() {
        super('EndingScene');
    }

    create() {
        this.createUI();
        this.scale.on('resize', this.onResize, this);
    }

    createUI() {
        this.children.removeAll();
        const { width, height } = this.scale;
        this.timeline = this.game.timelineDirector;

        // Title
        this.add.text(width / 2, 100, 'LORELEI: DESCENT', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 160, 'MISSION COMPLETE', {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Credits Placeholder
        this.creditsText = this.add.text(width / 2, 300, '', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        // Book Promotion Placeholder
        this.promoText = this.add.text(width / 2, 500, '', {
            fontSize: '24px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);

        // Buttons
        const replayButton = this.add.text(width / 2, height - 150, 'REPLAY', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.timeline.startTrack('SYNTH');
            // scene switching handled by trackStart listener in main.js
        });

        const backButton = this.add.text(width / 2, height - 80, 'BACK TO TITLE', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.timeline.stop();
            this.scene.start('TitleScene');
        });

        // Timeline Listeners
        this.setupTimelineListeners();

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            this.cleanupTimelineListeners();
        });

        console.log('EndingScene: Loaded.');
    }

    onResize() {
        this.createUI();
    }

    setupTimelineListeners() {
        this.onTimelineEvent = (eventId) => {
            if (eventId === 'SHOW_CREDITS' && this.creditsText) {
                this.creditsText.setText('Developed by Blackrush\nMusic by Lorelei Team');
            }
            if (eventId === 'SHOW_BOOK_PROMOTION' && this.promoText) {
                this.promoText.setText('Experience the legend.\nRead LORELEI: THE DESCENT today.');
            }
        };

        this.onDebugReturnToTitle = () => {
            if (this.timeline) {
                this.timeline.stop();
            }
            this.scene.start('TitleScene');
        };

        this.timeline.on('event', this.onTimelineEvent);
        this.timeline.on('debugReturnToTitle', this.onDebugReturnToTitle);
    }

    cleanupTimelineListeners() {
        if (this.timeline) {
            this.timeline.off('event', this.onTimelineEvent);
            this.timeline.off('debugReturnToTitle', this.onDebugReturnToTitle);
        }
    }

    update() {
        // Timeline and debug panel updates moved to global game loop in main.js
    }
}
