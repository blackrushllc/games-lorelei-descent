import Phaser from 'phaser';
import { PROXY_BOSS_CONFIG } from '../config/proxyBossConfig.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * The Proxy Boss entity.
 * Composed of multiple damageable components and a central core.
 */
export default class ProxyBoss extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;
        this.config = PROXY_BOSS_CONFIG;

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
        this.isLaserWarning = false;
        this.isLaserFiring = false;
        
        this.pixelArtEnabled = true;
        
        scene.add.existing(this);
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        // Boss currently has no pixel art sprites
        const showProcedural = true;
        
        this.components.forEach(comp => {
            if (comp.setPixelArtEnabled) comp.setPixelArtEnabled(enabled);
        });
        
        this.laserGraphic.setVisible(showProcedural);
    }

    setupComponents() {
        Object.entries(this.config.components).forEach(([key, cfg]) => {
            const comp = new BossComponent(this.scene, cfg.relativeX, cfg.relativeY, cfg);
            comp.boss = this;
            this.add(comp);
            this.components.set(key, comp);
            
            // Core is hidden until other components are weakened or specific cue
            if (cfg.exposedOnly) {
                comp.setVisible(false);
                comp.setActive(false);
                if (comp.body) comp.body.enable = false;
            }
        });
    }

    update(player, delta) {
        if (this.isDestroyed || this.state === 'DEFEATED') return;

        // Reset laser graphic
        this.laserGraphic.clear();

        // Behavior based on state
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
                // Do nothing while staggered
                break;
        }

        // Sync components if they had independent physics (not needed if they are in container)
        // But we want their bodies to be active for collisions
    }

    updateIdle(player, delta) {
        this.attackTimer += delta;
        this.moveTimer += delta;

        if (this.attackTimer > this.config.attacks.laser.cooldown) {
            this.state = 'ATTACKING';
            this.attackTimer = 0;
            this.startLaserAttack(player);
        } else if (this.moveTimer > 8000) { // Reposition every 8s
            this.state = 'MOVING';
            this.moveTimer = 0;
            this.pickNewTacticalPosition();
        }
    }

    pickNewTacticalPosition() {
        const arenaY = this.scene.descentController.getArenaPosition();
        const pos = this.config.tacticalPositions[Math.floor(Math.random() * this.config.tacticalPositions.length)];
        this.targetX = pos.x;
        this.targetY = arenaY + pos.y;
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
            this.isLaserWarning = false;
            this.isLaserFiring = false;
            this.state = 'IDLE';
            return;
        }

        if (this.isLaserWarning) {
            // Track player slowly
            const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.laserAngle = Phaser.Math.Angle.RotateTo(this.laserAngle, targetAngle, 0.02);
            this.drawLaser(false);
        } else if (this.isLaserFiring) {
            this.drawLaser(true);
        }
    }

    drawLaser(isDestructive) {
        this.laserGraphic.clear();
        
        // Calculate hit (simple for now)
        const maxLength = 2000;
        const lx = Math.cos(this.laserAngle) * maxLength;
        const ly = Math.sin(this.laserAngle) * maxLength;

        if (isDestructive) {
            this.laserGraphic.lineStyle(this.config.attacks.laser.beamWidth, 0xff00ff, 0.5);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
            
            this.laserGraphic.lineStyle(4, 0xffffff, 1);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
        } else {
            this.laserGraphic.lineStyle(2, 0xff00ff, 0.4);
            this.laserGraphic.moveTo(0, 0);
            this.laserGraphic.lineTo(lx, ly);
            this.laserGraphic.strokePath();
        }
    }

    startLaserAttack(player) {
        this.isLaserWarning = true;
        this.isLaserFiring = false;
        this.laserAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        this.scene.time.delayedCall(this.config.attacks.laser.warningTime, () => {
            if (this.state === 'ATTACKING') {
                this.fireLaser(player);
            }
        });
    }

    fireLaser(player) {
        this.isLaserWarning = false;
        this.isLaserFiring = true;

        // Apply damage if hit
        this.applyLaserDamage(player);

        this.scene.time.delayedCall(this.config.attacks.laser.fireTime, () => {
            this.isLaserFiring = false;
            if (this.state === 'ATTACKING') this.state = 'IDLE';
        });
    }

    applyLaserDamage(player) {
        const maxLength = 2000;
        const ray = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.laserAngle) * maxLength, this.y + Math.sin(this.laserAngle) * maxLength);
        const playerCircle = new Phaser.Geom.Circle(player.x, player.y, 25);
        
        if (Phaser.Geom.Intersects.GetLineToCircle(ray, playerCircle)) {
            const attack = {
                type: 'LASER',
                damage: this.config.attacks.laser.damage,
                direction: this.laserAngle,
                knockback: 100
            };
            if (this.scene.handlePlayerDamage) {
                this.scene.handlePlayerDamage(attack);
            }
        }
    }

    onComponentHit(component, attack) {
        // Handle damage to specific component
        // Armor reduction, health reduction, visual feedback
        const result = component.takeDamage(attack);
        
        if (component.hp <= 0 && !component.cfg.exposedOnly) {
            this.checkExposeCore();
        }
        
        return result;
    }

    checkExposeCore() {
        // If enough components are destroyed, expose core
        const brokenCount = [...this.components.values()].filter(c => c.hp <= 0 && !c.cfg.exposedOnly).length;
        if (brokenCount >= 2) {
            const core = this.components.get('CORE');
            if (core) {
                core.setVisible(true);
                core.setActive(true);
                if (core.body) core.body.enable = true;
            }
        }
    }

    die() {
        this.isDestroyed = true;
        this.state = 'DEFEATED';
        this.alpha = 0.5;
        // Trigger destruction effects in Scene
    }
}

/**
 * Sub-component of the boss that can be targeted.
 */
class BossComponent extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cfg) {
        super(scene, x, y);
        this.scene = scene;
        this.cfg = cfg;
        this.hp = cfg.health;
        this.armor = cfg.armor;
        
        // Visuals
        this.graphic = scene.add.graphics();
        this.draw(0xaa00ff);
        this.add(this.graphic);
        
        // Physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(cfg.radius, -cfg.radius, -cfg.radius);
        
        this.pixelArtEnabled = true;
    }

    setPixelArtEnabled(enabled) {
        this.pixelArtEnabled = enabled;
        // Boss components currently have no pixel art sprites
        const showProcedural = true;
        this.graphic.setVisible(showProcedural);
    }

    draw(color) {
        this.graphic.clear();
        this.graphic.fillStyle(color, 1);
        this.graphic.fillCircle(0, 0, this.cfg.radius);
        this.graphic.lineStyle(2, 0xffffff, 0.5);
        this.graphic.strokeCircle(0, 0, this.cfg.radius);
    }

    takeDamage(attack) {
        if (this.hp <= 0) return COMBAT_CONFIG.results.NO_DAMAGE;

        let damage = attack.damage;
        let result = COMBAT_CONFIG.results.HEALTH_DAMAGED;

        const worldPos = {
            x: this.boss.x + this.x,
            y: this.boss.y + this.y,
            combatConfig: { color: 0xaa00ff }
        };

        if (this.armor > 0) {
            if (attack.armorBreaking) {
                this.armor--;
                result = COMBAT_CONFIG.results.ARMOR_BROKEN;
                this.scene.events.emit('robotArmorHit', worldPos, true);
            } else {
                return COMBAT_CONFIG.results.ARMOR_HIT;
            }
        }

        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.draw(0x333333); // Darkened/destroyed look
            result = COMBAT_CONFIG.results.TARGET_DESTROYED;
            this.scene.events.emit('robotDestroyed', worldPos);
        } else {
            // Flash effect
            this.scene.tweens.add({
                targets: this.graphic,
                alpha: 0.2,
                duration: 50,
                yoyo: true,
                repeat: 1
            });
        }

        return result;
    }
}
