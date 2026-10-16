# JUNIE TASK — LORELEI: DESCENT
## Step 4.1: Fix Projectile Physics Initialization and GameScene Startup

### Context

We are implementing Step 4 of LORELEI: DESCENT, a Phaser 3.88.2 and JavaScript browser game.

Step 4 introduced player movement, mouse aiming, projectiles, throwing axes, and automatic camera descent.

The application currently fails immediately after clicking START GAME.

The music begins, but the screen continues displaying the title screen.

The browser console reports:

```
Uncaught TypeError: Cannot read properties of null (reading 'reset')
    at Projectile.enableBody (phaser.js:107895:29)
    at Projectile.fire (Projectile.js:19:14)
    at WeaponSystem.fireEnergy (WeaponSystem.js:50:28)
    at Blackrush.update (Blackrush.js:80:37)
    at GameScene.update (GameScene.js:144:21)
```

Developer timeline controls continue working.

**This is a corrective task. Fix the underlying problem without implementing additional gameplay features.**

### 1. Investigate the projectile lifecycle

Inspect:

- `src/entities/Projectile.js`
- `src/systems/WeaponSystem.js`
- `src/entities/Blackrush.js`
- `src/scenes/GameScene.js`

Determine exactly how Projectile instances are created, registered with the physics world, disabled, pooled, and reused.

The error strongly suggests that `enableBody()` is being called on a Projectile whose Arcade Physics body is null.

Check whether the constructor creates the projectile through a normal Phaser game-object mechanism without registering it with the Arcade Physics world.

For a class extending `Phaser.Physics.Arcade.Sprite`, constructing it with `new Projectile(...)` does not automatically guarantee that an Arcade Physics body has been installed.

Confirm whether the current implementation appropriately calls the physics world's enable mechanism or uses a physics-enabled group that automatically provisions bodies.

### 2. Correct the physics initialization

Ensure that every Projectile has a valid Arcade Physics body before `fire()` attempts to call `enableBody()`.

Use the appropriate Phaser 3.88.2 initialization approach.

For example, if projectiles are constructed manually, the architecture may require explicitly adding the object to the scene and enabling its Arcade Physics body.

Alternatively, use an appropriate Arcade Physics group that creates and manages physics-enabled projectiles.

Choose whichever solution best fits the existing project structure.

Do not create duplicate physics bodies.

Do not silently catch or suppress initialization exceptions.

Do not work around the problem by replacing `enableBody()` with unrelated position updates while leaving physics state inconsistent.

Make sure manually constructed, pooled, and reactivated projectiles all follow a consistent lifecycle.

### 3. Verify projectile pooling

Inspect any projectile pooling in WeaponSystem.

Confirm that:

- Every pooled projectile starts with a valid physics body.
- Inactive projectiles are properly disabled.
- Reactivated projectiles can call `enableBody()` successfully.
- No projectile is reused after destruction.
- Expired projectiles can be reused without errors.
- Energy bolts and axes both use correct physics initialization.
- Repeated firing does not accumulate unbounded objects.
- Shutdown cleans up projectiles appropriately.

Distinguish between disabling a physics body and destroying the object that owns it.

If the current pooling implementation mixes these concepts, correct it.

### 4. Investigate automatic firing

The stack trace indicates that firing occurs during the first GameScene update.

Check whether the primary weapon is accidentally interpreted as continuously pressed before the player has clicked or held the fire button.

The mouse click used to activate START GAME must not also trigger the energy weapon in the newly created GameScene.

Input state should begin neutral:

- No movement.
- No firing.
- No secondary weapon request.

Only deliberate gameplay input should activate weapons.

Ensure that switching scenes doesn't carry an unintended mouse-button state into the new scene.

### 5. Investigate the title screen remaining visible

The developer reports that clicking START GAME begins the music, but the title screen remains visible.

Check whether:

- TitleScene is properly stopped when GameScene starts.
- GameScene is successfully initialized.
- An exception during the first update interrupts normal rendering.
- The scene transition has been partially completed.
- Multiple scenes remain active unintentionally.

Correct any confirmed scene lifecycle problem.

Do not assume the projectile exception is the only cause without verification.

### 6. Preserve existing architecture

Preserve:

- AudioDirector.
- TimelineDirector.
- Musical cue configuration.
- Global timeline update loop.
- Developer timeline panel.
- Scene reconciliation.
- Canvas centering.
- Camera descent calculations.
- Player controls.
- Weapon configuration.
- HUD.

Avoid unrelated refactoring.

Do not introduce additional dependencies.

### 7. Regression testing

Add appropriate tests or focused diagnostics for:

1. Projectile creation.
2. Physics body initialization.
3. Projectile activation.
4. Projectile deactivation.
5. Projectile reuse after expiration.
6. Energy weapon firing.
7. Axe firing.
8. GameScene startup without unintended firing.
9. Scene shutdown and restart.

Where tests require a real Phaser browser environment, use a browser smoke test rather than attempting to run Phaser rendering in Node without the necessary environment.

Verify that:

- START GAME opens GameScene.
- Blackrush is visible.
- Music starts correctly.
- Player movement works.
- Left-click fires energy bolts.
- Right-click throws an axe.
- Projectiles travel correctly.
- Projectiles expire and can be reused.
- Automatic descent works.
- Timeline seeking works.
- Victory and Replay work.
- No console exceptions occur.

### 8. Build verification

Run the existing tests and:

```bash
npm run build
```

If browser testing is unavailable, explain what requires manual verification.

### 9. Documentation

Add a brief maintenance entry for Step 4.1 to `docs/DEVELOPMENT.md`.

Do not mark Step 4 as fully verified until the browser gameplay has been tested successfully.

### 10. Definition of done

This correction is complete when:

- Projectiles have valid physics bodies.
- `Projectile.fire()` no longer throws.
- START GAME transitions to the gameplay display.
- Energy bolts can fire repeatedly.
- Throwing axes work.
- Projectile pooling works.
- Scene restart works without stale physics objects.
- Music synchronization continues operating correctly.
- Existing tests and the production build pass.

Provide a concise report of the exact root cause, changes made, tests performed, and any remaining limitations.

Stop after fixing these issues.

Do not implement Step 5.