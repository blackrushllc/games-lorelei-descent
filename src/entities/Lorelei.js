import Phaser from 'phaser';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * Lorelei: Blackrush's student and ally. 
 * Autonomous companion that follows the player and uses telekinetic defense.
 */
export default class Lorelei extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.followConfig = COMBAT_CONFIG.lorelei.follow;
        this.defenseConfig = COMBAT_CONFIG.lorelei.defense;

        // 1. Visuals
        this.spriteRegistry = scene.registry.get('spriteAnimationRegistry');
        this.pixelArtEnabled = true;
        this.currentFacing = 'south';
        this.currentAnimState = 'idle';
        this.hasSprite = false;
        this.createVisuals();

        // 2. State
        this.isTelekineticActive = false;
        this.telekinesisCooldownTimer = 0;
        this.followState = 'idle'; // idle, walk, run
        this.isDestroyed = false;
        this.random = Math.random;
        this.stats = {
            totalPulses: 0,
            lastAffected: 0,
            lastDestroyed: 0,
            lastDisarmed: 0
        };

        // 3. Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Circle hitbox (approx human sized, similar to Blackrush)
        const hitRadius = 16;
        if (this.body) {
            this.body.setCircle(hitRadius, -hitRadius, -hitRadius);
            this.body.setDrag(this.followConfig.deceleration);
            this.body.setCollideWorldBounds(false);
        }
        
        // Telekinesis Visual Effect
        this.tkGraphic = scene.add.graphics().setDepth(1500);
        this.add(this.tkGraphic);
    }

    createVisuals() {
        const entityId = 'lorelei';
        
        // Sprite resolution through v2 manifest
        if (this.spriteRegistry) {
            this.sprite = this.scene.add.sprite(0, 0, entityId);
            this.sprite.setScale(1.8); // Teenager scale (Blackrush is 2.0)
            this.sprite.setVisible(this.pixelArtEnabled);
            if (typeof this.sprite.setOriginFromFrame === 'function') {
                this.sprite.setOriginFromFrame();
            }
            this.add(this.sprite);
            this.hasSprite = true;
        }

        // Procedural Visual Fallback
        this.bodyGraphic = this.scene.add.graphics();
        this.bodyGraphic.fillStyle(0xcc99ff, 1); // Violet/Light Purple
        this.bodyGraphic.fillRect(-10, -16, 20, 32);
        this.bodyGraphic.lineStyle(2, 0xffffff, 1);
        this.bodyGraphic.strokeRect(-10, -16, 20, 32);
        this.bodyGraphic.setVisible(!this.pixelArtEnabled);
        
        this.headGraphic = this.scene.add.graphics();
        this.headGraphic.fillStyle(0xffffff, 1);
        this.headGraphic.fillCircle(0, -8, 6);
        this.headGraphic.setVisible(!this.pixelArtEnabled);

        this.label = this.scene.add.text(0, 25, 'LORELEI', {
            fontSize: '10px',
            fill: '#cc99ff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add([this.bodyGraphic, this.headGraphic, this.label]);
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        if (this.hasSprite) {
            this.sprite.setVisible(enabled);
        }
        this.bodyGraphic.setVisible(!enabled);
        this.headGraphic.setVisible(!enabled);
    }

    update(time, delta) {
        if (!this.active || this.isDestroyed) return;

        // Authoritative pause check
        const timelineState = this.scene.timeline.getState();
        if (timelineState.isPaused) {
            if (this.body) {
                this.body.setAcceleration(0, 0);
                this.body.setVelocity(0, 0);
            }
            if (this.hasSprite && this.sprite.anims.isPlaying) {
                this.sprite.anims.pause();
            }
            return;
        } else if (this.hasSprite && this.sprite.anims.isPaused) {
            this.sprite.anims.resume();
        }

        const player = this.scene.player;
        if (!player) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // 1. Follow Logic
        this.handleFollow(player, dist, delta);

        // 2. Telekinesis Logic
        this.handleTelekinesis(player, dist, delta);

        // 3. Animations
        if (this.hasSprite && this.pixelArtEnabled) {
            this.updateAnimation(player, dist);
        }

        // 4. Catch-up safeguard
        this.handleCatchUp(player, dist);
    }

    handleFollow(player, dist, delta) {
        if (this.isTelekineticActive) {
            // Stop movement during telekinesis
            if (this.body) {
                this.body.setAcceleration(0, 0);
                this.body.setVelocity(this.body.velocity.x * 0.8, this.body.velocity.y * 0.8);
            }
            return;
        }

        let targetSpeed = 0;
        let acceleration = this.followConfig.acceleration;

        if (dist > this.followConfig.catchUpDistance) {
            this.followState = 'run';
            targetSpeed = this.followConfig.runSpeed;
        } else if (dist > this.followConfig.followDistance) {
            this.followState = 'walk';
            targetSpeed = this.followConfig.walkSpeed;
        } else if (dist < this.followConfig.stopDistance) {
            this.followState = 'idle';
            targetSpeed = 0;
            if (this.body) {
                this.body.setAcceleration(0, 0);
                // Friction takes over via Drag
            }
            return;
        } else {
            // Between stop and follow distance, slow down gradually
            this.followState = 'walk';
            targetSpeed = this.followConfig.walkSpeed * ((dist - this.followConfig.stopDistance) / (this.followConfig.followDistance - this.followConfig.stopDistance));
        }

        // Offset position slightly behind/beside player
        const pVel = player.body ? player.body.velocity : { x: 0, y: 0 };
        let targetX = player.x;
        let targetY = player.y;

        const velLen = Math.sqrt(pVel.x * pVel.x + pVel.y * pVel.y);
        if (velLen > 10) {
            const angle = Math.atan2(pVel.y, pVel.x);
            // Offset by 50 units opposite to player movement
            targetX -= Math.cos(angle) * 50;
            targetY -= Math.sin(angle) * 50;
        } else {
            // If player is idle, stay to the left slightly
            targetX -= 50; 
        }

        const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        
        // Simple obstacle avoidance (same as Robots)
        const isBlocked = this.body.speed < targetSpeed * 0.2 && targetSpeed > 0;
        let moveAngle = angleToTarget;
        if (isBlocked) {
            const timeFactor = Math.floor(this.scene.time.now / 800);
            const steerDir = (timeFactor % 2 === 0) ? 1 : -1;
            moveAngle += (Math.PI / 2) * steerDir;
        }

        if (this.body) {
            this.body.setAcceleration(Math.cos(moveAngle) * acceleration, Math.sin(moveAngle) * acceleration);
            this.body.setMaxSpeed(targetSpeed);
        }
    }

    handleTelekinesis(player, dist, delta) {
        if (this.telekinesisCooldownTimer > 0) {
            this.telekinesisCooldownTimer -= delta;
        }

        if (this.isTelekineticActive || this.telekinesisCooldownTimer > 0) return;

        // Proximity matters: protection is unavailable if too far
        if (dist > this.followConfig.maximumSupportDistance) return;

        // Check for threats near player
        const robots = this.scene.robotGroup.getChildren();
        const threats = robots.filter(r => {
            if (!r.active || r.isDestroyed || r.aiState === 'RETREATING') return false;
            // Use target center for proximity
            const tr = r.getTargetRegion ? r.getTargetRegion() : { x: r.x, y: r.y };
            const playerTR = player.getTargetRegion ? player.getTargetRegion() : { x: player.x, y: player.y };
            const d = Phaser.Math.Distance.Between(tr.x, tr.y, playerTR.x, playerTR.y);
            return d < this.defenseConfig.threatRadius;
        });

        // Especially close individual Pursuer emergency
        const emergencyThreat = robots.some(r => {
             if (!r.active || r.isDestroyed || r.type !== 'PURSUER') return false;
             const tr = r.getTargetRegion ? r.getTargetRegion() : { x: r.x, y: r.y };
             const playerTR = player.getTargetRegion ? player.getTargetRegion() : { x: player.x, y: player.y };
             return Phaser.Math.Distance.Between(tr.x, tr.y, playerTR.x, playerTR.y) < 70;
        });

        if (threats.length >= this.defenseConfig.minimumThreatCount || emergencyThreat) {
            this.triggerTelekinesis(player);
        }
    }

    triggerTelekinesis(player) {
        this.isTelekineticActive = true;
        this.telekinesisCooldownTimer = this.defenseConfig.telekinesisCooldown;

        // Face threat area? For now face player (defensive pose)
        const faceAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.currentFacing = this.spriteRegistry.get8WayDirection(faceAngle);

        // Visual effect lifecycle
        const duration = 600;
        this.tkGraphic.clear();
        
        // Origin at Lorelei's upper body
        const geo = COMBAT_CONFIG.geometry.lorelei;
        const originY = geo ? geo.weaponOrigin.y : -40;
        
        this.scene.tweens.add({
            targets: { radius: 10, alpha: 1 },
            radius: this.defenseConfig.telekinesisRadius,
            alpha: 0,
            duration: duration,
            onUpdate: (tween) => {
                const targets = tween.targets;
                this.tkGraphic.clear();
                this.tkGraphic.lineStyle(6, 0xcc99ff, targets.alpha);
                this.tkGraphic.strokeCircle(0, originY, targets.radius);
                
                // Brighter center burst
                if (targets.radius < 50) {
                    this.tkGraphic.fillStyle(0xffffff, targets.alpha * 0.8);
                    this.tkGraphic.fillCircle(0, originY, targets.radius);
                }

                // Expanding psychic streaks
                for (let i = 0; i < 12; i++) {
                    const ang = (i / 12) * Math.PI * 2;
                    const r1 = targets.radius * 0.5;
                    const r2 = targets.radius;
                    this.tkGraphic.lineBetween(
                        Math.cos(ang) * r1, originY + Math.sin(ang) * r1,
                        Math.cos(ang) * r2, originY + Math.sin(ang) * r2
                    );
                }
            },
            onComplete: () => {
                this.tkGraphic.clear();
                this.isTelekineticActive = false;
            }
        });

        // Apply effects to robots within LORELEI's range
        const robots = this.scene.robotGroup.getChildren();
        let affectedCount = 0;
        let destroyedCount = 0;
        let disarmedCount = 0;

        robots.forEach(r => {
            if (!r.active || r.isDestroyed) return;
            
            // Check distance to Lorelei's torso origin
            const dist = Phaser.Math.Distance.Between(this.x, this.y + originY, r.x, r.y - 30);
            if (dist < this.defenseConfig.telekinesisRadius) {
                affectedCount++;
                
                // 1. Independent Destruction Roll (50%)
                const shouldDestroy = this.random() < this.defenseConfig.destructionChance;
                
                if (shouldDestroy) {
                    destroyedCount++;
                    r.die();
                } else {
                    // 2. Survive and be violently pushed away
                    const angle = Phaser.Math.Angle.Between(this.x, this.y + originY, r.x, r.y - 30);
                    if (typeof r.applyKnockback === 'function') {
                        r.applyKnockback(angle, this.defenseConfig.knockbackStrength, this.defenseConfig.knockbackDuration);
                    }
                    
                    // 3. Disarm Armored Robots
                    if (r.type === 'ARMORED_PURSUER' && r.armor > 0) {
                        r.armor = 0;
                        r.onHit('ARMOR_BROKEN');
                        disarmedCount++;
                        
                        // Brief energy flash on robot losing armor
                        const armorFlash = this.scene.add.graphics().setPosition(r.x, r.y - 30);
                        armorFlash.lineStyle(2, 0xcc99ff, 1);
                        armorFlash.strokeCircle(0, 0, 40);
                        this.scene.tweens.add({
                            targets: armorFlash,
                            alpha: 0,
                            scale: 2,
                            duration: 300,
                            onComplete: () => armorFlash.destroy()
                        });
                    }
                }
            }
        });

        this.stats.totalPulses++;
        this.stats.lastAffected = affectedCount;
        this.stats.lastDestroyed = destroyedCount;
        this.stats.lastDisarmed = disarmedCount;

        console.log(`[LORELEI] Telekinesis Defense: ${affectedCount} robots affected. ${destroyedCount} destroyed, ${disarmedCount} disarmed.`);
    }

    handleCatchUp(player, dist) {
        const cam = this.scene.cameras.main;
        
        // Separation check: if way off screen vertically OR horizontally too far
        const verticalBuffer = cam.height * 1.5;
        const isWayOffscreenY = Math.abs(this.y - (cam.scrollY + cam.height / 2)) > verticalBuffer;
        
        if (isWayOffscreenY && dist > this.followConfig.maximumSupportDistance * 2) {
            // Discreet reposition to a valid nearby location
            // Find a spot just behind the player, offscreen if possible, or edge of screen
            const targetY = cam.scrollY + cam.height + 50; // Below screen
            const targetX = Phaser.Math.Clamp(player.x - 60, 100, 1180);
            
            let finalX = targetX;
            let finalY = targetY;

            // Use safe spawn logic if available
            if (typeof this.scene.findSafeRobotSpawnPosition === 'function') {
                const safePos = this.scene.findSafeRobotSpawnPosition(targetX, targetY, 150);
                finalX = safePos.x;
                finalY = safePos.y;
            }

            this.x = finalX;
            this.y = finalY;
            if (this.body) {
                this.body.reset(this.x, this.y);
            }
            console.log(`[LORELEI] Catch-up recovery triggered.`);
        }
    }

    updateAnimation(player, dist) {
        let state = 'idle';
        
        if (this.isTelekineticActive) {
            state = 'idle';
        } else if (this.body && this.body.velocity.length() > 5) {
            const speed = this.body.velocity.length();
            state = speed > this.followConfig.walkSpeed * 1.2 ? 'run' : 'walk';
            
            // Facings from velocity
            const angle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            this.currentFacing = this.spriteRegistry.get8WayDirection(angle);
        } else {
            // Face player if idle
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.currentFacing = this.spriteRegistry.get8WayDirection(angle);
            state = 'idle';
        }

        const animKey = this.spriteRegistry.getAnimationKey('lorelei', state, this.currentFacing);
        if (animKey && this.sprite.anims.currentAnim?.key !== animKey) {
            this.sprite.play(animKey);
            if (typeof this.sprite.setOriginFromFrame === 'function') {
                this.sprite.setOriginFromFrame();
            }
        }
    }

    getWeaponOrigin() {
        const geo = COMBAT_CONFIG.geometry.lorelei;
        return {
            x: this.x + geo.weaponOrigin.x,
            y: this.y + geo.weaponOrigin.y
        };
    }

    getTargetRegion() {
        const geo = COMBAT_CONFIG.geometry.lorelei;
        return {
            x: this.x + geo.targetCenter.x,
            y: this.y + geo.targetCenter.y,
            radius: geo.targetRadius
        };
    }
}
