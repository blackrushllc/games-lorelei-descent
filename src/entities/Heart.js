import Phaser from 'phaser';

/**
 * A collectible heart pickup.
 */
export default class Heart extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        // Procedural heart shape
        this.graphic = scene.add.graphics();
        this.drawHeart(this.graphic, 0, 0, 20);
        
        // Add a glow
        this.glow = scene.add.graphics();
        this.drawHeart(this.glow, 0, 0, 24);
        this.glow.setAlpha(0.3);

        this.add([this.glow, this.graphic]);

        // Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCircle(12, -12, -12);
        this.body.setImmovable(true);
        
        // Expiration logic
        this.spawnTime = scene.time.now;
        this.lifespan = 15000; // 15 seconds
        
        this.pixelArtEnabled = true;
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        // Heart currently has no pixel art sprites
        const showProcedural = true;
        this.graphic.setVisible(showProcedural);
        this.glow.setVisible(showProcedural);
    }

    drawHeart(g, x, y, size) {
        g.clear();
        const color = size > 20 ? 0xffffff : 0xff3366;
        const alpha = size > 20 ? 0.3 : 1.0;
        g.fillStyle(color, alpha);
        
        // Simple procedural heart shape (circles + triangle)
        // Scaled by size/20
        const scale = size / 20;
        g.fillCircle(x - 5 * scale, y - 5 * scale, 6 * scale);
        g.fillCircle(x + 5 * scale, y - 5 * scale, 6 * scale);
        
        g.beginPath();
        g.moveTo(x - 11 * scale, y - 4 * scale);
        g.lineTo(x + 11 * scale, y - 4 * scale);
        g.lineTo(x, y + 10 * scale);
        g.closePath();
        g.fillPath();
    }

    update() {
        // Floating animation
        this.y += Math.sin(this.scene.time.now / 200) * 0.2;
        
        // Check for expiration or being behind camera
        const camY = this.scene.cameras.main.scrollY;
        if (this.y < camY - 100 || this.scene.time.now - this.spawnTime > this.lifespan) {
            this.destroy();
        }
    }
}
