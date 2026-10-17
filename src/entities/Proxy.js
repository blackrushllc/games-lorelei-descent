import Phaser from 'phaser';

/**
 * Scripted Proxy entity for the opening escape sequence.
 * Visually distinct and deterministic based on musical time.
 */
export default class Proxy extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Object} config - PROXY_CONFIG.opening
     */
    constructor(scene, config) {
        super(scene, config.startX, config.startY);
        this.scene = scene;
        this.config = config;

        // 1. Visuals
        this.bodyGraphic = scene.add.graphics();
        this.bodyGraphic.fillStyle(config.color, 1);
        this.bodyGraphic.fillRect(-config.width/2, -config.height/2, config.width, config.height);
        this.bodyGraphic.lineStyle(2, 0xffffff, 1);
        this.bodyGraphic.strokeRect(-config.width/2, -config.height/2, config.width, config.height);

        // Head and a distinct "Nadine" bundle placeholder
        this.head = scene.add.graphics();
        this.head.fillStyle(0x444444, 1);
        this.head.fillCircle(0, -config.height/2, 12);
        
        // "Nadine" placeholder (a smaller light-blue box being carried)
        this.nadineBundle = scene.add.graphics();
        this.nadineBundle.fillStyle(0xaaaaff, 1);
        this.nadineBundle.fillRect(-15, -5, 30, 20);
        this.nadineBundle.lineStyle(1, 0xffffff, 0.5);
        this.nadineBundle.strokeRect(-15, -5, 30, 20);

        this.label = scene.add.text(0, config.height/2 + 15, config.label, {
            fontSize: '14px',
            fill: '#cc00ff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add([this.bodyGraphic, this.head, this.nadineBundle, this.label]);
        
        // Set depth to be above robots but maybe below HUD
        this.setDepth(10);

        scene.add.existing(this);
        
        // Initially hidden until updateFromTime is called
        this.setVisible(false);
    }

    /**
     * Updates position and visibility based on musical time.
     * @param {string} track - Current track key.
     * @param {number} time - Current track time in seconds.
     */
    updateFromTime(track, time) {
        if (track !== 'SYNTH' || time < this.config.startTime || time > this.config.endTime) {
            this.setVisible(false);
            return;
        }

        this.setVisible(true);
        const dt = time - this.config.startTime;
        
        // Straight downward deterministic movement
        this.y = this.config.startY + (this.config.speed * dt);
        this.x = this.config.startX;
    }
}
