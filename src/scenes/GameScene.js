import Phaser from 'phaser';
import ChamberBuilder from '../systems/ChamberBuilder.js';
import Blackrush from '../entities/Blackrush.js';
import Robot from '../entities/Robot.js';
import Heart from '../entities/Heart.js';
import Proxy from '../entities/Proxy.js';
import ProxyBoss from '../entities/ProxyBoss.js';
import SuperRobot from '../entities/SuperRobot.js';
import GermanSoldier from '../entities/GermanSoldier.js';
import Grenade from '../entities/Grenade.js';
import Lorelei from '../entities/Lorelei.js';
import Eclipse from '../entities/Eclipse.js';
import Hud from '../ui/Hud.js';
import DescentController from '../systems/DescentController.js';
import DesktopControls from '../controls/DesktopControls.js';
import WeaponSystem from '../systems/WeaponSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import EncounterDirector from '../systems/EncounterDirector.js';
import { COMBAT_CONFIG } from '../config/combatConfig.js';
import { PROXY_CONFIG } from '../config/proxyConfig.js';
import { PROXY_BOSS_CONFIG } from '../config/proxyBossConfig.js';
import { ASSISTANCE_CONFIG, ARENA_CHECKPOINTS } from '../config/assistanceConfig.js';

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
        this.debugGeometry = false;
        this.playerHasGrenade = false;
        this.grenadeResolved = false;

        // 1. Build Chamber
        this.chamberBuilder = new ChamberBuilder(this);
        this.environment = this.chamberBuilder.build();

        // 1.5 Call initial update to populate starting obstacles
        this.chamberBuilder.update(0);

        // Set world bounds to match the large descent (50,000 pixels)
        // Part B: World width is now 1280. We use a wide horizontal range to allow centering on wide monitors.
        this.cameras.main.setBounds(-2000, 0, 5280, 50000);

        // 2. Initialize Gameplay Systems
        this.descentController = new DescentController(this.timeline);
        this.controls = new DesktopControls(this);
        this.weaponSystem = new WeaponSystem(this);

        // 3. Add Blackrush (Player)
        // Center player in the wider world
        this.player = new Blackrush(this, 640, 450);
        console.log(`[SESSION ${this.sessionID}] PLAYER_CREATED`);

        // 4. Robot Group
        this.robotGroup = this.physics.add.group({
            classType: Robot,
            runChildUpdate: true
        });

        this.heartGroup = this.physics.add.group({
            classType: Heart,
            runChildUpdate: true
        });

        this.bossComponentGroup = this.physics.add.group();

        // 4.6 Combat Sensors Group (Step 10.2.1)
        this.combatSensorGroup = this.physics.add.group();

        // 4.5 Opening Proxy (Scripted Escape)
        this.openingProxy = new Proxy(this, PROXY_CONFIG.opening);
        this.proxyBoss = null;
        this.superRobot = null;
        this.germanSoldier = null;
        this.grenade = null;
        this.lorelei = null;
        this.eclipse = null;

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

        // 9. Back to Title Button (Dev purposes) - Only show if debug enabled
        if (window.location.search.includes('debug=1')) {
            const backButton = this.add.text(20, height - 20, 'BACK TO TITLE', {
                fontSize: '18px', fill: '#ffffff', fontFamily: 'Arial',
                backgroundColor: '#333333', padding: { x: 10, y: 5 }
            })
            .setOrigin(0, 1)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(1001)
            .on('pointerdown', () => this.returnToTitle());
        }

        // Direct Lorelei Spawn (Step 10.3.3)
        // Ensure Lorelei is created immediately during normal mission start
        // before any timeline events have been received.
        this.updateLoreleiPresence();
        this.updateEclipsePresence();

        // Timeline Event Listeners
        this.setupTimelineListeners();

        // 10. Pause Overlay (Step 10.2)
        this.createPauseOverlay();

        // PART B: Handle resize and initial camera scale
        this.scale.on('resize', this.onResize, this);
        this.onResize();

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.onResize, this);
            this.cleanupTimelineListeners();
            if (this.encounterDirector) {
                this.encounterDirector.destroy();
            }
            if (this.controls) {
                this.controls.destroy();
            }
            if (this.proxyBoss) {
                this.proxyBoss.destroy();
            }
            if (this.superRobot) {
                this.superRobot.destroy();
            }
            if (this.germanSoldier) {
                this.germanSoldier.destroy();
            }
            if (this.grenade) {
                this.grenade.destroy();
            }
        });

        console.log('GameScene: Step 5 Combat Prototype loaded.');
    }

    onResize() {
        if (!this.cameras || !this.cameras.main) return;
        const { width, height } = this.scale;
        
        // Target logical height: 960
        const logicalHeight = 960;
        const zoom = height / logicalHeight;
        
        this.cameras.main.setZoom(zoom);
        
        // Logical viewport width
        const logicalWidth = width / zoom;
        
        if (this.hud) {
            this.hud.resize(logicalWidth, logicalHeight);
        }
        
        if (this.pauseOverlay) {
            this.repositionPauseOverlay();
        }
    }

    updateHorizontalCamera(delta) {
        if (!this.player || this.player.isDestroyed) return;

        const cam = this.cameras.main;
        const zoom = cam.zoom;
        const logicalWidth = this.scale.width / zoom;

        // If the viewport width is >= world width, center the camera
        if (logicalWidth >= 1280) {
            // Allow negative scrollX to center the 1280px world
            // scrollX = (WorldWidth - ViewportWidth) / 2
            cam.scrollX = (1280 - logicalWidth) / 2;
        } else {
            // Target center X is player position
            const targetX = this.player.x - (logicalWidth / 2);
            
            // Smoothly lerp towards targetX
            const lerpFactor = 0.1;
            cam.scrollX = Phaser.Math.Linear(cam.scrollX, targetX, lerpFactor);
            
            // Clamp to world bounds (0 to 1280 - logicalWidth)
            cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, 1280 - logicalWidth);
        }
    }

    spawnRobotAt(x, y, type, cueID = null) {
        const robot = new Robot(this, x, y, type);
        
        // Sync with current pixel art state
        if (this.player) {
            robot.setPixelArtEnabled(this.player.pixelArtEnabled);
        }
        
        robot.cueID = cueID;
        this.robotGroup.add(robot);
        return robot;
    }

    spawnLorelei() {
        if (this.lorelei) return;
        
        // Spawn Lorelei near the player (slightly behind)
        this.lorelei = new Lorelei(this, this.player.x - 100, this.player.y);
        this.lorelei.setPixelArtEnabled(this.player.pixelArtEnabled);
        
        // Setup Lorelei collisions (Obstacles)
        this.physics.add.collider(this.lorelei, this.environment.obstacles);
        this.physics.add.collider(this.lorelei, this.environment.walls);
        
        console.log(`[SESSION ${this.sessionID}] LORELEI_JOINED`);
    }

    spawnEclipse() {
        if (this.eclipse) return;

        // Spawn slightly offset from player and Lorelei
        this.eclipse = new Eclipse(this, this.player.x + 100, this.player.y);
        this.eclipse.setPixelArtEnabled(this.player.pixelArtEnabled);
        
        // Setup Eclipse collisions (Obstacles)
        this.physics.add.collider(this.eclipse, this.environment.obstacles);
        this.physics.add.collider(this.eclipse, this.environment.walls);
        
        console.log(`[SESSION ${this.sessionID}] ECLIPSE_JOINED`);
    }

    updateLoreleiPresence(phase = null) {
        if (!phase) phase = this.timeline.currentPhase;
        if (!phase) return;

        // Step 10.3.3: One clear, centralized rule for Lorelei's existence
        const shouldExist = (phase.id === 'CHASE' || phase.id === 'ROBOT_SWARM');
        
        if (shouldExist) {
            this.spawnLorelei();
        } else if (this.lorelei) {
            this.lorelei.destroy();
            this.lorelei = null;
            console.log(`[SESSION ${this.sessionID}] Lorelei departed (Phase: ${phase.id})`);
        }
    }

    updateEclipsePresence(phase = null) {
        if (!phase) phase = this.timeline.currentPhase;
        if (!phase) return;

        // Eclipse accompanies from the start (CHASE and SWARM)
        const shouldExist = (phase.id === 'CHASE' || phase.id === 'ROBOT_SWARM');
        
        if (shouldExist) {
            this.spawnEclipse();
        } else if (this.eclipse) {
            this.eclipse.destroy();
            this.eclipse = null;
            console.log(`[SESSION ${this.sessionID}] Eclipse departed (Phase: ${phase.id})`);
        }
    }

    spawnHeartAt(x, y) {
        const heart = new Heart(this, x, y);
        this.heartGroup.add(heart);
        return heart;
    }

    findSafeSpawnPosition(suggestedX, suggestedY, permittedRegion = null) {
        // Try to find a safe position near the suggested one
        const attempts = [
            { x: suggestedX, y: suggestedY },
            { x: suggestedX + 40, y: suggestedY },
            { x: suggestedX - 40, y: suggestedY },
            { x: suggestedX, y: suggestedY + 40 },
            { x: suggestedX, y: suggestedY - 40 },
            { x: suggestedX + 80, y: suggestedY },
            { x: suggestedX - 80, y: suggestedY },
            { x: suggestedX, y: suggestedY + 80 },
            { x: suggestedX, y: suggestedY - 80 }
        ];

        for (const pos of attempts) {
            // Keep within horizontal bounds (World is 1280px wide)
            if (pos.x < 50) pos.x = 50;
            if (pos.x > 1230) pos.x = 1230;

            // Respect permitted region if provided
            if (permittedRegion && !permittedRegion.contains(pos.x, pos.y)) {
                continue;
            }

            const rect = new Phaser.Geom.Rectangle(pos.x - 20, pos.y - 20, 40, 40);
            let blocked = false;
            
            // Check obstacles
            this.environment.obstacles.getChildren().forEach(obj => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(rect, obj.getBounds())) blocked = true;
            });
            if (blocked) continue;

            // Check walls
            this.environment.walls.getChildren().forEach(obj => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(rect, obj.getBounds())) blocked = true;
            });
            if (blocked) continue;

            // Check player
            if (this.player && Phaser.Math.Distance.Between(pos.x, pos.y, this.player.x, this.player.y) < 120) continue;

            return pos;
        }

        return null; // Return null if no safe location found
    }

    findSafeRobotSpawnPosition() {
        const cam = this.cameras.main;
        const view = cam.worldView;
        // Search in the viewport
        const x = view.x + 100 + Math.random() * (view.width - 200);
        const y = view.y + 100 + Math.random() * (view.height - 200);
        return this.findSafeSpawnPosition(x, y) || { x, y }; // Fallback for manual debug
    }

    setupCollisions() {
        // Projectiles vs Robots (Generous Hit Detection via Combat Sensors)
        this.physics.add.overlap(this.weaponSystem.energyProjectiles, this.combatSensorGroup, this.handleProjectileRobotCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.axes, this.combatSensorGroup, this.handleProjectileRobotCollision, null, this);

        // Projectiles vs Boss Components
        this.physics.add.overlap(this.weaponSystem.energyProjectiles, this.bossComponentGroup, this.handleProjectileBossCollision, null, this);
        this.physics.add.overlap(this.weaponSystem.axes, this.bossComponentGroup, this.handleProjectileBossCollision, null, this);
        
        // Player vs Robots (Contact damage)
        this.physics.add.overlap(this.player, this.robotGroup, this.handlePlayerRobotCollision, null, this);
        this.physics.add.overlap(this.player, this.heartGroup, this.handlePlayerHeartCollision, null, this);

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

    handlePlayerHeartCollision(player, heart) {
        if (player.isDestroyed || player.isFinalDefeat) return;

        // Restore 1 heart
        if (player.hearts < player.maxHearts) {
            player.hearts++;
            this.hud.setHearts(player.hearts, player.maxHearts);
            
            // PART A: Adaptive Assistance - Only on SUCCESSFUL pickup
            if (this.game.missionState) {
                this.game.missionState.heartsCollected++;
                this.game.missionState.assistanceLevel++;
                if (window.location.search.includes('debug=1')) {
                    console.log(`[ASSISTANCE] Heart collected. Level: ${this.game.missionState.assistanceLevel}`);
                }
            }

            this.playSurvivalSound('heartGain');
            
            // Visual effect
            this.createHeartPickupEffect(heart.x, heart.y);
            
            heart.destroy();
            console.log(`[SESSION ${this.sessionID}] HEART_PICKUP. Hearts: ${player.hearts}`);
        }
    }

    createHeartPickupEffect(x, y) {
        const ring = this.add.graphics();
        ring.lineStyle(2, 0xff3366, 1);
        ring.strokeCircle(x, y, 10);
        this.tweens.add({
            targets: ring,
            alpha: 0,
            scale: 4,
            duration: 500,
            onComplete: () => ring.destroy()
        });
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

    handleProjectileRobotCollision(projectile, sensor) {
        // sensor can be the Robot itself (legacy) or a Combat Sensor (new)
        const robot = sensor.parentRobot || (sensor.isCombatSensor ? null : sensor);
        if (!robot || robot.isDestroyed || !projectile.active || projectile.hitTargets.has(robot)) return;
        
        const targetRegion = robot.getTargetRegion();
        const robotCircle = new Phaser.Geom.Circle(targetRegion.x, targetRegion.y, targetRegion.radius);

        // Step 10.2.1: Swept collision check (Line from previous to current position)
        const prevX = projectile.x - projectile.body.deltaX();
        const prevY = projectile.y - projectile.body.deltaY();
        const ray = new Phaser.Geom.Line(prevX, prevY, projectile.x, projectile.y);
        
        // Generous check: intersection with circle OR close proximity at current frame
        const points = [];
        const isHit = Phaser.Geom.Intersects.GetLineToCircle(ray, robotCircle, points) || 
                     Phaser.Math.Distance.Between(projectile.x, projectile.y, targetRegion.x, targetRegion.y) <= targetRegion.radius + 2;

        if (!isHit) return;

        // Obstacle Cover Priority: Ensure no wall is between projectile start and robot target region
        const distToRobot = Phaser.Math.Distance.Between(prevX, prevY, targetRegion.x, targetRegion.y);
        const wallHit = this.getNearestObstacleAlongRay(prevX, prevY, projectile.rotation - Math.PI / 2, distToRobot + 50);
        
        // If wall is closer than the robot's front edge, it's blocked
        if (wallHit && wallHit.distance < distToRobot - targetRegion.radius) {
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

        const playerTarget = player.getTargetRegion();
        const robotTarget = robot.getTargetRegion();

        const attack = {
            type: COMBAT_CONFIG.types.CONTACT,
            damage: robot.combatConfig.contactDamage,
            direction: Phaser.Math.Angle.Between(robotTarget.x, robotTarget.y, playerTarget.x, playerTarget.y),
            knockback: 200
        };

        this.handlePlayerDamage(attack);
    }

    handlePlayerDamage(attack) {
        if (!this.player || this.player.isDestroyed || this.player.isRespawning || this.player.isInvulnerable()) return;

        const result = CombatSystem.processAttack(attack, this.player);
        if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
            this.player.onHit();
            this.hud.setShield(this.player.shield, this.player.maxShield);

            if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                this.handlePlayerDefeat();
            }
        }
    }

    triggerNova() {
        if (!this.player || this.player.isDestroyed || this.player.isRespawning || this.isGameOver) return;

        // 1. Spend heart
        if (this.player.spendHeartForNova()) {
            // Update HUD immediately
            this.hud.setHearts(this.player.hearts, this.player.maxHearts);
            
            // 2. Visual Effect: Cyan/white expanding ring
            this.createNovaEffect(this.player.x, this.player.y);
            
            // 3. Clear Robots
            this.clearOrdinaryRobots();
            
            // 4. Suspend encounters
            if (this.encounterDirector) {
                this.encounterDirector.cancelNovaFormations();
                this.encounterDirector.suspendAmbientSpawning(COMBAT_CONFIG.nova.ambientSuspensionTime);
            }
            
            // Play heart loss sound as feedback
            this.playSurvivalSound('heartLoss');
            
            const isDebug = window.location.search.includes('debug=1');
            if (isDebug) console.log(`[SESSION ${this.sessionID}] NOVA_ACTIVATED. Hearts: ${this.player.hearts}`);
        }
    }

    createNovaEffect(x, y) {
        const ring = this.add.graphics();
        ring.lineStyle(8, 0x00ffff, 1);
        ring.strokeCircle(0, 0, 10);
        ring.setPosition(x, y);
        
        this.tweens.add({
            targets: ring,
            scale: 150, 
            alpha: 0,
            duration: COMBAT_CONFIG.nova.expansionTime,
            ease: 'Expo.out',
            onComplete: () => ring.destroy()
        });
        
        // Brief pulse effect
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.2);
        flash.fillRect(0, this.cameras.main.scrollY, 1280, 960);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    clearOrdinaryRobots() {
        // Includes Pursuers, Sentinels, and Armored Pursuers
        // We only destroy ordinary robots in the robotGroup.
        // Scripted entities like ProxyBoss, GermanSoldier etc are usually NOT in this group 
        // OR they are handled specially.
        const robots = this.robotGroup.getChildren();
        const toDestroy = [];
        
        robots.forEach(robot => {
            if (robot.active && !robot.isDestroyed) {
                const type = robot.type;
                if (type === 'PURSUER' || type === 'SENTINEL' || type === 'ARMORED_PURSUER') {
                    toDestroy.push(robot);
                }
            }
        });

        toDestroy.forEach(robot => {
            // No score for NOVA kills
            // robot.die() emits 'robotDestroyed' but score is added in collision handlers
            // We just call die() directly.
            robot.die();
        });
    }

    handleProjectileBossCollision(projectile, component) {
        if (!projectile.active || projectile.hitTargets.has(component)) return;
        
        // Step 10.2: Accurate component hit detection
        const targetRegion = component.getTargetRegion();
        const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, targetRegion.x, targetRegion.y);
        
        if (dist > targetRegion.radius + 5) return;

        const isAxe = projectile.texture.key === 'axe';
        const weaponCfg = isAxe ? COMBAT_CONFIG.weapons.axe : COMBAT_CONFIG.weapons.energy;
        
        const attack = {
            type: isAxe ? COMBAT_CONFIG.types.AXE : COMBAT_CONFIG.types.ENERGY,
            damage: weaponCfg.damage,
            armorBreaking: weaponCfg.armorBreaking,
            direction: projectile.rotation - Math.PI / 2,
            knockback: 0
        };

        const result = component.boss.onComponentHit(component, attack);
        
        if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
            projectile.hitTargets.add(component);
            this.createImpactSparks(projectile.x, projectile.y, attack.direction, isAxe);
            
            if (!isAxe) projectile.deactivate();
            
            if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) {
                this.addScore(500); 
            }
        }
    }

    handleProxyReleaseNadine() {
        if (this.openingProxy) {
            this.openingProxy.destroy();
            this.openingProxy = null;
        }
        
        const arenaY = this.descentController.getArenaPosition();
        this.proxyBoss = new ProxyBoss(this, 640, arenaY + 300);
        
        this.proxyBoss.components.forEach(comp => {
            this.bossComponentGroup.add(comp);
        });
        
        console.log(`[SESSION ${this.sessionID}] PROXY_BOSS_SPAWNED`);
    }

    handleProxyAttackStart() {
        if (this.proxyBoss) {
            this.proxyBoss.state = 'IDLE'; // Re-enable if it was waiting
            console.log(`[SESSION ${this.sessionID}] PROXY_BOSS_ACTIVE`);
        }
    }

    handleGermanSoldierArrival() {
        const arenaY = this.descentController.getArenaPosition();
        // Soldier appears from a side entrance
        this.germanSoldier = new GermanSoldier(this, 100, arenaY + 800);
        console.log(`[SESSION ${this.sessionID}] GERMAN_SOLDIER_ARRIVED`);
    }

    handleGrenadeSequence() {
        if (!this.germanSoldier || !this.proxyBoss) return;
        
        this.germanSoldier.throwGrenade(this.proxyBoss.x, this.proxyBoss.y, () => {
            const grenade = new Grenade(this, this.germanSoldier.x, this.germanSoldier.y);
            this.grenade = grenade;
            
            // Player can catch it
            this.physics.add.overlap(this.player, grenade, this.handlePlayerCatchGrenade, null, this);
            
            grenade.launch(this.proxyBoss.x, this.proxyBoss.y, 1500, () => {
                this.resolveGrenadeHit(false);
            });
        });
    }

    handlePlayerCatchGrenade(player, grenade) {
        if (grenade.isCaught) return;
        grenade.catch();
        console.log(`[SESSION ${this.sessionID}] PLAYER_CAUGHT_GRENADE`);
        
        // Attach to player (visual follow in update)
        this.playerHasGrenade = true;

        // Player now has the grenade. If they touch the Proxy, they deliver it.
        this.physics.add.overlap(this.player, this.bossComponentGroup, () => {
            if (this.playerHasGrenade) {
                this.resolveGrenadeHit(true);
            }
        }, null, this);
    }

    resolveGrenadeHit(byPlayer) {
        if (this.grenadeResolved) return;
        this.grenadeResolved = true;
        this.playerHasGrenade = false;

        if (this.grenade) {
            this.grenade.destroy();
            this.grenade = null;
        }

        if (this.proxyBoss) {
            this.proxyBoss.state = 'STAGGERED';
            console.log(`[SESSION ${this.sessionID}] GRENADE_HIT (byPlayer=${byPlayer})`);
        }
    }

    handleProxyCollapse() {
        if (this.proxyBoss) {
            this.resolveGrenadeHit(false); // Ensure it's hit if missed
            this.proxyBoss.die();
            
            // Clear soldier
            if (this.germanSoldier) {
                this.germanSoldier.destroy();
                this.germanSoldier = null;
            }

            console.log(`[SESSION ${this.sessionID}] PROXY_BOSS_COLLAPSED`);
        }
    }

    handleSuperRobotAppears() {
        const arenaY = this.descentController.getArenaPosition();
        this.superRobot = new SuperRobot(this, 640, arenaY + 300);
        
        this.superRobot.components.forEach(comp => {
            this.bossComponentGroup.add(comp);
        });
        
        console.log(`[SESSION ${this.sessionID}] SUPER_ROBOT_SPAWNED`);
    }

    handlePanzerShot(shotNumber) {
        if (!this.superRobot) return;
        
        console.log(`[SESSION ${this.sessionID}] PANZER_SHOT_${shotNumber} IMPACT`);
        
        // Panzer shots are powerful - they break armor and deal high damage
        const attack = {
            type: COMBAT_CONFIG.types.ENERGY, // Placeholder for Panzer impact
            damage: 20,
            armorBreaking: true,
            direction: Math.PI / 2,
            knockback: 1000
        };

        // Pick a random functional component to damage
        const components = [...this.superRobot.components.values()].filter(c => c.hp > 0);
        if (components.length > 0) {
            const target = Phaser.Utils.Array.GetRandom(components);
            this.superRobot.onComponentHit(target, attack);
            this.createImpactSparks(this.superRobot.x + target.x, this.superRobot.y + target.y, attack.direction, true);
        }
    }

    handleFinalBossDestruction() {
        if (this.superRobot) {
            this.superRobot.die();
            console.log(`[SESSION ${this.sessionID}] SUPER_ROBOT_DESTROYED`);
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

    spawnTestEncounter() {
        if (!this.encounterDirector || !this.encounterDirector.enabled) return;
        
        // Spawn a small starting group immediately
        this.encounterDirector.executeCue({
            id: 'STARTING_ENCOUNTER',
            type: 'SPAWN',
            formation: 'PATROL',
            robotTypes: ['PURSUER'],
            counts: { PURSUER: 3 },
            spawnRegion: 'TOP_RANDOM',
            seed: 'START_' + this.sessionID
        }, true);
    }

    setupTimelineListeners() {
        this.onPhaseChange = (phase) => {
            if (!this.scene.isActive()) return;
            if (this.hud) {
                this.hud.setPhaseLabel(phase.label);
            }
            
            // Step 10.3.3: Use centralized presence logic
            this.updateLoreleiPresence(phase);
            this.updateEclipsePresence(phase);
        };

        this.onTrackStart = (trackKey, startTime) => {
            // Guard: Studio is for EndingScene
            if (trackKey === 'STUDIO') return;

            // Guard: Ensure scene is active and valid
            if (!this.scene.isActive()) return;

            console.log(`[SESSION ${this.sessionID}] TRACK_START: ${trackKey} at ${startTime || 0}s`);
            
            // Full reset for track restart
            this.weaponSystem.reset();
            if (this.robotGroup && this.robotGroup.scene) {
                this.robotGroup.clear(true, true);
            }
            
            // Reconcile Lorelei and Eclipse
            this.updateLoreleiPresence();
            this.updateEclipsePresence();

            this.reconcilePlayerWithCamera();
            this.spawnTestEncounter();
            
            // Survival state reset
            if (this.player) {
                this.player.reset();
                
                // Override for Arena Checkpoint continuation
                if (startTime > 0 && this.game.missionState && this.game.missionState.arenaCheckpoint) {
                    const cp = ARENA_CHECKPOINTS[this.game.missionState.arenaCheckpoint];
                    // Check if we are starting at exactly this checkpoint
                    if (cp && trackKey === cp.track && Math.abs(startTime - cp.time) < 1.0) {
                        this.player.hearts = cp.startingHearts;
                        this.player.shield = cp.startingShield;
                        console.log(`[SESSION ${this.sessionID}] Applying checkpoint status: ${this.player.hearts} hearts`);
                    }
                }
                
                this.hud.setHearts(this.player.hearts, this.player.maxHearts);
                this.hud.setShield(this.player.shield, this.player.maxShield);
            }
            
            this.isGameOver = false;
            this.score = 0;
            this.hud.setScore(0);

            // Reconstruct arena/boss if needed
            if (startTime > 0) {
                this.reconstructArena();
            } else if (this.proxyBoss) {
                this.proxyBoss.reset();
            }
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

            // Reconcile Lorelei and Eclipse
            this.updateLoreleiPresence();
            this.updateEclipsePresence();

            // PART F: Reconstruct Boss State based on time
            this.reconstructBossState(state.time);
            
            // Reconcile camera first so spawnTestEncounter uses correct scrollY
            this.reconcilePlayerWithCamera();
            this.spawnTestEncounter();
            
            // Reset combat stats for dev purposes as per policy
            if (this.player) {
                this.player.reset();
                this.hud.setShield(this.player.shield, this.player.maxShield);
                this.hud.setHearts(this.player.hearts, this.player.maxHearts);
            }
            
            this.score = 0;
            this.hud.setScore(0);
            this.isGameOver = false;
        };

        this.onDebugReturnToTitle = () => {
            if (!this.scene.isActive()) return;
            if (this.lorelei) {
                this.lorelei.destroy();
            }
            if (this.eclipse) {
                this.eclipse.destroy();
            }
            this.returnToTitle();
        };

        this.onPlaySurvivalSound = (type) => {
            if (!this.scene.isActive()) return;
            if (this.game.audioDirector) {
                this.game.audioDirector.playSurvivalSound(type);
            }
        };

        this.onEvent = (eventID, eventData) => {
            if (!this.scene.isActive()) return;

            switch (eventID) {
                case 'PROXY_RELEASES_NADINE':
                    this.handleProxyReleaseNadine();
                    break;
                case 'PROXY_ATTACK':
                    this.handleProxyAttackStart();
                    break;
                case 'GERMAN_SOLDIER_APPEARS':
                    this.handleGermanSoldierArrival();
                    break;
                case 'GRENADE_SEQUENCE':
                    this.handleGrenadeSequence();
                    break;
                case 'PROXY_COLLAPSE':
                    this.handleProxyCollapse();
                    break;
                case 'SUPER_ROBOT_APPEARS':
                    this.handleSuperRobotAppears();
                    break;
                case 'PANZER_SHOT_1':
                    this.handlePanzerShot(1);
                    break;
                case 'PANZER_SHOT_2':
                    this.handlePanzerShot(2);
                    break;
                case 'FINAL_BOSS_DESTRUCTION':
                    this.handleFinalBossDestruction();
                    break;
            }
        };

        this.timeline.on('phaseChange', this.onPhaseChange);
        this.timeline.on('trackStart', this.onTrackStart);
        this.timeline.on('seek', this.onSeek);
        this.timeline.on('event', this.onEvent);
        this.timeline.on('debugReturnToTitle', this.onDebugReturnToTitle);
        this.events.on('playSurvivalSound', this.onPlaySurvivalSound);

        // Step 10.3.3: Initial reconciliation since we missed the events that created this scene
        if (this.timeline.currentTrackKey) {
            this.onTrackStart(this.timeline.currentTrackKey, this.timeline.audioDirector.getCurrentTime());
        }
        if (this.timeline.currentPhase) {
            this.onPhaseChange(this.timeline.currentPhase);
        }
    }

    cleanupTimelineListeners() {
        if (this.timeline) {
            this.timeline.off('phaseChange', this.onPhaseChange);
            this.timeline.off('trackStart', this.onTrackStart);
            this.timeline.off('seek', this.onSeek);
            this.timeline.off('event', this.onEvent);
            this.timeline.off('debugReturnToTitle', this.onDebugReturnToTitle);
        }
        this.events.off('playSurvivalSound', this.onPlaySurvivalSound);
        this.events.off('robotAttack');
        this.events.off('robotDestroyed');
        this.events.off('robotArmorHit');
        this.events.off('playerDestroyed');
    }

    reconstructArena() {
        // Clear old lasers, robots, grenade and soldier entities
        if (this.robotGroup && this.robotGroup.scene) {
            this.robotGroup.clear(true, true);
        }
        if (this.weaponSystem) {
            this.weaponSystem.reset();
        }
        
        // Soldier and Grenade cleanup
        if (this.germanSoldier) this.germanSoldier.destroy();
        if (this.grenade) this.grenade.destroy();
        this.playerHasGrenade = false;

        // Reset Bosses
        if (this.proxyBoss) {
            this.proxyBoss.reset();
        }
        if (this.superRobot) {
            this.superRobot.reset();
        }

        console.log(`[SESSION ${this.sessionID}] Arena reconstructed for checkpoint`);
    }

    updateCheckpointAcquisition() {
        if (!this.game.missionState) return;
        
        // Skip if not natural progression
        if (!this.timeline.isNaturalProgression) return;

        const state = this.timeline.getState();
        const missionState = this.game.missionState;
        
        // Proxy Checkpoint: Synth 5:00
        if (state.track === 'SYNTH' && state.time >= 300) {
            if (missionState.arenaCheckpoint !== 'PROXY') {
                missionState.arenaCheckpoint = 'PROXY';
                console.log(`[SESSION ${this.sessionID}] Checkpoint Unlocked: PROXY`);
            }
        }
        
        // Cathedral Checkpoint: Cathedral start
        if (state.track === 'CATHEDRAL') {
            if (missionState.arenaCheckpoint !== 'SUPER_ROBOT') {
                missionState.arenaCheckpoint = 'SUPER_ROBOT';
                console.log(`[SESSION ${this.sessionID}] Checkpoint Unlocked: SUPER_ROBOT`);
            }
        }
    }

    reconstructBossState(time) {
        // Clear existing boss/soldier/grenade
        if (this.proxyBoss) {
            this.proxyBoss.destroy();
            this.proxyBoss = null;
        }
        if (this.superRobot) {
            this.superRobot.destroy();
            this.superRobot = null;
        }
        if (this.germanSoldier) {
            this.germanSoldier.destroy();
            this.germanSoldier = null;
        }
        if (this.grenade) {
            this.grenade.destroy();
            this.grenade = null;
        }
        if (this.bossComponentGroup) {
            this.bossComponentGroup.clear(true, true);
        }
        this.playerHasGrenade = false;
        this.grenadeResolved = false;

        const cfg = PROXY_BOSS_CONFIG.timing;
        const trackKey = this.timeline.getState().track;

        if (trackKey === 'SYNTH' && time >= cfg.releaseNadine && time < cfg.bossCollapse) {
            this.handleProxyReleaseNadine();
            
            // Adjust health/components based on time for "representative" state
            if (time > cfg.bossActive + 20) {
                // Simulate some head damage
                const head = this.proxyBoss.components.get('HEAD');
                if (head) head.takeDamage({ damage: 10, armorBreaking: true });
            }
            
            if (time >= cfg.soldierAppears) {
                this.handleGermanSoldierArrival();
            }
            
            if (time >= cfg.grenadeSequence) {
                this.proxyBoss.state = 'STAGGERED';
            }
        }

        // CATHEDRAL reconstruct
        if (trackKey === 'CATHEDRAL') {
            this.handleSuperRobotAppears();
            // Reconstruct some component damage if deep into track
            if (time > 60) {
                const ls = this.superRobot.components.get('LEFT_SHOULDER');
                if (ls) ls.takeDamage({ damage: 20, armorBreaking: true });
            }
        }
    }

    reconcilePlayerWithCamera() {
        const targetScrollY = this.descentController.getTargetScrollY();
        this.cameras.main.scrollY = targetScrollY;
        
        // Center camera horizontally on player for the seek
        const zoom = this.cameras.main.zoom;
        const logicalWidth = this.scale.width / zoom;
        if (logicalWidth < 1280) {
            this.cameras.main.scrollX = Phaser.Math.Clamp(this.player.x - logicalWidth / 2, 0, 1280 - logicalWidth);
        } else {
            // Center the camera on wide screens
            this.cameras.main.scrollX = (1280 - logicalWidth) / 2;
        }

        // Update environment for the new position
        if (this.chamberBuilder) {
            this.chamberBuilder.clear();
            this.chamberBuilder.update(targetScrollY);
        }

        this.player.y = targetScrollY + 450;
        if (this.player.body) {
            this.player.body.reset(this.player.x, this.player.y);
        }
    }

    returnToTitle() {
        console.log(`[SESSION ${this.sessionID}] SESSION_STOP`);
        if (this.timeline) {
            this.timeline.stop();
        }
        this.scene.stop('GameOverScene');
        this.scene.start('TitleScene');
    }

    update(time, delta) {
        // 1. Update Controls and handle Pause Toggle (MUST happen even if paused)
        this.controls.update();
        const input = this.controls.getState();
        
        if (input.isPausedToggle && !this.isGameOver) {
            this.togglePause();
        }

        const state = this.timeline.getState();
        
        // If paused, freeze simulation
        if (state.isPaused || !state.isPlaying) {
            if (this.player.body) this.player.body.setAcceleration(0, 0).setVelocity(0, 0);
            this.robotGroup.getChildren().forEach(r => {
                if (r.body) {
                    r.body.setAcceleration(0, 0);
                    r.body.setVelocity(0, 0);
                }
            });
            return;
        }

        // 2. Update Camera Descent
        const targetScrollY = this.descentController.getTargetScrollY();
        this.cameras.main.scrollY = targetScrollY;
        
        // Adaptive Assistance & Checkpoints (Step 9.7)
        this.updateCheckpointAcquisition();

        // 1.5 Horizontal Camera tracking (Part B)
        this.updateHorizontalCamera(delta);

        // 1.5 Update Environment (Chunking)
        this.chamberBuilder.update(targetScrollY);

        // 2. Update Controls
        this.controls.update();

        // 2.5 Update Proxy Escape Sequence
        if (this.openingProxy) {
            this.openingProxy.updateFromTime(state.track, state.time);
        }

        // 2.6 Update Proxy Boss (Part C)
        if (this.proxyBoss) {
            this.proxyBoss.update(this.player, delta);
        }

        if (this.superRobot) {
            this.superRobot.update(this.player, delta);
        }

        // 2.7 Update Grenade (if held by player - Part D)
        if (this.playerHasGrenade && this.grenade && this.player) {
            this.grenade.x = this.player.x;
            this.grenade.y = this.player.y - 40;
        }

        // 3. Update Player
        if (input.isFiringNova) {
            this.triggerNova();
        }
        this.player.update(input, delta);

        // 4. Update Weapons
        this.weaponSystem.update();

        // 5. Update Robots (AI and depth cleanup)
        this.robotGroup.getChildren().forEach(r => r.update(time, delta));

        // 5.0 Update Companions
        if (this.lorelei) {
            this.lorelei.update(time, delta);
        }
        if (this.eclipse) {
            this.eclipse.update(time, delta);
        }

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

        // 8. Update Geometry Debug (Step 10.2)
        this.updateGeometryDebug();
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

    updateGeometryDebug() {
        if (!this.debugGeometryGraphic) {
            this.debugGeometryGraphic = this.add.graphics().setDepth(2000);
        }

        this.debugGeometryGraphic.clear();
        if (!this.debugGeometry) return;

        const drawEntity = (entity, color = 0x00ff00) => {
            if (!entity || !entity.active || entity.isDestroyed) return;

            // 1. Ground Position
            this.debugGeometryGraphic.lineStyle(1, 0xffffff, 0.5);
            this.debugGeometryGraphic.strokeCircle(entity.x, entity.y, 5);

            // 2. Movement Physics Body
            if (entity.body) {
                this.debugGeometryGraphic.lineStyle(1, 0x00ff00, 0.5);
                this.debugGeometryGraphic.strokeRect(
                    entity.body.x,
                    entity.body.y,
                    entity.body.width,
                    entity.body.height
                );
            }

            // 3. Combat Target Region (or Sensor Body)
            if (entity.combatSensor && entity.combatSensor.body) {
                const cs = entity.combatSensor.body;
                this.debugGeometryGraphic.lineStyle(2, color, 0.8);
                this.debugGeometryGraphic.strokeCircle(cs.center.x, cs.center.y, cs.halfWidth);
                this.debugGeometryGraphic.fillStyle(color, 0.2);
                this.debugGeometryGraphic.fillCircle(cs.center.x, cs.center.y, cs.halfWidth);
                
                // Target Center dot
                this.debugGeometryGraphic.fillStyle(0xffffff, 0.8);
                this.debugGeometryGraphic.fillCircle(cs.center.x, cs.center.y, 2);
            } else if (entity.getTargetRegion) {
                const tr = entity.getTargetRegion();
                this.debugGeometryGraphic.lineStyle(2, color, 0.8);
                this.debugGeometryGraphic.strokeCircle(tr.x, tr.y, tr.radius);
                this.debugGeometryGraphic.fillStyle(color, 0.2);
                this.debugGeometryGraphic.fillCircle(tr.x, tr.y, tr.radius);
            }

            // 4. Weapon Origin
            if (entity.getWeaponOrigin) {
                const wo = entity.getWeaponOrigin();
                this.debugGeometryGraphic.fillStyle(0xffff00, 1);
                this.debugGeometryGraphic.fillCircle(wo.x, wo.y, 3);
            }
        };

        // Draw Player
        drawEntity(this.player, 0x00ffff);

        // Draw Robots
        this.robotGroup.getChildren().forEach(r => drawEntity(r, 0xff0000));

        // Draw Lorelei
        if (this.lorelei) drawEntity(this.lorelei, 0xcc99ff);

        // Draw Boss Components
        this.bossComponentGroup.getChildren().forEach(comp => {
            if (comp.getTargetRegion) {
                const tr = comp.getTargetRegion();
                this.debugGeometryGraphic.lineStyle(2, 0xff00ff, 0.8);
                this.debugGeometryGraphic.strokeCircle(tr.x, tr.y, tr.radius);
                this.debugGeometryGraphic.fillStyle(0xff00ff, 0.2);
                this.debugGeometryGraphic.fillCircle(tr.x, tr.y, tr.radius);
            }
        });
    }

    /**
     * Toggles the game pause state.
     */
    togglePause() {
        const state = this.timeline.getState();
        const shouldPause = !state.isPaused;

        if (shouldPause) {
            this.timeline.pause();
            this.physics.world.pause();
            this.tweens.pauseAll();
            this.time.paused = true;
            this.pauseOverlay.setVisible(true);
            
            // Freeze all animations
            this.player.sprite.anims.pause();
            this.robotGroup.getChildren().forEach(r => {
                if (r.sprite) r.sprite.anims.pause();
            });
            if (this.proxyBoss) this.proxyBoss.sprite.anims.pause();
            if (this.superRobot) this.superRobot.sprite.anims.pause();
            if (this.lorelei && this.lorelei.sprite) this.lorelei.sprite.anims.pause();
        } else {
            this.timeline.resume();
            this.physics.world.resume();
            this.tweens.resumeAll();
            this.time.paused = false;
            this.pauseOverlay.setVisible(false);
            
            // Resume all animations
            this.player.sprite.anims.resume();
            this.robotGroup.getChildren().forEach(r => {
                if (r.sprite) r.sprite.anims.resume();
            });
            if (this.proxyBoss) this.proxyBoss.sprite.anims.resume();
            if (this.superRobot) this.superRobot.sprite.anims.resume();
            if (this.lorelei && this.lorelei.sprite) this.lorelei.sprite.anims.resume();
            
            // Clear input carry-over
            this.controls.reset();
        }
        
        console.log(`[SESSION ${this.sessionID}] Game ${shouldPause ? 'PAUSED' : 'RESUMED'}`);
    }

    createPauseOverlay() {
        this.pauseOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(2000).setVisible(false);
        
        // Use class properties for elements that need repositioning
        this.pauseBg = this.add.graphics();
        this.pauseOverlay.add(this.pauseBg);
        
        this.pauseTitle = this.add.text(0, 0, 'PAUSED', {
            fontSize: '64px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        this.pauseSubtitle = this.add.text(0, 0, 'Press ESC to resume', {
            fontSize: '24px',
            fill: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.pauseResumeBtn = this.add.text(0, 0, '[ RESUME GAME ]', {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.togglePause());
        
        this.pauseOverlay.add([this.pauseTitle, this.pauseSubtitle, this.pauseResumeBtn]);
        
        this.repositionPauseOverlay();
    }

    repositionPauseOverlay() {
        if (!this.pauseOverlay) return;
        
        const cam = this.cameras.main;
        const width = cam.width;
        const height = cam.height;
        const zoom = cam.zoom;
        
        // Logical dimensions for centering correctly even on wide viewports
        const lw = width / zoom;
        const lh = height / zoom;
        
        this.pauseBg.clear();
        this.pauseBg.fillStyle(0x000000, 0.5);
        this.pauseBg.fillRect(0, 0, lw, lh);
        
        this.pauseTitle.setPosition(lw / 2, lh / 2 - 20);
        this.pauseSubtitle.setPosition(lw / 2, lh / 2 + 40);
        this.pauseResumeBtn.setPosition(lw / 2, lh / 2 + 100);
    }
}
