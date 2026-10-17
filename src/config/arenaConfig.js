/**
 * Configuration for the Boss Arena environment.
 */
export const ARENA_CONFIG = {
    // Arena position relative to descent evaluation at Synth 5:00
    // (This is primarily decorative/spawn data for now)
    worldBounds: {
        width: 1280,
        height: 960
    },
    
    // Future expansion points
    cameraBounds: {
        width: 1280,
        height: 960
    },

    spawnPositions: {
        proxyBoss: { x: 640, y: 200 },
        superRobot: { x: 640, y: 300 }
    },

    visuals: {
        floorColor: 0x1a1f26,
        accentColor: 0x2d3436,
        gridColor: 0x333a44
    }
};
