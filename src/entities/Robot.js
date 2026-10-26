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
        this.creationTime = scene.time.now;

        // Catch-up burst state
        this.isBursting = false;
        this.burstTimer = 0;
        this.burstCooldown = 0;
        
        // Retreat state
        this.retreatX = 0;
        this.retreatY = 0;

        // Fair laser timing
        this.laserConfig = this.combatConfig.laserConfig || {
            trackingMs: 700,
            lockedMs: 0,
            firingMs: 150,
            beamWidth: 10
        };

        // 2. Visuals
        this.spriteRegistry = scene.registry.get('spriteAnimationRegistry');
        this.pixelArtEnabled = true;
        this.currentFacing = 'south';
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

        // 1. Sprite for Pursuer
        this.hasSprite = (type === 'PURSUER');
        if (this.hasSprite) {
            this.sprite = this.scene.add.sprite(0, 0, 'pursuer');
            this.sprite.setScale(2); 
            this.sprite.setVisible(this.pixelArtEnabled);
            this.add(this.sprite);
        }

        // 2. Scale for Armored Pursuer
        if (type === 'ARMORED_PURSUER') {
            this.setScale(1.25);
        }

        // 2. Body
        this.bodyGraphic = this.scene.add.graphics();
        this.drawBody(color);
        this.bodyGraphic.setVisible(!this.hasSprite || !this.pixelArtEnabled);
        this.add(this.bodyGraphic);

        // 3. Armor Plates (if applicable)
        if (type === 'ARMORED_PURSUER') {
            this.armorGraphics = this.scene.add.graphics();
            this.updateArmorVisuals();
            this.add(this.armorGraphics);
        }

        // 4. Sentinel Features
        if (type === 'SENTINEL') {
            this.antenna = this.scene.add.graphics();
            this.antenna.lineStyle(2, 0x888888, 1);
            this.antenna.moveTo(-8, -15); this.antenna.lineTo(-12, -25);
            this.antenna.moveTo(8, -15); this.antenna.lineTo(12, -25);
            this.add(this.antenna);
        }

        // 5. Eye
        const eyeColor = cfg.eyeColor || 0xff0000;
        const eyeRadius = type === 'SENTINEL' ? 7 : 5;
        this.eye = this.scene.add.graphics();
        this.eye.fillStyle(eyeColor, 1);
        this.eye.fillCircle(0, 0, eyeRadius);
        this.eye.lineStyle(1, 0xffffff, 0.5);
        this.eye.strokeCircle(0, 0, eyeRadius + 2);
        this.eye.setVisible(!this.hasSprite || !this.pixelArtEnabled);
        this.add(this.eye);

        // 6. Details
        this.details = this.scene.add.graphics();
        this.details.lineStyle(1, 0x333333, 0.5);
        this.details.moveTo(-10, -10); this.details.lineTo(-10, 10);
        this.details.moveTo(10, -10); this.details.lineTo(10, 10);
        this.details.setVisible(!this.hasSprite || !this.pixelArtEnabled);
        this.add(this.details);

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

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        
        // If we have a sprite, toggle visibility between sprite and procedural
        // If no sprite, we always show procedural (fallback)
        const showProcedural = !this.hasSprite || !enabled;
        const showSprite = this.hasSprite && enabled;
        
        if (this.sprite) this.sprite.setVisible(showSprite);
        if (this.bodyGraphic) this.bodyGraphic.setVisible(showProcedural);
        if (this.eye) this.eye.setVisible(showProcedural);
        if (this.details) this.details.setVisible(showProcedural);
        if (this.antenna) this.antenna.setVisible(showProcedural);
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

        // Update visuals if using pixel art
        if (this.hasSprite && this.pixelArtEnabled) {
            this.updateAnimation(player, dist);
        }

        // Update burst/cooldown timers
        if (this.isBursting) {
            this.burstTimer -= delta;
            if (this.burstTimer <= 0) this.isBursting = false;
        }
        if (this.burstCooldown > 0) {
            this.burstCooldown -= delta;
        }

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

            case 'LOCKED':
                this.handleLocked(player, delta);
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
            
            case 'RETREATING':
                this.handleRetreat(delta);
                break;
        }

        // Cleanup if way off screen
        const camY = this.scene.cameras.main.scrollY;
        
        // If retreating, we can be removed if we are off to the sides
        const isOffSides = this.x < -100 || this.x > 740;
        
        // Only cleanup if it's ABOVE the camera (passed) or VERY far below, or off sides during retreat
        if (this.y < camY - 400 || this.y > camY + 3000 || (this.aiState === 'RETREATING' && isOffSides)) {
            this.setActive(false).setVisible(false);
            if (this.body) this.body.enable = false;
            this.laserGraphic.clear();
        }
    }

    updateAnimation(player, dist) {
        // 1. Direction
        let angle = 0;
        const isMoving = this.body.velocity.length() > 5;
        
        if (isMoving) {
            angle = Phaser.Math.Angle.Between(0, 0, this.body.velocity.x, this.body.velocity.y);
        } else {
            // Face player if idle but active
            angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        }

        this.currentFacing = this.spriteRegistry.get8WayDirection(angle);

        // 2. State
        let state = 'idle';
        if (this.aiState === 'PURSUING' || this.aiState === 'RETREATING') {
            if (dist < 80 && this.aiState === 'PURSUING') {
                state = 'attack';
            } else if (isMoving) {
                state = 'walk';
            }
        } else if (this.aiState === 'ACQUIRING_TARGET' || this.aiState === 'FIRING') {
            state = 'attack'; // Sentinels claw out when ready? (Only Pursuer has sprites for now though)
        }

        const animKey = this.spriteRegistry.getAnimationKey('pursuer', state, this.currentFacing);
        if (animKey && this.sprite.anims.currentAnim?.key !== animKey) {
            this.sprite.play(animKey);
        }
    }

    handleRetreat(delta) {
        // Move towards retreat target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.retreatX, this.retreatY);
        const speed = this.combatConfig.speed * 1.5; // Increased speed during retreat
        
        // Obstacle avoidance (reuse logic)
        const isBlocked = this.body.speed < speed * 0.3 && (this.body.acceleration.x !== 0 || this.body.acceleration.y !== 0);
        let targetAngle = angle;
        if (isBlocked) {
            const timeFactor = Math.floor(this.scene.time.now / 400); // Faster steering
            const steerDir = (timeFactor % 2 === 0) ? 1 : -1;
            targetAngle += (Math.PI / 2) * steerDir;
        }

        this.body.setAcceleration(Math.cos(targetAngle) * 800, Math.sin(targetAngle) * 800);
        this.body.setMaxSpeed(speed);

        // Cancel any active laser
        this.laserGraphic.clear();
    }

    retreat() {
        if (this.aiState === 'RETREATING' || this.isDestroyed) return;
        
        this.aiState = 'RETREATING';
        
        // Determine exit: closest side
        const isLeftCloser = this.x < 320;
        this.retreatX = isLeftCloser ? -150 : 790;
        // Keep current Y or follow camera slightly
        this.retreatY = this.y;
        
        // Cancel firing
        if (this.fireTween) {
            this.fireTween.stop();
            this.fireTween = null;
        }
        this.laserGraphic.clear();
    }

    maybeTriggerCatchUp(multiplier) {
        if (this.aiState === 'RETREATING' || this.aiState === 'IDLE' || this.isDestroyed) return;
        if (this.isBursting || this.burstCooldown > 0) return;

        // 20% chance per check (if EncounterDirector calls it periodically)
        if (Math.random() > 0.8) {
            this.isBursting = true;
            this.burstTimer = 800 + Math.random() * 700; // 0.8 - 1.5s
            this.burstCooldown = 5000 + Math.random() * 5000; // 5-10s cooldown
            this.burstMultiplier = multiplier;
        }
    }

    handlePursue(player, dist) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        let speed = this.combatConfig.speed;
        
        if (this.isBursting) {
            speed *= this.burstMultiplier;
        }

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
        this.stateTimer += delta;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.laserAngle = angle;

        this.handleSentinelTactics(player, dist, delta);

        const laserLen = 1000;
        this.laserGraphic.clear();
        this.laserGraphic.lineStyle(1, 0xff0000, 0.4);
        
        const lx = Math.cos(this.laserAngle) * laserLen;
        const ly = Math.sin(this.laserAngle) * laserLen;
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();

        if (this.stateTimer >= this.laserConfig.trackingMs) {
            this.aiState = 'LOCKED';
            this.stateTimer = 0;
            // Brighter pulse on lock
            this.scene.tweens.add({
                targets: this.eye,
                scale: 1.5,
                duration: 100,
                yoyo: true
            });
        }
    }

    handleLocked(player, delta) {
        this.stateTimer += delta;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        this.handleSentinelTactics(player, dist, delta);

        const laserLen = 1000;
        this.laserGraphic.clear();
        // Brighter locked beam
        this.laserGraphic.lineStyle(2, 0xffffff, 0.6);
        
        const lx = Math.cos(this.laserAngle) * laserLen;
        const ly = Math.sin(this.laserAngle) * laserLen;
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();

        if (this.stateTimer >= this.laserConfig.lockedMs) {
            this.aiState = 'FIRING';
            this.stateTimer = 0;
        }
    }

    handleFiring(delta) {
        this.stateTimer += delta;
        this.body.setVelocity(0, 0);

        // Calculate impact based on LOCKED angle
        const result = this.calculateLaserImpact();
        const laserLen = result.distance;
        const beamWidth = this.laserConfig.beamWidth;

        this.laserGraphic.clear();
        this.laserGraphic.lineStyle(beamWidth / 2, 0xff0000, 1);
        this.laserGraphic.strokeCircle(0, 0, 4); 
        
        const lx = Math.cos(this.laserAngle) * laserLen;
        const ly = Math.sin(this.laserAngle) * laserLen;
        
        this.laserGraphic.lineStyle(beamWidth, 0xff6600, 0.3);
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();
        
        this.laserGraphic.lineStyle(beamWidth / 3, 0xffffff, 1);
        this.laserGraphic.moveTo(0, 0);
        this.laserGraphic.lineTo(lx, ly);
        this.laserGraphic.strokePath();

        if (this.stateTimer < delta * 2) { 
            this.applyLaserDamage(result);
        }

        if (this.stateTimer >= this.laserConfig.firingMs) {
            this.laserGraphic.clear();
            this.aiState = 'COOLDOWN';
            this.stateTimer = 0;
        }
    }

    handleSentinelTactics(player, dist, delta) {
        const prefDist = this.combatConfig.preferredDistance;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        // Ray-based laser blocking check for movement decision
        const hit = this.scene.getNearestObstacleAlongRay(this.x, this.y, this.laserAngle, 1000);
        const distToPlayer = dist;
        const isPlayerBlocked = hit && hit.distance < distToPlayer - 20;

        if (dist > prefDist + 50) {
            this.body.setVelocity(Math.cos(angle) * this.combatConfig.speed, Math.sin(angle) * this.combatConfig.speed);
        } else if (dist < prefDist - 50) {
            this.body.setVelocity(-Math.cos(angle) * this.combatConfig.speed, -Math.sin(angle) * this.combatConfig.speed);
        } else if (isPlayerBlocked) {
            const timeFactor = Math.floor(this.scene.time.now / 1000);
            const steerDir = (timeFactor % 2 === 0) ? 1 : -1;
            const sideAngle = this.laserAngle + (Math.PI / 2) * steerDir;
            this.body.setVelocity(Math.cos(sideAngle) * this.combatConfig.speed, Math.sin(sideAngle) * this.combatConfig.speed);
        } else {
            this.body.setVelocity(0, 0);
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
