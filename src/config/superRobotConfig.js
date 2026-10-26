/**
 * Configuration for the Super Robot (Giant Robot) Boss encounter in CATHEDRAL.
 */
export const SUPER_ROBOT_CONFIG = {
    health: 80,
    armor: 15,
    
    // Visuals
    width: 140,
    height: 180,
    color: 0x555555,
    exposedColor: 0xff0000,
    
    // Components / Weak Points (4 circular defensive components)
    components: {
        LEFT_SHOULDER: { id: 'LEFT_SHOULDER', health: 20, armor: 5, relativeX: -60, relativeY: -50, radius: 30 },
        RIGHT_SHOULDER: { id: 'RIGHT_SHOULDER', health: 20, armor: 5, relativeX: 60, relativeY: -50, radius: 30 },
        LEFT_KNEE: { id: 'LEFT_KNEE', health: 15, armor: 4, relativeX: -40, relativeY: 60, radius: 25 },
        RIGHT_KNEE: { id: 'RIGHT_KNEE', health: 15, armor: 4, relativeX: 40, relativeY: 60, radius: 25 },
        CORE: { id: 'CORE', health: 40, armor: 0, relativeX: 0, relativeY: 0, radius: 45, exposedOnly: true }
    },
    
    // Movement and Tactics
    tacticalPositions: [
        { x: 640, y: 350 }, // Center
        { x: 340, y: 250 }, // Top Left
        { x: 940, y: 250 }, // Top Right
        { x: 640, y: 700 }  // Bottom Center
    ],
    moveSpeed: 100,
    
    // Attacks
    attacks: {
        megaLaser: {
            damage: 30,
            laserConfig: {
                trackingMs: 1000,
                lockedMs: 400,
                firingMs: 500,
                beamWidth: 50
            },
            cooldown: 4000,
        },
        contact: {
            damage: 35,
            cooldown: 1000,
            range: 160
        }
    },
    
    // Timing (Seconds into CATHEDRAL track)
    timing: {
        appears: 0,
        intensifies: 90,
        panzerShot1: 180,
        panzerShot2: 210,
        finalDestruction: 225
    }
};
