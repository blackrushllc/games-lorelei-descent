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
        invulnerabilityWindow: 350, // ms
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
            speed: 90,
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
            speed: 45,
            preferredDistance: 250,
            laserDamage: 15,
            warningTime: 700, // ms
            fireTime: 150, // ms
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
            speed: 60,
            contactDamage: 12,
            contactCooldown: 1000,
            score: 300,
            armorScore: 50,
            color: 0x880000,
            armorColor: 0x808080,
            coreColor: 0xffa500,
            knockback: 100
        }
    }
};
