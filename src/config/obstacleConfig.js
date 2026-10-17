/**
 * Configuration for environmental obstacles in LORELEI: DESCENT.
 */
export const OBSTACLE_CONFIG = {
    chunkHeight: 960,
    activeRange: 2000, // Distance around camera to keep obstacles active

    types: {
        PILLAR: {
            id: 'pillar',
            solid: true,
            minSize: 30,
            maxSize: 50,
            color: 0x444444,
            strokeColor: 0x666666
        },
        MACHINE: {
            id: 'machine',
            solid: true,
            minWidth: 60,
            maxWidth: 100,
            minHeight: 80,
            maxHeight: 140,
            color: 0x333a44,
            strokeColor: 0x555e6b,
            detailColor: 0x222222
        },
        TANK: {
            id: 'tank',
            solid: true,
            minRadius: 25,
            maxRadius: 45,
            color: 0x2d3436,
            strokeColor: 0x636e72
        }
    },

    // Fixed layouts for specific areas
    arena: {
        obstacles: [
            // Left supports
            { type: 'MACHINE', x: 20, y: 230, w: 40, h: 60 },
            { type: 'MACHINE', x: 20, y: 530, w: 40, h: 60 },
            { type: 'MACHINE', x: 20, y: 830, w: 40, h: 60 },
            // Right supports
            { type: 'MACHINE', x: 1220, y: 230, w: 40, h: 60 },
            { type: 'MACHINE', x: 1220, y: 530, w: 40, h: 60 },
            { type: 'MACHINE', x: 1220, y: 830, w: 40, h: 60 },
            // Machinery near boundaries
            { type: 'MACHINE', x: 70, y: 80, w: 80, h: 60 },
            { type: 'MACHINE', x: 1130, y: 80, w: 80, h: 60 },
            { type: 'TANK', x: 80, y: 850, r: 35 },
            { type: 'TANK', x: 1200, y: 850, r: 35 }
        ]
    }
};
