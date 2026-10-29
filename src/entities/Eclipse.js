import Phaser from 'phaser';
import { COMBAT_CONFIG } from '../config/combatConfig.js';
import CombatSystem from '../systems/CombatSystem.js';

/**
 * Eclipse: Blackrush's wife and fellow veteran.
 * Autonomous companion with super-speed interception capabilities.
 */
export default class Eclipse extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.followConfig = COMBAT_CONFIG.eclipse.follow;
        this.interceptionConfig = COMBAT_CONFIG.eclipse.interception;

        // 1. Visuals
        this.spriteRegistry = scene.registry.get('spriteAnimationRegistry');
        this.pixelArtEnabled = true;
        this.currentFacing = 'south';
        this.currentAnimState = 'idle';
        this.hasSprite = false;
        this.createVisuals();

        // 2. State Machine
        this.aiState = 'FOLLOWING'; // FOLLOWING, PREPARING, BURSTING, RETURNING
        this.stateTimer = 0;
        this.cooldownTimer = 0;
        this.target = null;
        this.isDestroyed = false;
        
        this.stats = {
            totalInterceptions: 0,
            totalKills: 0
        };

        // 3. Trail Management
        this.trailTimer = 0;

        // 4. Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        const hitRadius = 16;
        if (this.body) {
            this.body.setCircle(hitRadius, -hitRadius, -hitRadius);
            this.body.setDrag(this.followConfig.deceleration);
            this.body.setCollideWorldBounds(false);
        }
    }

    createVisuals() {
        const entityId = 'eclipse';
        
        if (this.spriteRegistry) {
            this.sprite = this.scene.add.sprite(0, 0, entityId);
            this.sprite.setScale(2.0); // Veteran scale (same as Blackrush)
            this.sprite.setVisible(this.pixelArtEnabled);
            if (typeof this.sprite.setOriginFromFrame === 'function') {
                this.sprite.setOriginFromFrame();
            }
            this.add(this.sprite);
            this.hasSprite = true;
        }

        // Procedural Fallback
        this.bodyGraphic = this.scene.add.graphics();
        this.bodyGraphic.fillStyle(0x333333, 1); // Dark Gray / Black suit
        this.bodyGraphic.fillRect(-10, -20, 20, 40);
        this.bodyGraphic.lineStyle(2, 0xffffff, 1);
        this.bodyGraphic.strokeRect(-10, -20, 20, 40);
        this.bodyGraphic.setVisible(!this.pixelArtEnabled);
        
        this.headGraphic = this.scene.add.graphics();
        this.headGraphic.fillStyle(0xffffff, 1);
        this.headGraphic.fillCircle(0, -12, 7);
        this.headGraphic.setVisible(!this.pixelArtEnabled);

        this.label = this.scene.add.text(0, 25, 'ECLIPSE', {
            fontSize: '10px',
            fill: '#ffffff',
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
        } else {
            if (this.hasSprite && this.sprite.anims.isPaused) {
                this.sprite.anims.resume();
            }
        }

        // Update timers
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= delta;
        }

        // State Machine
        switch (this.aiState) {
            case 'FOLLOWING':
                this.handleFollowing(delta);
                break;
            case 'PREPARING':
                this.handlePreparing(delta);
                break;
            case 'BURSTING':
                this.handleBursting(delta);
                break;
            case 'RETURNING':
                this.handleReturning(delta);
                break;
        }

        this.updateAnimation(this.body.velocity);
    }

    handleFollowing(delta) {
        const player = this.scene.player;
        if (!player) return;

        // 1. Check for interception opportunity
        if (this.cooldownTimer <= 0) {
            const potentialTarget = this.acquireTarget();
            if (potentialTarget) {
                this.startInterception(potentialTarget);
                return;
            }
        }

        // 2. Normal follow logic
        const targetX = player.x - this.followConfig.formationOffsetX;
        const targetY = player.y + this.followConfig.formationOffsetY;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

        if (dist > this.followConfig.followDistance) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            const speed = dist > this.followConfig.catchUpDistance ? 
                          this.followConfig.runSpeed : this.followConfig.walkSpeed;
            
            this.body.setAcceleration(
                Math.cos(angle) * this.followConfig.acceleration,
                Math.sin(angle) * this.followConfig.acceleration
            );
            this.body.setMaxVelocity(speed);
        } else if (dist < this.followConfig.stopDistance) {
            this.body.setAcceleration(0, 0);
            this.body.setDrag(this.followConfig.deceleration);
        } else {
            this.body.setAcceleration(0, 0);
        }
    }

    acquireTarget() {
        const player = this.scene.player;
        if (!player) return null;

        // Must be within support range of Blackrush
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distToPlayer > this.followConfig.maximumSupportDistance) return null;

        // Get candidate robots
        const robots = this.scene.robotGroup.getChildren();
        let bestTarget = null;
        let bestScore = -1;

        for (const robot of robots) {
            if (!robot.active || robot.isDestroyed) continue;
            
            // Exclude Armored Pursuers for now
            if (robot.type === 'ARMORED_PURSUER') continue;

            const dist = Phaser.Math.Distance.Between(this.x, this.y, robot.x, robot.y);
            
            // Range check
            if (dist > this.interceptionConfig.radius) continue;

            // Visibility/Perimeter check: prefer robots within the viewport
            const cam = this.scene.cameras.main;
            const inViewport = robot.y > cam.scrollY && robot.y < cam.scrollY + cam.height;
            if (!inViewport) continue;

            // Score based on threat and distance
            let score = 0;
            if (robot.type === 'SENTINEL') score += 100; // Priority
            score += (1 - dist / this.interceptionConfig.radius) * 50; // Proximity

            // Avoid robots already inside Lorelei's threat radius if possible
            const lorelei = this.scene.lorelei;
            if (lorelei && lorelei.active) {
                const distToLorelei = Phaser.Math.Distance.Between(robot.x, robot.y, lorelei.x, lorelei.y);
                if (distToLorelei < COMBAT_CONFIG.lorelei.defense.threatRadius) {
                    score -= 80;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = robot;
            }
        }

        return bestTarget;
    }

    startInterception(target) {
        this.target = target;
        this.aiState = 'PREPARING';
        this.stateTimer = this.interceptionConfig.preparationDuration;
        this.body.setVelocity(0, 0);
        this.body.setAcceleration(0, 0);
        
        // Face target while preparing
        this.currentFacing = this.getFacingFromVelocity({
            x: target.x - this.x,
            y: target.y - this.y
        });
    }

    handlePreparing(delta) {
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
            if (this.target && this.target.active && !this.target.isDestroyed) {
                this.aiState = 'BURSTING';
                this.stateTimer = this.interceptionConfig.maxBurstDuration;
                this.trailTimer = 0;
            } else {
                this.aiState = 'FOLLOWING';
            }
        }
    }

    handleBursting(delta) {
        if (!this.target || !this.target.active || this.target.isDestroyed) {
            this.aiState = 'RETURNING';
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        
        // Path safety: check for obstacles
        const wallHit = this.scene.getNearestObstacleAlongRay(this.x, this.y, angle, 40);
        if (wallHit && wallHit.distance < 30) {
            // Path blocked, abandon
            this.aiState = 'RETURNING';
            return;
        }

        const vx = Math.cos(angle) * this.interceptionConfig.burstSpeed;
        const vy = Math.sin(angle) * this.interceptionConfig.burstSpeed;
        
        this.body.setVelocity(vx, vy);

        // Trail effect
        this.trailTimer += delta;
        if (this.trailTimer >= this.interceptionConfig.trailFrequency) {
            this.createTrail();
            this.trailTimer = 0;
        }

        // Swept collision or simple proximity? 
        // Requirements say use swept if needed. 
        // Given 1200 px/s, we move ~20px per frame at 60fps.
        // Robot target radius is ~28px. Simple overlap should be okay but let's be safe.
        if (dist < 40) {
            this.deliverStrike();
        }

        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
            this.aiState = 'RETURNING';
        }
    }

    deliverStrike() {
        if (this.target && this.target.active && !this.target.isDestroyed) {
            // Decisive contact attack
            const result = CombatSystem.processAttack({
                type: COMBAT_CONFIG.types.CONTACT,
                damage: 10, // Enough to destroy ordinary robots
                direction: Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y),
                knockback: 0
            }, this.target);
            
            if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                this.stats.totalKills++;
                this.target.die();
            } else if (this.target.onHit) {
                this.target.onHit(result);
            }
            
            // Visual hit confirmation
            const flash = this.scene.add.graphics();
            flash.fillStyle(0xffffff, 0.8);
            flash.fillCircle(this.target.x, this.target.y, 30);
            this.scene.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 200,
                onComplete: () => flash.destroy()
            });
        }
        
        this.stats.totalInterceptions++;
        this.cooldownTimer = this.interceptionConfig.cooldown;
        this.aiState = 'RETURNING';
    }

    handleReturning(delta) {
        const player = this.scene.player;
        if (!player) {
            this.aiState = 'FOLLOWING';
            return;
        }

        const targetX = player.x - this.followConfig.formationOffsetX;
        const targetY = player.y + this.followConfig.formationOffsetY;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

        if (dist < this.interceptionConfig.returnDistance) {
            this.aiState = 'FOLLOWING';
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const vx = Math.cos(angle) * this.interceptionConfig.burstSpeed * 0.8;
        const vy = Math.sin(angle) * this.interceptionConfig.burstSpeed * 0.8;
        
        this.body.setVelocity(vx, vy);

        // Trail effect
        this.trailTimer += delta;
        if (this.trailTimer >= this.interceptionConfig.trailFrequency) {
            this.createTrail();
            this.trailTimer = 0;
        }
    }

    createTrail() {
        if (!this.hasSprite || !this.sprite.visible) return;
        
        const trail = this.scene.add.sprite(this.x, this.y, this.sprite.texture.key, this.sprite.frame.name);
        trail.setScale(this.sprite.scaleX, this.sprite.scaleY);
        trail.setAlpha(0.4);
        trail.setDepth(this.depth - 1);
        trail.setTint(0xccccff);
        
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: this.interceptionConfig.trailLifetime,
            onComplete: () => trail.destroy()
        });
    }

    updateAnimation(velocity) {
        if (!this.hasSprite || !this.sprite.anims) return;

        let newState = this.aiState === 'PREPARING' ? 'crouch' : 'idle';
        let facing = this.currentFacing;

        if (this.aiState === 'BURSTING' || this.aiState === 'RETURNING') {
            newState = 'run';
            facing = this.getFacingFromVelocity(velocity);
        } else if (this.aiState === 'FOLLOWING') {
            const speed = velocity.length();
            if (speed > 10) {
                newState = speed > this.followConfig.walkSpeed + 10 ? 'run' : 'walk';
                facing = this.getFacingFromVelocity(velocity);
            }
        }

        const animKey = this.spriteRegistry.resolve('eclipse', newState, facing);
        if (animKey && this.sprite.anims.currentAnim?.key !== animKey) {
            this.sprite.play(animKey);
            this.currentFacing = facing;
            this.currentAnimState = newState;
        }
    }

    getFacingFromVelocity(vel) {
        if (Math.abs(vel.x) < 0.1 && Math.abs(vel.y) < 0.1) return this.currentFacing;
        
        const angle = Math.atan2(vel.y, vel.x) * (180 / Math.PI);
        const normalized = (angle + 360 + 22.5) % 360;
        const index = Math.floor(normalized / 45);
        
        const directions = [
            'east', 'south-east', 'south', 'south-west', 
            'west', 'north-west', 'north', 'north-east'
        ];
        return directions[index];
    }

    die() {
        this.isDestroyed = true;
        this.active = false;
        this.visible = false;
        if (this.body) this.body.enable = false;
    }

    getWeaponOrigin() {
        const offset = COMBAT_CONFIG.geometry.eclipse.weaponOrigin;
        return { x: this.x + offset.x, y: this.y + offset.y };
    }

    getTargetRegion() {
        const offset = COMBAT_CONFIG.geometry.eclipse.targetCenter;
        return {
            x: this.x + offset.x,
            y: this.y + offset.y,
            radius: COMBAT_CONFIG.geometry.eclipse.targetRadius
        };
    }
}
