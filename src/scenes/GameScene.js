import Phaser from 'phaser';
import ChamberBuilder from '../systems/ChamberBuilder.js';
import Blackrush from '../entities/Blackrush.js';
import Robot from '../entities/Robot.js';
import Hud from '../ui/Hud.js';
import DescentController from '../systems/DescentController.js';
import DesktopControls from '../controls/DesktopControls.js';
import WeaponSystem from '../systems/WeaponSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import EncounterDirector from '../systems/EncounterDirector.js';
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

        // 1.5 Call initial update to populate starting obstacles
        this.chamberBuilder.update(0);

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

        // 5. Encounter Orchestration
        this.encounterDirector = new EncounterDirector(this);
        console.log(`[SESSION ${this.sessionID}] ENCOUNTER_INITIALIZED`);

        // 6. Collisions
        this.setupCollisions();

        // 7. Add HUD
        this.hud = new Hud(this);
        this.hud.setHearts(this.player.hearts, this.player.maxHearts);

        // 8. Event Listeners for Combat
        this.setupCombatEvents();

        // 9. Survival Warning Timer
        this.survivalWarningTimer = 0;

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
            if (this.encounterDirector) {
                this.encounterDirector.destroy();
            }
        });

        console.log('GameScene: Step 5 Combat Prototype loaded.');
    }

    spawnRobotAt(x, y, type) {
        const robot = new Robot(this, x, y, type);
        this.robotGroup.add(robot);
        return robot;
    }

    findSafeSpawnPosition(suggestedX, suggestedY) {
        // Try to find a safe position near the suggested one
        const attempts = [
            { x: suggestedX, y: suggestedY },
            { x: suggestedX + 40, y: suggestedY },
            { x: suggestedX - 40, y: suggestedY },
            { x: suggestedX, y: suggestedY + 40 },
            { x: suggestedX, y: suggestedY - 40 },
            { x: suggestedX + 80, y: suggestedY },
            { x: suggestedX - 80, y: suggestedY }
        ];

        for (const pos of attempts) {
            // Keep within horizontal bounds
            if (pos.x < 50) pos.x = 50;
            if (pos.x > 590) pos.x = 590;

            const rect = new Phaser.Geom.Rectangle(pos.x - 20, pos.y - 20, 40, 40);
            let blocked = false;
            
            // Check obstacles
            this.environment.obstacles.getChildren().forEach(obj => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(rect, obj.getBounds())) blocked = true;
            });
            if (blocked) continue;

            // Check player
            if (this.player && Phaser.Math.Distance.Between(pos.x, pos.y, this.player.x, this.player.y) < 100) continue;

            return pos;
        }

        return { x: suggestedX, y: suggestedY }; // Fallback
    }

    setupCollisions() {
        // Projectiles vs Robots
        this.physics.add.overlap(this.weaponSystem.energyProjectiles, this.robotGroup, this.handleProjectileRobotCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.axes, this.robotGroup, this.handleProjectileRobotCollision, null, this);
        
        // Player vs Robots (Contact damage)
        this.physics.add.overlap(this.player, this.robotGroup, this.handlePlayerRobotCollision, null, this);

        // New: Solid Obstacles and Walls
        this.physics.add.collider(this.player, this.environment.obstacles);
        this.physics.add.collider(this.player, this.environment.walls);
        this.physics.add.collider(this.robotGroup, this.environment.obstacles);
        this.physics.add.collider(this.robotGroup, this.environment.walls);
        
        // Projectiles vs Obstacles/Walls
        this.physics.add.overlap(this.weaponSystem.energyProjectiles, this.environment.obstacles, this.handleProjectileObstacleCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.axes, this.environment.obstacles, this.handleProjectileObstacleCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.energyProjectiles, this.environment.walls, this.handleProjectileObstacleCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.axes, this.environment.walls, this.handleProjectileObstacleCollision, null, this);
    }

    handleProjectileObstacleCollision(projectile, obstacle) {
        if (!projectile.active) return;

        const isAxe = projectile.texture.key === 'axe';
        const direction = projectile.rotation - Math.PI / 2;

        // Visual effects
        this.createImpactSparks(projectile.x, projectile.y, direction, isAxe);

        if (isAxe) {
            // Stronger metallic impact
            this.createAxeImpactEffect(projectile.x, projectile.y);
        }

        projectile.deactivate();
    }

    handleProjectileRobotCollision(projectile, robot) {
        if (robot.isDestroyed || !projectile.active || projectile.hitTargets.has(robot)) return;
        
        // New: Check if robot is behind cover relative to the projectile's path
        const ray = new Phaser.Geom.Line(projectile.x - projectile.body.deltaX(), projectile.y - projectile.body.deltaY(), projectile.x, projectile.y);
        const hit = this.getNearestObstacleAlongRay(ray.x1, ray.y1, projectile.rotation - Math.PI / 2, 100);
        if (hit && hit.distance < Phaser.Math.Distance.Between(ray.x1, ray.y1, robot.x, robot.y)) {
            // Projectile hit an obstacle before the robot (Arcade overlap can be imprecise)
            return;
        }

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
                this.handlePlayerDefeat();
            }
        }
    }

    setupCombatEvents() {
        this.events.on('robotAttack', (attackData) => {
            if (this.player.isDestroyed || this.player.isRespawning) return;
            const result = CombatSystem.processAttack(attackData, this.player);
            if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
                this.player.onHit();
                this.hud.setShield(this.player.shield, this.player.maxShield);
                if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                    this.handlePlayerDefeat();
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

    handleFriendlyFire(attackData, targetRobot) {
        if (targetRobot.isDestroyed || !targetRobot.active) return;
        
        const isDebug = window.location.search.includes('debug=1');
        const result = CombatSystem.processAttack(attackData, targetRobot);
        
        if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
            // No score for friendly fire
            if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                if (isDebug) console.log(`[FRIENDLY FIRE] Robot destroyed.`);
                targetRobot.die();
                this.createFriendlyFireIndicator(targetRobot.x, targetRobot.y);
            } else {
                targetRobot.onHit(result);
            }
        }
    }

    createFriendlyFireIndicator(x, y) {
        const text = this.add.text(x, y - 40, 'FRIENDLY FIRE', {
            fontSize: '10px',
            fill: '#ff0000',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 80,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    addScore(points) {
        this.score += points;
        this.hud.setScore(this.score);
    }

    handlePlayerDefeat() {
        if (this.player.isDestroyed || this.player.isRespawning || this.isGameOver) return;
        
        // 1. Decrement hearts
        this.player.hearts--;
        this.hud.setHearts(this.player.hearts, this.player.maxHearts);
        
        // 2. Sound Effects (Part B requirement)
        this.playSurvivalSound('heartLoss');

        if (this.player.hearts <= 0) {
            // Final Defeat
            this.handleGameOver();
        } else {
            // Normal Defeat -> Respawn
            this.initiateRespawn();
        }
    }

    initiateRespawn() {
        this.player.isRespawning = true;
        
        // Shield collapse effect
        this.createShieldCollapseEffect(this.player.x, this.player.y);
        
        // Temporarily remove player
        this.player.setVisible(false);
        if (this.player.body) this.player.body.enable = false;

        // Respawn delay (1.2s)
        this.time.delayedCall(this.player.combatConfig.respawnDelay, () => {
            this.performRespawn();
        });
    }

    performRespawn() {
        // Safe position search
        const spawnPos = this.findSafeRespawnPosition();
        
        this.player.setPosition(spawnPos.x, spawnPos.y);
        this.player.setVisible(true);
        if (this.player.body) {
            this.player.body.enable = true;
            this.player.body.reset(spawnPos.x, spawnPos.y);
        }
        
        this.player.shield = this.player.maxShield;
        this.hud.setShield(this.player.shield, this.player.maxShield);
        
        this.player.isRespawning = false;
        this.player.invulnerabilityTimer = this.player.combatConfig.respawnInvulnerability;
        
        // Reappearance effect
        this.createReappearanceEffect(spawnPos.x, spawnPos.y);
    }

    findSafeRespawnPosition() {
        const cam = this.cameras.main;
        const centerX = 320;
        const centerY = cam.scrollY + 480;
        
        // Candidates: Center, slightly left, slightly right, slightly up, slightly down
        const candidates = [
            { x: centerX, y: centerY },
            { x: centerX - 120, y: centerY },
            { x: centerX + 120, y: centerY },
            { x: centerX, y: centerY - 150 },
            { x: centerX, y: centerY + 150 }
        ];

        // Filter out positions overlapping solid obstacles
        const validCandidates = candidates.filter(c => {
            const rect = new Phaser.Geom.Rectangle(c.x - 20, c.y - 20, 40, 40);
            let hit = false;
            this.environment.obstacles.getChildren().forEach(obj => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(rect, obj.getBounds())) hit = true;
            });
            this.environment.walls.getChildren().forEach(obj => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(rect, obj.getBounds())) hit = true;
            });
            return !hit;
        });

        const pool = validCandidates.length > 0 ? validCandidates : candidates;

        // Simple distance-based safety check against robots
        let bestCandidate = pool[0];
        let maxMinDist = -1;

        pool.forEach(c => {
            let minDist = 10000;
            this.robotGroup.getChildren().forEach(r => {
                if (r.active) {
                    const d = Phaser.Math.Distance.Between(c.x, c.y, r.x, r.y);
                    if (d < minDist) minDist = d;
                }
            });

            if (minDist > maxMinDist) {
                maxMinDist = minDist;
                bestCandidate = c;
            }
        });

        return bestCandidate;
    }

    handleGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.player.isFinalDefeat = true;

        console.log(`[SESSION ${this.sessionID}] PLAYER_DEFEATED_FINAL`);
        this.player.die();
        this.timeline.pause();
        
        // Launch GameOverScene (keeping GameScene visible in background)
        this.scene.launch('GameOverScene');
    }

    // Effect implementations
    playSurvivalSound(type) {
        // Part B: implemented via procedural audio later
        this.events.emit('playSurvivalSound', type);
    }

    createShieldCollapseEffect(x, y) {
        // Bright blue-white flash + electrical burst
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(x, y, 50);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Electrical burst
        for (let i = 0; i < 8; i++) {
            const arc = this.add.graphics();
            arc.lineStyle(2, 0x00ffff, 1);
            const angle = Math.random() * Math.PI * 2;
            arc.beginPath();
            arc.moveTo(x, y);
            arc.lineTo(x + Math.cos(angle) * 60, y + Math.sin(angle) * 60);
            arc.strokePath();
            this.tweens.add({
                targets: arc,
                alpha: 0,
                duration: 400,
                onComplete: () => arc.destroy()
            });
        }
    }

    createReappearanceEffect(x, y) {
        const flash = this.add.graphics();
        flash.fillStyle(0x00ffff, 1);
        flash.fillCircle(x, y, 30);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    createAxeImpactEffect(x, y) {
        // Stronger metallic impact: group of gray/white sparks
        for (let i = 0; i < 12; i++) {
            const spark = this.add.graphics();
            spark.fillStyle(0xcccccc, 1);
            spark.fillRect(-2, -2, 4, 4);
            spark.x = x;
            spark.y = y;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 50;
            
            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                onComplete: () => spark.destroy()
            });
        }
    }

    getNearestObstacleAlongRay(startX, startY, angle, maxLength, exclude = null) {
        const line = new Phaser.Geom.Line(
            startX, startY, 
            startX + Math.cos(angle) * maxLength, 
            startY + Math.sin(angle) * maxLength
        );

        let minDist = maxLength;
        let nearestPoint = null;
        let nearestTarget = null;

        const checkGroup = (group) => {
            group.getChildren().forEach(obj => {
                if (obj === exclude || !obj.active) return;
                
                // Get bounds for intersection
                let bounds;
                if (obj.body) {
                    bounds = new Phaser.Geom.Rectangle(obj.body.x, obj.body.y, obj.body.width, obj.body.height);
                } else if (obj.getBounds) {
                    bounds = obj.getBounds();
                } else {
                    return;
                }

                const out = [];
                if (Phaser.Geom.Intersects.GetLineToRectangle(line, bounds, out)) {
                    out.forEach(p => {
                        const d = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
                        if (d < minDist) {
                            minDist = d;
                            nearestPoint = p;
                            nearestTarget = obj;
                        }
                    });
                }
            });
        };

        if (this.environment) {
            checkGroup(this.environment.obstacles);
            checkGroup(this.environment.walls);
        }

        if (nearestPoint) {
            return { x: nearestPoint.x, y: nearestPoint.y, distance: minDist, target: nearestTarget };
        }
        return null;
    }

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
            if (!this.scene.isActive()) return;
            if (this.hud) {
                this.hud.setPhaseLabel(phase.label);
            }
        };

        this.onTrackStart = (trackKey) => {
            // Guard: Studio is for EndingScene
            if (trackKey === 'STUDIO') return;

            // Guard: Ensure scene is active and valid
            if (!this.scene.isActive()) return;

            console.log(`[SESSION ${this.sessionID}] TRACK_START: ${trackKey}`);
            
            // Full reset for track restart
            this.weaponSystem.reset();
            if (this.robotGroup && this.robotGroup.scene) {
                this.robotGroup.clear(true, true);
            }
            this.reconcilePlayerWithCamera();
            this.spawnTestEncounter();
            
            // Survival state reset
            this.player.maxShield = this.player.combatConfig.maxShield;
            this.player.shield = this.player.maxShield;
            this.player.hearts = this.player.combatConfig.startingHearts;
            this.player.maxHearts = this.player.combatConfig.maxHearts;
            this.player.isDestroyed = false;
            this.player.isRespawning = false;
            this.player.isFinalDefeat = false;
            this.player.invulnerabilityTimer = 0;
            this.player.lastDamageTime = 0;
            this.survivalWarningTimer = 0;

            if (this.player.body) {
                this.player.body.enable = true;
            }
            this.player.setAlpha(1);
            this.player.setScale(1);
            this.player.setVisible(true);
            this.isGameOver = false;
            
            this.hud.setShield(this.player.shield, this.player.combatConfig.maxShield);
            this.hud.setHearts(this.player.hearts, this.player.maxHearts);
            this.score = 0;
            this.hud.setScore(0);
        };

        this.onSeek = () => {
            // Guard: Only handle while in a gameplay track and scene is active
            const state = this.timeline.getState();
            const trackKey = state.track;
            const isGameplayTrack = (trackKey === 'SYNTH' || trackKey === 'CATHEDRAL');
            
            if (!isGameplayTrack || !this.scene.isActive()) return;

            const isDebug = window.location.search.includes('debug=1');
            if (isDebug) console.log(`[SESSION ${this.sessionID}] DEVELOPER_SEEK`);
            
            // Requirement 18: Reset transient state after seeking
            this.weaponSystem.reset();
            if (this.robotGroup && this.robotGroup.scene) {
                this.robotGroup.clear(true, true);
            }
            
            // Reconcile camera first so spawnTestEncounter uses correct scrollY
            this.reconcilePlayerWithCamera();
            this.spawnTestEncounter();
            
            // Reset combat stats for dev purposes as per policy
            this.player.maxShield = this.player.combatConfig.maxShield;
            this.player.shield = this.player.maxShield;
            this.player.hearts = this.player.combatConfig.startingHearts;
            this.player.isDestroyed = false;
            this.player.isRespawning = false;
            this.player.isFinalDefeat = false;
            this.player.invulnerabilityTimer = 0;
            this.player.lastDamageTime = 0;
            this.survivalWarningTimer = 0;

            if (this.player.body) {
                this.player.body.enable = true;
            }
            this.player.setAlpha(1);
            this.player.setScale(1);
            this.player.setVisible(true);
            this.isGameOver = false;
            
            this.hud.setShield(this.player.shield, this.player.combatConfig.maxShield);
            this.hud.setHearts(this.player.hearts, this.player.maxHearts);
            this.score = 0;
            this.hud.setScore(0);
        };

        this.onDebugReturnToTitle = () => {
            if (!this.scene.isActive()) return;
            this.returnToTitle();
        };

        this.onPlaySurvivalSound = (type) => {
            if (!this.scene.isActive()) return;
            if (this.game.audioDirector) {
                this.game.audioDirector.playSurvivalSound(type);
            }
        };

        this.timeline.on('phaseChange', this.onPhaseChange);
        this.timeline.on('trackStart', this.onTrackStart);
        this.timeline.on('seek', this.onSeek);
        this.timeline.on('debugReturnToTitle', this.onDebugReturnToTitle);
        this.events.on('playSurvivalSound', this.onPlaySurvivalSound);
    }

    cleanupTimelineListeners() {
        if (this.timeline) {
            this.timeline.off('phaseChange', this.onPhaseChange);
            this.timeline.off('trackStart', this.onTrackStart);
            this.timeline.off('seek', this.onSeek);
            this.timeline.off('debugReturnToTitle', this.onDebugReturnToTitle);
        }
        this.events.off('playSurvivalSound', this.onPlaySurvivalSound);
        this.events.off('robotAttack');
        this.events.off('robotDestroyed');
        this.events.off('robotArmorHit');
        this.events.off('playerDestroyed');
    }

    reconcilePlayerWithCamera() {
        const targetScrollY = this.descentController.getTargetScrollY();
        this.cameras.main.setScroll(0, targetScrollY);
        
        // Update environment for the new position
        if (this.chamberBuilder) {
            this.chamberBuilder.clear();
            this.chamberBuilder.update(targetScrollY);
        }

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

        // 1.5 Update Environment (Chunking)
        this.chamberBuilder.update(targetScrollY);

        // 2. Update Controls
        this.controls.update();

        // 3. Update Player
        this.player.update(this.controls.getState(), delta);

        // 4. Update Weapons
        this.weaponSystem.update();

        // 5. Update Robots (AI and depth cleanup)
        this.robotGroup.getChildren().forEach(r => r.update(time, delta));

        // 5.1 Update Encounters
        this.encounterDirector.update(time, delta);

        // 5.5 Survival Warning
        this.updateSurvivalWarning(delta);

        // 6. Update HUD
        this.hud.setWeaponStatus('energy', 'READY');
        const axeCooldown = this.weaponSystem.getAxeCooldownStatus();
        this.hud.setWeaponStatus('axe', axeCooldown >= 1 ? 'READY' : `${Math.floor(axeCooldown * 100)}%`);

        // 7. Update Technical Diagnostics (if debug enabled)
        this.updateDiagnostics();
    }

    updateSurvivalWarning(delta) {
        if (!this.player || this.player.isFinalDefeat || this.isGameOver) return;

        const hearts = this.player.hearts;
        if (hearts > this.player.combatConfig.lowHeartThreshold) {
            this.survivalWarningTimer = 0;
            return;
        }

        const interval = hearts === 1 
            ? this.player.combatConfig.oneHeartWarnInterval 
            : this.player.combatConfig.twoHeartWarnInterval;

        this.survivalWarningTimer += delta;
        if (this.survivalWarningTimer >= interval) {
            this.playSurvivalSound('lowLife');
            this.survivalWarningTimer = 0;
        }
    }

    updateDiagnostics() {
        if (this.game.timelineDebugPanel && this.game.timelineDebugPanel.isVisible) {
            // Already handled by debug panel reading scene state
        }
    }
}
