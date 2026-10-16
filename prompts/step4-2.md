# JUNIE TASK — LORELEI: DESCENT
## Step 4.2: Fixed Boss Arena, Music-Synchronized Camera Modes, and Optional Mouse-Assisted Movement

### 1. Project Context

We are developing **LORELEI: DESCENT**, a browser-based, music-driven, top-down arcade shooter based on the Lorelei superhero novel series.

Technology:

- JavaScript ES modules
- Phaser 3.88.2
- Vite 8.3.4
- Node.js 24
- Phaser Arcade Physics
- Logical resolution: 640 × 960
- Portrait-oriented gameplay

Steps 1, 2, 3, 3.1, 4, and 4.1 have been completed.

The application currently supports:

- A title screen and gameplay scene.
- A scrolling underground chamber.
- Blackrush movement with WASD and arrow keys.
- Mouse aiming.
- Rapid-fire energy bolts.
- A spinning throwing axe.
- Projectile pooling.
- Music-synchronized automatic descent.
- Three original musical recordings.
- A persistent TimelineDirector and AudioDirector.
- Developer timeline seeking and debugging.
- Functional Victory and Replay transitions.
- Correct scene lifecycle management.

The developer has manually verified that the Step 4.1 corrections work correctly.

**This task is limited to Step 4.2. Do not implement Step 5 or later gameplay mechanics.**

Before making changes, inspect the existing implementation, particularly:

- `src/config/timeline.js`
- `src/config/gameplayConfig.js`
- `src/scenes/GameScene.js`
- `src/entities/Blackrush.js`
- `src/controls/DesktopControls.js`
- `src/systems/DescentController.js`
- `src/systems/ChamberBuilder.js`
- `src/systems/TimelineDirector.js`
- `src/ui/TimelineDebugPanel.js`

Preserve existing working functionality.

---

## 2. Primary Objectives

Implement two enhancements:

**A. Music-synchronized camera modes**

The chamber scrolls downward during the chase and robot swarm, but stops scrolling when the Proxy boss battle begins at Synth 5:00.

The camera remains fixed throughout the Proxy and super-robot battles.

**B. Optional mouse-assisted movement**

Introduce an alternative desktop control mode allowing Blackrush to move toward the mouse pointer when it is sufficiently far away.

Traditional WASD movement remains available in both modes.

The player must be able to select between Classic and Assisted controls.

Both enhancements should be configurable and testable independently.

---

## 3. Revised Game Progression

The game now has two primary gameplay environments.

### Environment 1: The Descent

Soundtrack: `below-gamorrah-synth.mp3`

Time range: 0:00–5:00.

Behavior:

- The camera automatically descends through the underground complex.
- Blackrush moves freely within the visible playable area.
- The player cannot prevent downward progression.
- The chamber and obstacles scroll upward relative to the camera.
- The existing musical timeline controls the rate of progression.

The future robot swarm occupies most of this sequence.

### Environment 2: The Boss Arena

Begins at Synth 5:00.

Continues throughout the Cathedral track, approximately 4:01.

Behavior:

- Automatic camera scrolling stops.
- The camera remains fixed at a predetermined arena position.
- Blackrush can move around the visible arena.
- Existing aiming and weapons remain functional.
- The Proxy battle will occur here.
- The debris wall will eventually appear at the bottom of the arena.
- The super-robot will eventually break through the debris.
- The two boss battles occur in the same environment.

For Step 4.2, do not create actual boss fights, debris walls, or destructible arena objects.

Simply establish the camera behavior and placeholder arena environment.

---

## 4. Camera Modes

Extend the existing DescentController or introduce a lightweight camera-mode abstraction.

Use two named camera modes:

- `DESCENT`
- `ARENA`

The active camera mode must be determined from the current authoritative musical position.

Do not use an accumulating frame timer.

Do not allow camera mode to depend on previous events having fired, because the developer can seek directly to any musical timestamp.

### DESCENT mode

Active during Synth 0:00 to 5:00.

The camera advances downward using the existing configurable descent rate.

### ARENA mode

Active from Synth 5:00 through the end of Cathedral.

The camera stays at the depth reached when the descent ends.

For a constant descent rate of 75 world pixels per second, the provisional arena camera position would be:

`75 × 300 = 22,500 world pixels`

However, do not hardcode 22,500.

Derive the arena position from the configured descent function evaluated at Synth 5:00.

This ensures that changing the descent rate doesn't require manually updating arena placement.

### Studio track

When Studio begins, the game transitions to EndingScene as already implemented.

Do not continue gameplay camera updates during Studio.

---

## 5. Smooth Transition Into the Arena

I would like the camera to decelerate slightly as it approaches the arena.

Implement an optional, configurable deceleration interval.

Suggested initial value:

- Begin slowing at Synth 4:57.
- Stop completely at Synth 5:00.

Use a deterministic position function driven by the musical timestamp.

Do not use a conventional tween whose progress can diverge from the audio.

Avoid introducing a discontinuity in camera position when deceleration begins or ends.

The arena's final camera position should be derived from the same continuous position function used during descent, including the deceleration interval.

When the developer seeks directly to 5:00 or later, the camera must immediately appear at the correct final position.

The deceleration should feel subtle rather than theatrical.

Keep its duration configurable.

---

## 6. Boss Arena Geometry

The final boss encounter may eventually require a battlefield larger than the visible 640 × 960 viewport.

We want to preserve that future possibility.

Design the arena representation so that it can eventually support:

- A battlefield wider than the viewport.
- Horizontal camera tracking.
- Limited upward or downward camera movement.
- Large boss entities.
- Debris along the lower boundary.
- Industrial obstacles and cover.

However, for Step 4.2:

- Keep the camera fixed.
- Keep the immediately playable area within the current viewport.
- Use simple primitive geometry.
- Do not implement camera-follow behavior.
- Do not enlarge the actual playable area beyond the viewport yet.

Separate arena world bounds from viewport bounds.

Avoid assuming that the arena will always be exactly 640 pixels wide.

Suggested architecture:

`src/config/arenaConfig.js`

Use a configuration object that can eventually define:

- World boundaries.
- Camera boundaries.
- Arena entry position.
- Boss spawn locations.
- Debris positions.
- Environmental objects.

Only populate parameters needed for this milestone.

Do not create speculative boss implementations.

---

## 7. Arena Visuals

When the camera reaches Synth 5:00, the player should be able to recognize that the chamber has opened into a large industrial arena.

Use Phaser Graphics primitives.

Suggested appearance:

- A broader, visually open central floor.
- Heavy structural supports along the sides.
- Industrial machinery near the boundaries.
- A large, unobstructed central combat area.
- Subtle floor markings.
- A darker southern boundary where the future debris wall will appear.

Do not create the debris wall yet.

Do not introduce actual artwork.

The arena should be part of the continuous underground environment rather than a separate unrelated background.

It should be placed deterministically at the calculated arena depth.

Seeking to the same position must produce the same environment.

The arena should remain visually unchanged when transitioning from Synth to Cathedral.

It must not regenerate or shift at the soundtrack boundary.

---

## 8. Camera and Player Behavior at Arena Entry

When entering ARENA mode:

1. The camera finishes descending.
2. Blackrush remains visible.
3. His world position is reconciled with the fixed camera.
4. Movement controls remain active.
5. His position is constrained to the visible arena.
6. Weapons continue functioning.

Avoid snapping Blackrush unnecessarily to the center of the arena.

Preserve his relative screen position when possible.

The transition should not teleport the character.

If the player is already near a viewport boundary, clamp his position to safe playable bounds.

During ARENA mode, the camera must not resume scrolling because Blackrush moves toward the bottom of the screen.

The player may move up, down, left, and right within the arena.

The camera remains stationary.

---

## 9. Developer Seeking and Camera Restoration

This is a critical requirement.

The developer timeline panel must continue functioning correctly.

Test direct jumps to:

- CHASE
- SWARM
- PROXY
- SUPER-ROBOT
- FIRST PANZER SHOT
- SECOND PANZER SHOT
- VICTORY

Expected behavior:

| Timeline destination | Camera mode |
|---|---|
| Synth 0:00 | DESCENT |
| Synth 2:00 | DESCENT |
| Synth 4:30 | DESCENT |
| Synth 5:00 | ARENA |
| Synth 5:30 | ARENA |
| Cathedral 0:00 | ARENA |
| Cathedral 3:00 | ARENA |
| Cathedral 3:30 | ARENA |
| Studio | EndingScene |

When seeking from ARENA back to DESCENT:

- Restore the correct earlier camera depth.
- Keep Blackrush visible.
- Restore the appropriate environment.
- Reset transient projectiles as established in Step 4.
- Avoid duplicate listeners or physics bodies.

When seeking from DESCENT into ARENA:

- Immediately select the fixed arena camera position.
- Reconcile Blackrush's location.
- Display the correct arena geometry.

Do not replay elapsed camera movements after seeking.

The camera must be reconstructed directly from the timeline state.

---

## 10. Optional Mouse-Assisted Movement

Introduce a second desktop control scheme.

### CLASSIC mode

Existing behavior:

- WASD or arrow keys move Blackrush.
- Mouse aims.
- Left mouse button fires energy bolts.
- Right mouse button throws an axe.

The pointer's distance from Blackrush has no effect on player movement.

This remains the default control mode.

### ASSISTED mode

Behavior:

- WASD and arrow keys remain functional.
- Mouse continues aiming.
- When the pointer is close to Blackrush, it only aims.
- When the pointer moves beyond a configurable radius, Blackrush begins moving toward it.
- WASD or arrow-key input overrides automatic mouse movement.

The player's mouse position determines both aim direction and optional assisted movement direction.

The goal is to allow a player to navigate the chamber and shoot without requiring constant keyboard input.

---

## 11. Assisted Movement Dead Zone

Use a circular dead zone centered on Blackrush.

Suggested initial radius:

**110 logical pixels.**

Inside the dead zone:

- No mouse-assisted movement.
- Mouse aiming continues normally.

Outside the dead zone:

- Blackrush moves toward the pointer.

Movement speed should increase gradually with pointer distance beyond the dead zone.

Suggested behavior:

- 0–110 pixels: no assisted movement.
- 110–160 pixels: gradual acceleration.
- Beyond 160 pixels: normal maximum movement speed.

Make these values configurable.

Use a smooth response curve rather than an abrupt transition.

Avoid jitter at the threshold.

Calculate pointer distance in consistent coordinate units, taking into account Phaser's canvas scaling and camera transformation.

Use the current Blackrush world position and the pointer's world position, or equivalent consistent screen-space coordinates.

Do not mix CSS pixels with logical Phaser pixels.

---

## 12. Assisted Movement and Keyboard Priority

Keyboard movement must take priority.

If any WASD or arrow-key movement input is active:

- Use keyboard movement.
- Ignore mouse-assisted movement for that frame.
- Continue using the pointer for aiming.

When keyboard movement stops:

- Assisted movement may resume if the pointer remains outside the dead zone.

Do not add mouse and keyboard movement vectors together.

This avoids unexpected speed boosts or conflicting directions.

Preserve diagonal speed normalization.

Preserve the existing acceleration and deceleration behavior.

---

## 13. Mouse Buttons and Assisted Movement

In ASSISTED mode:

- Left mouse button continues firing energy bolts.
- Right mouse button continues throwing an axe.
- Mouse movement may continue while firing the energy weapon.
- Temporarily suppress assisted movement while the right mouse button is pressed.

This prevents the throwing-axe action from unintentionally changing Blackrush's position.

Do not suppress mouse aiming.

Preserve the existing protection against the START GAME click carrying into gameplay.

Do not allow a click on the title screen or developer timeline controls to trigger accidental weapon firing.

If the pointer is over the HTML developer panel rather than the Phaser canvas, assisted movement must not respond to that pointer location.

---

## 14. Control Mode Selection

Add a simple control mode selector to TitleScene.

Choices:

- CLASSIC
- ASSISTED

Use clear labels and short descriptions.

Example:

CLASSIC — Keyboard movement, mouse aiming.

ASSISTED — Mouse-follow movement with keyboard override.

Default to CLASSIC for first-time players.

Store the player's selection using browser localStorage.

Use a stable storage key such as:

`lorelei_descent_control_mode`

Handle unavailable or blocked localStorage gracefully.

Do not allow a storage error to prevent the game from starting.

Changing the selection should affect the next game session.

If convenient and simple, allow changing modes during gameplay using a keyboard shortcut, but this is optional.

Avoid adding a large settings menu.

Do not implement mobile input yet.

---

## 15. Input Architecture

Preserve the existing separation between input acquisition and character mechanics.

Update:

`src/controls/DesktopControls.js`

The control module should produce a normalized movement intent.

Blackrush should receive movement commands without needing to know whether they came from:

- WASD
- Arrow keys
- Mouse assistance

Use small, testable functions to calculate assisted movement.

For example, implement a pure function that accepts:

- Player position.
- Pointer position.
- Dead-zone radius.
- Full-speed radius.
- Maximum movement value.

And returns a normalized movement vector or movement intent.

Do not over-engineer the control abstraction.

Keep future mobile controls possible without implementing them now.

---

## 16. Pause, Resume, and Scene Lifecycle

All existing pause behavior must continue working.

When music is paused:

- Blackrush does not move.
- Mouse assistance does not move Blackrush.
- Energy weapon does not fire.
- Axe cooldown does not advance.
- Camera does not move.
- Projectiles do not advance.

When music resumes, normal gameplay resumes.

Returning to TitleScene must properly release gameplay input subscriptions.

Replay must restore the selected control mode.

Jumping from EndingScene back into gameplay through the developer timeline must restore the input system without duplicating listeners.

Respect the lifecycle cleanup established in Step 3.1 and Step 4.1.

---

## 17. Development Diagnostics

Extend the developer panel with minimal additional diagnostics.

Display:

- Active camera mode: DESCENT or ARENA.
- Current camera scrollY.
- Configured arena depth.
- Selected control mode.
- Mouse distance from Blackrush.
- Whether assisted movement is active.

Avoid cluttering the existing timeline controls.

A collapsible diagnostics section is acceptable.

If the pointer is not inside the game canvas, indicate that mouse assistance is inactive.

Do not add unnecessary debug overlays during normal gameplay.

---

## 18. Configuration

Keep configuration centralized.

Suggested additions to gameplay configuration:

- Arena entry time.
- Camera deceleration duration.
- Descent rate.
- Camera mode identifiers.
- Assisted movement dead-zone radius.
- Assisted movement full-speed radius.
- Default control mode.

The arena configuration should remain separate where appropriate.

Avoid duplicating these constants across scene classes.

Musical cue times in `timeline.js` remain the authoritative schedule.

Do not alter the existing musical event timestamps unless required to support the camera transition.

---

## 19. Regression Tests

Add deterministic unit tests for camera position and assisted movement.

At minimum, verify:

### Camera tests

1. Synth 0:00 selects DESCENT mode.
2. Synth 2:00 selects DESCENT mode.
3. Synth 4:30 selects DESCENT mode.
4. Synth 4:58 produces a decelerating camera position.
5. Synth 5:00 selects ARENA mode.
6. Synth 5:30 remains at arena depth.
7. Cathedral 0:00 uses the same arena depth.
8. Cathedral 3:30 remains at arena depth.
9. Seeking backward restores the appropriate descent depth.
10. Camera position is continuous at the start and end of deceleration.

### Assisted movement tests

1. Pointer inside dead zone produces zero movement.
2. Pointer exactly at dead-zone boundary produces zero movement.
3. Pointer slightly outside produces gradual movement.
4. Pointer beyond full-speed radius produces maximum movement intent.
5. Movement direction matches pointer direction.
6. Diagonal movement remains normalized.
7. Keyboard input overrides mouse-assisted movement.
8. Right mouse button suppresses mouse-assisted movement.
9. Pointer outside the canvas suppresses mouse-assisted movement.
10. Classic mode ignores mouse distance.

### Lifecycle tests

Verify:

- Game starts correctly.
- Input mode persists across Replay.
- Developer seeking works after Victory.
- No duplicate listeners accumulate.
- Pausing freezes assisted movement.
- The scene remains stable during camera-mode changes.

Use the existing Node.js test runner where practical.

Do not introduce a new testing framework.

---

## 20. Manual Browser Verification

Run:

`npm run dev`

Verify:

1. The title screen offers Classic and Assisted controls.
2. Classic behaves exactly as before.
3. Assisted movement activates outside the dead zone.
4. WASD overrides assisted movement.
5. Mouse aiming remains accurate.
6. Left-click firing works in both modes.
7. Right-click throwing works in both modes.
8. The camera descends normally before Synth 5:00.
9. The camera smoothly stops at Synth 5:00.
10. The camera remains fixed during Cathedral.
11. The arena is recognizable.
12. Seeking backward restores the scrolling chamber.
13. Seeking forward restores the arena.
14. Victory and Replay work.
15. No console exceptions occur.

Where possible, use the developer panel to test camera positioning without listening through the entire recording.

---

## 21. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- The revised two-stage camera structure.
- The fixed boss arena.
- Arena entry at Synth 5:00.
- Camera deceleration behavior.
- Classic and Assisted controls.
- Mouse-follow dead zone.
- Keyboard override behavior.
- Control mode persistence.
- Developer camera diagnostics.
- Known limitations.

Mark Step 4.2 complete only after implementation and verification.

---

## 22. Scope Restrictions

Do not implement:

- Robot movement.
- Robot AI.
- Robot damage.
- Robot shooting.
- Enemy spawning.
- Shield damage.
- Combat scoring.
- Boss attack patterns.
- The Proxy boss itself.
- The giant super-robot.
- Debris wall destruction.
- Panzer tank.
- German soldier.
- Grenade interaction.
- Lorelei NPC.
- Police NPCs.
- Mobile touchscreen gameplay.
- Actual sprite artwork.
- Sound effects.
- New music.
- Final promotional artwork.
- Backend services.

Do not modify the original MP3 files.

Preserve all existing weapon behavior.

Preserve the authoritative soundtrack timeline.

Do not begin Step 5.

---

## 23. Definition of Done

Step 4.2 is complete when:

- Automatic descent stops at Synth 5:00.
- Camera deceleration is deterministic and smooth.
- Camera remains stationary throughout both boss encounters.
- Boss arena geometry is present.
- Camera seeking correctly restores either environment.
- Classic controls remain unchanged.
- Assisted movement works.
- WASD overrides mouse assistance.
- Mouse aiming works in both modes.
- Right-click suppresses assisted movement appropriately.
- Control selection persists between sessions.
- Debug diagnostics reflect the current state.
- Existing soundtrack synchronization remains correct.
- Existing movement and weapon systems remain functional.
- Automated tests pass.
- Production build succeeds.

Provide a completion report summarizing the implementation, configuration, test results, and any known limitations.

Stop after Step 4.2.

Do not implement Step 5 without explicit authorization.