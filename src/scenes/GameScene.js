import Phaser from 'phaser';
import ChamberBuilder from '../systems/ChamberBuilder.js';
import Blackrush from '../entities/Blackrush.js';
import Robot from '../entities/Robot.js';
import Hud from '../ui/Hud.js';
import DescentController from '../systems/DescentController.js';
import DesktopControls from '../controls/DesktopControls.js';
import WeaponSystem from '../systems/WeaponSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.sessionID = data.sessionID || 0;
        console.log(`[SESSION ${this.sessionID}] GAME_SCENE_CREATE`);
    }

    create() {
        const { width, height } = this.game.config;

        this.timeline = this.game.timelineDirector;
        this.score = 0;
        this.isGameOver = false;

        // 1. Build Chamber
        this.chamberBuilder = new ChamberBuilder(this);
        this.environment = this.chamberBuilder.build();

        // Set world bounds to match the large descent (50,000 pixels)
        this.cameras.main.setBounds(0, 0, 640, 50000);

        // 2. Initialize Gameplay Systems
        this.descentController = new DescentController(this.timeline);
        this.controls = new DesktopControls(this);
        this.weaponSystem = new WeaponSystem(this);

        // 3. Add Blackrush (Player)
        this.player = new Blackrush(this, 320, 450);
        console.log(`[SESSION ${this.sessionID}] PLAYER_CREATED`);

        // 4. Robot Group
        this.robotGroup = this.physics.add.group({
            classType: Robot,
            runChildUpdate: true
        });

        // 5. Initial Test Encounter
        this.spawnTestEncounter();
        console.log(`[SESSION ${this.sessionID}] ENCOUNTER_INITIALIZED`);

        // 6. Collisions
        this.setupCollisions();

        // 7. Add HUD
        this.hud = new Hud(this);

        // 8. Event Listeners for Combat
        this.setupCombatEvents();

        // 9. Back to Title Button (Dev purposes)
        const backButton = this.add.text(width - 20, height - 20, 'BACK TO TITLE', {
            fontSize: '18px', fill: '#ffffff', fontFamily: 'Arial',
            backgroundColor: '#333333', padding: { x: 10, y: 5 }
        })
        .setOrigin(1, 1)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .on('pointerdown', () => this.returnToTitle());

        // Timeline Event Listeners
        this.setupTimelineListeners();

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            this.cleanupTimelineListeners();
        });

        console.log('GameScene: Step 5 Combat Prototype loaded.');
    }

    spawnTestEncounter() {
        const isDebug = window.location.search.includes('debug=1');
        if (isDebug) console.log(`[SESSION ${this.sessionID}] Spawning test encounter...`);
        
        // Deterministic placements for testing relative to current camera scroll
        // Use descentController to get authoritative depth even before first camera update
        const cameraY = this.descentController ? this.descentController.getTargetScrollY() : 0;
        const startY = cameraY + 300;
        const encounters = [
            { x: 150, y: startY, type: 'PURSUER' },
            { x: 500, y: startY + 100, type: 'PURSUER' },
            { x: 320, y: startY + 400, type: 'SENTINEL' },
            { x: 100, y: startY + 800, type: 'ARMORED_PURSUER' },
            { x: 550, y: startY + 1100, type: 'PURSUER' },
            { x: 200, y: startY + 1400, type: 'SENTINEL' },
            { x: 450, y: startY + 1800, type: 'ARMORED_PURSUER' }
        ];

        encounters.forEach(e => {
            const robot = new Robot(this, e.x, e.y, e.type);
            this.robotGroup.add(robot);
        });

        if (isDebug) console.log(`[SESSION ${this.sessionID}] Spawned ${this.robotGroup.getLength()} robots.`);
    }

    setupCollisions() {
        // Projectiles vs Robots
        this.physics.add.overlap(this.weaponSystem.energyProjectiles, this.robotGroup, this.handleProjectileRobotCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.axes, this.robotGroup, this.handleProjectileRobotCollision, null, this);
        
        // Player vs Robots (Contact damage)
        this.physics.add.overlap(this.player, this.robotGroup, this.handlePlayerRobotCollision, null, this);
    }

    handleProjectileRobotCollision(projectile, robot) {
        if (robot.isDestroyed || !projectile.active || projectile.hitTargets.has(robot)) return;

        const isDebug = window.location.search.includes('debug=1');
        const isAxe = projectile.texture.key === 'axe';
        const weaponCfg = isAxe ? COMBAT_CONFIG.weapons.axe : COMBAT_CONFIG.weapons.energy;
        
        const attack = {
            type: isAxe ? COMBAT_CONFIG.types.AXE : COMBAT_CONFIG.types.ENERGY,
            damage: weaponCfg.damage,
            armorBreaking: weaponCfg.armorBreaking,
            direction: projectile.rotation - Math.PI / 2, // Projectile rotation is offset
            knockback: weaponCfg.knockback
        };

        if (isDebug) {
            console.log(`[COLLISION] Projectile(${projectile.texture.key}) -> Robot(${robot.type}, id=${robot.name || 'N/A'})`);
        }

        const result = CombatSystem.processAttack(attack, robot);
        
        // Effects and cleanup
        if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
            // Track hit to prevent multi-damage
            projectile.hitTargets.add(robot);

            // Apply knockback
            if (attack.knockback > 0) {
                robot.applyKnockback(attack.direction, attack.knockback);
            }

            // Hit confirmation (sparks)
            this.createImpactSparks(projectile.x, projectile.y, attack.direction, isAxe);

            if (!isAxe) {
                projectile.deactivate();
            }

            // Scoring and Death
            if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                this.addScore(CombatSystem.getScoreForResult(result, robot.combatConfig));
                if (isDebug) console.log(`[DEATH] Robot(${robot.type}) destroyed.`);
                robot.die();
            } else if (result === COMBAT_CONFIG.results.ARMOR_BROKEN) {
                this.addScore(CombatSystem.getScoreForResult(result, robot.combatConfig));
                if (isDebug) console.log(`[ARMOR] Robot(${robot.type}) armor broken.`);
                robot.onHit(result);
            } else {
                robot.onHit(result);
            }
        }
    }

    handlePlayerRobotCollision(player, robot) {
        if (robot.isDestroyed || player.isDestroyed || player.isInvulnerable()) return;

        const attack = {
            type: COMBAT_CONFIG.types.CONTACT,
            damage: robot.combatConfig.contactDamage,
            direction: Phaser.Math.Angle.Between(robot.x, robot.y, player.x, player.y),
            knockback: 200
        };

        const result = CombatSystem.processAttack(attack, player);
        if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
            player.onHit();
            this.hud.setShield(player.shield, player.maxShield);

            if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                this.handleGameOver();
            }
        }
    }

    setupCombatEvents() {
        this.events.on('robotAttack', (attackData) => {
            if (this.player.isDestroyed) return;
            const result = CombatSystem.processAttack(attackData, this.player);
            if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
                this.player.onHit();
                this.hud.setShield(this.player.shield, this.player.maxShield);
                if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                    this.handleGameOver();
                }
            }
        });

        this.events.on('robotDestroyed', (robot) => {
            this.createDestructionEffect(robot);
        });

        this.events.on('robotArmorHit', (robot, broken) => {
            this.createArmorImpactEffect(robot, broken);
        });

        this.events.on('playerDestroyed', (player) => {
            this.createPlayerDestructionEffect(player);
        });
    }

    addScore(points) {
        this.score += points;
        this.hud.setScore(this.score);
    }

    handleGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        console.log(`[SESSION ${this.sessionID}] PLAYER_DEFEATED`);
        this.player.die();
        this.timeline.pause();
        
        // Launch GameOverScene (keeping GameScene visible in background)
        this.scene.launch('GameOverScene');
    }

    // Effect implementations
    createImpactSparks(x, y, angle, isAxe) {
        const count = isAxe ? 8 : 4;
        for (let i = 0; i < count; i++) {
            const spark = this.add.graphics();
            spark.fillStyle(isAxe ? 0xaaaaaa : 0x00ffff, 1);
            spark.fillRect(-1, -1, 2, 2);
            spark.x = x;
            spark.y = y;
            
            const scatter = (Math.random() - 0.5) * 1.5;
            const sa = angle + Math.PI + scatter;
            const speed = 100 + Math.random() * 200;
            
            this.tweens.add({
                targets: spark,
                x: x + Math.cos(sa) * 40,
                y: y + Math.sin(sa) * 40,
                alpha: 0,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
    }

    createDestructionEffect(robot) {
        const { x, y } = robot;
        const color = robot.combatConfig.color;
        
        // 1. Core flash
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(x, y, 40);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 150,
            onComplete: () => flash.destroy()
        });

        // 2. Fragments
        for (let i = 0; i < 6; i++) {
            const frag = this.add.graphics();
            frag.fillStyle(color, 1);
            frag.fillRect(-5, -5, 10, 10);
            frag.x = x;
            frag.y = y;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 100;
            
            this.tweens.add({
                targets: frag,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                rotation: Math.random() * Math.PI * 4,
                alpha: 0,
                scale: 0.5,
                duration: 600,
                onComplete: () => frag.destroy()
            });
        }
    }

    createArmorImpactEffect(robot, broken) {
        const { x, y } = robot;
        if (broken) {
            // Large gray fragments
            for (let i = 0; i < 4; i++) {
                const frag = this.add.graphics();
                frag.fillStyle(0x808080, 1);
                frag.fillRect(-8, -8, 16, 8);
                frag.x = x;
                frag.y = y;
                const angle = Math.random() * Math.PI * 2;
                this.tweens.add({
                    targets: frag,
                    x: x + Math.cos(angle) * 80,
                    y: y + Math.sin(angle) * 80,
                    rotation: 5,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => frag.destroy()
                });
            }
        }
    }

    createPlayerDestructionEffect(player) {
        // Similar to robot but blue/cyan
        const { x, y } = player;
        const flash = this.add.graphics();
        flash.fillStyle(0x00ffff, 1);
        flash.fillCircle(x, y, 60);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    setupTimelineListeners() {
        this.onPhaseChange = (phase) => {
            if (this.hud) {
                this.hud.setPhaseLabel(phase.label);
            }
        };

        this.onTrackStart = (trackKey) => {
            console.log(`[SESSION ${this.sessionID}] TRACK_START: ${trackKey}`);
            
            // Full reset for track restart
            this.weaponSystem.reset();
            this.robotGroup.clear(true, true);
            this.reconcilePlayerWithCamera();
            this.spawnTestEncounter();
            
            this.player.shield = this.player.combatConfig.maxShield;
            this.player.isDestroyed = false;
            if (this.player.body) {
                this.player.body.enable = true;
            }
            this.player.setAlpha(1);
            this.player.setScale(1);
            this.isGameOver = false;
            
            this.hud.setShield(this.player.shield, this.player.combatConfig.maxShield);
            this.score = 0;
            this.hud.setScore(0);
        };

        this.onSeek = () => {
            const isDebug = window.location.search.includes('debug=1');
            if (isDebug) console.log(`[SESSION ${this.sessionID}] DEVELOPER_SEEK`);
            
            // Requirement 18: Reset transient state after seeking
            this.weaponSystem.reset();
            this.robotGroup.clear(true, true);
            
            // Reconcile camera first so spawnTestEncounter uses correct scrollY
            this.reconcilePlayerWithCamera();
            this.spawnTestEncounter();
            
            // Reset combat stats for dev purposes as per policy (Step 5.3 section 8)
            this.player.shield = this.player.combatConfig.maxShield;
            this.player.isDestroyed = false;
            if (this.player.body) {
                this.player.body.enable = true;
            }
            this.player.setAlpha(1);
            this.player.setScale(1);
            this.isGameOver = false;
            
            this.hud.setShield(this.player.shield, this.player.combatConfig.maxShield);
            this.score = 0;
            this.hud.setScore(0);
        };

        this.onDebugReturnToTitle = () => {
            this.returnToTitle();
        };

        this.timeline.on('phaseChange', this.onPhaseChange);
        this.timeline.on('trackStart', this.onTrackStart);
        this.timeline.on('seek', this.onSeek);
        this.timeline.on('debugReturnToTitle', this.onDebugReturnToTitle);
    }

    cleanupTimelineListeners() {
        if (this.timeline) {
            this.timeline.off('phaseChange', this.onPhaseChange);
            this.timeline.off('trackStart', this.onTrackStart);
            this.timeline.off('seek', this.onSeek);
            this.timeline.off('debugReturnToTitle', this.onDebugReturnToTitle);
        }
        this.events.off('robotAttack');
        this.events.off('robotDestroyed');
        this.events.off('robotArmorHit');
        this.events.off('playerDestroyed');
    }

    reconcilePlayerWithCamera() {
        const targetScrollY = this.descentController.getTargetScrollY();
        this.cameras.main.setScroll(0, targetScrollY);
        
        this.player.y = targetScrollY + 450;
        this.player.body.reset(this.player.x, this.player.y);
    }

    returnToTitle() {
        console.log(`[SESSION ${this.sessionID}] SESSION_STOP`);
        if (this.timeline) {
            this.timeline.stop();
        }
        this.scene.start('TitleScene');
    }

    update(time, delta) {
        // Authoritative clock is the music. If paused, don't update gameplay.
        const state = this.timeline.getState();
        if (!state.isPlaying) {
            if (this.player.body) this.player.body.setAcceleration(0, 0).setVelocity(0, 0);
            this.robotGroup.getChildren().forEach(r => {
                if (r.body) {
                    r.body.setAcceleration(0, 0);
                    r.body.setVelocity(0, 0);
                }
            });
            return;
        }

        // 1. Update Camera Descent
        const targetScrollY = this.descentController.getTargetScrollY();
        this.cameras.main.scrollY = targetScrollY;

        // 2. Update Controls
        this.controls.update();

        // 3. Update Player
        this.player.update(this.controls.getState(), delta);

        // 4. Update Weapons
        this.weaponSystem.update();

        // 5. Update Robots (AI and depth cleanup)
        this.robotGroup.getChildren().forEach(r => r.update(time, delta));

        // 6. Update HUD
        this.hud.setWeaponStatus('energy', 'READY');
        const axeCooldown = this.weaponSystem.getAxeCooldownStatus();
        this.hud.setWeaponStatus('axe', axeCooldown >= 1 ? 'READY' : `${Math.floor(axeCooldown * 100)}%`);

        // 7. Update Technical Diagnostics (if debug enabled)
        this.updateDiagnostics();
    }

    updateDiagnostics() {
        if (this.game.timelineDebugPanel && this.game.timelineDebugPanel.isVisible) {
            // Already handled by debug panel reading scene state
        }
    }
}
