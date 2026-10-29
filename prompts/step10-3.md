# JUNIE TASK — LORELEI: DESCENT
## Step 10.3 — Lorelei Companion AI, Telekinetic Defense, and Pause Overlay Alignment

### 1. Objective

Introduce Lorelei as an autonomous companion who accompanies Blackrush through the underground robot battles.

Lorelei is a teenage superhero with latent telekinetic powers. She is Blackrush's student and ally, not a second player-controlled character.

Her behavior should be immediately recognizable:

- She follows Blackrush naturally.
- She uses her existing PixelLab movement animations.
- She can fall behind if Blackrush moves too rapidly.
- When nearby robots threaten Blackrush, she occasionally uses telekinesis to shove them away.
- Her protection is unavailable when she is too far from Blackrush.
- She requires no direct player controls.

Also correct a small existing UI problem: the ESC pause overlay currently appears flush left in the browser instead of centered over the game area.

**Preserve the excellent gameplay, forgiving hit detection, music synchronization, and pause functionality achieved in Steps 10.2 and 10.2.1.**

---

# PART A — Lorelei Sprite Integration

### 2. Existing artwork

The PixelLab sprite collection is already compiled through the v2 asset pipeline.

Canonical entity: `lorelei`

Source:

```text
public/assets/source/pixellab/lorelei/
    idle/
    walk/
    run/
```

Each animation has eight directional perspectives.

Use the existing SpriteAnimationRegistry to resolve textures and animations.

Do not load individual PixelLab source files at runtime.

Respect the variable-frame-size anchoring introduced in Step 10.0.1.

Use the same pixel-art display conventions as Blackrush.

Lorelei should appear approximately human-sized relative to Blackrush, with a visually appropriate scale rather than automatically filling her PNG canvas dimensions.

### 3. Character rendering

Create a lightweight Lorelei companion entity, following the established project architecture.

If an existing Lorelei entity already exists, extend it rather than creating a duplicate implementation.

Her visual modes are:

- `idle`: stationary or observing.
- `walk`: moving at ordinary following speed.
- `run`: catching up with Blackrush.

Select eight-way facing from actual movement velocity.

While stationary, Lorelei can face Blackrush or a nearby threat.

Do not restart the same animation every update.

The developer PIXEL ART toggle should affect Lorelei consistently with the other characters.

If sprites are disabled or unavailable, use a simple procedural visual fallback.

---

# PART B — Companion Spawning and Lifecycle

### 4. Join the mission

Lorelei should accompany Blackrush during the main underground combat section.

The current game begins with the opening Proxy/Nadine chase, followed by the underground robot battle at approximately Synth 00:45.

Prefer introducing Lorelei when the main chamber combat begins, using the existing phase transition rather than inventing a new arbitrary wall-clock timer.

Inspect current encounter and scene architecture before selecting the exact hook.

If Lorelei is already instantiated or introduced elsewhere, preserve the existing story sequence and avoid duplicates.

Do not modify the opening Proxy/Nadine chase during this milestone.

### 5. One companion

Only one Lorelei companion may exist during active gameplay.

Ensure correct behavior across:

- New game.
- Game Over.
- Restart.
- Arena checkpoint continue.
- Music timeline transitions.
- Debug seeking and encounter reconstruction.
- Return to title.
- Scene shutdown.

Avoid duplicate characters, orphaned physics bodies, duplicate animation listeners, and stale callbacks.

Use the established session lifecycle conventions where appropriate.

---

# PART C — Following Blackrush

### 6. Follow behavior

Lorelei should naturally follow Blackrush without being directly controlled.

She should try to remain close enough to provide protection, but she does not need to maintain an exact fixed position.

Prefer a position slightly behind or offset to one side of Blackrush rather than occupying the exact same coordinates.

Use smooth acceleration and deceleration where practical.

Avoid oscillation or jitter when Blackrush makes small movements.

Provide configurable values for:

```javascript
followDistance
stopDistance
walkSpeed
runSpeed
catchUpDistance
maximumSupportDistance
```

Choose sensible starting values based on the game's existing world scale and player movement speed.

### 7. Walk versus run

When Lorelei is comfortably near Blackrush, she should walk or idle.

When she falls behind, she should run to catch up.

Her run speed should be moderately greater than her ordinary walk speed.

Do not make her faster than Blackrush in every circumstance.

The player should be able to temporarily outrun her.

This is intentional gameplay behavior.

### 8. Obstacle navigation

Lorelei must respect the game's existing solid obstacles:

- Pillars.
- Machine blocks.
- Tanks.
- Perimeter walls.
- Boss arena structures.

Investigate the existing robot-navigation logic and reuse suitable pathfinding or steering helpers.

Do not implement a completely separate heavyweight navigation system unless necessary.

She should navigate around obstacles instead of becoming permanently trapped against them.

Do not allow routine movement to pass through solid cover.

### 9. Catch-up safeguards

If Lorelei becomes badly separated because of camera scrolling, chunk transitions, or navigation difficulties, implement a conservative recovery mechanism.

Prefer accelerated pathfinding and running first.

If recovery fails and she is safely offscreen, a discreet reposition to a valid nearby location is acceptable as a last resort.

Never visibly teleport her across the player's screen.

Never reposition her inside solid geometry.

Do not allow catch-up logic to bypass scripted boss encounters or break timeline reconstruction.

---

# PART D — Telekinetic Defense

### 10. Core behavior

Lorelei is not intended to be another automatic gun.

Her initial contribution should be **defensive telekinesis**.

When nearby robots crowd or threaten Blackrush, Lorelei can emit a brief telekinetic shockwave that pushes them away.

This should feel like Lorelei suddenly intervening to protect her mentor.

The player should occasionally experience a moment such as:

Blackrush becomes surrounded by Pursuers, and Lorelei throws out her hand. A violet psychic shockwave flashes across the chamber, knocking several robots backward and giving Blackrush a moment to escape or fire.

Make this visually satisfying without turning Lorelei into an invincibility shield.

### 11. Trigger conditions

Lorelei may activate telekinesis when:

- She is within support range of Blackrush.
- Multiple hostile robots are dangerously close to Blackrush.
- Her telekinetic ability is not on cooldown.
- She is not already performing another defensive action.
- Gameplay is active and unpaused.

Consider allowing an especially close individual Pursuer to qualify as an emergency threat, even if the normal multiple-enemy threshold has not been reached.

Do not repeatedly activate telekinesis against harmless distant robots.

Use the actual combat geometry developed in Step 10.2.1 rather than older feet-centered coordinates.

### 12. Proximity matters

Lorelei's protection must depend on her proximity to Blackrush.

If Blackrush outruns Lorelei, her telekinetic defense should not reach across the entire screen to save him.

She should first need to catch up.

When she is close enough, she becomes available to assist again.

This provides a useful tactical tradeoff:

- Moving fast can help Blackrush escape danger.
- Staying reasonably close to Lorelei provides occasional protection.

Do not add a complicated companion-management interface.

### 13. Telekinetic force

The telekinetic pulse should:

- Push nearby ordinary robots away from Blackrush.
- Affect Pursuers, Sentinels, and Armored Pursuers.
- Temporarily disrupt their immediate approach.
- Respect obstacle collision.
- Produce a clearly visible psychic effect.

It should not automatically kill ordinary robots.

It should not award points.

It should not remove armor from Armored Pursuers.

Only Blackrush's existing axe mechanic should perform that armor-removal action.

The telekinetic shove should not change a robot's health, damage resistance, or scoring rules.

### 14. Implement reliable knockback

Inspect how robot AI calculates velocity.

A common problem in arcade enemy AI is that a knockback impulse gets immediately overwritten by the next AI update.

Ensure that the pushback remains visible long enough to matter.

A short-lived knockback state or externally applied movement impulse is acceptable.

Avoid modifying the entire Robot AI architecture unnecessarily.

While knocked back, robots must still respect solid cover and world boundaries.

Do not let the effect launch enemies through pillars, machinery, or perimeter walls.

After knockback expires, their existing behavior should resume normally.

### 15. Boss exclusions

Do not let Lorelei's initial telekinetic pulse:

- Damage ProxyBoss.
- Damage SuperRobot.
- Disable Giant Boss components.
- Change scripted boss visual states.
- Interrupt authored boss destruction events.
- Alter musical timeline cues.

Boss-specific telekinetic assistance can be implemented in a later milestone.

During boss arenas, Lorelei may remain visually present and follow Blackrush, but her power must not bypass the specialized boss mechanics.

### 16. Cooldown and balance

Use configurable values for:

```javascript
supportRadius
threatRadius
minimumThreatCount
telekinesisRadius
telekinesisCooldown
knockbackStrength
knockbackDuration
```

Choose moderate initial values.

The effect should happen often enough to be noticed during intense robot swarms, but not so frequently that it trivializes combat.

A cooldown in the general range of several seconds is a reasonable starting point.

This should be adjustable after manual playtesting.

Do not couple the ability to the player's hearts, shield or NOVA resources.

Do not alter existing robot spawn rates to accommodate Lorelei.

---

# PART E — Telekinetic Visual Effects

### 17. Use procedural effects

Lorelei currently has idle, walk, and run artwork but no dedicated telekinesis animation.

Do not require additional PixelLab files.

During telekinesis:

- Briefly stop or reduce her movement.
- Face toward the immediate threat when possible.
- Use her idle pose.
- Display a short psychic pulse or expanding translucent ring.
- Optionally add subtle streaks or a brief violet/purple glow.
- Resume ordinary movement afterward.

Keep the effect visually distinct from Blackrush's force bolts and NOVA.

Aim for an energetic 1980s superhero arcade aesthetic.

Do not create elaborate particle systems yet.

### 18. Consistent origin

The telekinetic effect should originate near Lorelei's upper body, not her feet.

Use the combat geometry principles introduced in Step 10.2.

Keep its visual origin independent of the current source PNG dimensions.

Do not modify the sprite compiler or raw PixelLab artwork.

### 19. Animation and effect lifecycle

Ensure:

- Telekinetic effects are cleaned up after playback.
- Scene restarts do not leave ghost effects.
- Timeline seeking does not duplicate active effects.
- Effects pause correctly with ESC.
- Repeated use does not leak Phaser Graphics objects or listeners.

Sound effects are optional placeholders only for now.

Do not introduce a new audio asset requirement.

---

# PART F — ESC Pause Overlay Alignment

### 20. Existing bug

The ESC pause system works, but the pause overlay is visually positioned flush to the left side of the browser window.

The actual Phaser game area is centered.

Correct the overlay so its center matches the visible game canvas center.

### 21. Correct coordinate system

Inspect how the current pause overlay is created.

If it is a Phaser GameObject, use appropriate viewport or camera coordinates and suitable scroll factors.

If it is HTML/CSS, anchor it to the actual canvas container rather than the browser viewport.

Do not assume that the browser window's left edge corresponds to the game area's left edge.

Account for:

- Centered game canvas.
- Canvas scaling.
- Window resizing.
- Fullscreen mode where supported.
- Different viewport dimensions.
- Mobile-compatible layouts where practical.

The overlay should remain centered as the viewport changes.

### 22. Preserve existing pause functionality

Do not rewrite the working pause system.

Preserve:

- ESC toggles pause/resume.
- Music remains synchronized.
- AI and physics freeze.
- Gameplay timers freeze.
- Tweens and animations freeze.
- Clickable Resume control.
- Proper cleanup during restarts.

New Lorelei behavior and telekinetic cooldowns must obey the same pause state.

If Lorelei is midway through a pulse when ESC is pressed, the pulse should freeze and resume correctly.

---

# PART G — Debug Tools and Tests

### 23. Development diagnostics

Under `?debug=1`, provide concise diagnostics for Lorelei:

- Active/inactive.
- Distance from Blackrush.
- Follow mode: idle, walking, running, or recovering.
- Support available/unavailable.
- Telekinetic cooldown.
- Number of nearby qualifying threats.
- Last telekinetic activation.

Optionally visualize her follow and support radius.

Do not clutter normal gameplay.

Do not interfere with existing developer controls, including TOGGLE GEOMETRY.

### 24. Automated tests

Add focused tests for:

1. Lorelei sprite resolution through the v2 manifest.
2. Eight-direction idle/walk/run animation selection.
3. Correct visual anchoring.
4. Companion spawning at the appropriate mission phase.
5. No duplicate Lorelei instances.
6. Following and stopping distance.
7. Walk/run transition.
8. Obstacle avoidance.
9. Catch-up without visible teleportation.
10. Support unavailable when too far from Blackrush.
11. Telekinesis activating during nearby robot swarms.
12. Telekinesis not activating when no threat exists.
13. Telekinetic cooldown.
14. Knockback persists despite ordinary robot AI updates.
15. Knockback respects obstacles.
16. Armored Robots retain armor after telekinetic pushes.
17. Telekinesis does not award points.
18. Boss components are unaffected.
19. Effects are removed on scene shutdown.
20. Pause freezes Lorelei movement and cooldowns.
21. Pause freezes active telekinetic effects.
22. Pause overlay centers on the visible game canvas.
23. Pause overlay remains centered after resizing.
24. Restart and checkpoint continue remain functional.
25. Existing combat hit detection remains generous.
26. Existing music timeline synchronization remains intact.
27. Existing Pixel Art toggle still works.
28. Existing boss regression tests pass.

Run:

```bash
npm run sprites:check
npm test
npm run build
```

### 25. Manual browser playtest

The developer should be able to verify:

**Following**

- Lorelei appears when the underground combat begins.
- She follows Blackrush.
- She walks and runs naturally.
- She does not jitter against obstacles.
- Blackrush can outrun her temporarily.
- She eventually catches up.

**Defense**

- Allow several Pursuers to approach Blackrush.
- Observe Lorelei occasionally repel them.
- Confirm visible knockback.
- Confirm enemies resume their behavior afterward.
- Confirm no free kills or score are awarded.
- Confirm the effect stops being available if Lorelei falls far behind.
- Confirm it does not disrupt the two boss encounters.

**Pause**

- Press ESC while Blackrush and Lorelei are moving.
- Confirm both stop.
- Confirm the music stops.
- Confirm the pause overlay is correctly centered over the game canvas.
- Resume.
- Confirm all behavior and audio resume naturally.

**Regression**

- Force bolts and axes still hit robots generously.
- Sentinel lasers remain fair and dodgeable.
- Hearts, shields, NOVA, score, and checkpoint behavior remain unchanged.
- No new runtime errors occur.

### 26. Scope restrictions

Do not implement:

- Eclipse companion AI.
- Eclipse teleport/dash behavior.
- Lorelei offensive attacks.
- Lorelei boss-specific powers.
- New robot archetypes.
- New music cues.
- Proxy/Nadine combined sprite corrections.
- Armored Robot armor-break sound or particle effects.
- Giant Boss choreography.
- German Soldier grenade choreography.
- Panzer tank sequences.
- New PixelLab animation files.

This milestone concerns Lorelei's companion behavior, her initial defensive telekinesis, and the pause-overlay alignment correction.

### 27. Completion report

Report:

1. Files created and modified.
2. How Lorelei is spawned and managed.
3. Follow behavior and navigation approach.
4. Telekinetic trigger conditions and cooldown.
5. Knockback implementation.
6. Visual effect implementation.
7. How pause integrates with Lorelei.
8. Root cause of the pause-overlay positioning error.
9. How the overlay was centered.
10. Automated test results.
11. Production build results.
12. Browser verification status.
13. Remaining tuning suggestions.

**STOP AFTER STEP 10.3.**

Do not begin Eclipse AI or additional boss work.

The milestone is complete when Lorelei visibly accompanies Blackrush, provides occasional defensive telekinetic assistance, obeys the music-driven game lifecycle, and the ESC pause overlay is properly centered.