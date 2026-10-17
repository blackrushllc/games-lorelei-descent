import { ENCOUNTER_SCORE } from './encounterScore.js';

/**
 * Musical tracks, phases, and scheduled events for LORELEI: DESCENT.
 * All timestamps are in seconds.
 */

// Convert encounter score to timeline events for the SYNTH track
const encounterEvents = ENCOUNTER_SCORE.map(cue => ({
    time: cue.time,
    id: cue.id
}));

export const TIMELINE_CONFIG = {
    tracks: {
        SYNTH: {
            id: 'synth',
            assetPath: 'assets/audio/music/below-gamorrah-synth.mp3',
            phases: [
                { id: 'CHASE', start: 0, end: 45, label: 'CHASING THE PROXY' },
                { id: 'ROBOT_SWARM', start: 45, end: 300, label: 'ROBOT SWARM' },
                { id: 'PROXY_BATTLE', start: 300, end: null, label: 'PROXY BATTLE' }
            ],
            events: [
                { time: 0, id: 'CHASE_START' },
                { time: 45, id: 'SWARM_START' },
                ...encounterEvents,
                { time: 120, id: 'SWARM_INTENSIFY_1' },
                { time: 210, id: 'SWARM_INTENSIFY_2' },
                { time: 270, id: 'SWARM_CLIMAX' },
                { time: 300, id: 'PROXY_RELEASES_NADINE' },
                { time: 315, id: 'PROXY_ATTACK' },
                { time: 340, id: 'GERMAN_SOLDIER_APPEARS' },
                { time: 350, id: 'GRENADE_SEQUENCE' },
                { time: 358, id: 'PROXY_COLLAPSE' }
            ]
        },
        CATHEDRAL: {
            id: 'cathedral',
            assetPath: 'assets/audio/music/below-gamorrah-cathedral.mp3',
            phases: [
                { id: 'SUPER_ROBOT_BATTLE', start: 0, end: 180, label: 'SUPER-ROBOT BATTLE' },
                { id: 'PANZER_ASSAULT', start: 180, end: 210, label: 'PANZER ATTACK' },
                { id: 'FINAL_DESTRUCTION', start: 210, end: null, label: 'FINAL DESTRUCTION' }
            ],
            events: [
                { time: 0, id: 'SUPER_ROBOT_APPEARS' },
                { time: 90, id: 'BOSS_INTENSIFIES' },
                { time: 180, id: 'PANZER_SHOT_1' },
                { time: 210, id: 'PANZER_SHOT_2' },
                { time: 225, id: 'FINAL_BOSS_DESTRUCTION' },
                { time: 235, id: 'NADINE_RETURNS' }
            ]
        },
        STUDIO: {
            id: 'studio',
            assetPath: 'assets/audio/music/below-gamorrah-studio.mp3',
            phases: [
                { id: 'VICTORY', start: 0, end: 20, label: 'MISSION COMPLETE' },
                { id: 'CREDITS_AND_PROMOTION', start: 20, end: null, label: 'CREDITS' }
            ],
            events: [
                { time: 0, id: 'VICTORY_START' },
                { time: 20, id: 'SHOW_CREDITS' },
                { time: 35, id: 'SHOW_BOOK_PROMOTION' }
            ]
        }
    },
    
    // Order of tracks for automatic transition
    sequence: ['SYNTH', 'CATHEDRAL', 'STUDIO']
};
