/**
 * Configuration for adaptive difficulty and arena checkpoints.
 */

export const ASSISTANCE_CONFIG = {
    // Multipliers for spawn counts based on hearts collected: [0 hearts, 1 heart, 2 hearts, 3+ hearts]
    spawnMultipliers: [1.0, 0.5, 0.35, 0.25],
    
    // Minimum robots in a formation to prevent it from disappearing entirely
    minimumFormationCount: 4,
    
    // Whether assistance affects ambient and scripted spawns
    affectsAmbient: true,
    affectsScripted: true,
    
    // Assistance only applies during Synth descent before this time (seconds)
    appliesBeforeSynthTime: 300
};

export const ARENA_CHECKPOINTS = {
    PROXY: {
        id: 'PROXY',
        track: 'SYNTH',
        time: 300, // 5:00
        startingHearts: 3,
        startingShield: 100,
        label: 'CONTINUE FROM ARENA'
    },
    SUPER_ROBOT: {
        id: 'SUPER_ROBOT',
        track: 'CATHEDRAL',
        time: 0,
        startingHearts: 3,
        startingShield: 100,
        label: 'CONTINUE FROM CATHEDRAL'
    }
};
