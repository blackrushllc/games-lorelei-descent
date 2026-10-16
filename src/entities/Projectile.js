import Phaser from 'phaser';

/**
 * Base class for projectiles (Energy Bolt and Axe).
 */
export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        this.birthTime = 0;
        this.lifeTime = 1000;
        this.rotationSpeed = 0;
        this.hitTargets = new Set();
    }

    /**
     * Fired by the WeaponSystem.
     */
    fire(x, y, angle, speed, lifeTime, rotationSpeed = 0) {
        this.enableBody(true, x, y, true, true);
        this.hitTargets.clear();
        
        this.setRotation(angle + Math.PI / 2); // Texture is vertical
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        this.setVelocity(vx, vy);
        this.birthTime = this.scene.time.now;
        this.lifeTime = lifeTime;
        this.rotationSpeed = rotationSpeed;
    }

    update() {
        if (!this.active) return;

        // Check lifetime
        if (this.scene.time.now - this.birthTime > this.lifeTime) {
            this.deactivate();
        }

        // Handle custom rotation (for axe)
        if (this.rotationSpeed !== 0) {
            this.angle += this.rotationSpeed;
        }

        // Cleanup if way off screen vertically
        const cameraY = this.scene.cameras.main.scrollY;
        if (this.y < cameraY - 100 || this.y > cameraY + 1100) {
            this.deactivate();
        }
    }

    deactivate() {
        this.disableBody(true, true);
    }
}
