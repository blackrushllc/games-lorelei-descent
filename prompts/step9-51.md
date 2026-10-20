# JUNIE TASK — LORELEI: DESCENT
## Step 9.5.1: Fix Phaser Sprite Initialization Crash

The Step 9.5 PixelLab compiler and sprite animation integration have been completed, but the game cannot initialize.

### Confirmed browser error

```text
Blackrush.js:23 Uncaught TypeError:
this.sprite.setSmoothing is not a function

at new Blackrush (Blackrush.js:23)
at GameScene.create (GameScene.js:57)
```

After selecting Assisted and START GAME, the music begins, but gameplay does not initialize correctly.

The game displays only a grid and an apparently misplaced partial Blackrush sprite. Obstacles, robots, movement, and shooting do not function.

### Required corrections

**1. Fix unsupported Phaser API usage**

`setSmoothing()` is not a Phaser 3.88.2 Sprite method.

Remove this call and any equivalent unsupported Sprite methods.

Configure nearest-neighbor pixel-art filtering using supported Phaser 3 configuration or texture APIs.

Inspect the existing `gameConfig.js` and Phaser initialization before making changes.

Preserve the 48-pixel artwork and transparent backgrounds.

Do not alter the compiled atlas images unless a real compiler defect is discovered.

**2. Audit Step 9.5 rendering code**

Review:

- `Blackrush.js`
- `Robot.js`
- `SpriteAnimationRegistry.js`
- `BootScene.js`
- `GameScene.js`

Identify any other newly introduced calls to APIs not supported by Phaser 3.88.2.

Check sprite construction, animation registration, texture loading, cleanup, and procedural fallback.

Do not change combat or movement logic.

**3. Verify complete scene initialization**

The game must successfully create:

- Blackrush.
- Chamber obstacles.
- Robot entities.
- EncounterDirector.
- Weapons and projectiles.
- HUD.
- Hearts and shield systems.
- Proxy systems.

A failed optional sprite initialization should not prevent the entire game from operating.

Where practical, fall back to existing procedural rendering if a sprite texture is missing or cannot be initialized.

Do not hide unrelated programming exceptions behind broad try/catch blocks.

**4. Preserve existing layout**

Before Step 9.5, the game used a 1280-pixel-wide world with responsive camera behavior.

The developer now reports that the game appears flush against the left side of the browser again.

Determine whether this is only a consequence of the interrupted GameScene initialization.

Once the crash is resolved, verify that the canvas and playable area remain centered correctly.

Do not modify camera bounds or world geometry unless a separate reproducible layout defect remains.

Preserve the existing HUD alignment.

**5. Automated regression tests**

Add targeted tests that verify:

- Blackrush constructs without unsupported Sprite method calls.
- Pursuer constructs successfully with a loaded atlas.
- Nearest-neighbor filtering uses supported Phaser APIs.
- Missing or unavailable artwork activates procedural fallback.
- GameScene initialization reaches completion.
- Existing movement and combat behavior remain functional.
- Scene shutdown and restart do not create duplicate sprites or animations.

Run:

```bash
npm run sprites:check
npm test
npm run build
```

**6. Real browser verification**

If browser automation is available, actually start the game and verify:

1. START GAME opens a functional GameScene.
2. Blackrush is visible with pixel art.
3. Blackrush moves with Assisted and Classic controls.
4. Mouse aiming and energy firing work.
5. Axe throwing works.
6. Procedural obstacles appear.
7. Pursuer sprites appear and move.
8. Other robot types retain procedural artwork.
9. The PIXEL ART toggle works.
10. Developer seeking and restarting work.
11. Canvas and HUD are centered.
12. No new console exceptions occur.

If actual browser execution is unavailable, clearly state that these checks require manual testing.

Do not describe a successful code audit as a successful browser playtest.

### Scope

This is a small corrective milestone.

Do not implement additional sprites, gameplay mechanics, animation states, bosses, difficulty changes, or visual effects.

Do not rewrite the asset compiler unless an actual compiler bug is discovered.

### Definition of done

The game initializes normally, Blackrush and Pursuer render with their PixelLab animations, and existing gameplay works without the `setSmoothing()` exception.

Report the exact root cause, modifications, tests, and browser verification.

**Stop after Step 9.5.1.**