import Phaser from 'phaser';

/**
 * Scripted German Soldier entity for the Proxy Boss finale.
 */
export default class GermanSoldier extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        // Placeholder Visuals
        this.bodyGraphic = scene.add.graphics();
        this.bodyGraphic.fillStyle(0x4a5d4a, 1); // Field Gray
        this.bodyGraphic.fillRect(-15, -20, 30, 40);
        this.bodyGraphic.lineStyle(2, 0x000000, 1);
        this.bodyGraphic.strokeRect(-15, -20, 30, 40);

        this.headGraphic = scene.add.graphics();
        this.headGraphic.fillStyle(0xd2b48c, 1); // Tan/Skin
        this.headGraphic.fillCircle(0, -10, 8);
        
        this.label = scene.add.text(0, 30, 'SOLDIER', {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add([this.bodyGraphic, this.headGraphic, this.label]);

        scene.add.existing(this);
    }

    throwGrenade(targetX, targetY, callback) {
        // Animation of throwing (simplified)
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                if (callback) callback();
            }
        });
    }
}
