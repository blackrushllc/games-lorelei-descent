import Phaser from 'phaser';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * Robot enemy entity with AI state machine and combat capabilities.
 */
export default class Robot extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene 
     * @param {number} x 
     * @param {number} y 
     * @param {string} type - PURSUER, SENTINEL, or ARMORED_PURSUER
     */
    constructor(scene, x, y, type = 'PURSUER') {
        super(scene, x, y);

        this.scene = scene;
        this.type = type;
        this.combatConfig = COMBAT_CONFIG.robots[type];

        // 1. Stats and State
        this.health = this.combatConfig.maxHealth;
        this.armor = this.combatConfig.maxArmor;
        this.isDestroyed = false;
        this.aiState = 'IDLE';
        this.stateTimer = 0;
        this.lastAttackTime = 0;
        this.hitFlashTween = null;

        // 2. Visuals
        this.createVisuals();

        // 3. Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Circle hitbox
        const hitRadius = this.type === 'ARMORED_PURSUER' ? 18 : 15;
        this.body.setCircle(hitRadius, -hitRadius, -hitRadius);
        this.body.setDrag(1000);
        this.body.setBounce(0.2);

        // 4. Combat specifics
        this.laserGraphic = scene.add.graphics().setDepth(5);
        this.add(this.laserGraphic);
        
        this.muzzleFlash = scene.add.graphics();
        this.add(this.muzzleFlash);
    }

    createVisuals() {
        const type = this.type;
        const cfg = this.combatConfig;
        const color = cfg.color || 0xaa0000;

        // 1. Scale for Armored Pursuer
        if (type === 'ARMORED_PURSUER') {
            this.setScale(1.25);
        }

        // 2. Body
        this.bodyGraphic = this.scene.add.graphics();
        this.drawBody(color);
        this.add(this.bodyGraphic);

        // 3. Armor Plates (if applicable)
        if (type === 'ARMORED_PURSUER') {
            this.armorGraphics = this.scene.add.graphics();
            this.updateArmorVisuals();
            this.add(this.armorGraphics);
        }

        // 4. Sentinel Features
        if (type === 'SENTINEL') {
            const antenna = this.scene.add.graphics();
            antenna.lineStyle(2, 0x888888, 1);
            antenna.moveTo(-8, -15); antenna.lineTo(-12, -25);
            antenna.moveTo(8, -15); antenna.lineTo(12, -25);
            this.add(antenna);
        }

        // 5. Eye
        const eyeColor = cfg.eyeColor || 0xff0000;
        const eyeRadius = type === 'SENTINEL' ? 7 : 5;
        this.eye = this.scene.add.graphics();
        this.eye.fillStyle(eyeColor, 1);
        this.eye.fillCircle(0, 0, eyeRadius);
        this.eye.lineStyle(1, 0xffffff, 0.5);
        this.eye.strokeCircle(0, 0, eyeRadius + 2);
        this.add(this.eye);

        // 6. Details
        const details = this.scene.add.graphics();
        details.lineStyle(1, 0x333333, 0.5);
        details.moveTo(-10, -10); details.lineTo(-10, 10);
        details.moveTo(10, -10); details.lineTo(10, 10);
        this.add(details);

        // 7. Hit Flash Overlay
        this.hitFlashOverlay = this.scene.add.graphics();
        this.hitFlashOverlay.fillStyle(0xffffff, 1);
        this.hitFlashOverlay.fillRect(-20, -20, 40, 40);
        this.hitFlashOverlay.setAlpha(0);
        this.add(this.hitFlashOverlay);
    }

    drawBody(color) {
        this.bodyGraphic.clear();
        this.bodyGraphic.fillStyle(color, 1);
        this.bodyGraphic.fillRect(-15, -15, 30, 30);
        this.bodyGraphic.lineStyle(2, 0x555555, 1);
        this.bodyGraphic.strokeRect(-15, -15, 30, 30);
    }

    updateArmorVisuals() {
        if (!this.armorGraphics) return;
        this.armorGraphics.clear();

        if (this.armor > 0) {
            this.armorGraphics.fillStyle(this.combatConfig.armorColor || 0x808080, 1);
            // Heavy plates on sides
            this.armorGraphics.fillRect(-20, -18, 10, 36);
            this.armorGraphics.fillRect(10, -18, 10, 36);
            this.armorGraphics.lineStyle(1, 0x444444, 1);
            this.armorGraphics.strokeRect(-20, -18, 10, 36);
            this.armorGraphics.strokeRect(10, -18, 10, 36);
        } else {
            // Exposed core: Change body color
            this.drawBody(this.combatConfig.coreColor || 0xffa500);
        }
    }

    update(time, delta) {
        if (this.isDestroyed || !this.active) return;

        // Authoritative pause check
        const state = this.scene.timeline.getState();
        if (!state.isPlaying) {
            if (this.body) {
                this.body.setAcceleration(0, 0);
                this.body.setVelocity(0, 0);
            }
            return;
        }

        const player = this.scene.player;
        if (!player) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // State machine
        switch (this.aiState) {
            case 'IDLE':
                if (dist < 600) { // Activation range
                    this.aiState = this.type === 'SENTINEL' ? 'ACQUIRING_TARGET' : 'PURSUING';
                }
                break;

            case 'PURSUING':
                this.handlePursue(player, dist);
                break;

            case 'ACQUIRING_TARGET':
                this.handleAcquire(player, dist, delta);
                break;

            case 'FIRING':
                this.handleFiring(delta);
                break;

            case 'COOLDOWN':
                this.handleCooldown(delta);
                break;

            case 'STAGGERED':
                this.stateTimer -= delta;
                if (this.stateTimer <= 0) {
                    this.aiState = this.type === 'SENTINEL' ? 'ACQUIRING_TARGET' : 'PURSUING';
                }
                break;
        }

        // Cleanup if way off screen
        const camY = this.scene.cameras.main.scrollY;
        // Only cleanup if it's ABOVE the camera (passed) or VERY far below
        if (this.y < camY - 400 || this.y > camY + 3000) {
            this.setActive(false).setVisible(false);
            if (this.body) this.body.enable = false;
            this.laserGraphic.clear();
        }
    }

    handlePursue(player, dist) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const speed = this.combatConfig.speed;
        
        if (dist > 20) {
            // Simple obstacle avoidance: check if we are moving much slower than intended
            const isBlocked = this.body.speed < speed * 0.3 && (this.body.acceleration.x !== 0 || this.body.acceleration.y !== 0);
            
            let targetAngle = angle;
            if (isBlocked) {
                // Attempt to steer perpendicular to the target
                const timeFactor = Math.floor(this.scene.time.now / 800);
                const steerDir = (timeFactor % 2 === 0) ? 1 : -1;
                targetAngle += (Math.PI / 2) * steerDir;
            }

            this.body.setAcceleration(Math.cos(targetAngle) * 600, Math.sin(targetAngle) * 600);
            this.body.setMaxSpeed(speed);
        } else {
            this.body.setAcceleration(0, 0);
            this.body.setVelocity(0, 0);
        }
    }

    handleAcquire(player, dist, delta) {
        const prefDist = this.combatConfig.preferredDistance;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        this.stateTimer += delta;
        if (this.stateTimer < this.combatConfig.warningTime * 0.8) {
            this.laserAngle = angle;
        }

        // Ray-based laser blocking check
        const hit = this.scene.getNearestObstacleAlongRay(this.x, this.y, this.laserAngle, 1000);
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const isPlayerBlocked = hit && hit.distance < distToPlayer - 20;
        const laserLen = hit ? hit.distance : 1000;

        // Movement logic: maintain distance + steer if blocked
        if (dist > prefDist + 50) {
            this.body.setVelocity(Math.cos(angle) * this.combatConfig.speed, Math.sin(angle) * this.combatConfig.speed);
        } else if (dist < prefDist - 50) {
            this.body.setVelocity(-Math.cos(angle) * this.combatConfig.speed, -Math.sin(angle) * this.combatConfig.speed);
        } else if (isPlayerBlocked) {
            // Reposition sideways if line of sight is blocked
            const timeFactor = Math.floor(this.scene.time.now / 1000);
            const steerDir = (timeFactor % 2 === 0) ? 1 : -1;
            const sideAngle = this.laserAngle + (Math.PI / 2) * steerDir;
            this.body.setVelocity(Math.cos(sideAngle) * this.combatConfig.speed, Math.sin(sideAngle) * this.combatConfig.speed);
        } else {
            this.body.setVelocity(0, 0);
        }

        this.laserGraphic.clear();
        this.laserGraphic.lineStyle(1, 0xff0000, 0.4);
        
        const lx = Math.cos(this.laserAngle) * laserLen;
        const ly = Math.sin(this.laserAngle) * laserLen;
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();

        if (this.stateTimer >= this.combatConfig.warningTime) {
            this.aiState = 'FIRING';
            this.stateTimer = 0;
        }
    }

    handleFiring(delta) {
        this.stateTimer += delta;
        this.body.setVelocity(0, 0);

        // New: Ray-based laser blocking for destructive beam
        // Also checks for robots (friendly fire) and player
        const result = this.calculateLaserImpact();
        const laserLen = result.distance;

        this.laserGraphic.clear();
        this.laserGraphic.lineStyle(6, 0xff0000, 1);
        this.laserGraphic.strokeCircle(0, 0, 4); 
        
        const lx = Math.cos(this.laserAngle) * laserLen;
        const ly = Math.sin(this.laserAngle) * laserLen;
        
        this.laserGraphic.lineStyle(10, 0xff6600, 0.3);
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();
        
        this.laserGraphic.lineStyle(4, 0xffffff, 1);
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();

        if (this.stateTimer < delta * 2) { 
            this.applyLaserDamage(result);
        }

        if (this.stateTimer >= this.combatConfig.fireTime) {
            this.laserGraphic.clear();
            this.aiState = 'COOLDOWN';
            this.stateTimer = 0;
        }
    }

    calculateLaserImpact() {
        const maxLength = 1000;
        const ray = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.laserAngle) * maxLength, this.y + Math.sin(this.laserAngle) * maxLength);
        
        let nearestHit = { distance: maxLength, target: null, type: 'NONE' };

        // 1. Check Obstacles
        const obsHit = this.scene.getNearestObstacleAlongRay(this.x, this.y, this.laserAngle, maxLength);
        if (obsHit) {
            nearestHit = { distance: obsHit.distance, target: obsHit.target, type: 'OBSTACLE' };
        }

        // 2. Check Player
        const player = this.scene.player;
        if (player && !player.isDestroyed && !player.isRespawning) {
            const playerCircle = new Phaser.Geom.Circle(player.x, player.y, 25);
            const points = [];
            if (Phaser.Geom.Intersects.GetLineToCircle(ray, playerCircle, points)) {
                points.forEach(p => {
                    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
                    if (d < nearestHit.distance) {
                        nearestHit = { distance: d, target: player, type: 'PLAYER' };
                    }
                });
            }
        }

        // 3. Check Other Robots (Friendly Fire)
        this.scene.robotGroup.getChildren().forEach(other => {
            if (other === this || other.isDestroyed || !other.active) return;
            
            const radius = other.type === 'ARMORED_PURSUER' ? 22 : 18;
            const otherCircle = new Phaser.Geom.Circle(other.x, other.y, radius);
            const points = [];
            if (Phaser.Geom.Intersects.GetLineToCircle(ray, otherCircle, points)) {
                points.forEach(p => {
                    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
                    if (d < nearestHit.distance) {
                        nearestHit = { distance: d, target: other, type: 'ROBOT' };
                    }
                });
            }
        });

        return nearestHit;
    }

    applyLaserDamage(hit) {
        if (!hit.target) return;

        const attackData = {
            type: 'LASER',
            damage: this.combatConfig.laserDamage,
            direction: this.laserAngle,
            attacker: this
        };

        if (hit.type === 'PLAYER') {
            this.scene.events.emit('robotAttack', attackData);
        } else if (hit.type === 'ROBOT') {
            // Friendly Fire
            this.scene.handleFriendlyFire(attackData, hit.target);
        }
    }

    checkLaserDamage() {
        // Deprecated: logic moved to handleFiring and applyLaserDamage
    }

    handleCooldown(delta) {
        this.stateTimer += delta;
        if (this.stateTimer >= this.combatConfig.cooldown) {
            this.aiState = 'ACQUIRING_TARGET';
            this.stateTimer = 0;
        }
    }

    applyKnockback(angle, strength) {
        if (this.isDestroyed) return;
        this.aiState = 'STAGGERED';
        this.stateTimer = 400; 
        
        const vx = Math.cos(angle) * strength;
        const vy = Math.sin(angle) * strength;
        if (this.body) {
            this.body.setVelocity(vx, vy);
            this.body.setAcceleration(0, 0);
        }
        
        // Flash feedback on hit (Replaces setTint)
        this.hitFlashOverlay.setAlpha(1);
        if (this.hitFlashTween) this.hitFlashTween.stop();
        this.hitFlashTween = this.scene.tweens.add({
            targets: this.hitFlashOverlay,
            alpha: 0,
            duration: 150
        });
    }

    onHit(attackResult) {
        if (attackResult === 'ARMOR_BROKEN' || attackResult === 'ARMOR_HIT') {
            this.updateArmorVisuals();
            this.scene.events.emit('robotArmorHit', this, attackResult === 'ARMOR_BROKEN');
        }
    }

    die() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.aiState = 'DESTROYED';
        if (this.body) {
            this.body.enable = false;
            this.body.setVelocity(0, 0);
            this.body.setAcceleration(0, 0);
        }
        this.laserGraphic.clear();
        
        if (this.hitFlashTween) this.hitFlashTween.stop();

        this.scene.events.emit('robotDestroyed', this);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => {
                this.destroy();
            }
        });
    }

    destroy(fromScene) {
        if (this.hitFlashTween) this.hitFlashTween.stop();
        super.destroy(fromScene);
    }
}
