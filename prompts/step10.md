# JUNIE TASK — LORELEI: DESCENT
## Step 10.0 — Normalize and Extend the PixelLab Sprite Asset Pipeline

### 1. Objective

Extend the existing Step 9.5 PixelLab sprite compiler and Phaser animation registry to support the complete collection of artwork now available in the project.

The existing asset pipeline successfully compiles and renders Blackrush and Pursuer robots. Preserve this working functionality.

The new assets introduce several variations:

- Characters with different available animations.
- Multiple visual damage states.
- Separate armored and disarmed appearances.
- Eight-direction, four-direction, and single-direction animations.
- Static directional images and animated frame sequences.
- Different frame counts, including longer boss destruction sequences.
- Different source image dimensions for regular characters and bosses.
- Animations available in only some visual states.

Create a well-defined asset configuration and manifest system that supports all these patterns without requiring character-specific changes to the compiler.

**This is an asset infrastructure milestone only. Do not integrate new characters into gameplay yet.**

The developer will provide individual follow-up tasks for character rendering, companion AI, boss state transitions, and scripted musical events.

---

## 2. Existing architecture

The project uses:

- JavaScript ES modules.
- Phaser 3.88.2.
- Vite.
- Node.js.
- `sharp` for image processing.

Existing asset tooling includes:

```text
scripts/assets/compile-sprites.mjs
src/systems/SpriteAnimationRegistry.js
public/assets/source/pixellab/
public/assets/sprites/
docs/ASSETS.md
```

Existing npm commands include:

```bash
npm run sprites
npm run sprites:check
npm run sprites -- --character blackrush
```

Inspect the current implementation and preserve its working interfaces wherever practical.

Do not replace it with an unrelated asset-management framework.

### Critical compatibility requirement

Blackrush and Pursuer pixel art currently render correctly, including:

- Eight-way directional animation.
- Shooting and axe poses.
- Pursuer attack animation.
- Procedural fallback.
- The developer PIXEL ART toggle.

These features must continue working exactly as before.

If the manifest schema changes incompatibly, provide a compatibility adapter or migrate the existing registry and consumers safely.

---

# PART A — Asset Inventory and Canonical Definitions

## 3. Source artwork

All source artwork currently resides under:

```text
public/assets/source/pixellab/
```

The developer has organized the assets into the following primary directories:

```text
pixellab/
    blackrush/
    eclipse/
    german_soldier/
    giant_boss/
    lorelei/
    nadine/
    proxy/
    robots/
```

The directory listing also contains older top-level PixelLab export directories named `Sentinel` and `The_Proxy`.

Do not automatically treat those as additional playable characters. The normalized `robots/sentinel` and `proxy` directories are the intended sources.

Use an explicit configuration registry of source paths rather than blindly compiling every folder found at the root.

Do not rename, move, overwrite, or delete any original PixelLab files.

## 4. Asset inventory

Use the real project files to confirm the following organization.

### Blackrush

Source: `pixellab/blackrush/`

Animations:

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

One default visual state.

Retain existing behavior and canonical animation names.

### Eclipse

Source: `pixellab/eclipse/`

Animations:

```text
idle
walk
run
crouch
```

Important exception:

`crouch` has only four cardinal directions:

```text
north
east
south
west
```

The supplied crouch sequences contain five frames per direction.

The other animation sets use eight directions.

### German Soldier

Source: `pixellab/german_soldier/`

Animations:

```text
idle
run
throw
```

No walk animation exists.

The throw is a one-shot animation, performed while stationary.

Do not require a walk animation.

### Lorelei

Source: `pixellab/lorelei/`

Animations:

```text
idle
walk
run
```

A telekinesis pose or animation may be added later.

Do not require it now.

### Nadine

Source: `pixellab/nadine/`

Animations:

```text
idle
run
```

No walking or hugging animation exists.

Do not require those assets.

### Robots

Source: `pixellab/robots/`

The three logical robot identities are:

**Pursuer**

Source directory: `robots/persuer/`

```text
idle
walk
attack
```

Preserve the current `persuer` source spelling but continue using canonical runtime identity `pursuer`.

**Sentinel**

Source directory: `robots/sentinel/`

```text
idle
walk
run
```

**Armored Robot**

Two physical source directories represent two visual states of the same logical robot:

```text
robots/
    armored_robot/
        idle/
        walk/
        run/

    armored_robot_disarmed/
        idle/
        walk/
```

Canonical logical entity: `armored_robot`.

Visual states:

- `default` or `armored` — intact armor.
- `disarmed` — armor removed by Blackrush's axe.

Use a single logical asset identity with a configurable source mapping for each state.

Do not require a run animation in the disarmed state.

Do not add another gameplay enemy type.

### Proxy

Source: `pixellab/proxy/`

Visual states:

```text
proxy/
    carrying_nadine/
        idle/
        run/

    default/
        idle/
        walk/

    damage_1/
        idle/
        walk/

    damage_2/
        idle/
        walk/

    damage_3/
        idle/
        collapse/
```

Important exceptions:

- `carrying_nadine` is an alternate appearance for the opening chase, not a damage state.
- `damage_3` has no walk animation.
- `collapse` is available only within `damage_3`.
- The collapse animation has only a south-facing sequence.
- The source collapse sequence contains nine frames.

Do not invent or require missing animation sets.

### Giant Boss

Source: `pixellab/giant_boss/`

Visual states:

```text
giant_boss/
    default/
        idle/
        walk/
        swing/

    damage_left/
        idle/
        walk/

    damage_left_right/
        idle/
        walk/

    damage_all/
        idle/
        walk/
        collapse/

    destroyed/
        idle/
        burning/
```

Damage progression is fixed:

```text
default
    -> damage_left
    -> damage_left_right
    -> damage_all
    -> collapse
    -> destroyed
```

`collapse` is an animation within `damage_all`.

`burning` is an animation within `destroyed`.

Do not invent a separate right-side-only damage state.

Important exceptions:

- `swing` is available only in the default state.
- `swing` has four cardinal directions, each with nine frames.
- `collapse` has only a south-facing sequence.
- `burning` has only a south-facing sequence.
- The supplied directory listing contains 17 frames for each of `collapse` and `burning`.

Read frame counts from the source files rather than imposing an eight- or sixteen-frame limit.

---

# PART B — Generalized Asset Schema

## 5. Separate visual state, animation and direction

The manifest must distinguish three independent concepts.

**Visual state**

Which appearance is currently used:

```text
default
damage_1
damage_left
disarmed
destroyed
carrying_nadine
```

**Animation**

What the entity visually performs:

```text
idle
walk
run
attack
throw
swing
collapse
burning
crouch
```

**Direction**

Which perspective the artwork represents:

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

These must not be conflated.

A visual state can contain many animations.

Each animation can have its own supported directions, frame count, FPS, and looping policy.

The final lookup identity should conceptually be:

```text
entity + visualState + animation + direction
```

For example:

```text
giant_boss / damage_left_right / walk / south-east
proxy / damage_3 / collapse / south
armored_robot / disarmed / idle / north
eclipse / default / crouch / west
```

## 6. Canonical entity configuration

Extend the existing compiler configuration into a declarative per-entity specification.

The exact code format is your choice, but it should support a structure conceptually similar to:

```javascript
{
    id: 'giant_boss',
    source: 'giant_boss',
    expectedFrameSize: {
        width: 96,
        height: 96
    },
    defaultState: 'default',

    states: {
        default: {
            source: 'default',
            animations: {
                idle: {
                    directions: 'eight',
                    loop: false
                },
                walk: {
                    directions: 'eight',
                    loop: true,
                    fps: 8
                },
                swing: {
                    directions: 'cardinal',
                    loop: false,
                    fps: 12
                }
            }
        },

        damage_left: {
            source: 'damage_left',
            animations: {
                idle: {
                    directions: 'eight',
                    loop: false
                },
                walk: {
                    directions: 'eight',
                    loop: true
                }
            }
        },

        damage_all: {
            source: 'damage_all',
            animations: {
                idle: {
                    directions: 'eight',
                    loop: false
                },
                walk: {
                    directions: 'eight',
                    loop: true
                },
                collapse: {
                    directions: ['south'],
                    loop: false,
                    fps: 12
                }
            }
        }
    }
}
```

This is an illustrative partial configuration, not the complete required giant-boss specification.

Create complete declarations for every intended asset based on the actual filesystem.

Do not hardcode frame counts in the source configuration when they can be reliably discovered.

## 7. Default visual state

For characters without multiple appearance states, use an implicit or explicit `default` state.

For example:

```text
blackrush/default/run/north
eclipse/default/crouch/west
german_soldier/default/throw/east
```

The source directory does not need an actual `default` subdirectory.

The compiler must support both:

```text
blackrush/run/north/
```

and:

```text
giant_boss/default/walk/north/
```

without requiring the developer to reorganize assets.

## 8. Explicit source mapping

Source folder names are not always identical to runtime identities.

Support mappings such as:

```javascript
{
    id: 'pursuer',
    source: 'robots/persuer'
}
```

And for a state stored in a separate source directory:

```javascript
{
    id: 'armored_robot',
    states: {
        default: {
            source: 'robots/armored_robot'
        },
        disarmed: {
            source: 'robots/armored_robot_disarmed'
        }
    }
}
```

The compiler should not depend on a particular source nesting depth.

Validate source paths.

Do not use arbitrary dynamic source-path guessing when explicit mappings exist.

---

# PART C — Direction and Animation Support

## 9. Eight-direction animations

Preserve existing support for:

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

Maintain the existing world-space direction convention used by Blackrush and Pursuer.

Do not invert north and south or alter their current orientation behavior.

## 10. Four-direction animations

Add explicit support for animations with only:

```text
north
east
south
west
```

Examples:

- Eclipse crouch.
- Giant boss swing.

When an eight-way direction is requested, resolve it to the nearest available cardinal direction.

Use a deterministic, documented tie-breaking rule for exact diagonals.

Do not attempt to synthesize missing diagonal artwork.

Do not rotate or mirror pre-rendered sprites unless specifically configured in a future task.

## 11. Single-direction animations

Support animations with one fixed perspective.

Examples:

```text
proxy/damage_3/collapse/south
giant_boss/damage_all/collapse/south
giant_boss/destroyed/burning/south
```

These animations should play using the supplied south-facing frames regardless of the previous facing direction.

Do not require additional directions.

Do not repeatedly change direction during a fixed-perspective collapse or destruction sequence.

This behavior should be declared in metadata rather than hardcoded into ProxyBoss or SuperRobot.

## 12. Variable frame counts

Frame sequences may contain:

- Five frames.
- Seven frames.
- Eight frames.
- Nine frames.
- Seventeen frames.
- Other valid counts in future artwork.

Discover frames by filename and numeric sequence.

For example:

```text
frame_000.png
frame_001.png
...
frame_016.png
```

Sort numerically rather than lexicographically.

Do not assume that all directions of an animation must contain the same number of frames unless the specific configuration explicitly requires that.

Warn about unexpected inconsistencies where appropriate.

Missing or skipped frame numbers should be reported clearly.

## 13. Static directional images

Continue supporting sets such as:

```text
idle/
    north.png
    south.png
    east.png
    ...
```

These represent one frame per direction.

They should not be repeatedly restarted as if they were looping multi-frame animations.

The manifest must distinguish a static directional pose from an animated sequence.

## 14. Animation playback policies

Support declarative:

- Frames per second.
- Loop versus one-shot.
- Optional repeat count.
- Optional completion behavior.
- Direction policy.
- Default/fallback animation.

Suggested defaults:

| Animation | FPS | Behavior |
|---|---:|---|
| idle | 1 | Static where appropriate |
| walk | 10 | Loop |
| run | 14 | Loop |
| attack | 12 | Loop or as configured |
| throw | 18 | One-shot |
| crouch | 10 | One-shot or hold final frame |
| swing | 12 | One-shot |
| collapse | 12 | One-shot |
| burning | 8 | Loop while visible |

Treat these as editable starting values.

Do not alter existing Blackrush and Pursuer playback speeds unnecessarily.

---

# PART D — Fallback Rules

## 15. Explicit animation fallback

Some states have fewer animations than others.

Examples:

- German Soldier: no walk.
- Nadine: no walk.
- Pursuer: no run.
- Disarmed Armored Robot: no run.
- Proxy `damage_3`: no walk.
- Giant Boss `damage_left`: no swing.

Implement configurable fallbacks.

Suggested examples:

```text
german_soldier.walk -> run
nadine.walk -> run
pursuer.run -> walk
armored_robot.disarmed.run -> disarmed.walk
proxy.damage_3.walk -> damage_3.idle
giant_boss.damage_left.swing -> damage_left.idle
```

These are proposed visual fallbacks only.

They must not modify actual gameplay movement speed or attack behavior.

Fallbacks should be deliberate, documented, and finite.

Detect circular fallback chains.

## 16. Preserve visual damage state

**Do not automatically revert a damaged boss to its intact appearance because an animation is unavailable.**

For example, if the Proxy is in `damage_3` and a walk animation is requested, use `damage_3.idle` or another explicitly configured alternative.

Do not silently display `default.walk` and make its damage disappear.

Similarly, when the Armored Robot becomes disarmed, maintain its disarmed appearance during subsequent locomotion.

Prefer fallback within the current visual state before considering any explicitly allowed cross-state fallback.

## 17. Missing assets

Distinguish between:

- Valid, intentionally absent animations.
- Valid, intentionally limited directions.
- Invalid or missing required source files.
- Unavailable runtime textures.

A four-direction animation is not an error if the configuration declares four directions.

A missing expected direction is an error.

A missing optional animation is not an error if the configured fallback is valid.

Do not silently hide invalid source files behind a generic fallback.

Provide actionable warnings.

---

# PART E — Atlas and Manifest Generation

## 18. Extend existing compiler

Update `compile-sprites.mjs` rather than replacing its established functionality.

It should:

1. Read the canonical source configuration.
2. Discover declared visual states and animations.
3. Validate source files.
4. Validate direction coverage.
5. Validate image dimensions.
6. Collect frames in deterministic order.
7. Generate Phaser-compatible texture atlases.
8. Generate machine-readable manifests.
9. Report warnings and errors.
10. Preserve source PNG files untouched.

Retain the existing `sharp` dependency.

## 19. Mixed sprite dimensions

Regular characters and robots are expected to use 48×48 artwork.

The Proxy is intended to use larger art, previously planned around 64×64.

The Giant Boss is intended to use larger art, previously planned around 96×96.

**Inspect the actual PNG dimensions rather than assuming these sizes are already correct.**

Support different frame dimensions for different entities.

Ideally, validate consistent canvas dimensions across all visual states belonging to one entity, unless exceptions are explicitly declared.

Never silently resize larger boss art down to 48×48.

Never introduce anti-aliasing or blurry resampling.

Maintain transparency and stable frame alignment.

## 20. Atlas organization

Prefer a structure like:

```text
public/assets/sprites/
    manifest.json

    blackrush/
        ...

    eclipse/
        ...

    german_soldier/
        ...

    giant_boss/
        ...

    lorelei/
        ...

    nadine/
        ...

    proxy/
        ...

    robots/
        pursuer/
        sentinel/
        armored_robot/
```

Preserve existing output paths for Blackrush and Pursuer where possible.

If changing those paths is necessary, migrate all existing references and tests.

Atlas identifiers must include enough information to prevent collisions between visual states.

Example conceptual frame names:

```text
default__walk__south-east__003
damage_left__walk__north__006
damage_all__collapse__south__012
destroyed__burning__south__016
```

Use a consistent naming convention.

## 21. Texture atlas size and paging

The expanded art library is considerably larger than the initial Blackrush/Pursuer library.

Do not force every frame of every character into one enormous image.

Support configurable atlas page limits.

Use multiple atlas pages when needed.

The output must be compatible with Phaser 3.88.2 loading APIs.

Preserve deterministic frame ordering and naming.

No source frames may be silently omitted because a texture page is full.

Avoid wasting large amounts of texture space.

Do not unnecessarily load every character's atlas at game startup merely because it has been compiled.

## 22. Manifest version

Introduce a versioned manifest schema.

For example:

```json
{
  "schemaVersion": 2,
  "entities": {
    "giant_boss": {
      "defaultState": "default",
      "frameSize": {
        "width": 96,
        "height": 96
      },
      "states": {
        "default": {},
        "damage_left": {},
        "damage_left_right": {},
        "damage_all": {},
        "destroyed": {}
      }
    }
  }
}
```

This is only a simplified conceptual example.

The complete manifest must contain:

- Entity identity.
- Visual states.
- Source mapping or source audit metadata.
- Generated atlas page references.
- Frame dimensions.
- Animation identifiers.
- Direction support.
- Ordered frames.
- Playback speed.
- Loop policy.
- Fallback rules.
- Optional rendering scale and origin metadata.

Do not duplicate hand-maintained lists of frame identifiers in runtime code.

## 23. Runtime registry API

Extend `SpriteAnimationRegistry.js` with a generic resolution mechanism.

Conceptual API:

```javascript
registry.resolve({
    entity: 'giant_boss',
    state: 'damage_left_right',
    animation: 'walk',
    direction: 'north-east'
});
```

The result should identify a valid registered animation and the correct texture/atlas information.

A similar call for the four-direction swing should resolve deterministically to the nearest available cardinal direction.

A call for collapse should resolve to its fixed south-facing sequence.

The implementation may use a different method signature if that fits the existing architecture better.

Preserve existing calls used by Blackrush and Pursuer.

Do not require edits to every entity whenever a new visual state is added.

## 24. Origin and attachment metadata

Leave room in the manifest for optional:

- Render origin.
- Feet/ground alignment.
- Display scale.
- Weapon attachment points.
- Grenade release point.
- Spark emitters.
- Smoke emitters.
- Steam vents.
- Boss damage effect positions.

These are future extension points.

Do not guess detailed coordinates for every character.

Do not implement procedural smoke or spark systems yet.

For now, provide a sensible default origin and allow entity-specific overrides later.

Rendering origins must remain independent of physics hitboxes.

---

# PART F — CLI and Validation

## 25. CLI commands

Preserve and extend the existing commands.

Support:

```bash
npm run sprites:check
npm run sprites
npm run sprites -- --character blackrush
npm run sprites -- --character giant_boss
npm run sprites -- --character armored_robot
```

`--character` should accept canonical entity IDs.

Checking must not write generated files.

Compiling one entity must not erase other entities' previously generated atlas assets or manifest entries.

Report clear errors for unknown entity IDs.

## 26. Validation report

Produce a concise summary containing:

- Entity.
- Source path.
- Number of visual states.
- Number of animation sets.
- Number of direction sets.
- Total frame count.
- Frame dimensions.
- Atlas page count.
- Missing required assets.
- Fallbacks used.
- Ignored/unconfigured source directories.

Example report:

```text
[SPRITES] giant_boss
  States: 5
  Animations: validated
  Source frames: validated
  Four-direction swing: accepted
  South-only collapse: accepted
  South-only burning: accepted
  Atlas pages: generated
  Result: OK
```

Use actual discovered counts in the real report.

Do not copy illustrative counts into production diagnostics.

## 27. Source validation policy

Validation should fail for:

- Missing required source directories.
- Invalid PNGs.
- Unexpected source dimensions.
- Missing declared directions.
- Missing or duplicate frame indices.
- Duplicate canonical frame identifiers.
- Invalid fallback references.
- Circular fallback chains.
- Atlas frames exceeding allowed texture dimensions without a paging solution.
- Generated manifest references that do not exist.

Warnings are appropriate for intentionally ignored raw PixelLab export folders.

Do not delete or modify those ignored folders.

## 28. Safe compilation

Avoid partially replacing a valid atlas collection when compilation fails.

Prefer generating into temporary files or a staging directory and replacing the affected output atomically after validation succeeds.

Keep builds deterministic.

Avoid stale generated references when source frames are removed or renamed.

Make sure the compiler works on Windows and Linux.

Do not introduce platform-specific shell commands as required dependencies.

---

# PART G — Regression Protection

## 29. Preserve gameplay

This milestone must not modify:

- Player movement.
- Classic or Assisted controls.
- Weapons.
- Axe throwing.
- NOVA.
- Hearts or shields.
- Robot combat AI.
- EncounterDirector.
- Adaptive difficulty.
- Proxy boss mechanics.
- Giant boss mechanics.
- Music timeline.
- Boss checkpoints.
- Game Over.
- Victory.
- Camera tracking.
- Environmental collision.

Do not begin connecting new sprite states to those gameplay systems.

The purpose is to make future integration straightforward, not perform that integration now.

## 30. Preserve pixel art toggle

The developer's PIXEL ART ON/OFF toggle must continue working.

Blackrush and Pursuer should still switch between compiled artwork and procedural rendering.

Do not eagerly instantiate sprites for characters not yet used in gameplay.

The expanded manifest must not interfere with procedural fallbacks.

## 31. No unsupported Phaser APIs

A previous milestone encountered a startup crash from calling `setSmoothing()` on a Phaser Sprite.

Use only supported Phaser 3.88.2 APIs.

Preserve nearest-neighbor pixel-art rendering using the existing game configuration.

Do not call unsupported sprite methods.

---

# PART H — Tests

## 32. Compiler tests

Expand `tests/sprite_compiler.test.js` and add focused suites if useful.

Test at minimum:

1. Existing Blackrush assets still compile.
2. Existing Pursuer assets still compile.
3. Canonical Pursuer identity maps to `robots/persuer`.
4. Characters with one visual state compile.
5. Characters with multiple visual states compile.
6. Separately stored armored/disarmed sources combine into one entity.
7. Static eight-way idle sets compile.
8. Eight-way frame sequences compile.
9. Four-way crouch sequences compile.
10. Four-way swing sequences compile.
11. Single-direction collapse sequences compile.
12. Single-direction burning sequences compile.
13. Five-frame animations compile.
14. Seven-frame animations compile.
15. Eight-frame animations compile.
16. Nine-frame animations compile.
17. Seventeen-frame animations compile.
18. Mixed frame counts do not cause truncation.
19. Variable image dimensions are supported between entities.
20. Unexpected dimension changes are reported.
21. Invalid direction names are reported.
22. Missing required directions are reported.
23. Missing optional animations resolve through configured fallbacks.
24. Missing required animations fail validation.
25. Fallback cycles are rejected.
26. Damaged states do not silently revert to intact art.
27. Frame identifiers remain unique across visual states.
28. Atlas paging preserves all frames.
29. Manifest entries point to valid atlas frames.
30. Repeated compilation is deterministic.
31. Source PNGs are never modified.
32. Single-entity compilation preserves other generated assets.
33. Unconfigured raw export folders are ignored and reported.
34. Existing runtime animation registration remains compatible.

Use actual source assets for integration checks and small fixtures for isolated validation tests.

Do not hardcode the entire current collection's total frame count as a permanent invariant; additional artwork will be added later.

## 33. Runtime resolver tests

Test:

- Correct eight-way animation resolution.
- Nearest-cardinal selection from a diagonal request.
- Fixed-south collapse resolution.
- Missing-animation fallback within the same damage state.
- Default-state resolution for Blackrush.
- Disarmed-state resolution for Armored Robot.
- Missing runtime assets triggering the existing procedural fallback.
- No duplicate Phaser animation registrations.
- No undefined texture lookup.

## 34. Build verification

Run:

```bash
npm run sprites:check
npm run sprites
npm test
npm run build
```

Verify the production build includes the generated assets in the expected locations.

Do not claim browser testing unless a real browser was used.

---

# PART I — Documentation

## 35. Update asset documentation

Update:

```text
docs/ASSETS.md
docs/DEVELOPMENT.md
README.md
```

Explain:

- Canonical entity IDs.
- Physical source-path mappings.
- Default visual states.
- Nested visual states.
- Static directional poses.
- Animated directional sequences.
- Four-direction animations.
- Single-direction animations.
- Variable frame counts.
- Frame dimensions.
- Atlas paging.
- Manifest schema version.
- Animation FPS and looping.
- Fallback resolution.
- Source validation.
- Compiler CLI usage.
- Adding new PixelLab artwork.
- Rebuilding generated atlases.
- Runtime lookup.
- Backward compatibility.

Include examples showing how the developer can add:

1. A Lorelei telekinesis animation.
2. Another Eclipse action animation.
3. A new Giant Boss damage-state animation.
4. A different robot visual state.

These examples should demonstrate configuration only, not implement those gameplay features.

---

# PART J — Completion and Handoff

## 36. Definition of done

Step 10.0 is complete when:

- Every intended current PixelLab entity is represented in the canonical asset configuration.
- The compiler handles nested visual states.
- The compiler handles separate source directories for alternate visual states.
- Static eight-way poses work.
- Four-way animation sets work.
- Single-direction animations work.
- Arbitrary valid frame counts work.
- Boss-sized frames are supported without unwanted resizing.
- Texture atlases and manifests are generated correctly.
- A versioned manifest contract exists.
- A generic runtime animation resolver exists.
- Animation fallbacks are explicit and predictable.
- Existing Blackrush and Pursuer rendering remains functional.
- No new gameplay entities or companion behaviors are introduced.
- Existing combat and timeline systems are unchanged.
- All automated tests pass.
- Production build succeeds.

## 37. Completion report

When finished, report:

1. Files added and modified.
2. Canonical asset registry structure.
3. All discovered entities, states, and animations.
4. Actual source frame counts per entity.
5. Any missing or inconsistent source files.
6. Frame dimensions discovered from actual PNGs.
7. Generated atlas page counts and dimensions.
8. Manifest schema and version.
9. Direction fallback rules.
10. Animation fallback rules.
11. Compatibility approach for Blackrush and Pursuer.
12. Test results.
13. Build results.
14. Any issues requiring a developer decision.

Do not silently substitute incomplete artwork.

Do not modify original source directories to satisfy compiler assumptions.

## 38. Stop condition

**STOP AFTER STEP 10.0.**

Do not begin integrating Sentinel, Armored Robot, German Soldier, Lorelei, Eclipse, Nadine, Proxy, or Giant Boss art into gameplay.

Do not add companion AI.

Do not alter boss behavior.

Do not create sparks, smoke, steam, or other new graphical effects.

Do not implement grenade or Panzer animations.

Those tasks will be assigned individually in subsequent milestones.

The goal of Step 10.0 is a stable, general-purpose asset pipeline ready to support every character and boss in LORELEI: DESCENT.