/**
 * Centralized gameplay parameters for LORELEI: DESCENT.
 */
export const GAMEPLAY_CONFIG = {
    // Player movement
    player: {
        maxSpeed: 260,
        acceleration: 1600,
        deceleration: 2000,
        assistedMovementRadius: 110,
        assistedMovementFullSpeedRadius: 160,
        defaultControlMode: 'CLASSIC',
        bounds: {
            left: 45,
            right: 1235,
            top: 110,
            bottom: 900
        }
    },

    // Weapons
    weapons: {
        energy: {
            fireRate: 7, // shots per second
            speed: 650,
            lifeTime: 1200, // ms
            color: 0x00ffff,
            glowColor: 0x00aaff
        },
        axe: {
            cooldown: 2000, // ms
            speed: 420,
            lifeTime: 1500, // ms
            rotationSpeed: 15, // deg per frame
            color: 0xcccccc
        }
    },

    // World
    descent: {
        rate: 75, // pixels per second
        arenaEntryTime: 300, // seconds into Synth track
        decelerationDuration: 3, // seconds
        cameraModes: {
            DESCENT: 'DESCENT',
            ARENA: 'ARENA'
        }
    }
};
