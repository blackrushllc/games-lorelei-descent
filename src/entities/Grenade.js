import Phaser from 'phaser';

/**
 * Grenade physical object for the Proxy Boss finale.
 */
export default class Grenade extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        // Visuals
        this.graphic = scene.add.graphics();
        this.graphic.fillStyle(0x1a1a1a, 1);
        this.graphic.fillCircle(0, 0, 6);
        this.graphic.fillStyle(0x333333, 1);
        this.graphic.fillRect(-2, -10, 4, 12); // Stick handle
        
        this.add(this.graphic);

        // Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(8, -8, -8);
        
        this.pixelArtEnabled = true;
        this.isCaught = false;
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        // Grenade currently has no pixel art sprites
        const showProcedural = true;
        this.graphic.setVisible(showProcedural);
    }

    launch(targetX, targetY, duration, onComplete) {
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            rotation: Math.PI * 4,
            duration: duration,
            ease: 'Cubic.out',
            onComplete: () => {
                if (!this.isCaught && onComplete) onComplete();
            }
        });
    }

    catch() {
        this.isCaught = true;
        this.scene.tweens.killTweensOf(this);
        this.setScale(1.2);
    }
}
