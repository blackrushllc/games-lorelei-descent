# JUNIE TASK — LORELEI: DESCENT
## Step 5.3: Repair Mission Lifecycle, Player Restoration, Enemy Encounters, and Shield State

### 1. Project context

We are developing LORELEI: DESCENT, a browser-based, music-driven arcade shooter using:

- JavaScript ES modules
- Phaser 3.88.2
- Phaser Arcade Physics
- Vite 8.3.4
- Node.js 24
- 640 × 960 logical resolution

Steps 1–5.2 have been implemented.

The game now supports:

- Music-synchronized gameplay.
- Automatic descent and a fixed boss arena.
- Classic and Assisted movement.
- Energy bolts and throwing axes.
- Three robot archetypes.
- Robot combat and armor destruction.
- Shield damage and Game Over.
- Developer timeline seeking.
- Multiple scene transitions.

The developer reports that fresh gameplay works reasonably well, but restarting and seeking corrupt gameplay state.

**This is a stabilization milestone. Do not implement new gameplay mechanics.**

Before making changes, inspect the actual implementation and relevant Git history.

Do not assume previously reported fixes are correct merely because unit tests passed.

### 2. Observed defects

The developer reports all of the following:

1. Using RESTART during gameplay from the developer tools sometimes causes Blackrush to disappear.

2. Restarting after Blackrush dies also causes Blackrush to disappear.

3. During the first game session, robot combat works. Ordinary robots die, and an axe removes armored plating so an energy bolt can destroy the exposed robot. After the initial test encounters, no additional robots appear. The latter is acceptable for Step 5.

4. Restarting before dying sometimes restores Blackrush but no robots appear.

5. Restarting after dying sometimes places robots much farther down the chamber than expected.

6. When Blackrush disappears after restart, using the developer controls to jump to another musical location can restore him.

7. After jumping away and returning to CHASE, Blackrush appears and the robots may be positioned correctly, but Blackrush can no longer die.

8. His shield still flashes when hit, but shield depletion no longer results in defeat.

9. The HUD shield indicator begins green, changes entirely to red after the first hit, and remains red even after a restart.

These symptoms suggest inconsistent state initialization, session ownership, scene lifecycle behavior, and shield rendering.

Investigate each symptom, but seek common root causes rather than applying unrelated patches.

### 3. Required preliminary audit

Inspect at least:

- `src/main.js`
- `src/scenes/TitleScene.js`
- `src/scenes/GameScene.js`
- `src/scenes/GameOverScene.js`
- `src/scenes/EndingScene.js`
- `src/entities/Blackrush.js`
- `src/entities/Robot.js`
- `src/systems/TimelineDirector.js`
- `src/systems/AudioDirector.js`
- `src/systems/DescentController.js`
- `src/systems/CombatSystem.js`
- `src/systems/WeaponSystem.js`
- `src/systems/ChamberBuilder.js`
- `src/ui/Hud.js`
- `src/ui/TimelineDebugPanel.js`
- Existing encounter configuration and tests

Trace the complete call paths for:

- START GAME.
- RESTART MISSION.
- REPLAY.
- Developer RESTART.
- Developer timeline seek.
- Shield depletion.
- GameScene shutdown and startup.
- Robot encounter initialization.

Determine which objects own session state and which operations trigger scene transitions.

Identify duplicated or conflicting ownership.

Report the actual causes.

### 4. Establish explicit mission lifecycle ownership

A mission is a complete gameplay session beginning at Synth 0:00.

Its state includes:

- Blackrush.
- Player shield.
- Score.
- Camera progression.
- Robot encounters.
- Robot AI state.
- Weapons and projectiles.
- Combat state.
- Input handling.
- Defeat state.
- Temporary effects.

Persistent application systems include:

- TimelineDirector.
- AudioDirector.
- Developer tools.
- Phaser game instance.

Introduce a small, clearly defined mission lifecycle controller or equivalent application-level coordination mechanism if necessary.

Avoid a large architectural rewrite.

The lifecycle controller should own the sequence for starting, restarting, and ending a mission.

**Only one application-level component may initiate gameplay scene transitions in response to starting a mission or changing musical tracks.**

Other components should request a transition through that controller rather than independently calling competing scene-start operations.

Preserve the existing global timeline update architecture where possible.

### 5. Distinguish the four operations

These operations must be explicitly different.

#### NEW MISSION

Used by:

- START GAME.
- RESTART MISSION.
- REPLAY.
- Developer RESTART MISSION, if provided.

Behavior:

- End and clean up the previous mission.
- Reset all session state.
- Initialize fresh GameScene objects.
- Position the camera at the starting depth.
- Create Blackrush.
- Set shield to 100.
- Set score to zero.
- Recreate initial test encounters.
- Begin Synth at 0:00.
- Preserve the player's selected control mode.

#### RESTART CURRENT TRACK

The current developer panel already has a RESTART control.

Inspect its intended semantics and document them.

If the command means restart the current musical track, preserve that meaning.

Restarting Cathedral should not accidentally create a new mission at Synth 0:00 unless that is explicitly the documented behavior.

Restarting a track should restore a consistent test state at that track's beginning, including the correct player and encounter state.

Consider adding an explicitly named RESTART MISSION developer command if needed to eliminate ambiguity.

#### DEVELOPER SEEK

Jump directly to a musical position.

- Restore the correct gameplay scene.
- Restore the correct camera position.
- Restore Blackrush.
- Restore the appropriate encounter fixtures.
- Reset transient combat objects.
- Maintain consistent shield and defeat state.

Do not simulate every preceding encounter.

For development, it is acceptable to restore shield to 100 and clear defeat state on every seek.

Document this policy.

#### RETURN TO TITLE

- Stop music.
- Dispose the gameplay session.
- Remove scene-owned entities and listeners.
- Show TitleScene.
- Preserve control preferences.

Do not leave paused GameScene instances or hidden overlays intercepting input.

### 6. Fix Blackrush disappearing

Trace Blackrush creation, registration, positioning, activation, and destruction.

Investigate:

- Whether Blackrush is recreated when GameScene restarts.
- Whether a prior Blackrush instance remains referenced.
- Whether scene shutdown destroys the object after a new scene starts.
- Whether physics bodies are disabled or destroyed.
- Whether a player is being positioned outside the camera viewport.
- Whether the player is created before the camera is restored.
- Whether scene lifecycle callbacks run in an unexpected order.
- Whether an old Game Over state immediately disables a newly created player.

After every normal mission start, verify:

- `GameScene` is active.
- Exactly one Blackrush gameplay entity exists.
- Blackrush is active and visible.
- Its physics body is enabled.
- It is within the camera's visible playable area.
- Input is enabled.
- The shield is initialized.
- Defeat state is false.

Do not merely call `setVisible(true)` on a stale player object.

Correct the underlying creation and ownership issue.

### 7. Fix robot encounter restoration

The initial test encounter should be identical after every new mission start.

It currently contains approximately seven robots.

Inspect encounter initialization and offscreen activation/deactivation logic.

The previous Step 5.2 fix increased the look-ahead distance to 3000 pixels.

Determine whether that was addressing the actual bug or merely postponing it.

Introduce clear distinctions between:

- Not yet encountered.
- Active.
- Temporarily inactive.
- Destroyed.
- Removed at the end of a session.

Do not permanently delete future encounter definitions simply because their robots are not currently visible.

Separate immutable encounter definitions from runtime robot instances.

Use deterministic world positions.

On a new mission, discard old runtime encounter state and recreate the full expected initial population.

On developer seek, reconstruct the relevant encounter from its definitions.

Ensure encounter position calculations use the correct world coordinates and camera depth.

Do not accumulate camera offsets across restarts.

Avoid adding more robots or implementing full wave spawning.

### 8. Fix shield and defeat lifecycle

Audit all shield-related state in:

- Blackrush.
- CombatSystem.
- GameScene.
- GameOverScene.
- Hud.

Establish one authoritative shield value for the current Blackrush.

Confirm:

- New mission starts with 100/100 shield.
- Laser and contact hits reduce shield correctly.
- Invulnerability frames expire as intended.
- Shield never becomes negative.
- Defeat triggers exactly once when shield reaches zero.
- Defeat state resets on new mission.
- Developer seeks restore a clearly documented test state.
- Invulnerability and death flags do not leak between sessions.

The developer reports that after seeking away and back, Blackrush can be hit but cannot die.

Investigate whether this is caused by:

- A stale `isDead` flag.
- A stale `isGameOver` flag.
- Persistent invulnerability.
- A damaged combat callback.
- A missing scene listener.
- Damage affecting one player object while HUD or defeat logic references another.
- Paused physics or timer state surviving the seek.

Use the actual code to determine the cause.

Do not solve immortality by forcing defeat after a fixed number of hits.

### 9. Fix HUD shield visualization

The shield HUD currently behaves incorrectly.

It begins green, then becomes entirely red after the first hit.

Implement a clear proportional shield display.

Suggested behavior:

- 100–61%: Green/cyan.
- 60–31%: Yellow/amber.
- 30–1%: Red.
- 0%: Empty/depleted.

The bar's filled width must be proportional to:

`currentShield / maximumShield`

Clamp the ratio between zero and one.

The filled portion should shrink as damage accumulates.

Do not simply recolor the entire full-width bar when shield decreases.

Use Phaser Graphics or compatible display objects.

The HUD must update when:

- Blackrush takes damage.
- Shield is restored.
- A new mission starts.
- Developer seeking resets shield.
- The scene is recreated.

Do not let the HUD maintain a competing authoritative shield value.

It should display current player/session data supplied through a defined interface.

Example expected behavior:

| Shield | Bar width | Color |
|---|---|---|
| 100 | 100% | Green/cyan |
| 75 | 75% | Green/cyan |
| 50 | 50% | Yellow/amber |
| 20 | 20% | Red |
| 0 | 0% | Empty |

### 10. Preserve functioning combat

The developer confirms that the following currently work in a fresh session:

- Energy bolts destroy ordinary robots.
- Throwing axes damage or destroy robots.
- Axes strip armored robot plating.
- Exposed armored robots are destroyed by one energy bolt.
- Robot destruction effects work.

Preserve these behaviors.

Do not rebalance damage, weapon speeds, or enemy health.

Do not redesign Classic or Assisted movement.

Do not change the music schedule.

### 11. Centralize scene transition requests

Previous maintenance discovered duplicate scene-start operations between GameOverScene and `main.js`.

Audit again for similar duplication.

No restart path should cause:

- Two GameScene starts.
- Two Blackrush instances.
- Two encounter initializations.
- Two active soundtracks.
- Conflicting camera restoration.
- A late shutdown callback from the old scene affecting the new session.

Make new-session requests idempotent while a transition is in progress.

An accidental rapid double-click on RESTART MISSION must not create competing missions.

Use an explicit transition-in-progress guard or comparable mechanism.

### 12. Pause and physics state

When the shield is depleted, the music and gameplay pause.

Check whether restart correctly restores:

- Phaser Arcade Physics simulation.
- Scene update processing.
- Input processing.
- Player movement.
- Robot AI.
- Projectile physics.
- Laser timers.
- Local gameplay clock.

A restarted game must not inherit a paused physics world or inactive simulation state.

Developer seeking must likewise restore a playable simulation state when appropriate.

Do not automatically resume a mission that the player intentionally paused unless required by the selected restart or seek operation.

### 13. Add lifecycle diagnostics

Extend the existing developer diagnostics modestly.

During debug mode, log major session transitions:

- SESSION_START
- SESSION_STOP
- GAME_SCENE_CREATE
- GAME_SCENE_SHUTDOWN
- PLAYER_CREATED
- ENCOUNTER_INITIALIZED
- PLAYER_DEFEATED
- SESSION_RESTART
- DEVELOPER_SEEK

Include a monotonically increasing session identifier.

For example:

`[SESSION 4] PLAYER_CREATED`

This will help identify whether stale callbacks from Session 3 are accidentally affecting Session 4.

Display or log:

- Current session ID.
- Active Phaser scene.
- Whether GameScene is active.
- Blackrush active/visible state.
- Blackrush world coordinates.
- Blackrush shield.
- Blackrush defeated state.
- Number of active robots.
- Number of pending encounter definitions.
- Physics simulation paused/running state.

Do not log every frame.

Avoid exposing development diagnostics in the normal production interface.

### 14. Automated regression tests

Extend the existing Node.js tests.

At minimum, test:

1. New mission resets shield to 100.
2. New mission resets score to zero.
3. New mission resets defeat state.
4. New mission resets camera depth.
5. New mission restores initial encounter definitions.
6. Repeated new missions produce identical encounter definitions.
7. Session identifiers advance correctly.
8. Duplicate restart requests do not create competing sessions.
9. Player state is correctly initialized after restart.
10. Developer seek reconstructs player test state.
11. Developer seek resets defeat and invulnerability state according to policy.
12. Robot encounter positioning uses the correct camera depth.
13. HUD shield ratio is correctly calculated.
14. HUD color thresholds behave correctly.
15. Shield decreases through intermediate values.
16. Shield depletion triggers defeat exactly once.
17. Defeat can occur in a second newly created mission.
18. Defeat can occur after a developer seek.
19. No score or damage state survives a new mission unexpectedly.
20. Track restarting and mission restarting have distinct, documented semantics.

Use real application logic and configuration values in these tests.

Avoid duplicating implementation formulas in the test suite merely to obtain passing tests.

### 15. Browser-level acceptance tests — mandatory to report separately

Previous milestones had passing unit tests while the browser game remained broken.

Therefore, distinguish automated unit tests from actual runtime verification.

Perform browser tests if automation is available.

If not, supply an explicit manual test plan and do not claim these behaviors were verified.

#### Test A — Normal mission

1. Refresh browser.
2. Start Game.
3. Confirm Blackrush is visible.
4. Confirm seven initial robots or the configured initial population are present.
5. Destroy at least one Pursuer.
6. Break an armored robot's plating.
7. Destroy its exposed core.
8. Take damage and observe gradual shield depletion.
9. Allow Blackrush to die.

#### Test B — Restart after defeat

10. Select RESTART MISSION.
11. Confirm Synth begins at 0:00.
12. Confirm Blackrush is present.
13. Confirm shield is 100.
14. Confirm score is zero.
15. Confirm robot population has been restored.
16. Confirm robots move and attack.
17. Confirm player weapons work.
18. Allow Blackrush to die a second time.
19. Confirm Game Over works again.

#### Test C — Multiple restarts

20. Restart again.
21. Verify Blackrush and all initial encounter robots.
22. Repeat at least three consecutive mission restarts.
23. Confirm there is exactly one active Blackrush each time.

#### Test D — Developer tools

24. Start a mission.
25. Use developer RESTART CURRENT TRACK.
26. Verify correct track and reconstructed gameplay state.
27. Jump to PROXY.
28. Jump to CATHEDRAL.
29. Jump to VICTORY.
30. Jump backward to CHASE.
31. Confirm Blackrush reappears.
32. Confirm shield and defeat logic work.
33. Allow Blackrush to die.
34. Restart and verify normal gameplay.

#### Test E — Navigation

35. Return to Title.
36. Start a new game.
37. Verify Blackrush and the initial encounters.
38. Repeat in Assisted mode.
39. Verify developer-panel clicks do not trigger player movement or weapons.

No browser console exceptions should occur.

### 16. Build verification

Run:

`npm test`

`npm run build`

Both must succeed.

Report actual test counts.

Do not interpret successful unit tests or a successful production build as proof that Phaser scenes, physics, and browser rendering work correctly.

### 17. Documentation

Update:

- `docs/DEVELOPMENT.md`
- `docs/GAME_DESIGN.md` if session semantics need clarification.
- `README.md` if the developer controls change.

Document:

- The root causes of each discovered defect.
- Mission/session ownership.
- Start, restart, replay, and seek semantics.
- Encounter restoration behavior.
- Shield reset policy.
- Shield bar rendering.
- Defeat lifecycle.
- Developer lifecycle diagnostics.
- Testing performed.
- Any unresolved issues.

### 18. Scope restrictions

Do not implement:

- New robots.
- New attack patterns.
- Additional encounter waves.
- Obstacle collision response.
- Shield regeneration or pickups.
- Proxy boss.
- Super-robot.
- Panzer.
- Grenade sequence.
- Lorelei NPC.
- Mobile gameplay.
- New artwork.
- Sound effects.
- Additional weapons.

Do not change the original MP3 files.

Do not change musical cue timestamps.

Do not redesign working player controls.

Do not move to Step 6.

### 19. Definition of done

Step 5.3 is complete when:

- Every mission start creates a valid Blackrush.
- Blackrush is visible, active, and controllable.
- Initial robots consistently reappear.
- Robot positions are correct.
- Robot AI and combat work after restart.
- Shield state resets correctly.
- Shield display shows proportional depletion.
- Blackrush can die repeatedly across multiple sessions.
- Developer seeking restores a valid, damageable Blackrush.
- Restart Current Track behaves consistently.
- New Mission, Restart, Replay, and Return to Title have reliable lifecycle behavior.
- No duplicate scene transitions occur.
- No old session callbacks corrupt a new session.
- Automated tests pass.
- Production build succeeds.
- Browser verification passes or remaining manual verification is explicitly identified.

Provide a detailed completion report listing actual root causes, modified files, test results, browser verification, and remaining limitations.

Stop after Step 5.3.