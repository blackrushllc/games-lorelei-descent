# JUNIE TASK — LORELEI: DESCENT
## Step 4.3: Fix Assisted Movement Crash and Validate Pointer Coordinates

### Context

LORELEI: DESCENT is a browser-based arcade shooter using JavaScript, Phaser 3.88.2, and Vite.

Step 4.2 introduced optional mouse-assisted movement and a fixed boss arena.

Classic movement works correctly, but selecting Assisted mode causes a runtime exception:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'contains')
    at DesktopControls.calculateAssistedMovement (DesktopControls.js:114:60)
    at DesktopControls.update (DesktopControls.js:80:18)
    at GameScene.update (GameScene.js:141:23)
```

**Fix the Assisted movement implementation without adding new gameplay features.**

### 1. Identify the exact root cause

Inspect:

- `src/controls/DesktopControls.js`
- `src/entities/Blackrush.js`
- `src/scenes/GameScene.js`
- `src/config/gameplayConfig.js`

Examine line 114 of DesktopControls.js.

Identify precisely which object is undefined when `.contains()` is called.

Determine whether the problem involves:

- An invalid or unavailable Phaser API.
- A missing camera viewport rectangle.
- An uninitialized geometry object.
- A reference to a nonexistent property.
- Incorrect pointer-coordinate handling.

Do not assume the cause before inspecting the code.

### 2. Correct pointer boundary detection

Assisted movement should activate only while the pointer is within the Phaser gameplay canvas.

Implement reliable detection using APIs compatible with Phaser 3.88.2.

Prefer explicit checks against the logical game bounds or a validated Phaser geometry rectangle rather than relying on an undocumented `.contains()` property.

Remember:

- The game uses a logical resolution of 640 × 960.
- The canvas is scaled using Phaser Scale.FIT.
- The canvas is centered using CSS.
- Pointer coordinates must be interpreted consistently.
- Camera scrolling changes world coordinates but not the visible logical viewport boundaries.

Be careful to distinguish:

- Browser client coordinates.
- Canvas-relative logical coordinates.
- Camera-relative screen coordinates.
- Phaser world coordinates.

For detecting whether the pointer is inside the canvas, use an appropriate screen-space or DOM bounding rectangle check.

For calculating assisted movement, use a consistent coordinate system for both Blackrush and the pointer.

Do not assume the pointer's world coordinates are valid when it is outside the canvas.

### 3. Preserve Assisted movement behavior

The intended behavior is:

- Classic mode: WASD movement, mouse aiming, no mouse-follow movement.
- Assisted mode: Mouse-follow movement when the pointer is outside a configurable dead zone around Blackrush.
- WASD or arrow keys override assisted movement.
- Right mouse button temporarily suppresses assisted movement.
- Pointer outside the gameplay canvas disables assisted movement.
- Pointer over the developer panel does not cause assisted movement.
- Pausing music disables movement.
- The mouse continues controlling aim independently.

Preserve the existing configured dead-zone and full-speed radii.

Do not change movement speed or acceleration unless required to fix an identified bug.

### 4. Handle pointer coordinates defensively

Ensure Assisted mode does not throw exceptions when:

- GameScene has just started.
- The pointer has not yet moved.
- The player switches from Classic to Assisted.
- The mouse leaves the canvas.
- The mouse moves over the developer tools panel.
- The camera scrolls.
- The developer seeks to the boss arena.
- The browser window is resized.
- The player returns from Victory via Replay.

Any unavailable pointer information should produce a neutral movement intent rather than crashing.

Do not conceal unrelated programming errors with broad try/catch blocks.

### 5. Check event handling

Make sure Assisted mode does not interfere with:

- Left-click energy firing.
- Right-click axe throwing.
- The START GAME click carry-over protection.
- Keyboard movement.
- Mouse aiming.
- Developer timeline controls.

Avoid adding duplicate pointer listeners when GameScene is restarted.

### 6. Regression tests

Add focused tests for:

1. Valid pointer inside canvas.
2. Pointer outside canvas.
3. Pointer inside the dead zone.
4. Pointer outside the dead zone.
5. Pointer outside full-speed radius.
6. Keyboard override.
7. Right-button movement suppression.
8. Missing or uninitialized pointer information.
9. Camera offset and coordinate conversion.
10. Canvas resizing.
11. Assisted mode after scene restart.

Extract pure geometry or movement functions where helpful so they can be tested using Node.js without starting Phaser.

Do not introduce unnecessary dependencies.

### 7. Verification

Run:

```bash
npm test
npm run build
```

If browser automation is available, test Assisted mode directly.

Confirm:

- The game starts successfully in Assisted mode.
- No `.contains()` exception occurs.
- Blackrush moves toward the pointer outside the dead zone.
- Blackrush stops following within the dead zone.
- WASD overrides mouse movement.
- Weapon controls still work.
- The camera descends correctly.
- The camera stops at Synth 5:00.
- Developer seeking works.
- Victory and Replay work without exceptions.

If browser testing is unavailable, provide manual verification instructions.

### 8. Documentation

Add a short Step 4.3 maintenance entry to `docs/DEVELOPMENT.md`.

Document the root cause and correction.

### 9. Scope restrictions

Do not implement:

- Robot AI.
- Robot combat.
- Damage or health mechanics.
- Boss fights.
- Sound effects.
- Additional artwork.
- Mobile controls.
- New gameplay features.

Preserve all existing functionality.

### 10. Definition of done

Step 4.3 is complete when:

- Assisted movement runs without exceptions.
- Pointer detection works correctly.
- Mouse-follow movement respects its dead zone.
- Keyboard override works.
- Weapon input remains functional.
- Timeline seeking and camera modes remain correct.
- Tests pass.
- Production build succeeds.

Provide a concise completion report identifying the exact root cause, changed files, test results, and any limitations.

Stop after Step 4.3.