import Phaser from 'phaser';
import { SUPER_ROBOT_CONFIG } from '../config/superRobotConfig.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * The Super Robot (Giant Robot) Boss entity for CATHEDRAL.
 */
export default class SuperRobot extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;
        this.config = SUPER_ROBOT_CONFIG;

        this.hp = this.config.health;
        this.isDestroyed = false;
        this.state = 'IDLE'; // IDLE, ATTACKING, MOVING, STAGGERED, DEFEATED
        
        this.components = new Map();
        this.setupComponents();
        
        this.laserGraphic = scene.add.graphics();
        this.add(this.laserGraphic);
        
        this.targetX = x;
        this.targetY = y;
        this.attackTimer = 0;
        this.moveTimer = 0;
        
        this.laserAngle = 0;
        this.laserConfig = this.config.attacks.megaLaser.laserConfig;
        this.attackSubState = 'NONE';
        
        this.pixelArtEnabled = true;
        
        scene.add.existing(this);
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        this.components.forEach(comp => {
            if (comp.setPixelArtEnabled) comp.setPixelArtEnabled(enabled);
        });
    }

    reset() {
        this.hp = this.config.health;
        this.isDestroyed = false;
        this.state = 'IDLE';
        this.attackTimer = 0;
        this.moveTimer = 0;
        this.attackSubState = 'NONE';
        this.laserGraphic.clear();
        this.alpha = 1.0;
        
        this.components.forEach((comp, key) => {
            comp.reset();
            const cfg = this.config.components[key];
            if (cfg.exposedOnly) {
                comp.setVisible(false);
                comp.setActive(false);
                if (comp.body) comp.body.enable = false;
            } else {
                comp.setVisible(true);
                comp.setActive(true);
                if (comp.body) comp.body.enable = true;
            }
        });
    }

    setupComponents() {
        Object.entries(this.config.components).forEach(([key, cfg]) => {
            const comp = new BossComponent(this.scene, cfg.relativeX, cfg.relativeY, cfg);
            comp.boss = this;
            this.add(comp);
            this.components.set(key, comp);
            
            if (cfg.exposedOnly) {
                comp.setVisible(false);
                comp.setActive(false);
                if (comp.body) comp.body.enable = false;
            }
        });
    }

    update(player, delta) {
        if (this.isDestroyed || this.state === 'DEFEATED') return;

        this.laserGraphic.clear();

        switch (this.state) {
            case 'IDLE':
                this.updateIdle(player, delta);
                break;
            case 'MOVING':
                this.updateMoving(player, delta);
                break;
            case 'ATTACKING':
                this.updateAttacking(player, delta);
                break;
            case 'STAGGERED':
                // Temporarily disabled/vulnerable
                break;
        }

        // Reduced capabilities if components are destroyed
        const functionalComponents = [...this.components.values()].filter(c => c.hp > 0 && !c.cfg.exposedOnly).length;
        if (functionalComponents < 2 && this.state !== 'STAGGERED' && this.state !== 'DEFEATED') {
            this.checkExposeCore();
        }
    }

    updateIdle(player, delta) {
        this.attackTimer += delta;
        this.moveTimer += delta;

        if (this.attackTimer > this.config.attacks.megaLaser.cooldown) {
            this.startLaserAttack(player);
            this.attackTimer = 0;
        } else if (this.moveTimer > 3000) {
            const pos = Phaser.Utils.Array.GetRandom(this.config.tacticalPositions);
            this.targetX = pos.x;
            this.targetY = this.y; // Keep vertical relative to arena
            this.state = 'MOVING';
            this.moveTimer = 0;
        }
    }

    updateMoving(player, delta) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
        if (dist < 10) {
            this.state = 'IDLE';
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
        const step = (this.config.moveSpeed * delta) / 1000;
        this.x += Math.cos(angle) * step;
        this.y += Math.sin(angle) * step;
    }

    updateAttacking(player, delta) {
        if (!player || player.isDestroyed) {
            this.attackSubState = 'NONE';
            this.state = 'IDLE';
            return;
        }

        this.attackTimer += delta;

        if (this.attackSubState === 'TRACKING') {
            const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.laserAngle = Phaser.Math.Angle.RotateTo(this.laserAngle, targetAngle, 0.02);
            this.drawLaser('TRACKING');

            if (this.attackTimer >= this.laserConfig.trackingMs) {
                this.attackSubState = 'LOCKED';
                this.attackTimer = 0;
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1.05, scaleY: 1.05,
                    duration: 100, yoyo: true
                });
            }
        } else if (this.attackSubState === 'LOCKED') {
            this.drawLaser('LOCKED');
            if (this.attackTimer >= this.laserConfig.lockedMs) {
                this.attackSubState = 'FIRING';
                this.attackTimer = 0;
                this.applyLaserDamage(player);
            }
        } else if (this.attackSubState === 'FIRING') {
            this.drawLaser('FIRING');
            if (this.attackTimer >= this.laserConfig.firingMs) {
                this.attackSubState = 'NONE';
                this.state = 'IDLE';
                this.attackTimer = 0;
            }
        }
    }

    drawLaser(mode) {
        this.laserGraphic.clear();
        const maxLength = 2000;
        const lx = Math.cos(this.laserAngle) * maxLength;
        const ly = Math.sin(this.laserAngle) * maxLength;
        const beamWidth = this.laserConfig.beamWidth;

        if (mode === 'FIRING') {
            this.laserGraphic.lineStyle(beamWidth, 0xff3300, 0.6);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
            this.laserGraphic.lineStyle(beamWidth / 4, 0xffffff, 1);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
        } else if (mode === 'LOCKED') {
            this.laserGraphic.lineStyle(4, 0xffffff, 0.6);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
            this.laserGraphic.lineStyle(2, 0xff3300, 0.8);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
        } else {
            this.laserGraphic.lineStyle(2, 0xff3300, 0.4);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
        }
    }

    startLaserAttack(player) {
        this.state = 'ATTACKING';
        this.attackSubState = 'TRACKING';
        this.attackTimer = 0;
        this.laserAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    }

    applyLaserDamage(player) {
        const maxLength = 2000;
        const ray = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.laserAngle) * maxLength, this.y + Math.sin(this.laserAngle) * maxLength);
        const playerCircle = new Phaser.Geom.Circle(player.x, player.y, 25);
        
        // Blocking cover
        const obsHit = this.scene.getNearestObstacleAlongRay(this.x, this.y, this.laserAngle, maxLength);
        const playerDist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (obsHit && obsHit.distance < playerDist - 20) return;

        if (Phaser.Geom.Intersects.GetLineToCircle(ray, playerCircle)) {
            const attack = {
                type: 'LASER',
                damage: this.config.attacks.megaLaser.damage,
                direction: this.laserAngle,
                knockback: 200
            };
            if (this.scene.handlePlayerDamage) this.scene.handlePlayerDamage(attack);
        }
    }

    onComponentHit(component, attack) {
        const result = component.takeDamage(attack);
        if (component.hp <= 0 && !component.cfg.exposedOnly) {
            this.checkExposeCore();
        }
        return result;
    }

    checkExposeCore() {
        const brokenCount = [...this.components.values()].filter(c => c.hp <= 0 && !c.cfg.exposedOnly).length;
        if (brokenCount >= 3) {
            const core = this.components.get('CORE');
            if (core && !core.visible) {
                core.setVisible(true);
                core.setActive(true);
                if (core.body) core.body.enable = true;
                this.scene.events.emit('bossCoreExposed', this);
            }
        }
    }

    die() {
        if (this.state === 'DEFEATED') return;
        this.state = 'DEFEATED';
        this.isDestroyed = true;
        this.laserGraphic.clear();
        this.attackSubState = 'NONE';
        
        // Disable components
        this.components.forEach(comp => {
            comp.setActive(false);
            if (comp.body) comp.body.enable = false;
        });

        // Procedural destruction effect
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.5,
            duration: 2000,
            onComplete: () => {
                this.setVisible(false);
            }
        });

        // Explosions
        for (let i = 0; i < 15; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const rx = this.x + (Math.random() - 0.5) * 150;
                const ry = this.y + (Math.random() - 0.5) * 200;
                this.scene.createImpactSparks(rx, ry, Math.random() * Math.PI * 2, true);
            });
        }
    }
}

/**
 * Reusable Boss Component class.
 */
class BossComponent extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cfg) {
        super(scene, x, y);
        this.scene = scene;
        this.cfg = cfg;
        this.hp = cfg.health;
        this.armor = cfg.armor;
        
        this.graphic = scene.add.graphics();
        this.draw();
        this.add(this.graphic);
        
        scene.physics.add.existing(this);
        this.body.setCircle(cfg.radius, -cfg.radius, -cfg.radius);
    }

    draw() {
        this.graphic.clear();
        const color = this.hp > 0 ? (this.armor > 0 ? 0x888888 : 0xaa0000) : 0x333333;
        if (this.cfg.exposedOnly) {
            this.graphic.fillStyle(0xffaa00, 1);
            this.graphic.fillCircle(0, 0, this.cfg.radius);
            this.graphic.lineStyle(4, 0xff0000, 1);
            this.graphic.strokeCircle(0, 0, this.cfg.radius);
        } else {
            this.graphic.fillStyle(color, 1);
            this.graphic.fillCircle(0, 0, this.cfg.radius);
            this.graphic.lineStyle(2, 0xffffff, 0.5);
            this.graphic.strokeCircle(0, 0, this.cfg.radius);
        }
    }

    takeDamage(attack) {
        if (this.hp <= 0) return COMBAT_CONFIG.results.NO_DAMAGE;
        
        if (this.armor > 0 && !attack.armorBreaking) {
            return COMBAT_CONFIG.results.ARMOR_HIT;
        }
        
        if (this.armor > 0 && attack.armorBreaking) {
            this.armor--;
            this.draw();
            return this.armor <= 0 ? COMBAT_CONFIG.results.ARMOR_BROKEN : COMBAT_CONFIG.results.ARMOR_HIT;
        }
        
        this.hp -= attack.damage;
        this.draw();
        
        if (this.hp <= 0) {
            this.setActive(false);
            if (this.body) this.body.enable = false;
            return COMBAT_CONFIG.results.TARGET_DESTROYED;
        }
        
        return COMBAT_CONFIG.results.HEALTH_DAMAGED;
    }

    reset() {
        this.hp = this.cfg.health;
        this.armor = this.cfg.armor;
        this.draw();
    }

    setPixelArtEnabled(enabled) {
        // Boss components are currently procedural
    }
}
