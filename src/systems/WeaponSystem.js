import Projectile from '../entities/Projectile.js';
import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';

/**
 * Manages player weapons, projectiles, and cooldowns.
 */
export default class WeaponSystem {
    /**
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        
        // 1. Projectile Pools
        this.energyProjectiles = scene.physics.add.group({
            classType: Projectile,
            maxSize: 100,
            runChildUpdate: true
        });
        
        this.axes = scene.physics.add.group({
            classType: Projectile,
            maxSize: 10,
            runChildUpdate: true
        });
        
        // 2. Cooldown Tracking
        this.lastEnergyFireTime = 0;
        this.lastAxeFireTime = 0;
        
        // 3. Configuration
        this.energyConfig = GAMEPLAY_CONFIG.weapons.energy;
        this.axeConfig = GAMEPLAY_CONFIG.weapons.axe;
    }

    /**
     * Fires primary energy weapon.
     */
    fireEnergy(entity, angle) {
        const now = this.scene.time.now;
        const fireInterval = 1000 / this.energyConfig.fireRate;
        
        if (now - this.lastEnergyFireTime >= fireInterval) {
            const origin = entity.getWeaponOrigin ? entity.getWeaponOrigin() : { x: entity.x, y: entity.y };
            const projectile = this.energyProjectiles.get(origin.x, origin.y, 'energy_bolt');
            if (projectile) {
                // Offset muzzle position slightly forward
                const muzzleX = origin.x + Math.cos(angle) * 20;
                const muzzleY = origin.y + Math.sin(angle) * 20;
                
                projectile.fire(muzzleX, muzzleY, angle, this.energyConfig.speed, this.energyConfig.lifeTime);
                this.lastEnergyFireTime = now;
                
                this.muzzleFlash(muzzleX, muzzleY, angle);
            }
        }
    }

    /**
     * Fires secondary throwing axe.
     */
    fireAxe(entity, angle) {
        const now = this.scene.time.now;
        
        if (now - this.lastAxeFireTime >= this.axeConfig.cooldown) {
            const origin = entity.getWeaponOrigin ? entity.getWeaponOrigin() : { x: entity.x, y: entity.y };
            const axe = this.axes.get(origin.x, origin.y, 'axe');
            if (axe) {
                axe.fire(origin.x, origin.y, angle, this.axeConfig.speed, this.axeConfig.lifeTime, this.axeConfig.rotationSpeed);
                this.lastAxeFireTime = now;
                return true;
            }
        }
        return false;
    }

    /**
     * Visual effect for firing.
     */
    muzzleFlash(x, y, angle) {
        const flash = this.scene.add.sprite(x, y, 'muzzle_flash');
        flash.setRotation(angle);
        flash.setScale(0.5);
        flash.setAlpha(0.8);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.2,
            duration: 80,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * Returns axe cooldown as a normalized value (0 to 1).
     * @returns {number}
     */
    getAxeCooldownStatus() {
        const now = this.scene.time.now;
        const elapsed = now - this.lastAxeFireTime;
        return Math.min(1, elapsed / this.axeConfig.cooldown);
    }

    /**
     * Resets all weapon states and clears active projectiles.
     */
    reset() {
        if (this.energyProjectiles && this.energyProjectiles.scene) {
            this.energyProjectiles.clear(true, true);
        }
        if (this.axes && this.axes.scene) {
            this.axes.clear(true, true);
        }
        this.lastEnergyFireTime = 0;
        this.lastAxeFireTime = 0;
    }

    /**
     * Updates active projectiles.
     */
    update() {
        // Manually update all projectiles to handle lifetime and cleanup
        this.energyProjectiles.getChildren().forEach(p => p.update());
        this.axes.getChildren().forEach(a => a.update());
    }

    getActiveProjectileCount() {
        return this.energyProjectiles.countActive();
    }

    getActiveAxeCount() {
        return this.axes.countActive();
    }
}
