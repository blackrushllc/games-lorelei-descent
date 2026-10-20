# JUNIE TASK — LORELEI: DESCENT
## Step 9.5: PixelLab Asset Compiler and Animated Blackrush/Pursuer Integration

### 1. Project context

LORELEI: DESCENT is a Phaser 3.88.2 browser arcade shooter using JavaScript ES modules, Vite, and Phaser Arcade Physics.

Steps 1 through 9 have established functioning gameplay, including:

- Blackrush movement with Classic and Assisted controls.
- Independent mouse aiming.
- Energy bolt firing and magical axe throwing.
- Three robot archetypes.
- Music-driven encounters and swarms.
- Environmental obstacles and collision.
- Hearts, shields, respawning, and pickups.
- A responsive 1280-pixel-wide world.
- The Proxy boss, soldier, and grenade prototype.
- Timeline seeking, restarting, and scene transitions.

We are now introducing actual PixelLab character artwork.

**This is a rendering and asset-pipeline milestone. Do not change existing gameplay balance or develop new game mechanics.**

The developer creates original sprites using PixelLab and has manually organized their exported PNGs into a normalized directory structure.

The purpose of this task is to compile those assets into efficient Phaser-compatible texture atlases and integrate animated representations for only:

1. Blackrush.
2. The Pursuer robot.

Lorelei's artwork already exists, but she must not become a gameplay entity during this milestone.

### 2. Existing source directory structure

The original PNG assets are located under:

```text
public/assets/source/pixellab/
    blackrush/
        idle/
        walk/
        run/
        force-idle/
        force-walk/
        force-run/
        axe-ready/
        axe-throw/

    lorelei/
        idle/
        walk/

    robots/
        persuer/
            idle/
            walk/
            attack/
```

**Important:** The actual source directory currently uses `persuer`, not `pursuer`.

Do not silently rename, relocate, or delete the developer's source files.

Normalize this spelling in the generated game-facing asset identity to `pursuer`, matching the existing game robot type `PURSUER`.

Provide an explicit configurable source-path mapping.

Each animation uses eight directions:

```text
north
north-east
east
south-east
south
south-west
west
north-west
```

Static rotational sets consist of:

```text
idle/
    north.png
    north-east.png
    ...
```

Animated sets consist of:

```text
walk/
    north/
        frame_000.png
        frame_001.png
        ...
    north-east/
        frame_000.png
        frame_001.png
        ...
```

Animation frame counts may vary. Some sets contain seven frames; others contain eight.

Do not assume uniform animation length.

The developer reports that previously missing direction files have been added.

Audit the actual filesystem before making assumptions about completeness.

### 3. Canonical animation names

Use these names throughout the game-facing asset pipeline.

**Blackrush**

```text
idle
walk
run
force-idle
force-walk
force-run
axe-ready
axe-throw
```

**Pursuer**

```text
idle
walk
attack
```

**Lorelei — future integration**

```text
idle
walk
```

The compiler should support additional characters and animation sets later without requiring a rewrite.

Do not depend on PixelLab's original exported animation names if they differ from this vocabulary.

The normalized directory structure is authoritative.

### 4. Stage A — Build the CLI compiler

Implement a repeatable command-line asset compiler.

Suggested entry point:

```text
scripts/assets/compile-sprites.mjs
```

Use Node.js and an established image-processing library suitable for transparent PNG composition, such as `sharp`.

Add the dependency appropriately to the project.

Do not require a system-installed graphics application or platform-specific binary.

The developer works on Windows and may also build on Linux.

Add npm scripts such as:

```json
{
  "scripts": {
    "sprites": "node scripts/assets/compile-sprites.mjs",
    "sprites:check": "node scripts/assets/compile-sprites.mjs --check"
  }
}
```

Adapt the exact commands to the existing `package.json` conventions.

Support at least:

- Compile all configured characters.
- Compile one character.
- Validate without writing output.
- Print a useful summary of generated atlases, frame counts, and warnings.

Example invocation:

```bash
npm run sprites
npm run sprites -- --character blackrush
npm run sprites:check
```

Do not modify the source PNGs.

### 5. Compiler configuration

Create a small compiler configuration, such as:

```text
scripts/assets/sprite-config.mjs
```

It should identify:

- Canonical character ID.
- Source directory.
- Generated output directory.
- Required animation sets.
- Required eight directions.
- Animation playback FPS.
- Looping versus one-shot behavior.
- Optional animation fallback rules.
- Intended sprite display scale.

Suggested initial defaults:

```javascript
{
  blackrush: {
    source: 'blackrush',
    animations: {
      idle: { fps: 1, loop: false },
      walk: { fps: 10, loop: true },
      run: { fps: 14, loop: true },
      'force-idle': { fps: 1, loop: false },
      'force-walk': { fps: 10, loop: true },
      'force-run': { fps: 14, loop: true },
      'axe-ready': { fps: 8, loop: true },
      'axe-throw': { fps: 18, loop: false }
    }
  }
}
```

These are starting values, not permanently fixed animation speeds.

The developer should be able to adjust them without editing the compiler's packing algorithm.

The output must remain deterministic.

### 6. Asset validation

The compiler must validate:

1. Character source directory exists.
2. Animation directory exists.
3. All eight expected directions are present.
4. At least one valid frame is available per required direction.
5. PNG files are valid and readable.
6. Frame dimensions are compatible with the configured character specification.
7. Frame numbering is sequential when using `frame_NNN.png`.
8. No duplicate frame names occur.
9. Transparent backgrounds are preserved.
10. No unexpected filenames are silently treated as animation frames.

Use the actual PNG dimensions as evidence.

The developer's current PixelLab art is expected to be 48 × 48 pixels, but do not silently resize incompatible assets.

Report dimension mismatches.

A missing direction should produce a clear diagnostic, for example:

```text
[SPRITES] blackrush/axe-throw/north-east:
Missing required direction
```

Support an optional explicit fallback mechanism for incomplete future assets.

However, do not silently substitute another direction without reporting it.

For the initial Blackrush and Pursuer integration, require complete eight-direction coverage.

### 7. Atlas generation

Generate Phaser-compatible texture atlases rather than one giant rigid spritesheet.

Preferred output:

```text
public/assets/sprites/
    blackrush/
        blackrush.png
        blackrush.json

    robots/
        pursuer/
            pursuer.png
            pursuer.json

    manifest.json
```

If a character's complete atlas exceeds practical texture limits, support multiple atlas pages with an appropriate Phaser-compatible multiatlas manifest instead.

Never silently truncate, omit, or resize frames merely to fit one atlas.

Each frame should have a stable, descriptive identifier, for example:

```text
idle_south_000
walk_north-east_003
force-run_west_007
axe-throw_south_004
```

The atlas metadata must contain the correct packed rectangle for each source frame.

Preserve transparency.

Use deterministic frame ordering and packing.

Avoid unnecessary image filtering.

Do not scale the original pixels during atlas compilation.

If trimming transparent borders is supported, it must preserve sprite positioning consistently across animation frames. For the first implementation, untrimmed 48 × 48 frames are preferable to prevent character jitter.

Use sufficient padding between frames to avoid texture bleeding.

### 8. Generated animation manifest

Generate a separate normalized animation manifest containing the relationship between:

- Character.
- Atlas key and filename.
- Animation state.
- Direction.
- Ordered frame identifiers.
- Frame rate.
- Looping policy.
- Display scale.
- Original frame dimensions.

For example:

```json
{
  "character": "blackrush",
  "frameWidth": 48,
  "frameHeight": 48,
  "animations": {
    "walk": {
      "north": [
        "walk_north_000",
        "walk_north_001"
      ]
    }
  }
}
```

The actual schema may be more detailed.

It must be sufficient for the runtime to create Phaser animations automatically.

Do not require maintaining a second hand-written list of animation frame IDs.

The game must use the generated manifest instead of duplicating frame mappings manually.

### 9. Rebuild behavior

Running the compiler repeatedly with unchanged inputs should produce equivalent output.

Do not accumulate duplicate atlas entries.

Do not leave obsolete generated files that conflict with current manifests.

Handle changed or removed source frames correctly.

Preserve source files.

Provide clear diagnostics for which characters were compiled and how many frames were processed.

Avoid modifying unrelated assets.

### 10. Stage A validation

Before changing GameScene, Blackrush, or Robot rendering:

- Run the compiler.
- Run validation.
- Confirm both atlases are generated.
- Confirm all expected animations and directions exist.
- Confirm generated metadata refers to real atlas rectangles.
- Verify transparent pixels remain transparent.
- Verify output images are readable.
- Check representative frames visually if practical.

If compilation fails, repair the compiler or report missing source assets before proceeding.

**Do not begin Stage B until Stage A passes.**

---

## STAGE B — Phaser Animation Integration

### 11. Generic animation loader

Implement a small reusable runtime loader, such as:

```text
src/systems/SpriteAnimationRegistry.js
```

Its responsibilities:

- Load generated atlas assets and animation metadata.
- Register directional Phaser animations.
- Resolve animation keys.
- Provide consistent fallback behavior.
- Avoid registering duplicate animations after scene restarts.

Load textures in the existing appropriate asset-loading scene, likely BootScene.

Do not load hundreds of individual source PNGs during gameplay.

Runtime loading should use the compiled atlas files.

Ensure the registry can later support Lorelei, Sentinel, Armored Pursuer, and both bosses.

Do not implement those additional integrations now.

### 12. Keep physics separate from sprites

This is a strict architectural rule.

The existing Blackrush and Robot entities already have working movement, collision, targeting, health, and combat behavior.

**Do not replace or rebuild those systems merely to display pixel art.**

Attach or substitute a visual Phaser sprite that follows the entity's existing physics position.

If the existing entity architecture supports using a Sprite as the physics owner, use that appropriately. Otherwise, a separate visual sprite following an invisible physics body may be safer.

Do not change physics hitboxes to match extended arms, capes, or weapons in animation frames.

Preserve the existing collision size and origin unless there is a confirmed alignment defect.

Weapon origin calculations must remain correct.

Laser targeting must still target the appropriate player world position.

Do not make sprite animation transitions modify the Arcade Physics body size.

### 13. Pixel-art rendering

Use crisp nearest-neighbor rendering.

Disable smoothing for pixel sprites.

Use integer-friendly scaling where feasible.

Start with a configurable display scale, such as 2× for 48-pixel art, and adjust based on how the sprites compare with the existing chamber and robot dimensions.

Keep sprite scaling independent of game-world physics and camera scaling.

Do not introduce blurry filtering.

Avoid per-frame sprite creation or destruction.

### 14. Direction selection

Use the eight directions:

```text
N, NE, E, SE, S, SW, W, NW
```

Implement a reusable helper that quantizes a world-space vector into the nearest 45-degree direction.

For Blackrush:

- When actively aiming or firing, prefer the mouse aim direction.
- When moving normally without firing, prefer the movement direction.
- When idle, retain the most recent meaningful facing direction.
- During axe throwing, face toward the axe target.

Aiming must remain accurate with the 1280-pixel world and responsive horizontal camera.

For Pursuers:

- Prefer the robot's actual chase or attack direction.
- Retain the previous facing when nearly stationary.
- Update facing as robots turn toward Blackrush.

Do not rotate the pre-rendered eight-way sprites by arbitrary angles; select the matching directional artwork.

### 15. Blackrush animation state controller

Create a clear animation selection layer.

Suggested state priority:

1. `axe-throw` — highest priority, brief one-shot.
2. Force firing/recently firing.
3. Movement.
4. Idle.

The actual character states are:

**Idle**

Blackrush has no movement input and is not shooting.

If the magical axe is available, prefer `axe-ready`.

If the magical axe is on cooldown or otherwise unavailable, use `idle`.

**Walking**

Use `walk`.

**Running**

Use `run`.

Inspect existing movement mechanics and determine whether an actual walk/run distinction currently exists.

Do not invent a gameplay speed change merely to activate both animation sets.

If the game currently uses one movement speed, choose a consistent initial locomotion animation and document how the other set can be enabled later.

**Force idle**

While Blackrush is firing energy bolts and stationary, use `force-idle`.

**Force walking**

While Blackrush is firing energy bolts and walking, use `force-walk`.

**Force running**

While Blackrush is firing energy bolts and running, use `force-run`.

### 16. Force pose linger

Implement a configurable firing-pose persistence window.

Suggested default:

```javascript
forcePoseLingerMs: 350
```

Whenever Blackrush successfully fires or actively holds the firing input, update the force-pose expiration.

For approximately 350 milliseconds after the most recent firing activity, Blackrush continues using the force animation family.

Repeated clicks should maintain the pose smoothly.

When the grace window expires, return to the appropriate ordinary movement or idle pose.

Do not restart the same animation every frame.

Do not tie this to musical time; normal gameplay frame time is appropriate for visual animations.

Pause should suspend or appropriately freeze visual animation transitions.

### 17. Axe availability and ready pose

Blackrush should normally use `axe-ready` while standing still if the axe is available to throw.

When the axe is unavailable due to cooldown, use ordinary `idle`.

Read the real weapon cooldown state from the existing weapon system.

Do not maintain a separate artificial axe-availability timer in the animation system if that could diverge from the actual weapon cooldown.

The axe-ready loop must not block future animation transitions.

### 18. Axe throwing animation

Implement a brief visual throwing sequence.

When an actual axe throw is accepted by WeaponSystem:

1. Select the correct eight-way throw direction.
2. Play a short, non-looping `axe-throw` animation.
3. Launch the existing separate axe projectile at the appropriate throw/release moment.
4. Resume the correct force, movement, or idle animation afterward.

The developer has a separate magical-axe-ready animation showing Blackrush holding his axe.

The generic `axe-throw` animation does not include the axe itself.

Do not draw a second axe inside the throwing animation.

The existing axe projectile remains a separate game entity.

**Important timing requirement:** Preserve the current axe attack responsiveness, damage, cooldown, and targeting.

Do not delay projectile release significantly merely to match artwork.

If frame-synchronized projectile release requires gameplay changes, prefer to release the projectile immediately and use the throw animation as visual feedback for this milestone.

### 19. Brief movement interruption on axe throw

The developer would like Blackrush to pause briefly when throwing the axe.

Implement this cautiously.

Suggested maximum movement interruption: approximately 100–150 milliseconds.

Make it configurable.

Do not introduce a prolonged lock or change the underlying movement speed.

Ensure no movement key becomes stuck after the interruption.

Do not break Assisted movement.

If implementing movement interruption requires risky changes to existing control logic, defer that specific behavior and report it rather than destabilizing movement.

### 20. Pursuer robot animation states

Use the compiled Pursuer sprite atlas for robot type `PURSUER`.

Suggested mapping:

- Stationary: `idle`.
- Moving/chasing: `walk`.
- Close-range threatening or executing contact attack: `attack`.

The attack set depicts the Pursuer with claws extended.

Choose attack animation based on the existing AI/combat state or proximity.

Avoid showing a constant attack animation merely because a robot has a target far away.

Use actual robot velocity or intended movement vector for directional selection.

The robot should maintain its correct orientation during obstacle avoidance, pursuit, retreats, and catch-up bursts.

Retreating robots may use the walk animation initially.

Do not alter AI or combat values.

### 21. Other robots remain unchanged

The Sentinel and Armored Pursuer continue using their procedural graphics.

The Proxy boss and temporary opening Proxy remain unchanged.

Do not remove their existing effects.

The sprite rendering implementation should detect whether an atlas exists for a given robot archetype.

If no artwork is registered, continue using the current placeholder rendering.

The transition must not cause an undefined texture or animation exception.

### 22. Animation lifecycle

Ensure that:

- Sprites are created once per entity.
- Animations change only when state or direction changes.
- Animation definitions are registered only once.
- Deactivated robot visuals are hidden.
- Destroyed robot visuals and listeners are cleaned up.
- Respawning Blackrush restores valid animation state.
- Invulnerability flashing remains visible and compatible with the sprite.
- Restart creates a fresh valid player visual.
- Developer seeking does not leave ghost sprites.
- Game Over stops or cleans up animations correctly.
- Natural Cathedral-to-Studio transition remains safe.

Previous milestones experienced several scene-lifecycle errors. Preserve those protections.

### 23. Developer testing tools

Add a modest sprite diagnostics section to the existing debug panel if useful.

Suggested information:

- Pixel-art rendering enabled/disabled.
- Current Blackrush animation state.
- Current eight-way facing direction.
- Selected Pursuer animation.
- Atlas loading success/failure.
- Current sprite scale.

Include a developer toggle:

**PIXEL ART ON / OFF**

When disabled, use the existing procedural visuals.

This toggle is valuable for confirming that a rendering issue is not a gameplay issue.

The toggle must not duplicate entities or change physics.

Do not introduce a new large debug UI.

### 24. Automated testing

Create tests for the compiler and runtime integration.

At minimum, test:

**Compiler**

1. Static direction files are discovered correctly.
2. Animated frame sequences are discovered correctly.
3. All eight directions are recognized.
4. Missing directions produce errors.
5. Non-sequential frame numbering is detected.
6. Different valid animation frame counts are accepted.
7. Frame dimensions are validated.
8. Transparent backgrounds survive compilation.
9. Generated atlas frame names are unique.
10. All manifest frame references exist.
11. Repeated compilation is deterministic.
12. Source files are never modified.
13. Canonical `pursuer` identity resolves from the current `persuer` source directory.
14. Generated atlas assets are loadable.

**Runtime**

15. Eight-way direction selection is correct.
16. Blackrush selects appropriate movement and idle animations.
17. Blackrush chooses axe-ready only when axe is available.
18. Firing chooses appropriate force animation.
19. Force-pose linger behaves correctly.
20. Repeated clicking does not restart the animation unnecessarily.
21. Axe throwing overrides other visual states briefly.
22. Axe projectile behavior remains unchanged.
23. Pursuer chase selects walking animation.
24. Pursuer close attack selects attack animation.
25. Unavailable sprite assets fall back to procedural visuals.
26. Restart does not duplicate animation registrations.
27. Destruction cleans up sprite resources.
28. Existing combat, survival, camera, music, and encounter tests continue passing.

Run:

```bash
npm run sprites:check
npm run sprites
npm test
npm run build
```

### 25. Browser acceptance testing

If browser testing is available, verify the following.

**Blackrush**

- Appears with PixelLab artwork.
- Faces all eight directions correctly.
- Walks or runs in the expected directions.
- Stops without jittering.
- Uses axe-ready when stationary and axe available.
- Switches to ordinary idle during axe cooldown.
- Uses force-idle when standing and shooting.
- Uses force-walk or force-run when moving and shooting.
- Maintains force pose during repeated mouse clicks.
- Performs a brief axe throw animation.
- Throws a real independent axe projectile.
- Can still aim accurately in the expanded desktop world.

**Pursuer**

- Appears with the new robot artwork.
- Moves through all eight directions.
- Extends claws near the player.
- Still collides, chases, attacks, takes damage, and dies normally.

**Gameplay**

- Lasers and projectiles retain their prior collision behavior.
- Blackrush still takes damage and loses hearts.
- Respawning restores correct sprite visibility.
- Hearts can still be collected.
- Musical swarms operate normally.
- Seeking and restarting produce no ghost graphics.
- The Proxy boss remains functional.
- Natural Synth-to-Cathedral and Cathedral-to-Studio transitions still work.
- No console errors occur.

Check at least one Classic and one Assisted control session.

If actual browser verification is unavailable, provide clear manual testing instructions instead of claiming browser success.

### 26. Documentation

Update:

- `docs/ASSETS.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Include:

- Source directory conventions.
- Character identity mapping.
- Required directions.
- Static vs animated frame layouts.
- CLI compiler commands.
- How atlas output is organized.
- Manifest format.
- How to add a new animation.
- How to update PixelLab art and rebuild.
- Default FPS values.
- Sprite scale settings.
- Direction-selection rules.
- Blackrush animation priorities.
- Firing-pose linger timing.
- Axe-ready and throwing behavior.
- Procedural fallback behavior.

Include a short tutorial for adding the Sentinel's sprite artwork in a future milestone.

Do not integrate Sentinel yet.

### 27. Scope restrictions

Do not implement:

- Lorelei gameplay or companion AI.
- Sentinel sprite integration.
- Armored Pursuer sprite integration.
- Proxy sprite integration.
- Giant robot art.
- New environment artwork.
- Cinematics.
- Intro or outro presentations.
- Music or sound design.
- New weapons.
- New enemies.
- Boss combat changes.
- New encounter choreography.
- Difficulty balancing.
- Arena checkpoints.
- Mobile controls.
- Major architectural refactoring unrelated to sprites.

Preserve all existing gameplay functionality.

### 28. Definition of done

Step 9.5 is complete when:

- A Windows- and Linux-compatible sprite compiler exists.
- PixelLab source files remain untouched.
- Compiler validates all required directions and frames.
- Blackrush and Pursuer atlases are generated.
- Generated manifests drive Phaser animation registration.
- Blackrush displays eight-direction animations.
- Blackrush shooting changes visual stance appropriately.
- Force pose lingers briefly after firing.
- Axe-ready and axe-throw visual behavior works.
- Pursuer uses idle, walk, and attack animations.
- Existing physics and combat remain unchanged.
- Procedural fallback remains available.
- Developer sprite toggle works.
- Seeking, restart, and scene lifecycle remain stable.
- All automated tests pass.
- Production build succeeds.
- Browser verification is performed or clearly identified as requiring manual testing.

Report:

1. Files added and modified.
2. Compiler architecture and dependencies.
3. Source validation results.
4. Generated atlas sizes and frame counts.
5. Manifest format.
6. Blackrush animation integration.
7. Pursuer animation integration.
8. Fallback rendering.
9. Automated test results.
10. Browser verification.
11. Known limitations and future extension points.

**Stop after Step 9.5. Do not begin Step 10 without authorization.**