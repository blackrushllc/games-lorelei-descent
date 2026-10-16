# JUNIE TASK — LORELEI: DESCENT
## Step 5.4: Shield HUD Repair, Regeneration, Hearts, Automatic Respawning, and Low-Life Warning

### 1. Project Context

We are developing **LORELEI: DESCENT**, a browser-based, music-driven arcade shooter using JavaScript, Phaser 3.88.2, Vite, and Phaser Arcade Physics.

Steps 1 through 5.3 are complete.

The developer has personally verified that the following now work correctly:

- Game initialization.
- Classic and Assisted movement.
- Weapons and robot combat.
- Armored robot damage.
- Enemy targeting lasers.
- Player damage and defeat.
- Mission restart.
- Developer musical seeking.
- Scene transitions.
- Encounter restoration.
- Repeated mission sessions.

Step 5.3 established centralized mission lifecycle management in `src/main.js`, including session IDs and transition guards.

**Preserve this architecture.**

There is one outstanding defect: the shield bar still does not visually indicate remaining shield strength correctly.

The developer also wants to expand the survival system with regenerating shields and six hearts.

Implement this milestone in two stages, verifying the first before starting the second.

Do not implement Step 6 or later gameplay features.

---

# PART A — REPAIR THE SHIELD HUD

### 2. Diagnose the actual shield rendering problem

Despite previous changes, the developer reports that the shield indicator starts green, becomes red after the first hit, and does not provide a useful visual indication of remaining strength.

Step 5.3 reportedly implemented proportional width and color thresholds, but the observed behavior is still wrong.

Inspect the current implementation of:

- `src/ui/Hud.js`
- `src/entities/Blackrush.js`
- `src/scenes/GameScene.js`
- Shield-related combat configuration
- All calls to `Hud.setShield()`

Identify whether the error originates in:

- Incorrect shield values.
- Incorrect arguments passed to the HUD.
- Mismatched current/max shield values.
- Incorrect percentage calculations.
- Graphics drawing or clearing behavior.
- Graphics origin or coordinate positioning.
- Incorrect colors or layering.
- HUD updates being overwritten by stale data.

Do not guess at the cause.

### 3. Shield rendering requirements

Display a shield bar representing the actual current shield value.

Starting values:

- Maximum shield: 100.
- Initial shield: 100.

The bar should consist of:

1. A fixed-width background or frame.
2. A foreground fill whose width represents the current shield percentage.
3. A numerical value showing the current and maximum shield.

Example:

`SHIELD 75 / 100`

Color thresholds:

- Above 60%: Cyan/green.
- 31% through 60%: Amber/yellow.
- 1% through 30%: Red.
- 0%: Empty.

The foreground width must shrink proportionally as shield decreases.

A shield value of 50 must produce a bar approximately half as wide as a shield value of 100.

Do not color the entire background red when the shield is damaged.

Do not redraw the bar using incorrectly accumulated graphical transformations.

Ensure that the bar updates correctly when the shield increases as well as decreases.

### 4. Verify the shield display independently

Before implementing hearts or regeneration, provide a developer-only test method for explicitly setting shield values.

Test:

- 100
- 80
- 60
- 40
- 20
- 5
- 0

For each value, confirm:

- Correct numerical display.
- Correct filled width.
- Correct color.
- Correct empty background.

The developer should be able to perform this test without being attacked by robots.

Add the necessary debug controls to the existing developer panel, or another small temporary developer-only interface.

Use the same HUD code that normal gameplay uses.

Do not create a separate mock shield bar that could pass testing while the actual HUD remains broken.

**Part A must be verified before continuing with Part B.**

---

# PART B — HEARTS AND REGENERATING SHIELDS

### 5. Survival model

We are introducing three distinct survival concepts.

**Shield**

A regenerating energy barrier that absorbs ordinary damage.

**Hearts**

A limited number of lives that persist across the entire mission.

**Final defeat**

The mission ends only when Blackrush loses his last heart.

Hearts are not hit points.

Blackrush can take several attacks before losing one heart.

When shield reaches zero, Blackrush loses exactly one heart.

If hearts remain, he automatically respawns with a full shield.

If no hearts remain, the existing Game Over sequence occurs.

### 6. Initial configuration

Add configurable survival parameters, preferably in an existing gameplay or combat configuration module.

Use these initial values:

| Parameter | Value |
|---|---|
| Maximum shield | 100 |
| Starting shield | 100 |
| Maximum hearts | 6 |
| Starting hearts | 6 |
| Shield regeneration delay | 4 seconds |
| Shield regeneration rate | 12 points/second |
| Respawn delay | 1.2 seconds |
| Respawn invulnerability | 3 seconds |
| Low-heart warning threshold | 2 hearts |
| Two-heart warning interval | 8 seconds |
| One-heart warning interval | 4 seconds |

These values are provisional and must be easy to adjust.

Do not scatter them across unrelated classes.

### 7. State ownership

This is particularly important given the lifecycle problems corrected in Steps 5.2 and 5.3.

There must be one authoritative survival state for each mission.

That state includes:

- Current shield.
- Maximum shield.
- Remaining hearts.
- Maximum hearts.
- Whether Blackrush is temporarily respawning.
- Whether Blackrush is invulnerable.
- Time of the most recent damage.
- Whether final defeat has occurred.

Keep this state associated with the current mission and player.

The HUD must display this state, not maintain independent gameplay values.

Do not introduce conflicting mutable copies of shield or heart counts.

If the existing Blackrush class is the appropriate owner, retain it. If a small SurvivalComponent or equivalent object would simplify the code, that is acceptable.

Avoid unnecessary architectural refactoring.

### 8. Shield regeneration

Regeneration begins four seconds after Blackrush last takes actual shield damage.

Once regeneration begins:

- Restore 12 shield points per second.
- Stop at maximum shield.
- Update the HUD continuously.
- Display a subtle visual indication of regeneration.

Any new successful damage immediately cancels regeneration and restarts the four-second delay.

Blocked attacks and attacks received during invulnerability should not count as actual damage and should not reset the regeneration timer.

Regeneration must be frame-rate independent.

Regeneration must stop while gameplay is paused.

Do not use an untracked JavaScript timeout or interval for regeneration.

Use the existing gameplay simulation timing conventions.

After respawn, shield begins at 100 and does not need to regenerate.

### 9. Heart loss

When shield reaches zero:

1. Prevent further damage to the current life.
2. Decrement remaining hearts exactly once.
3. Update the heart display.
4. Trigger a shield-collapse effect.
5. Trigger a heart-loss sound.
6. Temporarily remove Blackrush from combat.
7. Begin the respawn sequence if hearts remain.

Do not allow multiple simultaneous laser hits or physics callbacks to remove several hearts in a single defeat.

A heart-loss event must be atomic.

Once heart loss begins, additional incoming damage must be ignored until respawn protection ends.

Do not reset score.

Do not reset the camera.

Do not restart the soundtrack.

Do not recreate the entire game session.

Do not reset or regenerate the robots merely because Blackrush lost a heart.

### 10. Automatic respawn

If at least one heart remains:

- Wait approximately 1.2 seconds.
- Respawn Blackrush within the visible gameplay area.
- Restore shield to 100.
- Restore movement and firing.
- Apply three seconds of invulnerability.

The soundtrack continues uninterrupted throughout the sequence.

The camera continues following the musical timeline.

Robots continue their encounter behavior as appropriate.

If Blackrush is temporarily absent, enemies should avoid operating on a destroyed or invalid player reference.

Their targeting may pause or become invalid during the respawn delay.

Do not allow their targeting code to throw exceptions.

### 11. Safe respawn placement

Respawn relative to the current camera position, never an obsolete world position.

Preferred location:

- Approximately central horizontally.
- Within the safe vertical gameplay region.
- Away from solid obstacles where practical.
- Away from the nearest robots where a reasonable alternative exists.

For Step 5.4, use a simple deterministic candidate-position search.

Do not implement sophisticated pathfinding.

The later obstacle-collision milestone may expand the safety checks.

If no sufficiently safe position exists, use a fallback position within the viewport and rely on respawn invulnerability.

Do not spawn Blackrush outside the current camera viewport.

This must work in both DESCENT and ARENA camera modes.

### 12. Respawn presentation

Use simple procedural visual effects.

Suggested sequence:

**Shield collapse**

- Bright blue-white flash.
- Brief electrical burst.
- Blackrush fades or breaks into particles.

**Reappearance**

- Small blue electrical flash.
- Blackrush reappears.
- Shield returns to full.
- Blackrush flashes or pulses during invulnerability.

Do not permanently destroy the player object if this complicates existing physics and session lifecycle behavior.

You may temporarily disable and reactivate the player entity, provided all physics bodies, input handlers, and state are restored correctly.

Keep the implementation simple.

### 13. Respawn invulnerability

For three seconds after respawning:

- Blackrush can move.
- Blackrush can aim.
- Blackrush can fire.
- Blackrush cannot receive shield damage.
- Contact damage is ignored.
- Laser damage is ignored.

Display a visible protective effect.

The player should understand that they are temporarily protected.

Do not make Blackrush invisible for the entire invulnerability interval.

Do not accidentally leave invulnerability enabled permanently after a seek or restart.

For this milestone, do not implement a damaging respawn shockwave.

### 14. Hearts HUD

Add a row of six hearts to the existing HUD.

Use simple Phaser-generated graphics or compatible icon shapes.

Do not download artwork.

The display should clearly distinguish remaining and lost hearts.

Suggested appearance:

- Remaining hearts: Bright red.
- Lost hearts: Dark gray or outlined.

Example:

`♥ ♥ ♥ ♥ ♡ ♡`

Do not rely on a font that may lack heart symbols. Procedural vector hearts or generated textures are acceptable.

The hearts should be legible at the game's 640 × 960 resolution and remain visible when the canvas scales down.

Avoid covering the playable area unnecessarily.

Do not enlarge the existing HUD excessively.

### 15. Low-heart warning sound

Introduce a simple, original, procedural warning sound.

The developer particularly likes the classic Nintendo feeling of a gentle repeating warning when lives are low.

Do not copy or recreate the exact audio of any existing commercial game.

Instead, produce a distinctive 1980s science-fiction-inspired two-note electronic warning.

Behavior:

**Three or more hearts**

No repeating low-life warning.

**Two hearts**

Warning approximately every eight seconds.

**One heart**

Warning approximately every four seconds.

The warning should be quiet enough not to compete with the original Lorelei soundtrack.

Use Web Audio or the existing compatible audio infrastructure.

Do not add a sound-generation dependency.

The low-life warning must:

- Stop when the mission ends.
- Stop when the player returns to Title.
- Pause when gameplay is paused.
- Reset its timing appropriately after developer seeking.
- Never create overlapping repeating alarms.
- Respect browser audio restrictions.

### 16. Heart-loss sound

Create a distinct, brief sound effect for losing a heart.

Suggested character:

- Descending electronic tone.
- Slight electrical distortion.
- Approximately 0.3–0.6 seconds.

Do not make it excessively loud.

Use a separate effect from the repeating low-heart warning.

Where practical, keep sound effects under a separately configurable sound-effects volume rather than hardwiring them to the music volume.

Do not implement a complete sound-settings screen.

### 17. Final defeat

When the sixth heart is lost:

- Stop normal gameplay.
- Pause the musical timeline.
- Stop or suspend active combat.
- Transition to the existing GameOverScene.
- Display the existing restart and title buttons.

The final defeat must occur exactly once.

No automatic respawn should occur when hearts reach zero.

Do not modify the working centralized restart architecture established in Step 5.3.

### 18. Restart and replay

A new mission must always initialize:

- Shield: 100.
- Hearts: 6.
- Score: 0.
- Respawning: false.
- Invulnerability: false.
- Final defeat: false.
- Regeneration delay reset.
- Low-heart warning state reset.

START GAME, RESTART MISSION, and REPLAY must produce the same valid initial survival state.

The previously corrected player visibility, physics-body, and encounter-restoration behavior must remain intact.

Do not introduce independent scene-start calls that conflict with the central session controller.

### 19. Developer seeking

Preserve all existing developer timeline jumps.

For development purposes, a seek may reset survival state to:

- Full shield.
- Six hearts.
- No respawn pending.
- No invulnerability.
- No defeat state.

Use this as the default deterministic test policy.

Clearly distinguish this from normal musical progression, during which hearts and shield must persist across phases.

A normal transition from Synth to Cathedral must **not** restore hearts.

A normal transition into the Proxy arena must **not** restore hearts.

A developer seek can reconstruct fresh testing state.

Document these semantics.

### 20. Development tools

Extend the developer panel with survival testing controls.

Include:

- Set shield to 100.
- Set shield to 75.
- Set shield to 50.
- Set shield to 25.
- Set shield to 5.
- Set remaining hearts to 6.
- Set remaining hearts to 2.
- Set remaining hearts to 1.
- Trigger one heart-loss event.
- Toggle temporary invulnerability, if convenient.

Display:

- Current shield.
- Maximum shield.
- Regeneration state.
- Remaining hearts.
- Respawn state.
- Invulnerability state.

These controls must be development-only.

Do not allow developer-panel clicks to trigger weapons or Assisted movement.

### 21. Important gameplay timing rules

The musical timeline remains authoritative for scripted game progression.

The following must continue during an ordinary heart-loss and respawn sequence:

- Music playback.
- Camera progression.
- Musical event dispatch.
- Global gameplay timeline.

The following are temporarily disabled for Blackrush while respawning:

- Movement input.
- Weapon firing.
- Receiving damage.

During a full game pause, all combat simulation and survival timers must stop.

During final defeat, the soundtrack and gameplay stop as already established.

Do not use the global mission clock to infer that Blackrush should respawn at an earlier world position.

### 22. Automated tests

Extend the current Node.js test suite.

At minimum, test:

1. Initial shield is 100.
2. Initial hearts are 6.
3. Shield damage reduces the shield correctly.
4. Shield regeneration does not begin before four seconds.
5. Shield regeneration begins after the configured delay.
6. Regeneration proceeds at 12 points per second.
7. Regeneration never exceeds maximum shield.
8. New damage resets the regeneration delay.
9. Blocked damage does not reset the delay.
10. Pausing freezes regeneration.
11. Shield reaching zero removes exactly one heart.
12. Simultaneous hits cannot remove multiple hearts.
13. A nonfinal heart loss initiates respawn.
14. Respawn restores shield to 100.
15. Respawn does not restore lost hearts.
16. Respawn protection prevents damage.
17. Invulnerability expires after three seconds.
18. Player becomes vulnerable again afterward.
19. Low-heart warning activates at two hearts.
20. Warning cadence increases at one heart.
21. Warning stops after returning to Title.
22. Losing the final heart triggers Game Over exactly once.
23. Restart restores six hearts and full shield.
24. Normal phase transitions preserve survival state.
25. Developer seeking restores consistent test state.
26. HUD shield ratios render correctly at representative values.
27. Heart display correctly reflects remaining lives.
28. Repeated restarts do not accumulate warning timers or listeners.
29. Blackrush remains visible and damageable after restarting.
30. Encounter state remains valid after heart loss.

Use actual project configuration values.

Do not change test assertions merely to conceal runtime failures.

### 23. Manual browser verification

After implementation, test the following:

**Shield HUD**

- Set shield to 100, 75, 50, 25, 5, and 0.
- Verify fill width, numerical display, and color.
- Confirm the shield visually refills during regeneration.

**Heart loss**

- Start with six hearts.
- Allow shield to deplete.
- Confirm exactly one heart is lost.
- Confirm Blackrush respawns.
- Confirm music never stops.
- Confirm shield returns to 100.
- Confirm temporary invulnerability expires.

**Multiple deaths**

- Lose several hearts consecutively.
- Confirm the counter decreases one at a time.
- Confirm the warning begins at two hearts.
- Confirm the warning accelerates at one heart.
- Confirm losing the last heart triggers Game Over.

**Restart**

- Restart after Game Over.
- Confirm six hearts and full shield.
- Confirm Blackrush is visible.
- Confirm robots are restored.
- Confirm weapons and collisions work.
- Repeat multiple times.

**Timeline**

- Begin Synth.
- Lose one or more hearts.
- Allow a normal transition into Cathedral.
- Confirm remaining hearts are preserved.
- Use developer seeking.
- Confirm the documented seek reset behavior.
- Jump to Victory and replay.
- Confirm a fresh mission begins correctly.

Test both Classic and Assisted controls.

No browser console exceptions should occur.

### 24. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- Shield regeneration.
- Heart mechanics.
- Respawn behavior.
- Low-heart warning.
- Final defeat.
- Survival-state ownership.
- Developer seeking semantics.
- Developer testing controls.
- Configuration parameters.
- Actual test results.
- Known limitations.

### 25. Scope restrictions

Do not implement:

- Shield pickups.
- Extra-heart pickups.
- Bonus lives.
- New robot types.
- Music-controlled enemy waves.
- Obstacle collisions.
- Boss fights.
- Grenade mechanics.
- Panzer tank.
- Lorelei companion.
- Mobile controls.
- New artwork.
- Additional background music.
- Permanent character upgrades.
- Additional weapons.

Do not change the existing Classic or Assisted movement behavior.

Do not modify original musical recordings.

Do not change musical cue timestamps.

Do not implement Step 6.

### 26. Definition of done

Step 5.4 is complete when:

- The shield bar correctly displays proportional depletion.
- Numerical shield values are visible.
- Shield regeneration works.
- Six hearts are displayed.
- Each shield depletion removes exactly one heart.
- Blackrush automatically respawns while hearts remain.
- Respawning does not interrupt the music.
- Temporary invulnerability works and expires.
- Low-heart warnings function correctly.
- Final heart loss triggers Game Over.
- Restart restores the full initial state.
- Normal musical progression preserves remaining hearts.
- Developer seeking produces a consistent test state.
- Existing combat mechanics remain functional.
- Both control modes work.
- Automated tests pass.
- Production build succeeds.
- Browser testing passes, or any remaining manual testing is clearly identified.

### 27. Completion report

Provide:

1. Exact shield HUD defect and correction.
2. Survival system implementation.
3. State ownership and lifecycle.
4. Respawn implementation.
5. Low-heart warning implementation.
6. Developer testing controls.
7. New or modified files.
8. Automated test results.
9. Browser verification results.
10. Remaining limitations.

Stop after Step 5.4.

Do not begin Step 6 without authorization.