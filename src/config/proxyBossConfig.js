/**
 * Configuration for the Proxy Boss encounter.
 */
export const PROXY_BOSS_CONFIG = {
    health: 50,
    armor: 10,
    
    // Visuals
    width: 80,
    height: 120,
    color: 0xaa00ff,
    exposedColor: 0xffaa00,
    
    // Components / Weak Points
    components: {
        HEAD: { id: 'HEAD', health: 15, armor: 2, relativeX: 0, relativeY: -40, radius: 25 },
        LEFT_ARM: { id: 'LEFT_ARM', health: 10, armor: 4, relativeX: -40, relativeY: 0, radius: 20 },
        RIGHT_ARM: { id: 'RIGHT_ARM', health: 10, armor: 4, relativeX: 40, relativeY: 0, radius: 20 },
        CORE: { id: 'CORE', health: 25, armor: 0, relativeX: 0, relativeY: 10, radius: 30, exposedOnly: true }
    },
    
    // Movement and Tactics
    tacticalPositions: [
        { x: 640, y: 300 }, // Center
        { x: 300, y: 200 }, // Top Left
        { x: 980, y: 200 }, // Top Right
        { x: 400, y: 600 }, // Mid Left
        { x: 880, y: 600 }, // Mid Right
        { x: 640, y: 750 }  // Bottom Center
    ],
    moveSpeed: 150,
    
    // Attacks
    attacks: {
        laser: {
            damage: 20,
            warningTime: 1200, // ms
            fireTime: 400, // ms
            cooldown: 5000, // ms
            beamWidth: 30
        },
        contact: {
            damage: 25,
            cooldown: 1500, // ms
            range: 120
        }
    },
    
    // Timing (Seconds into SYNTH track)
    timing: {
        arenaArrival: 297, // Descent starts decelerating before 300
        releaseNadine: 300,
        bossActive: 315,
        soldierAppears: 340,
        grenadeSequence: 350,
        bossCollapse: 358
    }
};
