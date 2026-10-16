# JUNIE TASK — LORELEI: DESCENT
## Step 3: Music Integration, Master Timeline, Developer Controls, and Canvas Centering

### 1. Project Context

We are continuing development of LORELEI: DESCENT, a browser-based, music-driven arcade shooter built with JavaScript, Phaser 3, and Vite.

Steps 1 and 2 are complete and working.

Existing environment:

- Node.js 24.12.0
- npm 11.6.2
- Phaser 3.88.2
- Vite 8.3.4
- Logical resolution: 640 × 960
- Development server: http://localhost:3000

Read the existing source code and project documentation before making changes.

Important existing files include:

- `src/main.js`
- `src/config/gameConfig.js`
- `src/scenes/BootScene.js`
- `src/scenes/TitleScene.js`
- `src/scenes/GameScene.js`
- `src/scenes/EndingScene.js`
- `src/systems/ChamberBuilder.js`
- `src/ui/Hud.js`
- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`

Preserve existing functionality.

**Implement Step 3 only. Do not implement combat, movement, enemy AI, automatic scrolling, or other later milestones.**

### 2. New Audio Assets

The developer has already placed three original MP3 recordings in:

`public/assets/audio/music/`

Files:

| Filename | Reported duration |
|---|---|
| `below-gamorrah-synth.mp3` | 6:02 (362 seconds) |
| `below-gamorrah-cathedral.mp3` | 4:01 (241 seconds) |
| `below-gamorrah-studio.mp3` | 3:07 (187 seconds) |

The combined duration is approximately 790 seconds, or 13 minutes 10 seconds.

**Do not modify, rename, transcode, trim, normalize, or overwrite these files.**

Inspect the actual audio metadata where practical, since the above durations are rounded to whole seconds.

Use the decoded audio durations as the authoritative track lengths after loading.

Do not hardcode the reported durations as exact playback endpoints.

### 3. Primary Objective

Implement an audio-driven timeline system in which the soundtrack controls the game sequence.

When the player clicks START GAME:

1. The Synth track begins.
2. The current timeline phase is displayed.
3. Events occur at configured positions within the musical track.
4. The game automatically transitions to the Cathedral track when Synth ends.
5. Cathedral completes and transitions to the Studio track.
6. The EndingScene displays while Studio plays.
7. Music stops when the player returns to TitleScene or restarts the game.

The player should be able to listen to the complete soundtrack while watching the timeline advance.

No actual gameplay events are required yet. Timeline events should generate visible development indicators and optional console logging.

We will connect these events to actual gameplay systems in subsequent milestones.

### 4. Architecture

Create the following modules:

`src/config/timeline.js`

Defines musical tracks, phases, timestamps, and scheduled events.

`src/systems/AudioDirector.js`

Responsible for:

- Loading and managing music playback.
- Starting individual tracks.
- Pausing.
- Resuming.
- Seeking.
- Stopping.
- Tracking playback position.
- Handling track completion.
- Maintaining master music volume.

`src/systems/TimelineDirector.js`

Responsible for:

- Determining the current phase.
- Dispatching timeline events.
- Tracking which one-shot events have occurred.
- Handling track transitions.
- Supporting developer seeking.
- Providing current timeline state to GameScene and UI.
- Ensuring that events are not duplicated.

`src/ui/TimelineDebugPanel.js`

A developer-only interface for inspecting and controlling the timeline.

Use Phaser 3 APIs appropriately and keep the architecture simple.

Avoid circular dependencies.

The TimelineDirector should not contain robot, weapon, movement, or boss-fight implementations.

### 5. Master Timeline Configuration

Define three named music tracks.

#### Track 1 — SYNTH

Duration: approximately 362 seconds.

Phases:

- 0:00–0:45: CHASE
- 0:45–5:00: ROBOT_SWARM
- 5:00–end: PROXY_BATTLE

Events:

- 0:00 — CHASE_START
- 0:45 — SWARM_START
- 2:00 — SWARM_INTENSIFY_1
- 3:30 — SWARM_INTENSIFY_2
- 4:30 — SWARM_CLIMAX
- 5:00 — PROXY_RELEASES_NADINE
- 5:15 — PROXY_ATTACK
- 5:40 — GERMAN_SOLDIER_APPEARS
- 5:50 — GRENADE_SEQUENCE
- Approximately 5:58 — PROXY_COLLAPSE
- Track completion — TRANSITION_TO_CATHEDRAL

These are provisional event cues for development.

They must all be configurable in `timeline.js`.

The musical positions may be adjusted after the developer has listened to the recordings alongside the timeline.

#### Track 2 — CATHEDRAL

Duration: approximately 241 seconds.

Phases:

- 0:00–3:00: SUPER_ROBOT_BATTLE
- 3:00–3:30: PANZER_ASSAULT
- 3:30–end: FINAL_DESTRUCTION

Events:

- 0:00 — SUPER_ROBOT_APPEARS
- 1:30 — BOSS_INTENSIFIES
- 3:00 — PANZER_SHOT_1
- 3:30 — PANZER_SHOT_2
- 3:45 — FINAL_BOSS_DESTRUCTION
- Approximately 3:55 — NADINE_RETURNS
- Track completion — TRANSITION_TO_STUDIO

Again, these events are provisional and configurable.

#### Track 3 — STUDIO

Duration: approximately 187 seconds.

This track accompanies the EndingScene.

Phases:

- 0:00–0:20: VICTORY
- 0:20–end: CREDITS_AND_PROMOTION

Events:

- 0:00 — VICTORY_START
- 0:20 — SHOW_CREDITS
- 0:35 — SHOW_BOOK_PROMOTION

The credits and book promotion do not need to disappear when Studio finishes.

The Studio track should normally play once, without automatically returning to the game.

The player can use REPLAY or BACK TO TITLE at any time.

### 6. Critical Timing Requirements

This is the most important architectural part of Step 3.

**The soundtrack is the authoritative clock.**

Do not implement the main timeline using an accumulating frame delta such as:

`elapsed += delta`

That would allow gameplay timing to drift from the recording.

Instead, obtain the current position from the active audio playback system.

Prefer Phaser's Web Audio implementation when supported, but use documented Phaser 3 APIs and verify their actual behavior in version 3.88.2.

Do not assume that a particular sound object's `seek` property or playback state works identically in Web Audio and HTML5 Audio.

Provide a clean abstraction that returns:

- Current track identifier.
- Current playback position in seconds.
- Track duration.
- Playing/paused state.
- Global timeline position.
- Current phase.
- Upcoming event.

The system must tolerate minor timing discrepancies and frame delays.

### 7. One-Shot Event Dispatch

Each scheduled event should normally fire exactly once during continuous forward playback.

For example:

- PANZER_SHOT_1 must not fire multiple times.
- GRENADE_SEQUENCE must not repeat every frame.
- SHOW_BOOK_PROMOTION must not repeat after appearing.

Do not detect events solely by testing floating-point equality against the audio timestamp.

Use threshold crossing or a similarly reliable approach.

A delayed rendering frame must not cause scheduled events to be silently skipped.

When several events become due in the same frame, dispatch them deterministically in chronological order.

Distinguish between persistent state and one-shot events.

For example:

- Current phase is persistent state.
- PANZER_SHOT_1 is a one-shot event.

### 8. Seeking and Event State

Seeking requires special care.

When the developer seeks from Synth 0:30 to Synth 5:30, the game should:

1. Position the audio at 5:30.
2. Update the current phase to PROXY_BATTLE.
3. Update the development display.
4. Mark earlier one-shot events as already passed, without replaying them.
5. Allow later events to fire normally.

Seeking backward should reset the one-shot event state appropriately so events can fire again when playback reaches them.

Do not blindly fire every event between the old and new positions during a manual seek.

A seek is a state restoration operation, not simulated playback.

Keep the seek semantics explicit and testable.

Although actual boss and enemy state restoration will come in later milestones, establish the event-state behavior now so gameplay systems can eventually integrate with it.

### 9. Pause and Resume

Implement reliable pause and resume functionality.

Requirements:

- Pausing must stop both timeline progression and audio playback.
- Resuming must continue from the same musical position.
- The displayed time must remain stable while paused.
- Do not restart the current track when resuming.
- Prevent multiple overlapping copies of the same track.

Handle browser focus and visibility changes.

If the browser tab becomes hidden or the game loses focus, pause the music and timeline.

For simplicity, do not automatically resume when the browser becomes visible again.

Require explicit user interaction to resume.

This avoids surprising audio playback and potential browser autoplay restrictions.

If the browser audio context becomes suspended, handle that state without falsely reporting that the timeline is progressing.

### 10. Track Transitions

Transitions should be automatic and reliable.

SYNTH → CATHEDRAL → STUDIO.

Use actual audio playback completion rather than assuming exact rounded durations.

Do not allow accidental overlapping soundtracks.

Do not implement long fade-outs or delays between tracks unless required for correct playback.

The aim is for the transition to be as seamless as reasonably possible.

A small transition gap caused by browser scheduling is acceptable for Step 3, but report it if noticeable.

Do not implement an elaborate audio mixing or crossfade engine yet.

The transition into Studio must also switch from GameScene to EndingScene.

Keep audio playback ownership independent of individual Phaser scene lifetimes so scene transitions don't accidentally destroy the active music.

Returning to TitleScene must intentionally stop the soundtrack and release the relevant playback state.

### 11. Browser Audio Restrictions

Modern browsers restrict audio playback before the user has interacted with the page.

Ensure that the START GAME button initiates playback as a result of the user's gesture.

Do not attempt to autoplay music during BootScene.

If audio playback fails or is blocked, provide a clear on-screen indication and a working retry action.

Do not continue advancing the timeline silently when the soundtrack cannot play.

Test for multiple rapid clicks of START GAME so overlapping playback sessions cannot occur.

### 12. Developer Timeline Panel

Create a practical developer-only timeline interface.

This will become one of our most important tools while building the game.

The panel should display:

- Current track.
- Current phase.
- Elapsed time in MM:SS format.
- Track duration.
- Global elapsed time.
- Playback state.
- Next scheduled event.
- Last dispatched event.

Provide the following controls:

- PLAY / RESUME
- PAUSE
- STOP / RETURN TO TITLE
- RESTART CURRENT TRACK
- SEEK BACKWARD 10 SECONDS
- SEEK FORWARD 10 SECONDS
- JUMP TO CHASE
- JUMP TO SWARM
- JUMP TO PROXY
- JUMP TO SUPER-ROBOT
- JUMP TO FIRST PANZER SHOT
- JUMP TO SECOND PANZER SHOT
- JUMP TO VICTORY
- A draggable progress slider for seeking within the current track.

Prefer standard HTML controls for the development panel, positioned outside the Phaser canvas.

This will be easier to interact with using a mouse and will avoid consuming valuable gameplay space.

The panel should be clearly marked DEVELOPMENT TOOLS.

It must not become part of the production game's normal interface.

A developer mode query parameter is acceptable:

`http://localhost:3000/?debug=1`

Use an explicit configuration flag or Vite development mode to restrict access.

Do not assume that every production user should have access to seeking.

The initial HUD inside Phaser should remain visible and unobstructed.

### 13. Developer Visual Indicators

During Step 3, the existing GameScene is still static.

Use visible on-screen text or a small status display to indicate current timeline phases.

For example:

- CHASING THE PROXY
- ROBOT SWARM
- SWARM INTENSIFYING
- PROXY BATTLE
- SUPER-ROBOT BATTLE
- PANZER ATTACK
- FINAL DESTRUCTION

These are temporary development indicators.

Do not build the actual events they describe.

Optionally change the chamber's ambient tint or a small status label when changing phases.

Do not animate or move the robots yet.

### 14. Fix Canvas Centering

The developer noticed that the existing Phaser canvas is slightly offset to the right in the desktop browser viewport.

Correct this as part of Step 3.

Requirements:

- The game canvas should be horizontally centered in the available viewport.
- The canvas should be vertically centered when there is sufficient space.
- Preserve the 640 × 960 logical resolution.
- Preserve Phaser Scale.FIT behavior.
- Avoid browser page scrolling.
- Support narrower mobile displays.
- Do not create permanent promotional side panels yet.

Eventually, we may create a desktop presentation with decorative or promotional HTML panels on either side of the portrait-oriented game.

For now, center the canvas and leave symmetrical unused space on widescreen monitors.

Inspect the existing HTML container and CSS before making changes.

Prefer a simple flexbox or CSS grid solution.

Do not change the logical gameplay resolution to compensate for CSS positioning.

The debug panel may occupy separate desktop space without altering the centered gameplay layout.

### 15. EndingScene Integration

Update EndingScene so the Studio track can play while it is displayed.

For now, show:

- LORELEI: DESCENT
- MISSION COMPLETE
- A simple credits placeholder.
- A simple book promotion placeholder.
- REPLAY button.
- BACK TO TITLE button.

Do not implement actual book cover artwork or final promotional copy.

The Studio track should continue playing while the user views the ending screen.

REPLAY should stop Studio and begin a fresh game from Synth 0:00.

BACK TO TITLE should stop playback and return to TitleScene.

If Studio reaches its end, leave the EndingScene visible.

### 16. Configuration and Testing

Keep timeline data separate from implementation.

Do not scatter musical timestamps throughout scene classes.

Provide unit tests for timing calculations, event dispatch, track boundaries, and seek-state reconstruction.

Use Node.js's built-in test runner if practical, avoiding another testing dependency.

Tests should not require a browser for pure timeline logic.

At minimum, test:

1. Phase selection at 0:00.
2. Phase selection at 0:45.
3. Phase selection at 5:00.
4. Phase selection at track end.
5. Crossing an event timestamp.
6. Skipping across several event timestamps because of a delayed frame.
7. Repeated updates do not duplicate events.
8. Seeking forward does not fire skipped events.
9. Seeking backward allows appropriate events to fire again later.
10. Track transitions preserve correct global elapsed time calculations.
11. Pause and resume do not introduce time drift.
12. A completed Studio track leaves the ending state intact.

Do not use arbitrary timeout-based tests to simulate audio playback if a deterministic fake clock or mock audio adapter would provide more reliable testing.

### 17. Verification

Run:

`npm run build`

If tests have been added, run them as well.

Start the development server and verify the following if browser testing is available:

- TitleScene loads correctly.
- START GAME begins Synth.
- Audio plays at normal speed.
- Timeline display advances with the music.
- Current phase changes at the correct timestamps.
- Developer controls work.
- Seeking does not duplicate events.
- Pause and resume work.
- Browser tab suspension behaves correctly.
- Synth transitions to Cathedral.
- Cathedral transitions to Studio.
- EndingScene displays.
- REPLAY restarts the experience.
- BACK TO TITLE stops audio.
- Game canvas is properly centered.

If full browser testing is not possible, clearly report the tests requiring manual verification.

### 18. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- Actual audio asset filenames.
- Reported track durations.
- Timeline configuration format.
- How to edit cue timestamps.
- Developer timeline controls.
- Seeking semantics.
- Pause/resume behavior.
- Track transition behavior.
- How to test specific musical events.

Mark Step 3 as complete only after implementation and verification.

### 19. Strict Scope Restrictions

Do not implement:

- Player movement.
- Keyboard movement controls.
- Player shooting.
- Robot AI.
- Robot movement.
- Robot spawning.
- Automatic chamber scrolling.
- Collision physics.
- Shield damage.
- Weapons.
- Combat systems.
- Explosions.
- Boss fight mechanics.
- Grenade interactions.
- Panzer firing visuals.
- NPC behavior.
- Sprite animation.
- Final promotional artwork.
- Analytics.
- Backend services.

Do not generate additional music or sound effects.

Do not modify the original MP3 files.

Do not implement future milestones prematurely.

### 20. Definition of Done

Step 3 is complete when:

- All three MP3 files load correctly.
- Music playback starts only after appropriate user interaction.
- The soundtrack controls the timeline.
- Musical phases are identified correctly.
- Timeline events dispatch reliably.
- Pausing, resuming, and seeking work.
- Developer timeline controls are usable.
- Synth transitions into Cathedral.
- Cathedral transitions into Studio.
- Studio plays during EndingScene.
- Music stops or restarts correctly when navigating.
- The canvas is centered properly.
- Production build succeeds.
- Timing and seeking tests pass.
- Documentation is updated.
- No actual gameplay mechanics have been implemented.

### 21. Completion Report

Provide:

1. Summary of new and modified files.
2. Audio playback implementation details.
3. Actual detected duration of each track, where measurable.
4. Explanation of master-clock synchronization.
5. Event dispatch and seeking behavior.
6. Developer panel controls and access instructions.
7. Canvas centering correction.
8. Automated test results.
9. Build results.
10. Any known timing, browser audio, or transition limitations.

Stop after completing Step 3.

Do not begin Step 4 without explicit authorization.