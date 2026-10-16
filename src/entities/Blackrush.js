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

        // Visuals
        this.bodyGraphic = scene.add.graphics();
        this.bodyGraphic.fillStyle(0x00aaff, 1);
        this.bodyGraphic.fillRect(-14, -20, 28, 40);
        this.bodyGraphic.lineStyle(2, 0xffffff, 1);
        this.bodyGraphic.strokeRect(-14, -20, 28, 40);

        this.headGraphic = scene.add.graphics();
        this.headGraphic.fillStyle(0xffffff, 1);
        this.headGraphic.fillCircle(0, -10, 8);

        // Direction indicator (aim indicator)
        this.aimIndicator = scene.add.graphics();
        this.aimIndicator.fillStyle(0xffff00, 1);
        this.aimIndicator.fillTriangle(30, 0, 15, -6, 15, 6);

        this.label = scene.add.text(0, 30, 'BLACKRUSH', {
            fontSize: '12px',
            fill: '#00aaff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Shield Flash Effect
        this.shieldGraphic = scene.add.graphics();

        this.add([this.bodyGraphic, this.headGraphic, this.aimIndicator, this.label, this.shieldGraphic]);

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
    }

    isInvulnerable() {
        return this.invulnerabilityTimer > 0;
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

        // Shield Regeneration
        const now = this.scene.time.now;
        if (this.shield < this.maxShield && now - this.lastDamageTime >= this.combatConfig.regenDelay) {
            const regenAmount = (this.combatConfig.regenRate * delta) / 1000;
            this.shield = Math.min(this.maxShield, this.shield + regenAmount);
            this.scene.hud.setShield(this.shield, this.maxShield);
            
            // Subtle regen visual (pulsing eye or glow?)
            this.showRegenEffect();
        }

        if (!inputState) return;

        // 1. Aiming
        const dist = Phaser.Math.Distance.Between(this.x, this.y, inputState.aimX, inputState.aimY);
        if (dist > 10) {
            this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, inputState.aimX, inputState.aimY);
            this.aimIndicator.setRotation(this.aimAngle);
        }

        // 2. Movement
        if (inputState.moveX !== 0 || inputState.moveY !== 0) {
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
        }

        // 3. Firing
        if (inputState.isFiringPrimary) {
            this.scene.weaponSystem.fireEnergy(this.x, this.y, this.aimAngle);
        }
        if (inputState.isFiringSecondary) {
            this.scene.weaponSystem.fireAxe(this.x, this.y, this.aimAngle);
        }

        // 4. Bounds Enforcement
        this.constrainToBounds();
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
