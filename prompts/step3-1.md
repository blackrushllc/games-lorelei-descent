# JUNIE TASK — LORELEI: DESCENT
## Step 3.1: Fix Victory Scene Lifecycle Bug, Developer Timeline Updates, and Canvas Centering

### Project context

LORELEI: DESCENT is a Phaser 3.88.2 and Vite browser game.

Steps 1–3 are complete.

The game successfully plays and synchronizes three musical recordings:

- Below Gamorrah Synth — approximately 6:02
- Below Gamorrah Cathedral — approximately 4:01
- Below Gamorrah Studio — approximately 3:07

The TimelineDirector and AudioDirector control musical progression, track transitions, seeking, and developer debugging.

The developer has tested the complete musical sequence and discovered two problems.

**Fix these problems without implementing Step 4 or changing the intended game design.**

### Problem 1 — Timeline and HUD exception after Victory

When gameplay reaches Victory and transitions into EndingScene, the developer panel stops updating correctly.

Subsequent timeline jumps, restarts, and replays continue to change the music position, but the developer panel becomes stale.

The browser console reports:

```text
Uncaught TypeError:
Cannot read properties of null (reading 'drawImage')

at Frame.updateUVs
at Frame.setCutPosition
at Frame.setSize
at Text.updateText
at Text.setText
at Hud.setPhaseLabel (Hud.js:100)
at TimelineDirector.<anonymous> (GameScene.js:74)
at TimelineDirector.emit
at TimelineDirector.handleSeek
at TimelineDirector.update
```

This strongly suggests that GameScene has registered a listener with the persistent TimelineDirector, and that listener continues executing after GameScene shuts down and destroys its HUD.

#### Required investigation

Inspect:

- `src/scenes/GameScene.js`
- `src/scenes/EndingScene.js`
- `src/scenes/TitleScene.js`
- `src/ui/Hud.js`
- `src/ui/TimelineDebugPanel.js`
- `src/systems/TimelineDirector.js`
- `src/systems/AudioDirector.js`

Identify the actual cause rather than merely suppressing the exception.

Pay particular attention to listener ownership and Phaser scene lifecycle behavior.

#### Required correction

1. Ensure GameScene unregisters all timeline event listeners when the scene shuts down.
2. Use Phaser's scene shutdown lifecycle event to perform cleanup.
3. Unregister callbacks using their exact function references, event names, and listener contexts as appropriate.
4. Avoid anonymous persistent event handlers that cannot subsequently be removed.
5. Apply the same lifecycle discipline to EndingScene and any other scenes that subscribe to persistent systems.
6. Do not destroy or recreate the global TimelineDirector merely because a scene changes.
7. Prevent callbacks from accessing destroyed Phaser game objects.
8. Ensure the developer panel remains connected to the active timeline throughout scene transitions.
9. Verify the panel remains functional after any number of replay and restart cycles.

Do not use `removeAllListeners()` indiscriminately on a shared emitter, because doing so could remove subscribers belonging to other systems.

Do not hide the problem by wrapping HUD updates in silent try/catch blocks.

Do not merely add a null check to Hud.setPhaseLabel as the primary solution.

Fix the lifecycle ownership problem.

#### Persistent timeline ownership

Establish a clear ownership rule:

- TimelineDirector and AudioDirector belong to the lifetime of the Phaser game or an equivalent persistent application controller.
- Individual scenes subscribe to their events while active.
- Individual scenes unsubscribe when shut down.
- The developer panel subscribes independently of GameScene and EndingScene.
- Restarting a game should reset the intended timeline session without leaving stale listeners or duplicated active playback.

If the current implementation violates this model, correct it with the smallest reasonable refactoring.

### Problem 2 — Developer panel freezes or becomes stale

The development tools display correctly during the first playback.

After entering Victory, the display stops updating even though the audio seeking controls still operate.

#### Required correction

The panel must always display the current authoritative state of the TimelineDirector.

It must not depend on GameScene remaining active.

Verify that its lifecycle and update mechanism survive:

- GameScene to EndingScene.
- EndingScene to GameScene via Replay.
- EndingScene to TitleScene.
- TitleScene to GameScene via Start Game.
- Seeking backward from Studio to Synth.
- Seeking from Cathedral to Studio.
- Multiple successive seek operations.

Ensure that its refresh mechanism is not inadvertently destroyed, disabled, or detached when one Phaser scene shuts down.

Avoid installing multiple competing polling loops or duplicate event listeners after replay.

If the debug panel is attached to the document, make sure it remains mounted appropriately without recreating duplicate controls.

### Problem 3 — Phaser canvas is still offset horizontally

The developer reports that the playable area remains shifted to the right despite the centering change made in Step 3.

The desired layout is:

- The Phaser canvas is geometrically centered in the browser viewport.
- There is equal available horizontal space to the left and right of the canvas.
- The game uses a logical 640 × 960 resolution.
- Phaser Scale.FIT continues to preserve aspect ratio.
- On narrow screens, the canvas scales down without causing page overflow.
- The development tools should not shift the canvas.

#### Required investigation

Inspect:

- `index.html`
- `src/styles/main.css`
- `src/config/gameConfig.js`
- `src/ui/TimelineDebugPanel.js`

Determine whether the offset is caused by:

- CSS flexbox or grid positioning.
- The width or positioning of the developer panel.
- A parent container with unexpected width or padding.
- Phaser CENTER_BOTH applying alignment in combination with CSS positioning.
- A mismatch between the viewport and game container dimensions.

#### Required layout

Use a full-viewport game stage or equivalent container that is independent of the debug panel.

The stage must fill the viewport and center its Phaser canvas.

The developer panel should be positioned separately, preferably using fixed positioning on desktop.

The debug panel must not change the width or horizontal centering of the gameplay stage.

Where the developer panel overlaps the canvas on a narrow viewport, provide a collapsible or toggleable panel rather than shrinking or shifting the canvas unexpectedly.

Avoid hardcoded horizontal offsets.

Do not modify the game's logical resolution.

Do not add permanent promotional side panels.

#### Layout verification

Where browser automation or runtime inspection is available, measure:

- Viewport width.
- Canvas bounding rectangle.
- Canvas center.
- Viewport center.

Calculate horizontal centering error:

`canvasCenterX - viewportCenterX`

For an unobstructed desktop viewport, the error should be approximately zero, ideally within one CSS pixel.

Check with the developer panel both visible and hidden.

If browser automation is unavailable, provide instructions for the developer to run the measurement using browser DevTools.

### Problem 4 — Robust replay and restart behavior

Verify that the following actions work reliably:

1. Finish Synth.
2. Finish Cathedral.
3. Enter Victory.
4. Seek backward to the Proxy phase.
5. Seek forward to the first Panzer shot.
6. Seek to Victory again.
7. Click Replay.
8. Click Restart Current Track.
9. Return to Title.
10. Start Game again.

During this sequence:

- No destroyed scene objects may be updated.
- No browser console exceptions may occur.
- The correct scene must be displayed for the selected musical position.
- Music playback must reflect the selected track and position.
- The developer panel must remain synchronized.
- No overlapping music instances may occur.
- Timeline event listeners must not accumulate.

In particular, seeking from Studio back into Synth or Cathedral must reactivate GameScene if EndingScene is currently displayed.

Seeking from gameplay into Studio must activate EndingScene.

Treat scene reconciliation as an explicit responsibility of the application-level timeline/session controller, rather than allowing arbitrary scene-specific listeners to initiate conflicting transitions.

### Testing requirements

Add regression tests where feasible.

At minimum, test:

- Scene listeners are removed on shutdown.
- Persistent timeline listeners remain available across scene transitions.
- Replay resets timeline state correctly.
- Seeking from Studio into gameplay selects the appropriate scene.
- Seeking from gameplay into Studio selects EndingScene.
- No duplicate event subscriptions accumulate after multiple replay cycles.
- One-shot events remain correctly deduplicated within each playback session.

Use the existing Node.js test infrastructure for pure logic.

For Phaser scene lifecycle testing, browser-based smoke tests or small test harnesses are acceptable.

Do not introduce a heavyweight test framework merely for this correction.

### Documentation

Update `docs/DEVELOPMENT.md` with a brief Step 3.1 maintenance entry.

Document the listener-ownership policy and how the debug panel is managed.

If CSS or markup changes materially affect the project setup, update README accordingly.

### Verification

Run:

```bash
npm test
npm run build
```

If `npm test` is not defined, use the repository's existing Node.js test command and document it.

Perform browser verification when available.

Explicitly report whether the canvas centering measurement was performed or still requires manual verification.

### Scope restrictions

Do not implement:

- Player movement.
- Weapons.
- Robot behavior.
- Combat.
- Shield damage.
- Automatic scrolling.
- Boss fight mechanics.
- Additional artwork.
- New audio assets.
- New game phases.

Preserve all Step 3 features and existing musical cue configuration.

Avoid broad unrelated refactoring.

### Definition of done

Step 3.1 is complete when:

1. Victory no longer causes stale HUD callbacks.
2. No destroyed Phaser objects receive updates.
3. The developer panel continues updating after Victory.
4. Seeking between Studio and gameplay tracks switches scenes correctly.
5. Replay and Restart work repeatedly.
6. Music remains synchronized.
7. The Phaser canvas is centered relative to the browser viewport.
8. The debug panel does not alter canvas centering.
9. Tests and production build pass.
10. No Step 4 gameplay mechanics have been introduced.

Provide a completion report listing the root causes, code changes, test results, canvas-centering verification, and any remaining limitations.

Stop after completing Step 3.1.