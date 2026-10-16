# JUNIE TASK — LORELEI: DESCENT
## Step 5: Robot AI, Combat Damage, Shields, Armor, and Destruction

### 1. Project Context

We are developing **LORELEI: DESCENT**, a browser-based, top-down, music-driven arcade shooter promoting the original Lorelei superhero novel.

Technology:

- JavaScript ES modules
- Phaser 3.88.2
- Vite 8.3.4
- Node.js 24
- Phaser Arcade Physics
- Logical resolution: 640 × 960

Previous milestones are implemented and working:

- Step 1: Project foundation.
- Step 2: Scenes, underground environment, and placeholders.
- Step 3: Music-driven timeline.
- Step 3.1: Lifecycle and canvas corrections.
- Step 4: Blackrush movement, aiming, shooting, and scrolling.
- Step 4.1: Projectile physics corrections.
- Step 4.2: Fixed boss arena and optional mouse-assisted controls.
- Step 4.3: Assisted movement pointer corrections.

The developer has manually tested Classic and Assisted controls and is satisfied with both.

**Your task is to implement Step 5 only.**

Before changing code, inspect the existing project architecture, including:

- `src/entities/Blackrush.js`
- `src/entities/Robot.js`
- `src/entities/Projectile.js`
- `src/systems/WeaponSystem.js`
- `src/systems/DescentController.js`
- `src/systems/ChamberBuilder.js`
- `src/controls/DesktopControls.js`
- `src/scenes/GameScene.js`
- `src/ui/Hud.js`
- `src/config/gameplayConfig.js`
- `src/config/timeline.js`
- `src/systems/TimelineDirector.js`
- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`

Preserve all existing working functionality.

Do not replace functioning systems with new implementations merely for architectural consistency.

---

### 2. Primary Objective

Make the robot placeholders into actual enemies.

Implement:

1. Three robot types.
2. Robot movement and targeting behavior.
3. Player projectile collisions.
4. Robot health and armor.
5. Shield damage and recovery rules.
6. Contact damage.
7. Enemy laser attacks with advance warning.
8. Hit reactions and knockback.
9. Robot destruction animations.
10. Combat scoring.
11. Small, deterministic test encounters.
12. Combat state cleanup when seeking or changing scenes.

The objective is an enjoyable, responsive combat prototype.

Do not implement the full music-controlled robot swarm. That is Step 7.

---

### 3. Combat Design Philosophy

This game should emphasize **powerful weapons and satisfying destruction**, not prolonged battles against enemies with large health bars.

Ordinary robots should be relatively easy to kill individually.

The challenge will eventually come from overwhelming numbers, tactical positioning, enemy targeting, and the need to preserve Blackrush's shield.

Combat should feel energetic and dramatic, but not excessively difficult.

Prioritize:

- Responsive weapons.
- Clear hit confirmation.
- Visually spectacular robot destruction.
- Readable enemy attacks.
- Fair damage.
- Forgiving difficulty.
- Efficient simulation.

A robot receiving a killing blow should respond immediately.

Do not require lengthy death animations before the robot becomes noninteractive.

---

### 4. Robot Types

Implement three robot archetypes.

Use the existing Robot module where practical, adding configurable behavior profiles.

#### Type A: PURSUER

Purpose: Basic close-range enemy.

Suggested initial parameters:

- Maximum health: 1.
- Movement speed: 90 pixels/second.
- Chase range: 450 pixels.
- Contact shield damage: 8.
- Contact damage cooldown: 1 second.
- No ranged weapon.
- Destroyed by one energy bolt.
- Destroyed by one axe hit.

Behavior:

- Detect Blackrush within an activation radius.
- Move directly toward him.
- Attempt to close the distance.
- Cause shield damage upon contact.
- React to knockback.
- Resume pursuit after recovering from knockback.

Use smooth but uncomplicated movement.

No sophisticated pathfinding is required.

#### Type B: SENTINEL

Purpose: Ranged attacker.

Suggested parameters:

- Maximum health: 2.
- Movement speed: 45 pixels/second.
- Preferred firing distance: approximately 250 pixels.
- Target acquisition warning: 0.7 seconds.
- Laser shield damage: 15.
- Cooldown between attacks: 2.5 seconds.
- Destroyed by two energy bolts.
- Destroyed by one axe hit.

Behavior:

- Detect Blackrush.
- Move slowly into a suitable firing position.
- Stop and acquire the target.
- Display a visible red targeting line.
- After the warning interval, fire a destructive laser.
- Pause before acquiring the next target.

Targeting should initially track Blackrush during part of the warning, then lock the final firing direction shortly before the shot.

A moving player must have a reasonable opportunity to evade.

The destructive beam should be brief, powerful, and visually distinct from the targeting line.

For simplicity, use a short-lived ray or beam rather than a physical projectile, if appropriate.

#### Type C: ARMORED PURSUER

Purpose: Tougher enemy demonstrating armor-breaking combat.

Suggested parameters:

- Maximum health after armor removal: 1.
- Armor integrity: 1.
- Movement speed: 60 pixels/second.
- Contact shield damage: 12.
- Contact damage cooldown: 1 second.

Behavior:

- Slowly pursue Blackrush.
- Resist ordinary energy bolts while armored.
- React visibly when struck.
- Lose armor when hit by an axe.
- Become vulnerable to a single energy bolt after armor is removed.

The armored robot should visually change when its armor is destroyed.

For example:

- Initial appearance: Dark red robot with heavy gray armor plates.
- After axe impact: Armor plates break away, exposing a bright orange mechanical core.
- Final energy hit: Robot explodes.

Do not implement regenerative armor.

Keep the armor and health mechanics separate.

An axe should not automatically destroy an armored robot in this milestone.

---

### 5. Configurable Damage Model

Introduce a lightweight damage system.

Suggested modules:

- `src/systems/CombatSystem.js`
- `src/config/combatConfig.js`

You may use another reasonable structure if it better fits the existing code.

Represent attacks with data describing:

- Damage amount.
- Damage type.
- Knockback strength.
- Attacker.
- Impact direction.
- Armor-breaking capability.

Suggested attack types:

- ENERGY
- AXE
- LASER
- CONTACT

Avoid implementing an elaborate role-playing-game damage model.

Do not add elemental damage, critical-hit calculations, inventory equipment, or complex resistance tables.

The system needs to support the current three robot types and future boss weak points.

An attack should be processed deterministically and return a result describing what happened.

For example:

- No damage.
- Armor hit.
- Armor broken.
- Health damaged.
- Target destroyed.

This result can drive visual effects and scoring.

---

### 6. Weapon Interactions

Preserve the existing energy bolt and throwing axe implementations.

Do not modify their movement speed, firing rate, or cooldown unless correcting a confirmed defect.

#### Energy bolts

- Damage ordinary robots.
- Destroy a one-health Pursuer immediately.
- Require two hits to destroy a Sentinel.
- Produce sparks against armored robots.
- Do not penetrate intact armored plating.
- Destroy an armored robot once armor has been removed.

#### Throwing axe

- Instantly destroys ordinary Pursuers and Sentinels.
- Strips armor from Armored Pursuers.
- Produces stronger impact feedback than energy bolts.
- Applies visible knockback.

Optionally allow an axe to continue through one ordinary robot and strike another.

Implement this only if it can be achieved cleanly without substantially complicating collision handling.

Prevent one projectile from repeatedly damaging the same robot across successive physics frames.

Axe projectiles should have a clear hit-registration policy, including what happens to the projectile after striking armor or an ordinary robot.

Do not allow unintended multiple hits caused by overlapping hitboxes.

---

### 7. Knockback

Implement basic knockback.

When a robot is struck by an axe:

- Apply a short impulse away from the impact direction.
- Briefly interrupt its movement.
- Display a strong impact reaction.
- Allow it to resume normal behavior if it survives.

For energy bolts, use much smaller knockback or none.

Knockback should be frame-rate independent.

It must not accidentally propel robots outside the playable world.

Do not implement complicated ragdoll physics.

Destroyed robots should stop participating in movement and collision systems immediately.

---

### 8. Robot AI Architecture

Keep AI relatively simple.

Suggested states:

- IDLE
- PURSUING
- ACQUIRING_TARGET
- FIRING
- COOLDOWN
- STAGGERED
- DESTROYED

Not every robot type needs every state.

Use a straightforward state-machine approach.

Do not introduce behavior-tree libraries or third-party AI frameworks.

Robots should activate when Blackrush is nearby and become inactive or simplified when sufficiently far outside the visible playfield.

Avoid simulating every robot in the entire underground complex continuously.

Each robot should have a clear separation between:

- Configuration.
- State.
- Movement behavior.
- Attack behavior.
- Damage handling.
- Visual presentation.

---

### 9. Enemy Laser Targeting

This is an especially important visual and gameplay feature.

The Sentinel should project a narrow, bright red targeting beam toward Blackrush.

The warning beam should be clearly visible for approximately 0.7 seconds.

Near the end of target acquisition, lock its firing direction.

Then fire a destructive red or orange laser beam.

The destructive beam should:

- Appear significantly brighter and thicker.
- Last approximately 0.15 seconds.
- Damage Blackrush if the beam intersects his collision geometry.
- Trigger a shield impact effect.
- Avoid applying repeated damage on every rendering frame.

Use geometric intersection or appropriate Phaser collision logic for beam damage.

The beam must not damage Blackrush multiple times during one shot.

For this milestone, static obstacles do not need to block enemy lasers. However, design the beam system so environmental line-of-sight blocking can be added in Step 6 without rewriting the attacks.

Keep laser origin, direction, length, and hit logic separated from visual rendering.

Do not create unbounded numbers of Phaser Graphics objects during firing.

---

### 10. Blackrush Shield

The HUD already has a shield indicator.

Make it functional.

Suggested initial shield configuration:

- Maximum shield: 100.
- Initial shield: 100.
- Laser hit: 15 damage.
- Pursuer contact: 8 damage.
- Armored Pursuer contact: 12 damage.
- Damage invulnerability window: approximately 0.35 seconds.

Implement a visible shield effect when Blackrush takes damage.

Suggested effects:

- Cyan circular shield flash.
- Brief electrical arcs or sparks.
- A short player glow or color pulse.
- HUD shield bar reduction.

The shield should not regenerate automatically during this milestone.

We will introduce resource balancing and recovery mechanics in Step 7.

Do not implement separate player lives or a complicated health model.

#### Shield depletion

When the shield reaches zero:

- Stop accepting further damage.
- Disable normal combat input.
- Display a temporary "SHIELD DEPLETED" or "BLACKRUSH DOWN" overlay.
- Pause gameplay and music consistently.
- Provide a working RESTART GAME or BACK TO TITLE action.

You may integrate the existing GameOverScene if that can be done without breaking the persistent music and scene architecture.

Do not permit the soundtrack to continue progressing through encounters while the player is defeated.

Avoid implementing checkpoints yet.

---

### 11. Collision Detection

Enable appropriate Arcade Physics collisions between:

- Blackrush energy projectiles and robots.
- Blackrush axe projectiles and robots.
- Robots and Blackrush.

Use collision groups where appropriate.

Avoid checking every projectile against every robot manually unless there is a specific reason.

Configure hitboxes to match the simple placeholder sprites approximately.

Keep collision geometry independent of final artwork.

Important considerations:

- Dead robots must stop colliding.
- Inactive pooled projectiles must not collide.
- A projectile must not repeatedly register the same impact.
- A robot being knocked backward must not inflict many contact hits in rapid succession.
- Offscreen objects should be cleaned up or deactivated appropriately.

Do not yet implement player-obstacle or robot-obstacle collision response; that belongs to Step 6.

---

### 12. Robot Destruction Effects

This is one of the highest-priority presentation features of Step 5.

When a robot dies, make its destruction visibly satisfying, even using only primitive graphics.

Suggested effects:

- Bright impact flash.
- Several mechanical fragments thrown outward.
- Small sparks.
- Brief explosion glow.
- Rapid fragment rotation.
- Fragments fading and disappearing.
- Optional subtle camera shake for nearby heavy impacts.

Use different destruction intensities:

**Pursuer:** Small electrical explosion.

**Sentinel:** Larger explosion with red mechanical fragments.

**Armored Pursuer:** Strong armor-breaking effect followed by exposed core destruction.

Use Phaser graphics, generated textures, or Phaser's built-in particle capabilities.

Do not download artwork.

Do not introduce an external particle library.

Precreate reusable textures where practical.

Limit active particle counts to maintain performance.

All temporary effects must expire and be cleaned up.

Avoid heavy full-screen flashes that could become uncomfortable when many robots explode simultaneously.

---

### 13. Combat Scoring

Make the score display functional.

Suggested initial values:

- Pursuer destroyed: 100 points.
- Sentinel destroyed: 200 points.
- Armored Pursuer destroyed: 300 points.
- Armor broken: 50 points.

Do not award multiple scores for the same destruction event.

Keep score inside the current game session.

Do not implement online leaderboards.

Reset score when beginning a fresh game.

Do not reset score when simply seeking within a session unless developer seek semantics explicitly require restoring deterministic test state.

For development seeking, prefer resetting combat state and clearly documenting how score is treated.

---

### 14. Deterministic Test Encounters

Do not yet implement a full SpawnDirector.

We want small test encounters to verify combat.

Create configurable robot placements appropriate for:

- Early descent.
- Mid-descent.
- Late swarm.
- Boss arena.

Place approximately 8–15 robots around the initial visible region, with enough room for Blackrush to move.

Use a mixture of robot types.

Additional test groups can appear at predefined world depths.

Because the chamber advances automatically, robots should become active only when near the camera viewport.

Do not spawn unlimited robots.

Avoid placing robots directly on top of Blackrush when seeking.

The boss arena may contain a few test robots, but do not introduce bosses.

Keep encounter positions deterministic.

If random behavior is introduced, use a configurable seed where practical.

---

### 15. Developer Testing Controls

Preserve the existing timeline development panel.

Add a few useful combat testing controls, if simple:

- Reset shield to 100.
- Clear active robots.
- Spawn a Pursuer.
- Spawn a Sentinel.
- Spawn an Armored Pursuer.
- Toggle temporary invulnerability.

These must be development-only.

Do not clutter the production game.

Existing timeline jump controls must continue functioning.

Do not allow debug panel clicks to trigger mouse-assisted movement or weapons.

---

### 16. Mouse Controls

Preserve the two working control modes exactly as currently implemented.

**Classic**

- WASD / arrow movement.
- Mouse aiming.
- Left-click energy bolts.
- Right-click throwing axe.

**Assisted**

- Mouse-follow movement outside the configured dead zone.
- WASD override.
- Mouse aiming and weapons.

The developer is satisfied with both behaviors.

Do not redesign them.

However, ensure the assisted movement parameters are centralized and configurable:

- Dead-zone radius.
- Full-speed radius.
- Pointer-outside-canvas behavior.

Preserve the current pointer-outside-canvas behavior as the default.

If a configuration setting is already present, reuse it.

Do not introduce new control features.

---

### 17. Music and Pause Integration

This game is controlled by an authoritative musical timeline.

Preserve the existing three soundtrack recordings and their configuration.

Enemy AI, projectiles, collision damage, knockback, and temporary effects must pause together when the musical timeline is paused.

Do not allow robots to continue moving or firing during pause.

Do not allow laser acquisition or weapon cooldowns to continue advancing during pause.

If using Phaser Arcade Physics, ensure the physics simulation itself does not continue independently while gameplay is paused.

Avoid implementing a second unrelated authoritative game clock.

For local combat timers, use a simulation-time mechanism that advances only while music-driven gameplay is active.

The soundtrack remains authoritative for large-scale progression and encounter timing. Per-frame combat simulation may use frame delta while actively playing.

---

### 18. Musical Seeking and Transient State

Developer seeking must remain reliable.

When seeking to another phase:

1. Stop or deactivate existing robots.
2. Remove active enemy attacks and laser beams.
3. Clear or recycle player projectiles.
4. Clear temporary destruction effects.
5. Restore a consistent Blackrush position.
6. Set the correct camera mode and depth.
7. Rebuild the appropriate test encounter.
8. Reset transient enemy state.
9. Prevent duplicate event subscriptions.

Maintain a clear policy for whether debug seeking restores the shield and score.

For this milestone, it is acceptable to reset both to their initial values during a developer seek, provided this is consistent and documented.

Do not attempt to simulate the entire combat history from the beginning of the musical recording when the developer jumps directly to a timestamp.

A developer seek is a deterministic reconstruction of a test state.

When entering EndingScene or returning to TitleScene, all scene-owned combat systems and objects must clean up correctly.

Do not damage the existing persistent TimelineDirector or AudioDirector subscriptions.

---

### 19. Music-Driven Arena Transition

Preserve the Step 4.2 camera behavior:

- Synth 0:00–5:00: Descending camera.
- Synth 5:00 onward: Fixed arena.
- Cathedral: Fixed arena.
- Studio: EndingScene.

The robot test encounters should not interfere with this behavior.

When the camera stops at the arena, robots currently outside the intended combat area should not continue pursuing Blackrush from distant world positions.

Keep the future Proxy boss location unobstructed.

Do not implement the Proxy, grenade, debris wall, or giant boss.

---

### 20. Performance Requirements

Target smooth performance at 60 FPS on a typical desktop browser.

Use efficient collision groups.

Avoid constructing large numbers of graphics objects every frame.

Recycle projectiles and effects where appropriate.

Ensure destroyed robots are removed from active AI and physics processing.

Limit offscreen updates.

Do not generate a new geometry texture for every explosion.

Avoid excessive allocations in `update()` loops.

The implementation should be able to handle approximately 30 active ordinary robots without significant performance degradation on typical desktop hardware.

This is a target to evaluate, not a reason to prematurely optimize everything.

---

### 21. Automated Tests

Extend the existing Node.js test suite.

Where practical, extract pure combat functions that can be tested independently from Phaser rendering.

At minimum, test:

1. Pursuer takes one energy hit and dies.
2. Sentinel survives one energy hit.
3. Sentinel dies after the second energy hit.
4. Ordinary robot dies instantly from an axe.
5. Armored robot resists ordinary energy damage while armored.
6. Axe removes armored robot's armor.
7. One energy hit destroys the exposed armored robot.
8. A destroyed robot cannot receive duplicate score awards.
9. Contact damage respects cooldown or invulnerability.
10. Laser damage is applied at most once per shot.
11. Laser warning precedes the damaging beam.
12. Shield value never becomes negative.
13. Shield depletion produces a single defeat transition.
14. Knockback interrupts and then releases movement correctly.
15. Pausing freezes AI and combat timers.
16. Developer seeking resets transient combat state.
17. Object cleanup removes expired effects and dead enemies.

Browser smoke tests should verify actual Arcade Physics collision behavior.

Do not pretend pure Node unit tests establish that Phaser physics interactions work in a real browser.

---

### 22. Manual Browser Verification

Run:

`npm run dev`

Verify:

1. START GAME opens GameScene correctly.
2. Both movement modes function.
3. Energy bolts collide with robots.
4. Pursuers die with one energy hit.
5. Sentinels require two hits.
6. Axe destroys ordinary robots.
7. Axe visibly removes armor.
8. Exposed armored robots die from an energy hit.
9. Pursuers approach Blackrush.
10. Sentinels display targeting lines and fire lasers.
11. Blackrush's shield decreases when hit.
12. Shield effects are visible.
13. Robot destruction looks satisfying.
14. Score updates correctly.
15. Shield depletion triggers the defeat behavior.
16. Pausing stops gameplay.
17. Seeking to the arena works.
18. Seeking back to the swarm works.
19. Victory and Replay remain reliable.
20. No browser console errors occur.

Check that the game remains responsive after several minutes of continuous firing and repeated robot destruction.

---

### 23. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- Robot types.
- Starting health and armor values.
- Weapon damage.
- Shield behavior.
- Laser warning mechanics.
- Knockback behavior.
- Combat scoring.
- Test encounter configuration.
- Developer combat controls.
- Combat state reset during seeking.
- Remaining Step 5 limitations.

Mark Step 5 complete only after implementation and verification.

---

### 24. Strict Scope Restrictions

Do not implement:

- Full music-based robot wave spawning.
- Dynamic encounter difficulty.
- Large robot swarms.
- Player shield pickups.
- Shield regeneration.
- Proxy boss combat.
- German soldier or grenade sequences.
- Panzer tank.
- Giant super-robot boss.
- Destructible environment geometry.
- Environmental collision response.
- Lorelei NPC.
- Police NPCs.
- Mobile touchscreen gameplay.
- Permanent upgrades.
- Radial shockwave.
- New music.
- Sound effects.
- Final sprite artwork.
- Online scoring.
- Backend services.

Do not modify the MP3 recordings.

Do not replace the existing timeline architecture.

Do not change working Classic or Assisted controls.

Avoid unrelated refactoring.

---

### 25. Definition of Done

Step 5 is complete when:

- Three robot archetypes are operational.
- Robots pursue or target Blackrush appropriately.
- Player weapons damage robots.
- Throwing axes destroy ordinary robots.
- Axes break armored robots' plating.
- Laser targeting and firing work.
- Shield damage functions.
- Robot contact damage functions.
- Robot destruction effects are visible and satisfying.
- Combat scoring works.
- Small test encounters are reproducible.
- Defeat behavior functions.
- Music pause freezes gameplay.
- Seeking resets combat state reliably.
- Classic and Assisted controls remain functional.
- Camera progression and boss arena behavior remain unchanged.
- No stale physics bodies or scene callbacks cause exceptions.
- Tests pass.
- Production build succeeds.

Provide a completion report describing:

1. New and modified files.
2. Robot AI architecture.
3. Damage and armor implementation.
4. Shield and laser mechanics.
5. Visual destruction effects.
6. Combat test encounter configuration.
7. Debug controls.
8. Test results.
9. Production build result.
10. Known limitations or remaining problems.

Stop after Step 5.

Do not begin Step 6 without explicit authorization.