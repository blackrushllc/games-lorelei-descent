import { test } from 'node:test';
import assert from 'node:assert';
import EventEmitter from 'eventemitter3';

// Mocking Phaser classes for Node
const Phaser = {
    Math: {
        Distance: {
            Between: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        },
        Angle: {
            Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1)
        }
    },
    Geom: {
        Line: class {
            constructor(x1, y1, x2, y2) {
                this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
            }
        },
        Circle: class {
            constructor(x, y, radius) {
                this.x = x; this.y = y; this.radius = radius;
            }
        },
        Intersects: {
            GetLineToCircle: (line, circle, out = []) => {
                // Simplified intersection for test: 
                // check if distance from circle center to line is <= radius
                // and if the projection of center on line is within line segment
                const { x1, y1, x2, y2 } = line;
                const { x, y, radius } = circle;
                const dx = x2 - x1;
                const dy = y2 - y1;
                const lenSq = dx * dx + dy * dy;
                if (lenSq === 0) return Phaser.Math.Distance.Between(x, y, x1, y1) <= radius;
                
                const t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
                const closestX = x1 + Math.max(0, Math.min(1, t)) * dx;
                const closestY = y1 + Math.max(0, Math.min(1, t)) * dy;
                const dist = Phaser.Math.Distance.Between(x, y, closestX, closestY);
                if (dist <= radius) {
                    out.push({ x: closestX, y: closestY });
                    return true;
                }
                return false;
            }
        }
    }
};

const COMBAT_CONFIG = {
    types: { ENERGY: 'ENERGY', AXE: 'AXE' },
    results: { NO_DAMAGE: 'NO_DAMAGE', HEALTH_DAMAGED: 'HEALTH_DAMAGED', TARGET_DESTROYED: 'TARGET_DESTROYED', ARMOR_HIT: 'ARMOR_HIT', ARMOR_BROKEN: 'ARMOR_BROKEN' },
    weapons: {
        energy: { damage: 1, armorBreaking: false, knockback: 0 },
        axe: { damage: 2, armorBreaking: true, knockback: 400 }
    },
    geometry: {
        PURSUER: { targetCenter: { x: 0, y: -30 }, targetRadius: 28 },
        ARMORED_PURSUER: { targetCenter: { x: 0, y: -40 }, targetRadius: 35 }
    }
};

// Mock CombatSystem
class CombatSystem {
    static processAttack(attack, target) {
        if (target.armor > 0 && attack.armorBreaking) {
            target.armor--;
            return target.armor === 0 ? COMBAT_CONFIG.results.ARMOR_BROKEN : COMBAT_CONFIG.results.ARMOR_HIT;
        }
        target.health -= attack.damage;
        return target.health <= 0 ? COMBAT_CONFIG.results.TARGET_DESTROYED : COMBAT_CONFIG.results.HEALTH_DAMAGED;
    }
    static getScoreForResult() { return 100; }
}

test('Step 10.2.1: Generous Robot Hit Detection Logic', async (t) => {
    
    const createRobot = (type, x, y) => ({
        type, x, y,
        health: 1, armor: type === 'ARMORED_PURSUER' ? 1 : 0,
        isDestroyed: false,
        active: true,
        combatConfig: { score: 100 },
        getTargetRegion: function() {
            const geo = COMBAT_CONFIG.geometry[this.type];
            return { x: this.x + geo.targetCenter.x, y: this.y + geo.targetCenter.y, radius: geo.targetRadius };
        },
        die: function() { this.isDestroyed = true; },
        onHit: function() {}
    });

    const createProjectile = (type, x, y, vx, vy) => ({
        x, y, active: true,
        texture: { key: type },
        body: { deltaX: () => vx, deltaY: () => vy },
        rotation: Math.atan2(vy, vx) + Math.PI / 2,
        hitTargets: new Set(),
        deactivate: function() { this.active = false; }
    });

    const scene = {
        getNearestObstacleAlongRay: () => null, // Default: no walls
        addScore: () => {},
        events: new EventEmitter(),
        handleProjectileRobotCollision: function(projectile, robot) {
            // Extracted logic from GameScene.js
            const targetRegion = robot.getTargetRegion();
            const robotCircle = new Phaser.Geom.Circle(targetRegion.x, targetRegion.y, targetRegion.radius);
            const prevX = projectile.x - projectile.body.deltaX();
            const prevY = projectile.y - projectile.body.deltaY();
            const ray = new Phaser.Geom.Line(prevX, prevY, projectile.x, projectile.y);
            const points = [];
            const isHit = Phaser.Geom.Intersects.GetLineToCircle(ray, robotCircle, points) || 
                         Phaser.Math.Distance.Between(projectile.x, projectile.y, targetRegion.x, targetRegion.y) <= targetRegion.radius + 2;

            if (!isHit) return false;

            const distToRobot = Phaser.Math.Distance.Between(prevX, prevY, targetRegion.x, targetRegion.y);
            const wallHit = this.getNearestObstacleAlongRay(prevX, prevY, projectile.rotation - Math.PI / 2, distToRobot + 50);
            if (wallHit && wallHit.distance < distToRobot - targetRegion.radius) return false;

            const weaponCfg = projectile.texture.key === 'axe' ? COMBAT_CONFIG.weapons.axe : COMBAT_CONFIG.weapons.energy;
            const attack = {
                type: projectile.texture.key === 'axe' ? COMBAT_CONFIG.types.AXE : COMBAT_CONFIG.types.ENERGY,
                damage: weaponCfg.damage,
                armorBreaking: weaponCfg.armorBreaking
            };

            const result = CombatSystem.processAttack(attack, robot);
            if (result !== COMBAT_CONFIG.results.NO_DAMAGE) {
                projectile.hitTargets.add(robot);
                if (projectile.texture.key !== 'axe') projectile.deactivate();
                if (result === COMBAT_CONFIG.results.TARGET_DESTROYED) robot.die();
                return true;
            }
            return false;
        }
    };

    // 1. Bolt passing through Pursuer torso (y=-30) should hit
    const pursuer = createRobot('PURSUER', 100, 500);
    // Torso is at y = 470.
    const bolt1 = createProjectile('energy_bolt', 100, 470, 10, 0); 
    const hit1 = scene.handleProjectileRobotCollision(bolt1, pursuer);
    assert.strictEqual(hit1, true, 'Bolt hitting torso should register');
    assert.strictEqual(pursuer.isDestroyed, true, 'Pursuer should be destroyed');

    // 2. Bolt passing near shoulder should hit (Generous radius 28)
    const pursuer2 = createRobot('PURSUER', 200, 500);
    // Torso center (200, 470). Shoulder at (225, 470). dist = 25 < 28.
    const bolt2 = createProjectile('energy_bolt', 225, 470, 10, 0);
    const hit2 = scene.handleProjectileRobotCollision(bolt2, pursuer2);
    assert.strictEqual(hit2, true, 'Bolt hitting generous shoulder region should register');

    // 3. Axe hitting Armored Pursuer torso should break armor
    const armored = createRobot('ARMORED_PURSUER', 300, 500);
    // Torso center (300, 460). Radius 35.
    const axe = createProjectile('axe', 300, 460, 10, 0);
    const hit3 = scene.handleProjectileRobotCollision(axe, armored);
    assert.strictEqual(hit3, true, 'Axe hitting armored torso should register');
    assert.strictEqual(armored.armor, 0, 'Armor should be broken');

    // 4. Hit registers without touching feet (y=500)
    // In our logic, we don't even check feet (robot.x, robot.y) for hit, only targetRegion.
    // This is verified by hit1, hit2, hit3.

    // 5. Miss if completely outside
    const pursuer3 = createRobot('PURSUER', 400, 500);
    const bolt3 = createProjectile('energy_bolt', 450, 470, 10, 0); // x=450, dist=50 > 28
    const hit4 = scene.handleProjectileRobotCollision(bolt3, pursuer3);
    assert.strictEqual(hit4, false, 'Bolt far outside should miss');

    // 6. Swept collision: fast bolt skipping over the center
    const pursuer4 = createRobot('PURSUER', 500, 500);
    // Torso center (500, 470).
    // Prev pos (480, 470), Current pos (520, 470). 
    // It didn't "hit" the center in either frame, but the path crossed the 28 radius circle.
    const bolt4 = createProjectile('energy_bolt', 520, 470, 40, 0); // deltaX = 40
    const hit5 = scene.handleProjectileRobotCollision(bolt4, pursuer4);
    assert.strictEqual(hit5, true, 'Swept collision should catch fast bolts crossing the region');

    // 7. Wall blocking
    const pursuer5 = createRobot('PURSUER', 700, 500);
    // Robot center at 700. Radius 28. Front edge at 672.
    // Projectile starts at 600, ends at 620.
    // Wall at 650.
    scene.getNearestObstacleAlongRay = () => ({ distance: 50 }); // Wall at 650 (600 + 50)
    const bolt5 = createProjectile('energy_bolt', 620, 470, 20, 0); // deltaX=20, prevX=600.
    // distToRobot = 100. (700 - 600)
    // 50 < (100 - 28) => 50 < 72. TRUE. Blocked.
    const hit6 = scene.handleProjectileRobotCollision(bolt5, pursuer5);
    assert.strictEqual(hit6, false, 'Wall between projectile and robot should block hit');
});
