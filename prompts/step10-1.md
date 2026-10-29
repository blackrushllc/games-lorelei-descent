# JUNIE TASK — LORELEI: DESCENT
## Step 10.1 — Sentinel Pixel-Art Rendering and Animation Integration

### 1. Objective

Integrate the existing PixelLab Sentinel sprite artwork into the working Phaser 3.88.2 game.

Step 10.0 established the v2.0 sprite compiler, versioned manifests, multi-page texture support, visual states, directional fallback, and the generalized SpriteAnimationRegistry.

This milestone concerns **only the Sentinel robot**.

Replace its procedural body rendering with the compiled Sentinel artwork while preserving its existing AI, movement, targeting, laser attacks, collision, damage, and destruction behavior.

Do not change gameplay mechanics or combat balancing.

### 2. Existing assets

The Sentinel source artwork is located at:

```text
public/assets/source/pixellab/robots/sentinel/
    idle/
    walk/
    run/
```

Each animation supports eight directions:

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

The idle set contains static directional PNGs.

The walk and run sets contain numbered animation frames.

These assets have already been configured and compiled by Step 10.0.

Use the generated v2 manifest and atlas files.

**Do not load individual source PNGs at runtime.**

### 3. Preserve existing Robot architecture

Inspect the current `Robot.js` implementation and identify how robot archetypes are selected.

The game currently uses:

- Pursuer — pixel-art rendering implemented.
- Sentinel — procedural rendering.
- Armored robot — procedural rendering.

Extend the existing sprite-rendering architecture to support Sentinel.

Do not create a parallel Sentinel entity system.

Avoid changes to shared Robot functionality that could break Pursuer animations or Armored Robot behavior.

### 4. Sentinel animation states

Use the following visual state mapping.

**Idle**

When the Sentinel is stationary or nearly stationary, use `idle`.

**Walking**

When moving at normal speed, use `walk`.

**Running**

When moving rapidly, use `run`.

Determine whether the existing Sentinel AI distinguishes walking and running.

If only one movement speed exists, choose the most appropriate animation without changing AI velocity.

Do not invent an additional movement mechanic simply to utilize both animation sets.

### 5. Directional behavior

The Sentinel artwork has eight facing directions.

When moving, choose direction from the robot's movement vector.

When stationary and targeting Blackrush, face toward the target.

During the existing laser attack sequence:

- TRACKING: face the tracked target.
- LOCKED: retain the attack's locked facing direction.
- FIRING: retain the locked direction.
- COOLDOWN: return to normal idle or movement-facing behavior.

Do not allow sprite orientation to imply that a locked laser is still tracking Blackrush.

Use the existing direction helper and SpriteAnimationRegistry where possible.

Do not restart the same animation every frame.

### 6. Laser integration

Step 9.8 implemented a three-stage Sentinel laser attack:

```text
TRACKING -> LOCKED -> FIRING -> COOLDOWN
```

The developer has manually verified that the corrected implementation works and that attacks can now be dodged.

Preserve it exactly.

The Sentinel sprite must not interfere with:

- Target acquisition.
- Warning beams.
- Direction locking.
- Laser firing.
- Ray-based collision.
- Obstacle blocking.
- Damage.
- Attack cooldowns.

The Sentinel has no dedicated shooting animation.

Use the appropriate idle or locomotion animation while it fires.

Retain the existing laser graphics and targeting effects as separate elements.

Ensure their world positions and firing origins remain aligned with the robot after its procedural body is hidden.

### 7. Physics independence

Do not change:

- Sentinel movement speed.
- Collision body dimensions.
- Laser range.
- Laser damage.
- Detection radius.
- Attack timing.
- Robot health.
- Spawn density.
- Encounter formations.

The visual sprite should follow the existing physics entity correctly.

If the sprite's visible dimensions differ from its collision body, preserve the gameplay hitbox and adjust only the visual alignment.

Ensure correct rendering scale and origin.

### 8. Sprite rendering

Use the Step 10.0 atlas and registry.

Preserve:

- Nearest-neighbor filtering.
- Crisp pixel edges.
- Original frame alignment.
- Consistent sprite scale.
- Correct animation registration.
- Transparent backgrounds.

The developer's regular characters and robots use 48×48 source artwork.

Use the existing Pursuer display scaling as an initial comparison.

Do not automatically assume the Sentinel must have an identical collision radius or displayed size merely because both use 48×48 frames.

Keep visual scale configurable.

### 9. Pixel Art toggle

The existing developer PIXEL ART toggle must work for the Sentinel.

When enabled:

- Show the Sentinel sprite.
- Hide the old procedural body artwork.
- Preserve laser targeting graphics and effects.

When disabled:

- Hide the Sentinel sprite.
- Restore its procedural body.
- Keep combat running normally.

The toggle must affect existing Sentinels and future spawned Sentinels.

Do not duplicate robot entities or physics bodies.

Preserve existing toggle functionality for Blackrush and Pursuer.

### 10. Procedural fallback

If the Sentinel texture or animation manifest is unavailable, use its existing procedural rendering.

Do not crash GameScene.

Report the missing asset clearly in development diagnostics.

Do not hide unrelated exceptions behind broad error handlers.

### 11. Spawning and destruction

Verify that Sentinels display correctly when spawned by:

- Scripted musical formations.
- Ambient encounter spawning.
- Developer spawn controls.
- Developer seeking and reconstruction.
- Arena checkpoint reconstruction.

On destruction:

- Stop sprite animation.
- Hide or destroy the visual appropriately.
- Clean up listeners.
- Preserve normal scoring.
- Prevent stale laser effects.

NOVA must still eliminate Sentinels without awarding points.

### 12. Debug diagnostics

Use the existing sprite diagnostics where practical.

Display:

- Sentinel rendering mode.
- Selected animation.
- Facing direction.
- Current laser attack phase.
- Texture and animation availability.

Do not create another large developer panel.

Maintain `?debug=1` gating and input isolation.

### 13. Automated tests

Add focused regression tests covering:

1. Sentinel atlas resolves from the v2 manifest.
2. Idle animation uses correct directions.
3. Walk animation plays correctly.
4. Run animation plays correctly.
5. Direction selection follows movement.
6. Stationary targeting faces Blackrush.
7. LOCKED and FIRING preserve the locked orientation.
8. Sprite rendering does not change laser geometry.
9. Pixel-art toggle updates active Sentinels.
10. New Sentinels inherit the current rendering mode.
11. Missing textures activate procedural fallback.
12. Sentinel destruction cleans up visuals.
13. NOVA still eliminates Sentinels without score.
14. Existing Pursuer animations remain unchanged.
15. Armored Robot procedural rendering remains unchanged.
16. GameScene restart does not duplicate registered animations.
17. Existing encounter and boss tests pass.

Run:

```bash
npm run sprites:check
npm test
npm run build
```

### 14. Real browser verification

If browser execution is available, perform actual gameplay testing.

Otherwise, explicitly report that browser verification remains necessary.

The developer should be able to verify:

**Startup**

- Blackrush still renders correctly.
- Pursuer still renders correctly.
- GameScene initializes normally.
- Camera centering remains correct.

**Sentinel appearance**

- Sentinels appear using PixelLab artwork.
- All eight orientations look correct.
- Movement animations play smoothly.
- Stationary Sentinels remain visually stable.

**Sentinel combat**

- Targeting beams remain visible.
- The beam tracks Blackrush.
- The beam locks.
- The Sentinel fires.
- Blackrush can dodge.
- Cover still blocks laser damage.
- Sentinel damage and destruction work.

**Developer features**

- PIXEL ART ON/OFF works.
- Manual Sentinel spawning works.
- Timeline seeking works.
- Restart does not leave ghost sprites.

### 15. Documentation

Update `docs/ASSETS.md` and `docs/DEVELOPMENT.md` with:

- Sentinel animation mapping.
- Direction behavior.
- Display-scale configuration.
- Rendering fallback behavior.
- Laser phase orientation.
- Manual browser testing instructions.

### 16. Scope restrictions

Do not implement:

- Armored Robot sprites.
- German Soldier sprites.
- Proxy sprites.
- Giant Boss sprites.
- Lorelei.
- Eclipse.
- Nadine.
- New combat mechanics.
- New robot types.
- New animations.
- Damage overlays.
- New musical events.
- Boss changes.

### 17. Definition of done

Step 10.1 is complete when:

- Sentinels render using their original PixelLab artwork.
- Idle, walk, and run animations function correctly.
- Eight-direction facing works.
- Targeting orientation respects the laser lock phase.
- Existing laser combat remains unchanged.
- The global pixel-art toggle works.
- Procedural fallback remains available.
- Existing Blackrush and Pursuer animations still work.
- Automated tests pass.
- Production build succeeds.
- Real browser verification is completed or explicitly marked as pending.

Report modified files, animation mappings, test results, browser verification status, and known limitations.

**Stop after Step 10.1. Do not begin Armored Robot integration.**