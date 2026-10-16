# JUNIE TASK — LORELEI: DESCENT
## Step 4: Player Movement, Mouse Aiming, Weapons, and Music-Synchronized Descent

### 1. Project Context

We are developing LORELEI: DESCENT, a browser-based, top-down arcade shooter based on the Lorelei novel series.

Technology:

- JavaScript ES modules
- Phaser 3.88.2
- Vite 8.3.4
- Node.js 24
- Logical resolution: 640 × 960
- Portrait-oriented gameplay

Steps 1, 2, 3, and 3.1 are complete.

The application currently has:

- A working title screen.
- A static underground chamber.
- A Blackrush placeholder sprite.
- Robot placeholders.
- A heads-up display.
- Three original musical recordings.
- A persistent AudioDirector and TimelineDirector.
- A functioning developer timeline panel.
- Reliable timeline-based scene transitions.
- Correct canvas centering.
- Scene lifecycle cleanup.

The music-driven system has been tested and is working.

Before making changes, inspect the existing code and documentation.

Pay particular attention to:

- `src/main.js`
- `src/config/gameConfig.js`
- `src/config/timeline.js`
- `src/scenes/GameScene.js`
- `src/entities/Blackrush.js`
- `src/entities/Robot.js`
- `src/systems/ChamberBuilder.js`
- `src/systems/AudioDirector.js`
- `src/systems/TimelineDirector.js`
- `src/ui/Hud.js`
- `src/ui/TimelineDebugPanel.js`
- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`

**Implement Step 4 only. Do not begin Step 5.**

### 2. Primary Objective

Transform the static chamber demonstration into an interactive shooting and movement prototype.

The player should be able to:

1. Move Blackrush with WASD or arrow keys.
2. Aim independently with the mouse pointer.
3. Fire rapid energy bolts by holding the left mouse button.
4. Throw a spinning axe with the right mouse button.
5. Watch the underground chamber gradually scroll downward.
6. Move tactically within the visible playing field while automatic descent continues.
7. Use the developer timeline controls to jump between musical phases.
8. Pause and resume gameplay along with the soundtrack.

Robots should remain inactive placeholders.

Do not implement enemy AI, damage, or combat collisions yet.

The main emphasis is on responsive, satisfying movement and weapon behavior.

### 3. Coordinate and Camera Architecture

Our established coordinate system is:

- Positive X points right.
- Positive Y points downward.
- Increasing world Y represents descent into the Gamora complex.
- World coordinates are independent of screen coordinates.
- The HUD remains fixed to the viewport.

Preserve these conventions.

Use Phaser's main camera for the vertically scrolling environment.

Blackrush and projectiles exist in world coordinates.

HUD and developer controls remain independent of camera movement.

Do not simulate scrolling by manually moving every environment object upward.

Instead, implement camera scrolling using `camera.scrollY`.

The camera must not rotate.

The game retains the 640 × 960 logical viewport.

### 4. Music-Synchronized Automatic Descent

This requirement is particularly important.

The musical timeline determines how far the player has descended.

The camera's target vertical position must be derived from the authoritative musical playback position, not from accumulated frame delta.

Implement a reusable system such as:

`src/systems/DescentController.js`

The controller should calculate the intended camera position using:

- Current musical track.
- Local playback position.
- Global musical elapsed time.
- Configurable descent parameters.

For the first prototype, use a constant descent rate during Synth and Cathedral.

Suggested initial rate:

**75 world pixels per second.**

Treat this as a tunable parameter, not a final decision.

The total travel depth over ten minutes would therefore be much larger than the existing 3000-pixel chamber.

Update or extend ChamberBuilder to support sufficient environment depth.

Prefer deterministic, reusable environment generation over allocating thousands of individual decorative objects.

The chamber may use repeating floor sections, recycled segments, or other efficient techniques.

Avoid creating the entire six-hundred-second environment as thousands of permanent Phaser graphics objects.

The scrolling behavior must work correctly when the developer jumps to any musical position.

For example:

- Seeking to Synth 3:00 shows the appropriate chamber depth.
- Seeking to Synth 5:30 advances farther.
- Seeking to Cathedral 2:00 advances deeper still.
- Seeking backward restores the earlier depth.

The chamber should be deterministic: revisiting the same timestamp should show the same basic environment layout.

Small decorative variations are acceptable only if deterministic.

### 5. Track Boundaries

Synth lasts approximately 362 seconds.

Cathedral lasts approximately 241 seconds.

These are rounded durations; use the actual detected track durations when calculating global elapsed time.

Studio is the ending track.

Automatic descent occurs during Synth and Cathedral only.

When Studio begins, the game switches to EndingScene as established in Step 3.

Do not continue moving the gameplay camera during Studio.

Use the existing TimelineDirector and AudioDirector APIs rather than introducing a parallel timing implementation.

Avoid duplicating the global timeline calculations.

### 6. Scrolling and Player Position

Blackrush can move independently of automatic camera descent.

The environment scrolls downward relative to the player.

The player must remain within a safe visible region of the screen.

Recommended boundaries:

- Left: approximately 45 logical pixels.
- Right: approximately 595 logical pixels.
- Top: approximately 110 logical pixels, below the HUD.
- Bottom: approximately 900 logical pixels.

Use these as initial tunable values.

The HUD must never obscure Blackrush.

The player should not be able to escape the screen by moving upward faster than the camera scrolls.

When the camera advances and Blackrush reaches the upper visible boundary, the player's world Y should be carried forward with the camera.

This represents the game forcing Blackrush to continue descending.

However, Blackrush should retain freedom to move up and down within the viewport.

Do not permanently lock the player to the screen center.

The player should be able to retreat toward the upper boundary or advance toward the bottom.

The camera is not controlled by Blackrush's position.

It is controlled by the musical timeline.

### 7. Blackrush Movement

Extend the existing `src/entities/Blackrush.js` implementation.

Movement controls:

- W / Up Arrow: move upward.
- S / Down Arrow: move downward.
- A / Left Arrow: move left.
- D / Right Arrow: move right.

Support simultaneous movement in two axes.

Normalize diagonal movement so that moving diagonally is not faster than moving horizontally or vertically.

Use frame-rate-independent movement.

Suggested starting movement speed:

**260 logical pixels per second.**

Introduce modest acceleration and deceleration.

Suggested initial values:

- Acceleration: 1600 pixels/second².
- Deceleration: 2000 pixels/second².
- Maximum speed: 260 pixels/second.

These are initial values and should be centralized in gameplay configuration.

Movement should feel responsive and arcade-like, not sluggish.

Do not create complicated inertia or momentum physics.

Use Phaser Arcade Physics if it is appropriate, but avoid unnecessary physics abstractions.

Avoid implementing collision response with chamber obstacles in this milestone; that belongs to Step 6.

### 8. Movement Input Architecture

Create:

`src/controls/DesktopControls.js`

This module should translate keyboard and mouse input into an input state that Blackrush can consume.

Keep input acquisition separate from movement and weapon mechanics.

The control state should represent concepts such as:

- Horizontal movement direction.
- Vertical movement direction.
- Aim world position.
- Primary weapon held.
- Secondary weapon triggered.

The Blackrush entity should not need to know whether a command originated from a keyboard, mouse, touchscreen, or eventual gamepad.

Keep the interface simple and documented.

Do not implement the full MobileControls module yet.

However, the architecture should allow mobile input to produce equivalent gameplay commands in Step 14.

### 9. Mouse Aiming

Blackrush should face the mouse pointer independently of movement.

The pointer must be translated into world coordinates correctly, accounting for the moving camera and scaled canvas.

Do not assume screen coordinates and world coordinates are identical.

Use Phaser's camera-aware pointer coordinate conversion.

Show a simple directional aiming indicator extending from Blackrush.

Do not rotate the entire player sprite if doing so makes the placeholder appear unnatural.

Instead, rotate a small weapon-direction indicator or equivalent visual element.

Keep the Blackrush body approximately upright in this overhead presentation.

The aim direction should update smoothly as the mouse moves.

When the mouse is extremely close to Blackrush, preserve the last valid aim direction to avoid jitter or undefined vectors.

The aiming indicator should be subtle but clearly visible.

### 10. Energy Weapon

Implement Blackrush's primary energy weapon.

Holding the left mouse button fires a continuous stream of energy bolts.

Suggested initial firing rate:

**7 shots per second.**

Suggested projectile speed:

**650 logical pixels per second.**

Suggested projectile lifetime:

**1.2 seconds.**

Use bright cyan or electric blue placeholders for energy bolts.

The projectiles should have:

- A bright central core.
- A slightly larger translucent glow.
- A short motion trail, if reasonably inexpensive.
- A clearly visible forward direction.

Keep the initial effects simple.

Do not download graphics or introduce particle-effect libraries.

Projectile direction must match the aim direction at the instant of firing.

Projectiles continue moving independently after they are fired.

The player should be able to move and fire simultaneously.

Use a small muzzle flash on each shot.

A very subtle recoil or firing pulse is acceptable.

Do not implement robot damage.

Projectiles should pass through robot placeholders for now.

Do not implement destructible obstacles.

Projectiles expire when their lifetime ends or they leave the active world region.

### 11. Throwing Axe

Implement Blackrush's secondary throwing weapon.

The player throws an axe using the right mouse button.

Prevent the browser context menu from appearing over the gameplay canvas.

Suggested initial parameters:

- Projectile speed: 420 pixels/second.
- Lifetime: 1.5 seconds.
- Cooldown: 2.0 seconds.
- Placeholder size: approximately 24–32 pixels.

The axe should look visually distinct from energy bolts.

Use a simple procedural shape with a handle and two opposing axe blades.

Rotate the axe continuously while it travels.

The direction of travel should be determined by the aim vector at the moment of throwing.

For the initial prototype, the axe travels in a straight line.

Do not implement boomerang behavior, ricochets, penetration, or knockback yet.

The axe should disappear when its lifetime expires or it leaves the active region.

The HUD should show AXE: READY when available and a meaningful recharge status while unavailable.

Cooldown progression should pause when gameplay is paused.

Avoid relying on unrelated wall-clock timers for weapon cooldowns.

### 12. Projectile Architecture

Create reusable projectile modules in:

`src/entities/Projectile.js`

And, if useful:

`src/systems/WeaponSystem.js`

Do not introduce a complicated class hierarchy.

A small data-driven projectile system should support both the primary energy bolt and throwing axe.

The system should eventually support:

- Damage values.
- Projectile collision.
- Knockback.
- Impact effects.
- Enemy ownership.
- Different attack types.

Those features are not required in Step 4.

Keep projectiles separate from input management.

Use pooling if appropriate, particularly for rapid energy-bolt firing.

Ensure unused projectiles are cleaned up or returned to a pool.

Projectiles must not accumulate indefinitely during the six-minute Synth sequence.

### 13. Weapon Timing and Audio Pause

The music is the authoritative gameplay clock.

Weapon cooldowns and gameplay progression must pause when the music pauses.

Do not allow Blackrush to move or fire during a paused timeline.

Do not implement cooldowns using untracked JavaScript timers that continue during pause.

A clean implementation could derive cooldown progression from the active gameplay clock or maintain timers that are explicitly governed by the same pause state.

Account for developer seeking.

Important distinction:

- The musical timeline is authoritative for scripted world progression.
- Local weapon cooldown state should remain mechanically reasonable after seeking.

Do not rewind an entire history of fired projectiles when seeking backward.

For developer seeks, reset temporary combat objects and reinitialize weapon cooldowns to a consistent ready state.

This makes testing easier and prevents stale projectiles from appearing in unrelated musical phases.

### 14. Seek and Scene Lifecycle Integration

The developer panel already supports jumping among:

- CHASE
- SWARM
- PROXY
- SUPER-ROBOT
- PANZER events
- VICTORY

All existing timeline controls must continue working.

When seeking within GameScene:

1. Update the camera to the correct world depth.
2. Reconcile Blackrush's world position with the new camera position.
3. Reset temporary projectiles.
4. Reset transient weapon effects.
5. Keep input responsive.
6. Display the correct musical phase.

When seeking from EndingScene back to a gameplay track:

- GameScene should become active.
- Blackrush should be created correctly.
- The chamber should display the appropriate depth.
- The player should regain movement and firing controls.
- No duplicate listeners or input subscriptions should accumulate.

When seeking from GameScene into Studio:

- Transition to EndingScene.
- Clean up GameScene controls and temporary objects.
- Preserve global TimelineDirector and AudioDirector functionality.

Respect the lifecycle management improvements made in Step 3.1.

Do not reintroduce stale listeners or destroyed HUD references.

### 15. ChamberBuilder Improvements

The existing chamber is approximately 3000 pixels tall.

Extend its rendering system to support a substantially longer descent.

We want the underground chamber to feel industrial and atmospheric.

Continue using geometric primitives.

Suggested elements:

- Dark metal floor panels.
- Subtle grid lines.
- Industrial machinery.
- Support columns.
- Tanks and conduits.
- Occasional structural variations.

Do not create a maze.

For now, obstacles are decorative and non-colliding.

The environment should appear continuous during forward scrolling.

Do not generate excessive objects or expensive geometry on every frame.

Prefer recyclable segments or deterministic procedural construction.

Keep environmental data separate from rendering where practical.

Do not introduce external art assets.

### 16. HUD Improvements

Update `src/ui/Hud.js` as necessary.

Continue displaying:

- Shield: 100%.
- Energy weapon status.
- Axe readiness or recharge.
- Score: 0.
- Current musical phase.

Shield and score remain unchanged in this milestone.

The energy weapon can display READY or FIRING.

The axe status should reflect its cooldown.

The HUD must remain fixed in the viewport while the camera scrolls.

Do not allow HUD objects to participate in world scrolling.

### 17. Development Diagnostics

Enhance the existing developer tools where practical.

Add read-only indicators for:

- Camera scrollY.
- Blackrush world X/Y.
- Blackrush screen X/Y.
- Current movement speed.
- Number of active energy projectiles.
- Number of active axes.

Do not overload the existing timeline panel with unnecessary complexity.

A collapsible technical section is acceptable.

Keep the controls and indicators disabled or hidden in normal production mode.

### 18. Performance

Target smooth gameplay at 60 FPS on a typical desktop browser.

Use frame-rate-independent movement.

Avoid unbounded growth of game objects.

The rapid-fire energy weapon must remain efficient during several minutes of continuous firing.

Do not rebuild the entire chamber every frame.

Do not perform unnecessary texture generation during each shot.

Create placeholder textures once and reuse them.

Minimize temporary allocations inside the main update loop where practical.

### 19. Testing Requirements

Use the existing Node.js test infrastructure where possible.

Add deterministic unit tests for:

1. Movement vector normalization.
2. Player movement bounds.
3. Camera depth calculations for musical timestamps.
4. Camera depth calculations at track boundaries.
5. Camera restoration after seeking.
6. Projectile direction calculations.
7. Projectile lifetime expiration.
8. Axe cooldown behavior.
9. Gameplay pause behavior.
10. Transient state reset after developer seeking.

Pure movement, timing, and coordinate calculations should be testable without running the entire Phaser renderer.

Browser smoke tests should verify:

- WASD movement.
- Arrow-key movement.
- Diagonal speed normalization.
- Mouse aiming.
- Continuous energy firing.
- Right-click axe throwing.
- Axe cooldown.
- Automatic descent.
- Pause and resume.
- Jumping among musical phases.
- No console exceptions after entering and leaving Victory.

If automated browser testing is unavailable, provide manual verification instructions.

### 20. Documentation

Update:

- `docs/DEVELOPMENT.md`
- `docs/GAME_DESIGN.md`
- `README.md`

Document:

- Desktop controls.
- Movement configuration values.
- Projectile configuration values.
- Automatic descent calculation.
- Camera/player coordinate conventions.
- How developer seeking interacts with gameplay.
- Known Step 4 limitations.

Mark Step 4 as completed only after implementation and verification.

### 21. Strict Scope Restrictions

Do not implement:

- Robot AI.
- Robot movement.
- Robot attacks.
- Robot damage or death.
- Enemy spawning.
- Enemy projectiles.
- Shield depletion.
- Health or lives.
- Collision response with obstacles.
- Actual boss battles.
- Proxy combat mechanics.
- Panzer firing.
- Grenade interaction.
- Lorelei NPC behavior.
- Police NPCs.
- Radial shockwave.
- Mobile touch controls.
- External artwork.
- New music.
- Sound effects.
- Complex particle systems.
- Online scores.
- Backend services.

The existing music tracks must remain unchanged.

The musical timeline and event cue configuration must remain intact.

### 22. Definition of Done

Step 4 is complete when:

- Blackrush moves smoothly with WASD and arrow keys.
- Diagonal speed is normalized.
- Blackrush aims independently with the mouse.
- Holding left-click fires continuous energy bolts.
- Right-click throws a spinning axe.
- Weapon cooldowns work.
- The camera descends based on the musical timeline.
- The chamber extends continuously through gameplay.
- The player remains within visible screen boundaries.
- Projectiles are cleaned up correctly.
- Pausing the music pauses gameplay.
- Developer seeking correctly restores the camera and temporary gameplay state.
- Victory and Replay transitions remain reliable.
- No destroyed scene objects receive callbacks.
- Unit tests pass.
- Production build succeeds.
- Documentation is updated.

Provide a completion report summarizing implementation, controls, configuration, tests, build results, and any known limitations.

Stop after completing Step 4.

Do not proceed to Step 5 without explicit authorization.