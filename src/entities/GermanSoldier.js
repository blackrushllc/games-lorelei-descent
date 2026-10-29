import Phaser from 'phaser';

/**
 * Scripted German Soldier entity for the Proxy Boss finale.
 */
export default class GermanSoldier extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        // Visuals
        this.spriteRegistry = scene.registry.get('spriteAnimationRegistry');
        this.pixelArtEnabled = true;

        this.sprite = scene.add.sprite(0, 0, 'german_soldier');
        this.sprite.setScale(2);
        this.sprite.setVisible(this.pixelArtEnabled);
        this.sprite.setOriginFromFrame();

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

        this.add([this.sprite, this.bodyGraphic, this.headGraphic, this.label]);

        this.pixelArtEnabled = true;

        scene.add.existing(this);
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        const showProcedural = !enabled;
        if (this.sprite) this.sprite.setVisible(enabled);
        this.bodyGraphic.setVisible(showProcedural);
        this.headGraphic.setVisible(showProcedural);
    }

    throwGrenade(targetX, targetY, callback) {
        // Animation of throwing
        if (this.pixelArtEnabled && this.spriteRegistry) {
            const animKey = this.spriteRegistry.getAnimationKey('german_soldier', 'throw', 'north');
            if (animKey) {
                this.sprite.play(animKey);
            }
        }

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
