# JUNIE TASK — LORELEI: DESCENT
## Step 6: Solid Obstacles, Environmental Cover, Robot Navigation, and Laser Interactions

### 1. Project context

We are developing **LORELEI: DESCENT**, a browser-based, top-down arcade shooter based on the Lorelei superhero novel.

Technology:

- JavaScript ES modules
- Phaser 3.88.2
- Phaser Arcade Physics
- Vite 8.3.4
- Node.js 24
- Logical resolution: 640 × 960

Steps 1 through 5.4 are implemented and tested.

The developer confirms that the game is now enjoyable and working correctly, including:

- Classic and Assisted movement.
- Energy bolts and throwing axes.
- Robot AI, targeting beams, and destructive lasers.
- Armored robots and destructible armor.
- Automatic musical descent.
- Fixed boss arena beginning at Synth 5:00.
- Six-heart survival system.
- Shield regeneration.
- Automatic respawning.
- Low-heart warning sounds.
- Game Over, Restart, Replay, and developer timeline seeking.

The developer has verified that all major features behave correctly.

**This task implements Step 6 only.**

Before changing code, inspect the existing project and documentation, especially:

- `src/scenes/GameScene.js`
- `src/systems/ChamberBuilder.js`
- `src/systems/DescentController.js`
- `src/entities/Blackrush.js`
- `src/entities/Robot.js`
- `src/entities/Projectile.js`
- `src/systems/WeaponSystem.js`
- `src/systems/CombatSystem.js`
- `src/controls/DesktopControls.js`
- `src/config/gameplayConfig.js`
- `src/config/combatConfig.js`
- `src/ui/TimelineDebugPanel.js`
- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`

Preserve the existing working implementation.

Do not introduce unnecessary dependencies or undertake broad architectural refactoring.

---

## 2. Primary objectives

Transform the currently decorative underground environment into a battlefield with solid obstacles and meaningful cover.

Implement:

1. Solid environmental collision geometry.
2. Player-to-obstacle collisions.
3. Robot-to-obstacle collisions.
4. Player projectile impacts against obstacles.
5. Sentinel targeting beams blocked by obstacles.
6. Destructive lasers blocked by obstacles.
7. Enemy friendly fire from lasers.
8. Simple robot obstacle navigation.
9. Assisted movement that handles collisions gracefully.
10. Collision-safe player respawning.
11. Developer visualization of collision geometry.
12. Minor low-heart warning and robot-spawn refinements.

Do not implement the full music-controlled enemy swarm. That belongs to Step 7.

### Design philosophy

Obstacles should provide tactical choices without making the game difficult to navigate.

The player should be rewarded for:

- Moving behind solid cover.
- Approaching robots from advantageous directions.
- Avoiding exposed areas.
- Using obstacles to interrupt enemy targeting.
- Luring robots into enemy laser fire.

The battlefield should remain open enough for fast, enjoyable combat.

Avoid maze-like layouts.

---

## 3. Environmental object types

Distinguish decorative objects from solid objects.

Suggested categories:

**Floor decorations**

Non-colliding objects, including seams, markings, stains, shadows, and decorative conduits.

**Solid structural obstacles**

Support columns, concrete blocks, heavy machinery, and industrial tanks.

**Perimeter walls**

Solid boundaries that prevent Blackrush or robots from leaving the intended battlefield.

**Future destructible objects**

Reserve architectural support for destructible environment objects, but do not implement environmental destruction yet.

Each obstacle definition should contain:

- Stable unique identifier.
- Obstacle type.
- World position.
- Dimensions.
- Whether solid.
- Collision geometry.
- Rendering parameters.

Keep obstacle definitions independent from their Phaser Graphics objects.

Collision boundaries should be driven by the same obstacle definitions used to position the visual representations.

---

## 4. ChamberBuilder architecture

Extend the existing deterministic ChamberBuilder.

The chamber is extremely long because its scrolling progression is synchronized to approximately five minutes of music.

Do not create tens of thousands of permanent physics bodies.

Use segmented or chunked world geometry.

Suggested chunk height:

960 world pixels, or another suitable configurable value.

Maintain solid obstacles only in the relevant active region around the camera.

As the camera descends:

- Create upcoming collision geometry.
- Keep currently relevant obstacles active.
- Retire collision geometry that is sufficiently far behind.
- Keep the visual and physics geometry synchronized.

The same musical timestamp should always produce the same obstacle positions.

Use deterministic generation or deterministic layout definitions.

Do not regenerate random collision geometry during repeated visits to the same timestamp.

The boss arena should have its own fixed obstacle layout.

---

## 5. Collision representation

Use Phaser Arcade Physics static bodies where appropriate.

Prefer simple rectangles for machinery, pillars, barriers, and walls.

Circular-looking tanks may use approximate rectangular physics bounds for now.

Do not attempt pixel-perfect collision detection.

Configure body dimensions to match the visible solid portion of each obstacle.

Keep collision geometry simple and reliable.

Avoid giving purely decorative details their own physics bodies.

Ensure recycled obstacles are properly disabled or destroyed before being reused.

Do not create duplicate physics bodies for the same active obstacle.

---

## 6. Blackrush collision behavior

Blackrush must no longer move through solid machinery or walls.

Use Phaser Arcade Physics collision resolution or another consistent approach integrated with the existing movement system.

Requirements:

- Blackrush stops when moving directly into an obstacle.
- Diagonal movement allows him to slide along obstacle edges.
- Moving around a corner feels responsive.
- He does not become stuck inside structural geometry.
- He cannot cross perimeter walls.
- Collision does not alter the mouse aiming direction.
- Collisions do not disable firing or axes.

Preserve movement acceleration, deceleration, and current speed settings.

Do not change the established control schemes.

### Music-driven camera constraint

The camera continues descending even when Blackrush is blocked by an obstacle.

Do not allow the camera to push Blackrush through solid geometry.

When the scrolling viewport forces Blackrush forward, reconcile his position against obstacles.

If the player becomes trapped against the upper camera boundary by an obstacle, resolve the situation safely.

Prefer a small collision-safe repositioning or an appropriate forward escape location over allowing the player to be pinned indefinitely.

Do not inflict unavoidable damage simply because the camera pushed Blackrush into a barrier.

Keep this behavior deterministic and testable.

---

## 7. Assisted movement and obstacles

The developer reports that Assisted mode has become particularly enjoyable and may eventually become the preferred default.

**Do not change the existing Assisted movement sensitivity, dead zone, or maximum speed.**

When Blackrush follows the mouse pointer:

- Solid obstacles should stop or redirect his physical movement.
- He should slide along obstacle edges where possible.
- The camera must continue descending.
- Mouse aiming remains independent of collision resolution.
- WASD override continues functioning.

A limited amount of simple steering around nearby obstacle corners is acceptable if it meaningfully improves usability.

However, do not implement sophisticated pathfinding for Blackrush.

Do not allow automatic steering to unexpectedly send him in the opposite direction from his pointer.

Do not introduce an Assisted-mode teleport or obstacle-jumping mechanic.

If the pointer is located beyond a solid obstacle, Blackrush may remain against the obstacle until the player moves the pointer around it.

That is acceptable for Version 1.

Preserve the existing pointer-outside-canvas behavior.

---

## 8. Robot environmental collisions

All three robot types must respect solid obstacles.

### Pursuer

- Chase Blackrush.
- Collide with obstacles.
- Slide or steer around them when possible.
- Avoid permanently pushing into the same wall.

### Sentinel

- Move toward a suitable firing position.
- Respect obstacle boundaries.
- Avoid firing through machinery.
- Reposition when its line of sight is blocked, where reasonably possible.

### Armored Pursuer

- Respect obstacle collisions.
- Continue to exhibit slower, heavier movement.
- Retain its armor-destruction behavior.

### Simple steering

Use a lightweight obstacle-avoidance technique.

Possible approaches include:

- Testing horizontal and vertical movement alternatives.
- Sliding along an obstacle edge.
- Choosing an unobstructed short-range steering direction.
- Briefly alternating movement directions if stuck.

Do not implement A* pathfinding, navigation meshes, or a generic pathfinding framework.

Prevent rapid direction oscillation around corners.

If a robot cannot find a route immediately, temporary obstruction is acceptable.

Avoid large CPU costs with many active robots.

---

## 9. Player projectiles and obstacles

Energy bolts and throwing axes must interact with solid objects.

### Energy bolts

On impact with a solid obstacle:

- Stop the projectile.
- Deactivate or recycle it.
- Display a small electrical spark.
- Do not damage a robot behind the obstacle.

### Throwing axe

On impact with a solid obstacle:

- Stop the projectile.
- Show a stronger metallic impact effect.
- Optionally display a brief recoil or spin effect.
- Recycle it afterward.

Do not implement ricochets yet.

Do not permit an axe to pass through walls.

### Collision priority

If a projectile could hit both an obstacle and a robot during one update, resolve the nearest valid impact along its movement path.

Do not allow a robot behind solid cover to be hit merely because a projectile overlaps it through an obstacle.

Avoid double-hit registration.

Test projectiles fired diagonally and at high speed.

Consider swept or segment-based collision checks if ordinary discrete Arcade Physics overlap detection produces visible tunneling.

Do not introduce a heavyweight physics library.

---

## 10. Sentinel targeting and solid cover

The Sentinel targeting system already displays warning beams before firing destructive lasers.

Extend it to account for solid obstacles.

A solid obstacle must block both:

- The visible targeting beam.
- The destructive laser.

The targeting line should terminate at the nearest solid obstacle along its path.

This provides immediate visual feedback that the object offers cover.

If Blackrush is behind the obstacle, the Sentinel cannot damage him through it.

Use a reusable ray-versus-obstacle intersection utility.

Do not merely hide the laser graphically while allowing damage to pass through.

Visual laser length and collision length must agree.

### Acquisition behavior

Preserve the existing warning and lock-on timing.

A Sentinel may acquire Blackrush even when cover interrupts its current line of sight, but its actual attack must respect the obstruction.

It may choose to reposition afterward.

Do not allow a blocked laser to become damaging because Blackrush moves behind cover after target acquisition.

---

## 11. Laser friendly fire

Implement the previously planned mechanic allowing Sentinels to damage other robots.

This should create opportunities for skillful positioning.

Rules:

- Sentinel lasers can damage other robots.
- A Sentinel cannot damage itself.
- Laser damage follows the ordinary robot damage system.
- Ordinary robots can be destroyed by friendly fire.
- Armored robots remain protected according to their established armor rules.
- Robots killed by friendly fire must be removed correctly.
- Friendly-fire destruction must not award Blackrush ordinary kill points by default.

If an enemy laser reaches a robot before reaching Blackrush, it should interact with that robot according to the beam's collision policy.

For Version 1, prefer a simple first-impact laser that stops when it hits its first solid obstacle or valid robot.

If a single beam can strike multiple robots, explicitly document the penetration rule and limit damage to once per target per shot.

Avoid accidental repeated damage every frame.

### Visual feedback

When a Sentinel destroys another robot:

- Display the ordinary robot destruction effect.
- Optionally display a small "FRIENDLY FIRE" development indicator.
- Avoid additional permanent HUD complexity.

Do not create a separate friendly-fire scoring system.

---

## 12. Boss arena cover

The fixed boss arena begins at Synth 5:00 and continues throughout Cathedral.

Add a recognizable arrangement of solid industrial cover.

Suggested elements:

- Two large support columns near the sides.
- Several machine blocks along the perimeter.
- Open central fighting space.
- A largely unobstructed lower area for future Proxy and giant boss entrances.

The center should remain open enough for Blackrush and a large boss to move.

Do not make the arena a narrow maze.

Keep all arena geometry deterministic.

Future versions may expand the arena horizontally or vertically.

Therefore, do not permanently couple obstacle geometry to the 640 × 960 visible viewport.

Separate arena world bounds from the current camera viewport.

Do not implement boss entities or larger camera movement yet.

---

## 13. Collision-safe respawning

The Step 5.4 survival system now automatically respawns Blackrush when he loses a heart.

Extend respawn location selection to consider solid obstacles.

A valid spawn location must:

- Be within the current playable camera area.
- Not overlap solid geometry.
- Not overlap a perimeter wall.
- Prefer reasonable distance from active robots.
- Avoid unnecessary teleportation if the original position remains safe.

Use a simple deterministic set of candidate positions.

If no ideal location exists, select the safest valid fallback position and rely on the existing invulnerability interval.

Do not spawn Blackrush inside machinery.

Do not modify the six-heart mechanic or shield regeneration values.

The soundtrack must continue uninterrupted during ordinary respawning.

---

## 14. Robot spawning refinements

The developer reports that development-tool spawned robots currently appear above Blackrush and sometimes scroll away almost immediately.

Adjust only the developer spawn behavior in this milestone.

When using a manual SPAWN ROBOT button:

- Spawn within the currently visible battlefield.
- Prefer a position below or beside Blackrush.
- Keep sufficient distance to avoid immediate contact damage.
- Choose a location outside solid obstacles.
- Ensure armored robots have room to approach and be attacked.
- Fall back to another visible location if the preferred position is blocked.

Use the current camera position and viewport bounds.

Do not rely on a fixed world Y coordinate.

Do not place every robot at the same location.

Ensure manual spawning works in both DESCENT and ARENA modes.

These changes are for test-spawn usability.

Do not implement the full music-driven spawning system yet.

---

## 15. Low-heart warning adjustment

The developer likes the existing procedural warning sound, but considers the interval too long.

Change the timing configuration:

- Two hearts remaining: repeat approximately every **4 seconds**.
- One heart remaining: repeat approximately every **2 seconds**.

Keep the existing sound character and general volume.

Use a warning-onset interval measured consistently from the beginning of each alert, rather than inadvertently adding the sound's duration to every interval.

Avoid overlapping warning tones.

Preserve:

- Pause handling.
- Session cleanup.
- Restart behavior.
- Musical synchronization.
- Browser audio restrictions.

Do not add new sound assets.

This should be a small configuration or scheduling change, not a new audio implementation.

---

## 16. Camera and timeline integration

Preserve:

- Synth 0:00–5:00: DESCENT.
- Synth 5:00–end: ARENA.
- Cathedral: ARENA.
- Studio: EndingScene.

Obstacle generation and physics must remain synchronized with the current camera position.

Developer seeking must correctly reconstruct the obstacle environment.

When seeking:

1. Clear obsolete active collision bodies.
2. Create the appropriate deterministic obstacle set.
3. Restore camera position.
4. Reposition Blackrush safely.
5. Rebuild current test encounters.
6. Restore projectiles and transient combat state according to existing seek semantics.

The exact operation order may differ if required by the code, but the resulting state must be internally consistent.

Do not allow player or robot physics bodies to become embedded in obstacles after seeking.

Do not duplicate static collision bodies during repeated seeks.

Preserve the centralized mission lifecycle implemented in Step 5.3.

---

## 17. Developer collision visualization

Add an optional development-only collision overlay.

Suggested controls:

- SHOW COLLISION BOUNDS.
- HIDE COLLISION BOUNDS.

Display:

- Solid obstacle hitboxes.
- Blackrush hitbox.
- Robot hitboxes.
- Optionally projectile hitboxes.
- Optionally laser rays and their collision endpoints.

The overlay must not interfere with collision detection or pointer input.

It should update correctly during camera scrolling.

Hide it in normal gameplay.

Preserve the existing developer timeline and survival controls.

---

## 18. Collision performance

The full game will eventually contain many robots.

Avoid testing every robot against every obstacle in the entire underground complex.

Use Phaser's physics collision system or localized spatial checks.

Keep only nearby obstacle bodies active.

Avoid expensive per-frame geometry construction.

Use reusable ray-intersection helpers.

Keep collision visualizations disabled in production.

Ensure that destroyed robots and inactive projectiles are excluded from unnecessary collision processing.

Target smooth 60 FPS gameplay with approximately 30 active robots on a typical desktop browser.

Do not prematurely build a large generalized physics architecture.

---

## 19. Automated regression tests

Extend the existing Node.js test suite with pure geometry and collision-related tests where practical.

At minimum, verify:

1. Blackrush cannot pass through a solid rectangle.
2. Blackrush slides along a wall when moving diagonally.
3. Perimeter walls prevent leaving the playable region.
4. A blocked player projectile cannot damage a robot behind cover.
5. A projectile strikes the nearest obstacle along its path.
6. A laser ray stops at the nearest solid obstacle.
7. A blocked laser cannot damage Blackrush.
8. An unobstructed laser can damage Blackrush.
9. Laser friendly fire damages a valid robot.
10. The firing Sentinel cannot damage itself.
11. A single laser shot cannot repeatedly damage the same target.
12. Friendly-fire kills do not award ordinary player kill points.
13. Armored robots retain appropriate armor resistance.
14. Deterministic chamber reconstruction produces identical obstacles.
15. Recycled obstacle segments do not duplicate physics bodies.
16. Arena geometry remains fixed across the Synth/Cathedral transition.
17. Seeking restores correct collision geometry.
18. Respawn placement does not overlap solid obstacles.
19. Manual robot spawning produces visible, valid positions.
20. Assisted movement continues to obey keyboard override.
21. Low-heart warnings follow the new configured intervals.
22. Restart restores a valid obstacle and combat state.

Use the actual application configuration and reusable geometry functions.

Do not merely test copies of formulas.

---

## 20. Browser acceptance tests

After implementation, perform browser testing where available.

### Test A — Player collision

- Start a new mission.
- Move Blackrush toward machinery.
- Confirm he cannot pass through it.
- Move diagonally against the machinery.
- Confirm he can slide along its edge.
- Repeat in Assisted mode.
- Confirm controls remain responsive.

### Test B — Cover

- Place Blackrush behind a support column.
- Allow a Sentinel to target him.
- Confirm the targeting line stops at the column.
- Confirm the destructive laser stops at the column.
- Confirm the shield takes no damage.
- Move out of cover.
- Confirm lasers can damage Blackrush again.

### Test C — Projectile impacts

- Fire energy bolts into machinery.
- Confirm they stop and produce impact effects.
- Throw an axe into a solid obstacle.
- Confirm it does not pass through.
- Attack a robot behind cover.
- Confirm the obstacle blocks the attack.

### Test D — Friendly fire

- Position a Pursuer between Blackrush and a Sentinel.
- Allow the Sentinel to fire.
- Confirm the Pursuer can be damaged or destroyed.
- Confirm ordinary player kill points are not awarded for that destruction.

### Test E — Scrolling and arena

- Play through the descending chamber.
- Confirm no repeated or missing collision segments.
- Jump to Synth 5:00.
- Confirm fixed arena cover appears.
- Jump to Cathedral.
- Confirm arena geometry stays unchanged.
- Jump backward to CHASE.
- Confirm geometry is reconstructed properly.

### Test F — Survival and restart

- Take damage.
- Confirm shield bar and numerical value agree.
- Confirm regeneration still works.
- Lose a heart.
- Confirm Blackrush respawns outside obstacles.
- Lose the final heart.
- Restart.
- Confirm player, robots, obstacles, and music return correctly.
- Repeat a restart cycle.

### Test G — Developer tools

- Spawn each robot archetype.
- Confirm it appears visibly and accessibly.
- Toggle collision bounds.
- Seek among tracks.
- Confirm no console errors or stale physics bodies.

Test both Classic and Assisted movement.

If browser automation is unavailable, provide explicit manual testing instructions without claiming that browser verification was performed.

---

## 21. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- Obstacle categories.
- Static collision geometry.
- Chunk loading and unloading.
- Robot obstacle avoidance.
- Player collision behavior.
- Projectile blocking.
- Laser line-of-sight behavior.
- Friendly-fire rules.
- Respawn safety.
- Developer collision visualization.
- Updated low-heart warning cadence.
- Known limitations.

Record the actual test results.

---

## 22. Scope restrictions

Do not implement:

- Music-controlled robot swarms.
- Dynamic difficulty progression.
- New robot archetypes.
- Destructible walls or machinery.
- Advanced pathfinding.
- Complex environmental puzzles.
- Proxy boss mechanics.
- Super-robot boss.
- Panzer.
- German soldier.
- Grenade interaction.
- Lorelei companion.
- Police NPCs.
- Mobile controls.
- Final artwork.
- New background music.
- New sound-effect assets.
- New player weapons.
- Shield pickups.
- Bonus hearts.

Do not change the existing music cue times.

Do not alter working Classic or Assisted movement sensitivities.

Do not rebalance the existing weapon damage.

Preserve all established survival and mission lifecycle behavior.

---

## 23. Definition of done

Step 6 is complete when:

- Blackrush collides correctly with solid obstacles.
- Robots collide with obstacles.
- Basic robot obstacle navigation works.
- Energy bolts and axes are blocked by solid cover.
- Sentinel targeting and destructive beams stop at obstacles.
- Cover provides real protection.
- Sentinel lasers can damage other robots.
- Friendly fire behaves consistently.
- Chamber collision geometry loads efficiently.
- Fixed arena obstacles are present.
- Assisted movement remains functional.
- Respawning avoids solid objects.
- Developer robot spawns occur in useful visible positions.
- Low-heart warning intervals are shortened.
- Developer collision visualization works.
- Musical seeking reconstructs the correct environment.
- Mission restart remains stable.
- All existing survival and combat behavior remains functional.
- Automated tests pass.
- Production build succeeds.

Provide a completion report with:

1. Exact files created or changed.
2. Collision architecture.
3. Obstacle generation and recycling.
4. Robot navigation behavior.
5. Laser obstruction implementation.
6. Friendly-fire behavior.
7. Respawn and debug-spawn changes.
8. Warning cadence changes.
9. Automated test results.
10. Browser verification results.
11. Any remaining problems or limitations.

Stop after Step 6.

Do not begin Step 7 without explicit authorization.