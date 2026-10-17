# JUNIE TASK — LORELEI: DESCENT
## Step 9: Expanded Battlefield, Proxy Boss Battle, Grenade Sequence, and Conditional Heart Drops

### 1. Project context

LORELEI: DESCENT is a music-driven browser arcade shooter developed with JavaScript ES modules, Phaser 3.88.2, Arcade Physics, Vite, and Node.js.

Steps 1 through 8 are implemented and tested.

Working features include:

- Musical timeline synchronized to three original recordings.
- Classic and Assisted desktop controls.
- Player weapons, damage, and robot combat.
- Three ordinary robot types.
- Environmental obstacles and cover.
- Six hearts, regenerating shields, and respawning.
- Music-driven encounters, formations, retreats, and ambient resistance.
- Deterministic seeking and restart.
- Opening Proxy escape.
- Working Game Over, EndingScene, and Replay.

The developer reports that the game is fun and stable.

**This milestone must remain focused on gameplay. Do not design cinematics, music, narrative presentations, final artwork, introductions, or outros.**

The developer will create and integrate final sprites, music, and voice assets separately.

Implement Step 9 in stages, verifying each stage before continuing.

Do not begin the giant super-robot boss or Panzer encounter.

---

## PART A — Small Encounter System Maintenance

### 2. Support conditional HEART_DROP events

Extend the existing music-driven encounter score with a new event type:

```javascript
{
    id: 'HEART_1',
    time: 160,
    type: 'HEART_DROP',
    ifHeartsBelow: 3
},
```

Semantics:

- At the specified musical time, check Blackrush's remaining hearts.
- If remaining hearts are strictly below `ifHeartsBelow`, spawn one collectible heart.
- Otherwise, spawn nothing.
- The pickup restores exactly one heart when collected.
- Never exceed the configured maximum of six hearts.
- Collecting a heart does not affect shield strength.
- A pickup must be physically collected by Blackrush.

Initial implementation should use a simple procedural heart placeholder.

Spawn the item below the visible battlefield, in a collision-safe location, so the descending camera reveals it naturally.

Keep it accessible long enough for the player to collect it.

Prevent heart pickups from being placed inside machinery or behind inaccessible obstacles.

Uncollected hearts should eventually expire or be retired when they are irretrievably behind the camera.

The developer must be able to add additional HEART_DROP records without changing engine code.

Do not implement random enemy drops.

### 3. Encounter ID validation

Inspect `src/config/encounterScore.js`.

Some current cue IDs may be duplicated.

Because TimelineDirector tracks events by ID, duplicate IDs may prevent intended musical cues from firing.

Implement startup validation that reports duplicate IDs.

Rename duplicates uniquely while preserving their original timestamps, types, formations, and counts.

Do not rebalance the developer's carefully adjusted encounter score.

Also validate HEART_DROP records and numeric conditions.

Tests must verify that separate cues with previously duplicated IDs now execute independently.

---

## PART B — Expanded Desktop Battlefield

### 4. World and viewport separation

The game currently uses a 640 × 960 portrait gameplay area.

The developer wants a significantly wider experience on desktop while retaining the portrait design for mobile.

Implement an expandable horizontal battlefield.

Suggested starting world width:

**1280 logical pixels.**

Target viewport behavior:

- Large desktop: Up to approximately 1280 × 960 logical pixels visible.
- Narrow/mobile display: Approximately 640 × 960 logical pixels visible.
- Intermediate widths: Adapt to available space where practical.

Maintain one shared world coordinate system.

Do not simulate different gameplay worlds for desktop and mobile.

Avoid horizontally stretching the 640-pixel game to fill a 1280-pixel canvas.

Use an appropriately configured Phaser canvas and camera viewport.

### 5. Camera behavior

During descent:

- Preserve music-controlled vertical scrolling.
- Allow horizontal tracking when the viewport is narrower than the world.
- Keep Blackrush reasonably centered horizontally when possible.
- Clamp the camera to world bounds.
- Keep camera movement smooth and predictable.

In the fixed arena:

- The camera stops descending at Synth 5:00.
- On desktop, more horizontal arena space becomes visible.
- On narrow displays, the camera follows Blackrush horizontally.
- Camera movement must not allow the player to see beyond world boundaries.

Developer seeking must reconstruct the camera position correctly.

Do not change musical cue timing.

### 6. Controls and HUD

Preserve Classic and Assisted controls exactly as users experience them.

Important:

- Mouse aiming must use the correct camera/world coordinate conversion.
- Assisted movement must remain correct with a horizontally moving camera.
- Debug panel input isolation must continue working.
- HUD remains anchored to the visible viewport, not the world.
- Hearts, shield, score, and musical indicators remain legible.
- Resizing must not create duplicate physics objects or corrupt input state.

Do not implement touchscreen controls yet.

### 7. Expand the environment

Extend chamber and arena geometry to support the wider world.

The procedural environment should remain deterministic.

Preserve existing obstacle behavior:

- Solid machinery.
- Perimeter walls.
- Laser-blocking cover.
- Projectile collisions.
- Robot obstacle avoidance.
- Safe spawning.
- Tactical retreats.

The fixed arena needs an open central combat region with machinery and support structures near its edges.

Leave space for:

- The Proxy.
- Blackrush.
- Ordinary supporting robots.
- A future giant boss.
- A future Panzer tank.

Do not implement the Panzer yet.

### 8. Validate wide-world behavior before continuing

Before implementing the boss, verify:

- Desktop viewport uses the expanded width.
- Narrow viewport can follow Blackrush horizontally.
- Projectile aiming remains accurate.
- Assisted movement remains responsive.
- Obstacle collisions work.
- Respawning works at both horizontal extremes.
- Robot encounters remain functional.
- Musical camera progression is unchanged.
- Restart and seeking work.

Do not proceed to Part C until this foundation is stable.

---

## PART C — Proxy Boss Gameplay

### 9. Boss entity

Implement the Proxy as a proper boss entity.

Suggested module:

`src/entities/ProxyBoss.js`

Keep it separate from the temporary opening `Proxy.js` escape representation.

The developer will eventually provide two different sprites:

- `proxy-carrying-nadine`
- `proxy-boss`

Use a configurable placeholder for now.

The boss should be larger and more durable than ordinary robots.

Support:

- Boss health and armor.
- Damageable weak points.
- Movement.
- Targeting and attacking.
- Hit reactions.
- Staggering.
- Disabled components.
- Boss defeat state.

Do not use the ordinary robot damage model blindly if dedicated boss rules are needed.

Reuse existing combat utilities where appropriate.

### 10. Boss musical timeline

The Proxy encounter occupies Synth 5:00–6:02.

Use the existing musical event configuration as its primary timing source.

Relevant existing events include:

- `PROXY_RELEASES_NADINE` at 300 seconds.
- `PROXY_ATTACK` at 315 seconds.
- `GERMAN_SOLDIER_APPEARS` at 340 seconds.
- `GRENADE_SEQUENCE` at 350 seconds.
- `PROXY_COLLAPSE` at 358 seconds.

Preserve event IDs and timestamps unless a confirmed conflict requires correction.

Do not infer detailed narrative actions solely from an existing event's name.

Make boss gameplay behavior configurable in a dedicated module, for example:

`src/config/proxyBossConfig.js`

Do not implement visual narrative sequences.

### 11. Proxy movement and attacks

The Proxy should move around the fixed arena and present a meaningful threat.

Implement a manageable initial set of attacks:

**Laser targeting**

- Visible warning.
- Brief destructive beam.
- Proper cover blocking.
- Shield damage.
- Sensible cooldown.

**Close-range attack**

- Contact or mechanical strike when Blackrush gets too close.
- Appropriate telegraphing.
- Shield damage and temporary hit protection.

**Repositioning**

- Move between tactical positions in the arena.
- Avoid spending the entire encounter standing still.
- Respect collision geometry where applicable.

Use music cues for major changes in behavior.

Do not implement sophisticated pathfinding or elaborate animation systems.

### 12. Boss armor and weak points

The Proxy should have several identifiable mechanical weak points.

Suggested starting arrangement:

- Head/laser assembly.
- Left mechanical component.
- Right mechanical component.
- Exposed central core.

Weak points should be represented by independent collision targets or a similarly reliable system.

Support a combination of:

- Throwing axe impacts.
- Energy bolt damage.
- Armor-breaking transitions.

Axe hits should be particularly useful against armor.

Energy bolts should be useful against exposed components.

Do not require the player to strike a tiny pixel-perfect target.

Give weak points sufficiently generous collision areas for casual gameplay.

Use simple procedural visual feedback until final artwork exists.

### 13. Boss defeat policy

The Proxy encounter is musically choreographed.

Blackrush's attacks must have meaningful effects, but the soundtrack must not become stuck waiting for a boss to reach zero health.

Implement a clear distinction between:

- Combat damage.
- Boss components disabled.
- Boss staggered state.
- Final defeat.
- Scripted musical climax.

The player should be able to weaken the Proxy through skillful fighting.

However, a player who is less accurate should not be forced to replay the encounter indefinitely after the soundtrack reaches its ending.

At the musical climax, the scripted grenade sequence provides a reliable resolution.

If the player has performed well, reflect this with a stronger or earlier combat advantage, not a different soundtrack duration.

Document the exact rules so the fight remains understandable and fair.

---

## PART D — German Soldier and Grenade

### 14. Soldier gameplay entity

At the existing German soldier cue, introduce a temporary non-player gameplay entity.

This entity does not require advanced AI.

It should:

- Appear at a valid arena position.
- Remain safe from ordinary combat damage.
- Deliver or throw a grenade at the configured cue.
- Clean up after its role is complete.

Use a simple placeholder.

The developer will supply the final sprite and associated presentation later.

Do not implement dialogue or cutscenes.

### 15. Grenade interaction

Implement a grenade as a physical gameplay object.

At the configured musical cue, the German soldier throws the grenade toward the Proxy.

Blackrush should have an opportunity to intervene.

Possible interaction:

- If Blackrush is correctly positioned near the Proxy, he can catch or intercept the grenade.
- A successful interception allows Blackrush to perform the finishing grenade action.
- If he does not intervene, the soldier's scripted action still completes the encounter.

The final sequence must remain synchronized to the music.

Keep the interaction simple and visually readable.

Do not introduce a complicated inventory system.

Use an explicit interaction window and clear collision rules.

The grenade must not be lost permanently if the player misses it.

### 16. Grenade and boss resolution

At the configured final cue:

- The Proxy enters its final disabled/defeated state.
- Its attacks stop.
- Any supporting robot attacks are cleared.
- The grenade resolution triggers the boss's final mechanical collapse.
- The game prepares for the Cathedral track.

The player should not be able to kill the boss so early that the musical sequence becomes empty.

If health reaches zero before the final cue, the Proxy may remain critically damaged or disabled until the scripted conclusion.

Avoid making it look as though the boss is invincible; component destruction and movement impairments should provide clear feedback.

Do not implement a cinematic explosion, collapsing building presentation, or Nadine reunion.

Those are presentation tasks for later.

---

## PART E — Supporting Enemies

### 17. Controlled boss reinforcements

The wider arena should not remain empty while Blackrush fights the Proxy.

Introduce small, explicitly scheduled groups of ordinary robots during the Proxy encounter.

Suggested groups:

- A few Sentinels protecting the Proxy.
- Occasional Pursuers.
- Rare Armored Pursuers.

The arena should never become overwhelmed by the full Step 7 swarm.

Support configurable caps and musical spawn cues.

Ordinary reinforcements should enter from appropriate arena access points rather than appearing in the middle of the battlefield.

Do not reactivate the ordinary descent EncounterDirector blindly.

Create a controlled boss encounter policy that works with the existing population-management infrastructure.

Ensure all reinforcements are retired during the grenade finale.

### 18. Survival compatibility

All current survival systems must continue functioning.

Preserve:

- Six hearts.
- Shield regeneration.
- Automatic respawning.
- Low-heart warnings.
- Final Game Over.
- Score.
- Conditional heart pickups.

Heart loss during the Proxy fight must not restart the music or boss timeline.

Respawn must use safe arena positions.

Do not replenish hearts automatically on entering the boss arena.

---

## PART F — Seeking, Debugging, and Stability

### 19. Deterministic boss seeking

Developer jumps should reconstruct representative boss state.

Examples:

- Seek to 5:00: Proxy at opening encounter state.
- Seek to 5:20: Active combat state.
- Seek to 5:40: Soldier arrival state.
- Seek to 5:50: Grenade interaction test state.
- Seek to 5:58: Final collapse state.
- Seek into Cathedral: Proxy encounter removed.
- Seek backward to Proxy: Valid boss recreated.

Do not replay all combat history to reconstruct a seek.

For developer seeking, use deterministic representative boss health and component states appropriate to the selected time.

Avoid duplicate boss objects and stale physics bodies.

### 20. Developer controls

Add a small Proxy testing section to the existing debug panel.

Useful readouts:

- Boss active/inactive.
- Boss health.
- Armor status.
- Weak-point states.
- Attack state.
- Current boss musical cue.
- Grenade state.
- Soldier state.
- Active reinforcement count.

Useful controls:

- Spawn/reset Proxy in arena.
- Damage selected weak point.
- Disable armor component.
- Test grenade interaction.
- Trigger boss finale.

Developer controls must not interfere with gameplay input.

Preserve all existing timeline and encounter tools.

### 21. Lifecycle safety

Previous milestones corrected important scene and event-listener races.

Do not reintroduce them.

All boss and grenade objects must belong clearly to GameScene.

Clean up on:

- Scene shutdown.
- Game Over.
- Restart.
- Developer seeking.
- Natural Synth-to-Cathedral transition.
- Studio transition.

No callback may access destroyed physics groups.

No stale boss timer should fire after a scene transition.

No independent wall-clock timer should control scripted boss events.

### 22. Automated tests

Extend the existing suite.

Test at minimum:

1. HEART_DROP condition uses strict less-than comparison.
2. Heart pickup restores one life.
3. Pickup cannot exceed six hearts.
4. Pickup does not refill shield.
5. Pickup is not created when condition fails.
6. Duplicate encounter IDs are rejected or clearly reported.
7. Responsive viewport preserves world coordinates.
8. Narrow camera follows Blackrush horizontally.
9. Wide camera remains within world bounds.
10. Mouse aiming remains camera-correct.
11. Proxy initializes at the arena cue.
12. Proxy attacks damage Blackrush.
13. Environmental cover blocks the Proxy laser.
14. Axe damages an appropriate armored component.
15. Energy damages an exposed weak point.
16. Boss damage cannot cause duplicate defeat events.
17. Grenade cue creates the intended interaction.
18. Player intervention can alter grenade handling.
19. Soldier fallback resolves the fight if intervention fails.
20. Proxy encounter finishes at the configured musical climax.
21. Reinforcement caps are respected.
22. Seeking reconstructs representative boss state.
23. Restart clears all boss state.
24. Natural Cathedral transition succeeds.
25. Natural Studio victory still works.
26. Existing ordinary combat and survival tests remain passing.

### 23. Manual browser acceptance

Test:

**Heart drops**

- Reduce hearts to two.
- Allow the configured cue to trigger.
- Collect the heart.
- Verify one life is restored.
- Repeat with three hearts and confirm no pickup appears.

**Wide desktop**

- Confirm expanded gameplay width.
- Move across the arena.
- Verify camera and mouse aiming.
- Confirm collisions work.

**Narrow viewport**

- Confirm Blackrush remains visible.
- Confirm horizontal camera following.
- Confirm control accuracy.

**Proxy fight**

- Jump to Synth 5:00.
- Fight the Proxy.
- Verify meaningful damage and weak-point reactions.
- Take damage and respawn.
- Confirm music remains synchronized.
- Observe supporting robots.
- Test soldier and grenade sequence.
- Allow Synth to finish naturally.
- Confirm Cathedral begins without exceptions.

**Lifecycle**

- Jump backward from Cathedral into Proxy.
- Jump forward to Victory.
- Replay.
- Repeat multiple times.

Do not claim browser verification unless it was actually performed.

### 24. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- Heart-drop cue syntax.
- Encounter ID validation.
- Responsive world and viewport architecture.
- Proxy configuration and weak points.
- Boss attacks.
- Musical boss states.
- Reinforcement policy.
- Grenade handling.
- Developer controls.
- Seeking and lifecycle behavior.

### 25. Scope restrictions

Do not implement:

- Final Proxy artwork.
- Nadine sprite animation.
- Dialogue.
- Cutscenes.
- Intro/outro presentation.
- Original music editing.
- Full Shadow Lorelei companion.
- Giant super-robot.
- Panzer combat.
- Final-boss armor sequences.
- Final Nadine reunion.
- New ordinary robot types.
- Mobile touchscreen controls.
- New soundtrack.
- Permanent upgrades.
- Additional weapons.

The developer will handle final artwork, music, sound design, and presentation.

### 26. Completion requirements

Step 9 is complete when:

- Conditional musical heart pickups work.
- Duplicate encounter IDs cannot silently suppress cues.
- Desktop battlefield supports a wider view.
- Narrow viewports use a functional horizontal camera.
- The Proxy is a playable boss.
- Boss weak points and armor function.
- Blackrush can meaningfully damage the Proxy.
- Supporting robots appear in controlled formations.
- German soldier and grenade interaction work.
- Musical climax produces a reliable boss resolution.
- Natural progression to Cathedral works.
- Seeking and restart remain stable.
- Existing game systems continue working.
- Automated tests pass.
- Production build succeeds.

Implement and validate the parts in order.

If an early part requires substantial architectural changes, finish and report that part before proceeding rather than rushing into incompatible boss code.

**Stop after Step 9. Do not begin Step 10 without authorization.**