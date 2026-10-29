/**
 * Combat-related constants and parameters for LORELEI: DESCENT.
 */
export const COMBAT_CONFIG = {
    // Attack Types
    types: {
        ENERGY: 'ENERGY',
        AXE: 'AXE',
        LASER: 'LASER',
        CONTACT: 'CONTACT'
    },

    // Results
    results: {
        NO_DAMAGE: 'NO_DAMAGE',
        ARMOR_HIT: 'ARMOR_HIT',
        ARMOR_BROKEN: 'ARMOR_BROKEN',
        HEALTH_DAMAGED: 'HEALTH_DAMAGED',
        TARGET_DESTROYED: 'TARGET_DESTROYED'
    },

    // Player (Blackrush)
    player: {
        maxShield: 100,
        startingShield: 100,
        maxHearts: 6,
        startingHearts: 6,
        invulnerabilityWindow: 350, // ms for ordinary hits
        regenDelay: 4000, // ms
        regenRate: 12, // pts per second
        respawnDelay: 1200, // ms
        respawnInvulnerability: 3000, // ms
        lowHeartThreshold: 2,
        twoHeartWarnInterval: 4000, // ms
        oneHeartWarnInterval: 2000, // ms
    },

    // Lorelei Companion (Step 10.3)
    lorelei: {
        follow: {
            followDistance: 120,
            stopDistance: 60,
            walkSpeed: 160,
            runSpeed: 280,
            catchUpDistance: 400,
            maximumSupportDistance: 600,
            acceleration: 800,
            deceleration: 1200
        },
        defense: {
            supportRadius: 300,
            threatRadius: 150,
            minimumThreatCount: 3,
            telekinesisRadius: 250,
            telekinesisCooldown: 8000, // 8 seconds
            knockbackStrength: 850,
            knockbackDuration: 1200, // ms
            destructionChance: 0.5
        }
    },

    // Eclipse Companion (Step 10.4)
    eclipse: {
        follow: {
            followDistance: 160,
            stopDistance: 80,
            walkSpeed: 180,
            runSpeed: 300,
            catchUpDistance: 450,
            maximumSupportDistance: 700,
            acceleration: 1000,
            deceleration: 1400,
            formationOffsetX: 120,
            formationOffsetY: 40
        },
        interception: {
            radius: 800,
            burstSpeed: 1200,
            preparationDuration: 400, // ms (crouch)
            cooldown: 10000, // 10 seconds
            maxBurstDuration: 2000, // failsafe
            returnDistance: 60,
            trailLifetime: 200,
            trailFrequency: 30 // ms between afterimages
        }
    },

    // Emergency Area-Clear Weapon (Step 9.6)
    nova: {
        heartCost: 1,
        minHeartsRequired: 2,
        expansionTime: 400, // ms
        invulnerabilityWindow: 1000, // ms
        ambientSuspensionTime: 2.0, // musical seconds
    },

    // Weapons
    weapons: {
        energy: {
            damage: 1,
            armorBreaking: false,
            knockback: 0
        },
        axe: {
            damage: 2,
            armorBreaking: true,
            knockback: 400
        }
    },

    // Robot Archetypes
    robots: {
        PURSUER: {
            type: 'PURSUER',
            maxHealth: 1,
            maxArmor: 0,
            speed: 110,
            chaseRange: 450,
            contactDamage: 8,
            contactCooldown: 1000,
            score: 100,
            color: 0xaa0000,
            knockback: 200
        },
        SENTINEL: {
            type: 'SENTINEL',
            maxHealth: 2,
            maxArmor: 0,
            speed: 80,
            preferredDistance: 250,
            contactDamage: 5,
            laserDamage: 15,
            // Fair laser timing
            laserConfig: {
                trackingMs: 650,
                lockedMs: 300,
                firingMs: 180,
                beamWidth: 12
            },
            cooldown: 2500, // ms
            score: 200,
            color: 0xaa0000,
            eyeColor: 0xff0000,
            knockback: 150
        },
        ARMORED_PURSUER: {
            type: 'ARMORED_PURSUER',
            maxHealth: 1,
            maxArmor: 1,
            speed: 90,
            contactDamage: 12,
            contactCooldown: 1000,
            score: 300,
            armorScore: 50,
            color: 0x880000,
            armorColor: 0x808080,
            coreColor: 0xffa500,
            knockback: 100
        }
    },

    // Geometry and Offsets (Step 10.2)
    geometry: {
        player: {
            weaponOrigin: { x: 0, y: -45 },
            targetCenter: { x: 0, y: -40 },
            targetRadius: 22
        },
        PURSUER: {
            weaponOrigin: { x: 0, y: -30 },
            targetCenter: { x: 0, y: -30 },
            targetRadius: 28
        },
        SENTINEL: {
            weaponOrigin: { x: 0, y: -35 },
            targetCenter: { x: 0, y: -35 },
            targetRadius: 28
        },
        ARMORED_PURSUER: {
            weaponOrigin: { x: 0, y: -40 },
            targetCenter: { x: 0, y: -40 },
            targetRadius: 35
        },
        lorelei: {
            weaponOrigin: { x: 0, y: -40 },
            targetCenter: { x: 0, y: -35 },
            targetRadius: 20
        },
        eclipse: {
            weaponOrigin: { x: 0, y: -45 },
            targetCenter: { x: 0, y: -40 },
            targetRadius: 22
        }
    }
};
