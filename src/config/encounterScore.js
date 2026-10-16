/**
 * Musical choreography for robot encounters.
 * All times are in seconds relative to the start of the 'SYNTH' track.
 */
export const ENCOUNTER_SCORE = [
    {
        id: 'FIRST_PATROL',
        time: 45,
        type: 'SPAWN',
        formation: 'PATROL',
        robotTypes: ['PURSUER'],
        counts: { PURSUER: 4 },
        spawnRegion: 'TOP_RANDOM'
    },
    {
        id: 'REINFORCEMENTS_1',
        time: 65,
        type: 'SPAWN',
        formation: 'PATROL',
        robotTypes: ['PURSUER'],
        counts: { PURSUER: 4 },
        spawnRegion: 'MIXED'
    },
    {
        id: 'LASER_INTRO',
        time: 85,
        type: 'SPAWN',
        formation: 'FAN',
        robotTypes: ['SENTINEL', 'PURSUER'],
        counts: { SENTINEL: 3, PURSUER: 3 },
        spawnRegion: 'TOP_FAN'
    },
    {
        id: 'PRESSURE_INC',
        time: 108,
        type: 'PRESSURE',
        maxActive: 16,
        pressure: 0.8
    },
    {
        id: 'MIXED_GROUP_1',
        time: 108,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        robotTypes: ['PURSUER', 'SENTINEL'],
        counts: { PURSUER: 6, SENTINEL: 3 },
        spawnRegion: 'TOP_RANDOM'
    },
    {
        id: 'FIRST_SPECTACLE',
        time: 125,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        robotTypes: ['SENTINEL'],
        counts: { SENTINEL: 14 },
        spawnRegion: 'TOP_ARC',
        maxActive: 24
    },
    {
        id: 'RETREAT_1',
        time: 140,
        type: 'RETREAT',
        retreatFraction: 0.7,
        priority: 'OLDEST'
    },
    {
        id: 'LULL_1',
        time: 145,
        type: 'LULL',
        duration: 25
    },
    {
        id: 'ARMORED_ADVANCE',
        time: 170,
        type: 'SPAWN',
        formation: 'HEAVY_ADVANCE',
        robotTypes: ['ARMORED_PURSUER', 'PURSUER'],
        counts: { ARMORED_PURSUER: 3, PURSUER: 4 },
        spawnRegion: 'TOP_RANDOM'
    },
    {
        id: 'CROSSFIRE',
        time: 190,
        type: 'SPAWN',
        formation: 'PINCER',
        robotTypes: ['SENTINEL'],
        counts: { SENTINEL: 6 },
        spawnRegion: 'SIDES'
    },
    {
        id: 'REINFORCEMENTS_2',
        time: 210,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        robotTypes: ['PURSUER', 'SENTINEL', 'ARMORED_PURSUER'],
        counts: { PURSUER: 4, SENTINEL: 3, ARMORED_PURSUER: 1 },
        spawnRegion: 'TOP_RANDOM'
    },
    {
        id: 'RETREAT_2',
        time: 220,
        type: 'RETREAT',
        retreatFraction: 0.5
    },
    {
        id: 'LULL_2',
        time: 220,
        type: 'LULL',
        duration: 20
    },
    {
        id: 'HEAVY_ASSAULT',
        time: 240,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        robotTypes: ['PURSUER', 'SENTINEL', 'ARMORED_PURSUER'],
        counts: { PURSUER: 8, SENTINEL: 4, ARMORED_PURSUER: 3 },
        spawnRegion: 'TOP_RANDOM',
        maxActive: 24
    },
    {
        id: 'LASER_CRESCENDO',
        time: 260,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        robotTypes: ['SENTINEL'],
        counts: { SENTINEL: 16 },
        spawnRegion: 'TOP_ARC',
        maxActive: 36
    },
    {
        id: 'FINAL_DEPLOYMENT',
        time: 282,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        robotTypes: ['PURSUER', 'SENTINEL', 'ARMORED_PURSUER'],
        counts: { PURSUER: 10, SENTINEL: 6, ARMORED_PURSUER: 4 },
        spawnRegion: 'TOP_RANDOM',
        maxActive: 36
    },
    {
        id: 'EVACUATION',
        time: 291,
        type: 'CLEAR_FOR_BOSS'
    }
];
