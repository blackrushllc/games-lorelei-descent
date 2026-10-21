import Phaser from 'phaser';
import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * The playable character: Blackrush.
 */
export default class Blackrush extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.config = GAMEPLAY_CONFIG.player;
        this.combatConfig = COMBAT_CONFIG.player;

        // 1. Visuals
        this.spriteRegistry = scene.registry.get('spriteAnimationRegistry');
        this.pixelArtEnabled = true;

        // Sprite
        this.sprite = scene.add.sprite(0, 0, 'blackrush');
        this.sprite.setScale(2); // Configurable scale
        this.sprite.setVisible(this.pixelArtEnabled);

        // Procedural Graphics (Legacy/Fallback)
        this.bodyGraphic = scene.add.graphics();
        this.bodyGraphic.fillStyle(0x00aaff, 1);
        this.bodyGraphic.fillRect(-14, -20, 28, 40);
        this.bodyGraphic.lineStyle(2, 0xffffff, 1);
        this.bodyGraphic.strokeRect(-14, -20, 28, 40);
        this.bodyGraphic.setVisible(!this.pixelArtEnabled);

        this.headGraphic = scene.add.graphics();
        this.headGraphic.fillStyle(0xffffff, 1);
        this.headGraphic.fillCircle(0, -10, 8);
        this.headGraphic.setVisible(!this.pixelArtEnabled);

        // Direction indicator (aim indicator)
        this.aimIndicator = scene.add.graphics();
        this.aimIndicator.fillStyle(0xffff00, 1);
        this.aimIndicator.fillTriangle(30, 0, 15, -6, 15, 6);
        this.aimIndicator.setVisible(!this.pixelArtEnabled);

        this.label = scene.add.text(0, 30, 'BLACKRUSH', {
            fontSize: '12px',
            fill: '#00aaff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Shield Flash Effect
        this.shieldGraphic = scene.add.graphics();

        this.add([this.sprite, this.bodyGraphic, this.headGraphic, this.aimIndicator, this.label, this.shieldGraphic]);

        // 2. Combat State
        this.maxShield = this.combatConfig.maxShield;
        this.shield = this.maxShield;
        this.maxHearts = this.combatConfig.maxHearts;
        this.hearts = this.combatConfig.startingHearts;
        
        this.isDestroyed = false; // Currently defeated (this life)
        this.isRespawning = false;
        this.isFinalDefeat = false;
        
        this.invulnerabilityTimer = 0;
        this.lastDamageTime = 0;
        this.regenTimer = 0;

        // 3. Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Hitbox approx matching visual
        this.body.setCircle(18, -18, -18);
        this.body.setCollideWorldBounds(false);
        this.body.setMaxSpeed(this.config.maxSpeed);
        this.body.setDrag(this.config.deceleration);
        
        this.aimAngle = 0;
        this.currentFacing = 'south';
        this.currentAnimState = 'idle';
        this.forcePoseTimer = 0;
        this.isThrowingAxe = false;
        this.axeInterruptionTimer = 0;
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        this.sprite.setVisible(enabled);
        this.bodyGraphic.setVisible(!enabled);
        this.headGraphic.setVisible(!enabled);
        this.aimIndicator.setVisible(!enabled);
    }

    spendHeartForNova() {
        if (this.hearts >= COMBAT_CONFIG.nova.minHeartsRequired) {
            this.hearts -= COMBAT_CONFIG.nova.heartCost;
            
            // Apply invulnerability without shortening existing
            const novaInvul = COMBAT_CONFIG.nova.invulnerabilityWindow;
            this.invulnerabilityTimer = Math.max(this.invulnerabilityTimer, novaInvul);
            
            return true;
        }
        return false;
    }

    isInvulnerable() {
        return this.invulnerabilityTimer > 0;
    }

    reset() {
        this.shield = this.maxShield;
        this.hearts = this.combatConfig.startingHearts;
        this.isDestroyed = false;
        this.isRespawning = false;
        this.isFinalDefeat = false;
        this.invulnerabilityTimer = 0;
        this.lastDamageTime = 0;
        this.regenTimer = 0;
        this.alpha = 1;
        this.scale = 1;
        this.setVisible(true);
        if (this.body) {
            this.body.enable = true;
            this.body.setVelocity(0, 0);
        }
    }

    update(inputState, delta) {
        if (this.isFinalDefeat) return;

        if (this.isDestroyed || this.isRespawning) {
            if (this.body) {
                this.body.setAcceleration(0, 0);
                this.body.setVelocity(0, 0);
            }
            return;
        }

        // 0. Timers and Regeneration
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= delta;
            this.setAlpha(Math.sin(this.scene.time.now / 50) > 0 ? 0.5 : 1.0);
        } else {
            this.setAlpha(1.0);
        }

        if (this.forcePoseTimer > 0) {
            this.forcePoseTimer -= delta;
        }

        if (this.axeInterruptionTimer > 0) {
            this.axeInterruptionTimer -= delta;
        }

        // Shield Regeneration
        const now = this.scene.time.now;
        if (this.shield < this.maxShield && now - this.lastDamageTime >= this.combatConfig.regenDelay) {
            // Safety: Ensure delta and shield are numbers
            const d = typeof delta === 'number' ? delta : 0;
            const regenAmount = (this.combatConfig.regenRate * d) / 1000;
            
            if (!isNaN(regenAmount)) {
                this.shield = Math.min(this.maxShield, this.shield + regenAmount);
                if (isNaN(this.shield)) this.shield = this.maxShield; // Emergency recovery
                this.scene.hud.setShield(this.shield, this.maxShield);
                
                // Subtle regen visual
                this.showRegenEffect();
            }
        }

        if (!inputState) return;

        // 1. Aiming
        const dist = Phaser.Math.Distance.Between(this.x, this.y, inputState.aimX, inputState.aimY);
        if (dist > 10) {
            this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, inputState.aimX, inputState.aimY);
            this.aimIndicator.setRotation(this.aimAngle);
        }

        // 2. Movement
        if (this.axeInterruptionTimer <= 0 && (inputState.moveX !== 0 || inputState.moveY !== 0)) {
            let moveVec = new Phaser.Math.Vector2(inputState.moveX, inputState.moveY);
            if (moveVec.length() > 1) {
                moveVec.normalize();
            }
            this.body.setAcceleration(
                moveVec.x * this.config.acceleration,
                moveVec.y * this.config.acceleration
            );
        } else {
            this.body.setAcceleration(0, 0);
            if (this.axeInterruptionTimer > 0) {
                this.body.setVelocity(0, 0);
            }
        }

        // 3. Firing
        if (inputState.isFiringPrimary) {
            this.scene.weaponSystem.fireEnergy(this.x, this.y, this.aimAngle);
            this.forcePoseTimer = 350; // Configurable linger
        }
        if (inputState.isFiringSecondary) {
            if (this.scene.weaponSystem.fireAxe(this.x, this.y, this.aimAngle)) {
                this.triggerAxeThrow();
            }
        }

        // 4. Animation Stance
        if (this.pixelArtEnabled) {
            this.updateAnimation(inputState);
        }

        // 5. Bounds Enforcement
        this.constrainToBounds();
    }

    triggerAxeThrow() {
        this.isThrowingAxe = true;
        this.axeInterruptionTimer = 150; // Configurable brief interruption

        const dir = this.currentFacing;
        const animKey = this.spriteRegistry.getAnimationKey('blackrush', 'axe-throw', dir);
        if (animKey) {
            this.sprite.play(animKey);
            this.sprite.once('animationcomplete', () => {
                this.isThrowingAxe = false;
            });
        } else {
            this.isThrowingAxe = false;
        }
    }

    updateAnimation(inputState) {
        if (this.isThrowingAxe) return;

        // 1. Determine Direction
        // If firing or recently fired, face aim. Otherwise face movement.
        let targetAngle = this.aimAngle;
        const isMoving = this.body.velocity.length() > 10;
        
        if (this.forcePoseTimer <= 0 && isMoving && !inputState.isFiringPrimary) {
            targetAngle = Phaser.Math.Angle.Between(0, 0, this.body.velocity.x, this.body.velocity.y);
        }

        this.currentFacing = this.spriteRegistry.get8WayDirection(targetAngle);

        // 2. Determine State
        let state = 'idle';
        const isFiring = this.forcePoseTimer > 0;
        const speed = this.body.velocity.length();
        const isRunning = speed > this.config.maxSpeed * 0.7; // Threshold for run animation

        if (isFiring) {
            if (isMoving) {
                state = isRunning ? 'force-run' : 'force-walk';
            } else {
                state = 'force-idle';
            }
        } else if (isMoving) {
            state = isRunning ? 'run' : 'walk';
        } else {
            // Check axe availability for idle stance
            const axeAvailable = this.scene.weaponSystem.axes.countActive(false) > 0 || this.scene.weaponSystem.axeCooldown <= 0;
            // Actually check if the weapon system says it's ready.
            // For now, if no axes are in flight and cooldown is zero.
            if (axeAvailable && this.scene.weaponSystem.axeCooldown <= 0) {
                state = 'axe-ready';
            } else {
                state = 'idle';
            }
        }

        // 3. Play Animation
        const animKey = this.spriteRegistry.getAnimationKey('blackrush', state, this.currentFacing);
        if (animKey && this.sprite.anims.currentAnim?.key !== animKey) {
            this.sprite.play(animKey);
        }
    }

    onHit() {
        // Update damage timer for regen delay
        this.lastDamageTime = this.scene.time.now;

        // Visual shield flash
        this.shieldGraphic.clear();
        this.shieldGraphic.lineStyle(4, 0x00ffff, 0.8);
        this.shieldGraphic.strokeCircle(0, 0, 35);
        
        // Electric arcs
        this.shieldGraphic.lineStyle(2, 0xffffff, 1);
        for(let i=0; i<3; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.shieldGraphic.beginPath();
            this.shieldGraphic.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
            this.shieldGraphic.lineTo(Math.cos(angle) * 45, Math.sin(angle) * 45);
            this.shieldGraphic.strokePath();
        }

        this.scene.tweens.add({
            targets: this.shieldGraphic,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.shieldGraphic.clear();
                this.shieldGraphic.setAlpha(1);
            }
        });

        // Set invulnerability
        this.invulnerabilityTimer = this.combatConfig.invulnerabilityWindow;
    }

    showRegenEffect() {
        // Subtle cyan pulse on the head
        if (!this.regenTween || !this.regenTween.isPlaying()) {
            this.regenTween = this.scene.tweens.add({
                targets: this.headGraphic,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    this.headGraphic.setAlpha(1);
                }
            });
        }
    }

    die() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        
        if (this.body) {
            this.body.enable = false;
            this.body.setVelocity(0, 0);
            this.body.setAcceleration(0, 0);
        }
        
        // Debris/Explosion effect
        this.scene.events.emit('playerDestroyed', this);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 2,
            duration: 500
        });
    }

    constrainToBounds() {
        const camera = this.scene.cameras.main;
        const bounds = this.config.bounds;

        // Vertical boundaries (relative to camera)
        const topBound = camera.scrollY + bounds.top;
        const bottomBound = camera.scrollY + bounds.bottom;

        if (this.y < topBound) {
            this.y = topBound;
            
            // Viewport-forced collision resolution:
            // If pushed into an obstacle by the camera, try to escape forward
            const obstacles = this.scene.environment.obstacles;
            const walls = this.scene.environment.walls;
            
            if (this.scene.physics.world.overlap(this, obstacles) || this.scene.physics.world.overlap(this, walls)) {
                // Trapped! Attempt forward escape
                for (let offset = 5; offset <= 60; offset += 5) {
                    this.y = topBound + offset;
                    if (!this.scene.physics.world.overlap(this, obstacles) && !this.scene.physics.world.overlap(this, walls)) {
                        break;
                    }
                }
            }
            
            if (this.body.velocity.y < 0) this.body.velocity.y = 0;
        } else if (this.y > bottomBound) {
            this.y = bottomBound;
            if (this.body.velocity.y > 0) this.body.velocity.y = 0;
        }

        // Horizontal boundaries
        if (this.x < bounds.left) {
            this.x = bounds.left;
            this.body.velocity.x = Math.max(0, this.body.velocity.x);
        } else if (this.x > bounds.right) {
            this.x = bounds.right;
            this.body.velocity.x = Math.min(0, this.body.velocity.x);
        }
    }
}
