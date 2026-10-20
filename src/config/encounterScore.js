/**
 * Musical choreography for robot encounters.
 * All times are in seconds relative to the start of the 'SYNTH' track.
 */
export const AMBIENT_POLICY = {
    startTime: 24,
    targetCount: 4, // Average 3-6
    spawnIntervalRange: [4, 8], // Seconds
    types: ['PURSUER', 'SENTINEL'],
    armoredStartTime: 170, // Introduce armored pursuers later
    regions: ['BOTTOM_APPROACH', 'BOTTOM_FAN']
};

export const ENCOUNTER_SCORE = [
    {
        id: 'FIRST_PATROL0',
        time: 10,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { PURSUER: 1 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'FIRST_PATROL1',
        time: 16,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { PURSUER: 2 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'FIRST_PATROL2',
        time: 24,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { PURSUER: 3 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'REINFORCEMENTS_1',
        time: 35,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { ARMORED_PURSUER: 1, SENTINEL: 3, PURSUER: 3 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'REINFORCEMENTS_2',
        time: 40,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { SENTINEL: 3, PURSUER: 5 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'REINFORCEMENTS_3',
        time: 47,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { ARMORED_PURSUER: 1, SENTINEL: 2, PURSUER: 5 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'LASER_INTRO',
        time: 55,
        type: 'SPAWN',
        formation: 'FAN',
        counts: { SENTINEL: 3, PURSUER: 6 },
        spawnRegion: 'BOTTOM_FAN'
    },
    {
        id: 'PRESSURE_INC',
        time: 65,
        type: 'PRESSURE',
        maxActive: 16,
        pressure: 0.8
    },
    {
        id: 'MIXED_GROUP_1',
        time: 85,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        counts: { ARMORED_PURSUER: 1, PURSUER: 3, SENTINEL: 3 },
        spawnRegion: 'BOTTOM_FAN'
    },
    {
        id: 'FIRST_SPECTACLE',
        time: 90,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { SENTINEL: 6 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 24
    },
    {
        id: 'FIRST_SPECTACLE1',
        time: 90,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { SENTINEL: 7 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 24
    },
    {
        id: 'FIRST_SPECTACLE2',
        time: 90,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { SENTINEL: 8 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 24
    },
    {
        id: 'FIRST_SPECTACLE3',
        time: 105,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { SENTINEL: 4 },
        spawnRegion: 'BOTTOM_ARC',
        maxActive: 24
    },
    {
        id: 'HEART_0',
        time: 120,
        type: 'HEART_DROP',
        ifHeartsBelow: 3
    },
    {
        id: 'HEART_0_EXTRA',
        time: 120,
        type: 'HEART_DROP',
        ifHeartsBelow: 6 // Always drop at 120s if not full
    },
    {
        id: 'FIRST_SPECTACLE4',
        time: 125,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { ARMORED_PURSUER: 1, PURSUER: 6, SENTINEL: 4 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 24
    },
    {
        id: 'FIRST_SPECTACLE5',
        time: 132,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { PURSUER: 3, SENTINEL: 3 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 24
    },

    {
        id: 'ARMORED_ADVANCE1',
        time: 140,
        type: 'SPAWN',
        formation: 'HEAVY_ADVANCE',
        counts: { ARMORED_PURSUER: 2, PURSUER: 3 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'ARMORED_ADVANCE2',
        time: 150,
        type: 'SPAWN',
        formation: 'HEAVY_ADVANCE',
        counts: { ARMORED_PURSUER: 2, PURSUER: 5, SENTINEL: 2 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'ARMORED_ADVANCE3',
        time: 155,
        type: 'SPAWN',
        formation: 'HEAVY_ADVANCE',
        counts: { ARMORED_PURSUER: 2, PURSUER: 4, SENTINEL: 3 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'RETREAT_1',
        time: 160,
        type: 'RETREAT',
        retreatFraction: 0.7,
        priority: 'OLDEST'
    },
    {
        id: 'HEART_1',
        time: 160,
        type: 'HEART_DROP',
        ifHeartsBelow: 3
    },
    {
        id: 'LULL_1',
        time: 165,
        type: 'LULL',
        duration: 25
    },
    {
        id: 'ARMORED_ADVANCE',
        time: 170,
        type: 'SPAWN',
        formation: 'HEAVY_ADVANCE',
        counts: { ARMORED_PURSUER: 1, PURSUER: 4 },
        spawnRegion: 'BOTTOM_APPROACH'
    },
    {
        id: 'ARMORED_ADVANCE1_ALT',
        time: 176,
        type: 'SPAWN',
        formation: 'HEAVY_ADVANCE',
        counts: { SENTINEL: 6, ARMORED_PURSUER: 2, PURSUER: 4 },
        spawnRegion: 'BOTTOM_FAN'
    },
    {
        id: 'CROSSFIRE',
        time: 190,
        type: 'SPAWN',
        formation: 'PINCER',
        counts: { SENTINEL: 6 },
        spawnRegion: 'BOTTOM_PINCER'
    },
    {
        id: 'REINFORCEMENTS_2B',
        time: 210,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        counts: { PURSUER: 4, SENTINEL: 3, ARMORED_PURSUER: 1 },
        spawnRegion: 'BOTTOM_FAN'
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
        counts: { PURSUER: 8, SENTINEL: 4, ARMORED_PURSUER: 2 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 24
    },
    {
        id: 'LASER_CRESCENDO',
        time: 260,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { SENTINEL: 5 },
        spawnRegion: 'BOTTOM_ARC',
        maxActive: 36
    },
    {
        id: 'LASER_CRESCENDO2',
        time: 265,
        type: 'SPAWN',
        formation: 'SENTINEL_WALL',
        counts: { SENTINEL: 5 },
        spawnRegion: 'BOTTOM_ARC',
        maxActive: 36
    },
    {
        id: 'FINAL_DEPLOYMENT',
        time: 282,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        counts: { PURSUER: 6, SENTINEL: 4, ARMORED_PURSUER: 3 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 36
    },
    {
        id: 'EVACUATION',
        time: 291,
        type: 'CLEAR_FOR_BOSS'
    },
    {
        id: 'BOSS_REINFORCEMENTS_1',
        time: 310,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { SENTINEL: 2 },
        spawnRegion: 'SIDES',
        maxActive: 4
    },
    {
        id: 'BOSS_REINFORCEMENTS_2',
        time: 325,
        type: 'SPAWN',
        formation: 'MIXED_SWARM',
        counts: { PURSUER: 3, SENTINEL: 1 },
        spawnRegion: 'BOTTOM_FAN',
        maxActive: 6
    },
    {
        id: 'BOSS_REINFORCEMENTS_3',
        time: 340,
        type: 'SPAWN',
        formation: 'PATROL',
        counts: { ARMORED_PURSUER: 1, PURSUER: 2 },
        spawnRegion: 'SIDES',
        maxActive: 6
    },
    {
        id: 'BOSS_FINALE_CLEAR',
        time: 350,
        type: 'CLEAR_FOR_BOSS'
    }
];
