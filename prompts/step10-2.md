# JUNIE TASK — LORELEI: DESCENT
## Step 10.2 — Combat Geometry, Weapon Origins, and ESC Pause/Resume

### 1. Objective

The PixelLab artwork is now successfully rendered in the actual browser game.

The developer has confirmed that the game plays correctly and that the new character graphics look good.

However, two visual/combat alignment problems have emerged:

1. Blackrush's energy bolts appear to originate around his feet instead of his upper body or hands.
2. Sentinel laser beams also appear to originate around the robot's feet.

Additionally, the effective hit detection for ordinary robots feels too small or positioned too low. Shots sometimes appear to pass through a robot's visible body unless they are aimed close to its feet.

These issues likely relate to the distinction between the new PixelLab sprite anchors and existing gameplay coordinates.

Correct these issues while adding one requested control:

**Pressing ESC during gameplay must pause the game; pressing ESC again must resume it, including the music, at exactly the same position.**

Do not introduce new enemies, companion AI, or gameplay systems in this milestone.

---

# PART A — Inspect the Existing Geometry

## 2. Understand the coordinate systems

Step 10.0.1 introduced stable sprite anchoring using detected ground offsets and Phaser frame metadata.

Inspect the current implementations of:

- `Blackrush.js`
- `Robot.js`
- `ProxyBoss.js`
- `SuperRobot.js`
- `SpriteAnimationRegistry.js`
- `WeaponSystem.js`
- `CombatSystem.js`
- `GameScene.js`

Also inspect any modules responsible for projectile collisions, laser raycasting, and environmental cover.

Determine how the following coordinates relate:

- Entity world position.
- Physics body position.
- Physics body center.
- Sprite origin and ground anchor.
- Visible sprite bounds.
- Weapon muzzle position.
- Targetable combat region.
- Boss component hit regions.

Do not assume that a grounded sprite's `x, y` position corresponds to its visual center.

The current rendering should be treated as generally correct. Avoid rewriting the asset pipeline.

## 3. Separate visual anchoring from combat geometry

Maintain three distinct concepts:

**Ground position:** The entity's authoritative movement and navigation location.

**Weapon origin:** The world-space point from which an attack visually and mechanically begins.

**Target region:** The world-space region in which a projectile or laser can successfully hit a character.

These locations do not need to coincide.

For example, a standing robot may have its movement position at ground level, its targetable center around the torso, and its laser emitter around its chest or head.

All coordinates must be consistent with the current display scale and the PixelLab frame anchoring system.

Do not use a frame's entire transparent PNG rectangle as its collision geometry.

---

# PART B — Correct Blackrush's Weapon Origins

## 4. Energy bolts

Blackrush's force bolts should appear to emerge from his upper body, ideally around his outstretched hand or appropriate weapon-emission area.

Use a stable world-space offset relative to the character's logical position.

The offset may depend on facing direction if necessary.

The source PNGs contain multiple directions and dedicated force animations. Inspect these assets where useful.

Do not require pixel-perfect hand tracking.

A reasonably consistent shoulder/chest/hand location is sufficient for this arcade game.

### Important

The actual projectile must originate from the corrected point.

Do not merely shift the visual effect while leaving its physics projectile at the feet.

The rendered projectile, collision body, travel direction and effective firing origin must agree.

## 5. Aiming

Preserve:

- Classic controls.
- Assisted mouse-follow controls.
- Existing mouse aiming.
- Force-bolt range.
- Projectile velocity.
- Rate of fire.
- Projectile damage.
- Obstacles and cover.

Calculate projectile direction from its actual emission point toward the intended target or cursor position.

Avoid an offset that causes shots to appear to travel at a different angle from the visible firing animation.

Do not accidentally make Assisted mode less responsive.

## 6. Axe throwing

Audit the axe throw using the same coordinate principles.

If it already looks correct, leave it alone.

If the axe visibly emerges from the feet or another obviously incorrect location, apply the same stable weapon-origin approach.

Preserve the existing behavior in which an axe removes armor from an Armored Robot.

Do not change damage or weapon mechanics.

---

# PART C — Correct Sentinel Laser Origins

## 7. Sentinel emitters

Sentinel laser beams should originate from a visually appropriate upper-body point.

Use a stable emitter offset independent of the sprite's transparent padding and ground anchor.

The same origin must be used for:

- TRACKING beam.
- LOCKED warning beam.
- FIRING laser.
- Ray-based obstruction checks.
- Player collision geometry.

Avoid having the warning beam appear at one position while the actual damaging laser starts somewhere else.

## 8. Preserve Step 9.8 laser fairness

The existing Sentinel laser sequence is:

```text
TRACKING -> LOCKED -> FIRING -> COOLDOWN
```

The developer has verified that this system is working and that Blackrush can successfully dodge incoming fire.

Do not rewrite or retune it.

When the Sentinel locks its shot, preserve the locked firing direction. The player must still be able to move out of the laser's path.

Do not reintroduce guaranteed-hit logic.

The visible beam must correspond to the actual collision ray.

Respect environmental cover.

Maintain existing timing, cooldown, damage, and range values.

## 9. Other laser-capable enemies

Inspect ProxyBoss and SuperRobot for equivalent emitter-origin problems.

If their attacks already use suitable component-specific positions, preserve them.

If they share the same incorrect ground-based emitter calculation, correct that through the common geometry mechanism.

Do not alter boss attack patterns, damage, weak points, component progression, or authored musical cues.

---

# PART D — Improve Combat Hit Detection

## 10. Ordinary robot target regions

The developer reports that ordinary robots frequently appear harder to hit than their artwork suggests.

Investigate whether the current hitboxes:

- Are centered near the ground position.
- Are too small relative to the visible torso.
- Are offset from the rendered character.
- Fail to account for stable sprite anchoring.
- Use a collision circle that was originally tuned for the old procedural graphics.

Correct the discrepancy.

### Desired behavior

If a force bolt clearly passes through the substantial visible body of a Pursuer, Sentinel, or Armored Robot, it should generally count as a hit.

The player should not have to aim precisely at the robot's feet.

Do not require pixel-perfect collision.

Use appropriately forgiving arcade-style target geometry.

### Important distinction

Movement and obstacle collision are not necessarily the same as combat hit detection.

Keep robot navigation, crowd movement, and obstacle interaction stable.

Adjust the combat target region rather than indiscriminately enlarging every physics body.

Where feasible, establish a shared combat hitbox definition so it can be reused by relevant projectile and ray-based combat calculations.

Avoid two conflicting hit-test implementations that disagree about the robot's location.

## 11. Separate hit geometry from visual scale

Do not calculate hitboxes directly from each new animation frame's PNG dimensions.

For example, switching from a 64×64 walk frame to a 68×68 frame must not cause a robot's vulnerability to flicker or shift.

Use logical combat dimensions and stable offsets.

These may be configurable by robot archetype.

Preserve the existing visual anchors.

## 12. Armored Robot behavior

The Armored Robot has two visual states:

```text
default -> disarmed
```

Blackrush's axe removes its armor.

After the armor is removed, the robot becomes vulnerable to the existing finishing attack.

Preserve this mechanic.

Make sure the armored and disarmed appearances use appropriately aligned combat geometry.

Do not let switching sprite states move the target region unexpectedly.

## 13. Boss hit detection

The Proxy and Giant Boss use distinct component-based damage systems.

**Do not replace their existing weak-point mechanics with a generic enlarged hitbox.**

Preserve their component circles and current damage progression.

Correct only demonstrable offsets between the displayed component graphics and actual target geometry.

Boss hit zones must remain independent of the dimensions of the current damage-state sprite.

## 14. Blackrush receiving damage

Audit Blackrush's own target region for similar alignment problems.

Sentinel lasers should strike a sensible portion of Blackrush's body, not solely the ground anchor.

Do not enlarge the player hitbox indiscriminately or make the game harder.

Maintain the intended ability to dodge narrow laser attacks.

Treat fairness as the priority: when the visual beam misses Blackrush's body, it should not inflict damage; when it clearly passes through his body, it should generally register.

---

# PART E — Add ESC Pause/Resume

## 15. Keyboard control

During active gameplay:

**ESC toggles the paused state.**

First press:

```text
PLAYING -> PAUSED
```

Second press:

```text
PAUSED -> PLAYING
```

Ignore automatic keyboard-repeat events so holding ESC does not repeatedly pause and resume.

Ensure ESC continues to work when the main gameplay scene is paused.

A dedicated lightweight PauseScene is acceptable if it simplifies input handling and lifecycle safety.

Do not create a complicated menu system.

## 16. Pause everything that matters

While paused, freeze:

- Blackrush movement.
- Robot movement.
- Projectile movement.
- Physics simulation.
- Enemy AI.
- Boss AI.
- Laser tracking/locking/firing timers.
- Encounter spawning.
- Scripted wave progression.
- Heart pickups.
- Shield regeneration timers.
- Animation playback.
- Gameplay tweens and delayed callbacks.
- Relevant particle effects.
- The authoritative music timeline.

No damage, deaths, respawns, new waves, or scripted boss events should occur while paused.

Do not merely stop player input while allowing the world to continue.

## 17. Music synchronization — critical

The game uses AudioDirector as the authoritative musical clock.

The three principal tracks are:

```text
below-gamorrah-synth.mp3
below-gamorrah-cathedral.mp3
below-gamorrah-studio.mp3
```

Pausing must freeze the current track at its exact playback position.

When gameplay resumes, playback must continue from that position without restarting the track or skipping forward.

TimelineDirector must resume at the corresponding musical position.

### Example

If the player pauses at Synth 02:17:

- Music stops at approximately 02:17.
- Robot waves stop progressing.
- No new timed events fire.
- The clock remains frozen.

When ESC is pressed again:

- Music resumes from approximately 02:17.
- Timeline events continue normally.
- Robots resume from their previous locations.

Do not use wall-clock elapsed time to advance the gameplay timeline during a pause.

Preserve the existing Synth → Cathedral → Studio transitions.

## 18. Pause near a musical event

Handle the case where ESC is pressed immediately before:

- A new robot formation.
- A boss attack.
- The German Soldier's grenade sequence.
- A boss destruction cue.
- A soundtrack transition.

After resuming, the corresponding event should execute at its intended musical time.

Do not skip the event.

Do not execute it twice.

Do not restart the boss encounter.

Preserve one-shot timeline event semantics.

## 19. Pause overlay

Display a simple, centered pause overlay above gameplay.

Suggested appearance:

```text
         PAUSED

   Press ESC to resume
```

Use existing game typography and visual style.

Dim the gameplay behind the text modestly.

The battlefield should remain visible.

Do not obscure it with a full-screen black background.

Keep the overlay legible across screen sizes.

A small clickable Resume option is acceptable if it is implemented safely, but ESC is the required control.

## 20. Input safety

While paused:

- Mouse clicks must not fire force bolts.
- Right-click must not throw the axe.
- SPACE must not activate NOVA.
- Player movement must not respond.
- Debug spawn and timeline controls must not mutate active gameplay unexpectedly.

When resuming:

- Clear stale pointer/button states where necessary.
- Do not immediately fire because a mouse button was pressed during pause.
- Do not activate NOVA from a keypress held before pausing.
- Restore normal Assisted and Classic controls.

Preserve the existing pointer carry-over protections.

## 21. Scene lifecycle

ESC should pause active gameplay only.

Do not allow ESC to interfere with:

- BootScene.
- TitleScene.
- GameOverScene.
- EndingScene.

If the player dies, restarts, returns to the title, or reaches the ending, remove the pause overlay and clear paused state appropriately.

Arena checkpoint continues must begin unpaused with the correct soundtrack position.

Avoid stale keyboard listeners, orphaned scenes, duplicate audio playback, or paused physics after restart.

Repeated pause/resume cycles must be safe.

---

# PART F — Debug and Testing

## 22. Geometry debug display

Extend the existing `?debug=1` diagnostics with a toggle for combat geometry.

Display temporary overlays showing:

- Entity ground position.
- Visual anchor.
- Combat target center.
- Combat target radius or shape.
- Weapon emission point.
- Relevant targeting rays.

Use distinct colors and small markers.

Do not display these overlays in normal gameplay.

Avoid modifying hitboxes when merely showing the debug visualization.

This diagnostic will also be useful for the upcoming Lorelei, Eclipse, and boss integration work.

## 23. Automated tests

Add focused tests covering at least:

1. Blackrush projectile originates above the ground anchor.
2. Projectile direction is calculated from the actual emission point.
3. Blackrush's axe origin remains correctly aligned.
4. Sentinel TRACKING beam uses the visual emitter.
5. Sentinel LOCKED and FIRING beams use consistent geometry.
6. Locked laser direction remains unchanged.
7. Environmental cover continues to block shots.
8. Ordinary robot combat regions align with visible body positions.
9. Combat regions remain stable across animation changes.
10. Armored/disarmed transitions preserve hitbox alignment.
11. Boss component target geometry remains unchanged unless intentionally corrected.
12. Player laser hit detection remains fair.
13. ESC pauses gameplay.
14. ESC resumes gameplay.
15. Held ESC does not repeatedly toggle pause.
16. Physics remains frozen while paused.
17. Gameplay timers remain frozen.
18. Music position remains stable while paused.
19. Audio resumes at the correct position.
20. Timeline cues are not skipped or duplicated.
21. NOVA cannot activate while paused.
22. Mouse attacks cannot activate while paused.
23. Restart clears pause state.
24. Game Over and checkpoint continues work correctly.
25. No duplicate pause listeners are created.
26. PIXEL ART toggle continues working.
27. Existing combat and boss regression tests pass.

Use realistic scene and audio mocks where appropriate.

Do not change existing tests merely to make newly broken functionality appear successful.

## 24. Manual browser verification

The developer should be able to perform these checks:

**Blackrush**

- Energy bolts visibly emerge from the upper body.
- The force-bolt direction feels natural in Assisted mode.
- Axe throwing remains functional.
- Changing facing directions does not cause muzzle jitter.

**Robots**

- Sentinel lasers originate from the upper body.
- Telegraphing still works.
- Lasers remain dodgeable.
- Robots can be hit when shots pass through their visible bodies.
- Robot movement and obstacle handling remain unchanged.

**Pause**

- Start normal Synth gameplay.
- Press ESC.
- Confirm music, robots, projectiles, and timers stop.
- Leave the game paused.
- Press ESC again.
- Confirm music resumes correctly without a time jump.
- Confirm gameplay continues normally.
- Repeat several times.
- Test during the Proxy and Giant Boss arenas.
- Test immediately before a music transition.

## 25. Verification commands

Run:

```bash
npm run sprites:check
npm test
npm run build
```

Only rebuild sprite atlases if the actual asset configuration or generation process has changed.

This milestone should not require changes to the PixelLab source assets.

---

# PART G — Scope and Completion

## 26. Preserve existing features

Do not modify:

- Adaptive assistance.
- Heart pickups.
- NOVA costs.
- Shield regeneration balance.
- Spawn counts.
- Boss health.
- Robot damage values.
- Laser warning durations.
- Musical score timing.
- Boss finale sequences.
- Arena checkpoint behavior.
- PixelLab source artwork.

The goal is better geometric alignment and a reliable pause control, not gameplay rebalancing.

## 27. Completion report

Provide:

1. Root cause of the feet-origin problem.
2. Root cause of the undersized or misaligned robot hit detection.
3. Files modified.
4. Weapon-origin implementation.
5. Combat hitbox implementation.
6. Whether boss target geometry required changes.
7. Pause/resume architecture.
8. How AudioDirector and TimelineDirector remain synchronized.
9. Tests passed.
10. Production build results.
11. Browser verification status.
12. Any remaining visual alignment issues.

## 28. Stop condition

**STOP AFTER STEP 10.2.**

Do not implement new Lorelei or Eclipse behavior.

Do not create new enemy types or attack mechanics.

Do not add German Soldier grenade effects or Panzer tank events.

Do not modify PixelLab artwork.

Step 10.2 is finished when firing origins and hit detection feel visually accurate, ESC reliably freezes and resumes the entire musical game, and all existing gameplay remains functional.