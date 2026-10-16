# JUNIE TASK — LORELEI: DESCENT
## Step 5.1: Fix Robot Damage Rendering, Game Over Buttons, and Armored Robot Visuals

### 1. Project Context

We are developing LORELEI: DESCENT, a browser-based arcade shooter using JavaScript, Phaser 3.88.2, Vite, and Phaser Arcade Physics.

Steps 1 through 4.3 have been completed and verified.

Step 5 introduced robot AI, damage, armor, enemy lasers, shield depletion, explosions, and scoring.

The developer has tested the Step 5 implementation and discovered several problems.

**This is a corrective milestone. Do not implement Step 6 or add unrelated gameplay features.**

Preserve the current music-driven timeline, automatic descent, boss arena, weapons, and both control modes.

### 2. Problem A — Robot rendering crashes

During gameplay, particularly when robots receive damage or armor is broken, the game throws:

```text
Uncaught TypeError:
this.bodyGraphic.setTint is not a function

at Tween.onUpdate (Robot.js:291:34)
```

The error sometimes occurs after approximately 30 seconds of gameplay and is reproducible when hitting an armored robot with an axe.

#### Investigation

Inspect:

- `src/entities/Robot.js`
- Robot damage and armor-break methods.
- Hit reaction tweens.
- Destruction animation callbacks.
- Any related rendering or effects modules.

Identify the actual type of `bodyGraphic`.

The likely problem is that `bodyGraphic` is a Phaser Graphics object, whereas `setTint()` is being used as though it were a Sprite or Image.

Verify the actual API supported by the object.

#### Required fix

Correct the damage-feedback implementation using Phaser 3.88.2-compatible APIs.

Options include:

- Redrawing Graphics primitives with modified fill colors.
- Tweening a numeric color or flash-intensity property and using it during redraw.
- Displaying a temporary translucent overlay.
- Using a generated texture with a Sprite, if appropriate.

Prefer the smallest correction compatible with the existing architecture.

Do not convert every robot to a different rendering system merely to fix one method call.

Inspect all robot animation callbacks for similar invalid method usage.

Ensure that hit, stagger, armor-break, and destruction animations do not reference destroyed game objects.

Ensure that multiple rapid hits do not leave competing tweens attempting to update invalid state.

Stop or remove owned tweens during robot destruction and scene shutdown where necessary.

Do not mask rendering errors with broad try/catch blocks.

### 3. Problem B — Game Over buttons do nothing

When Blackrush's shield reaches zero, the game displays:

- SHIELD DEPLETED
- RESTART GAME
- BACK TO TITLE

Neither button responds to clicks.

The developer reports no JavaScript exceptions when clicking them.

However, restarting from the persistent DEVELOPMENT TOOLS panel does work.

#### Investigation

Inspect:

- `src/scenes/GameScene.js`
- `src/scenes/GameOverScene.js`
- `src/entities/Blackrush.js`
- `src/systems/TimelineDirector.js`
- `src/systems/AudioDirector.js`
- The code handling shield depletion and defeat.

Determine exactly how the game pauses when shield depletion occurs.

Check whether the implementation pauses GameScene itself, which may prevent its own buttons from receiving input.

Also inspect input enablement, event registration, button hit areas, display depth, and scene transition callbacks.

#### Required behavior

When shield depletion occurs:

1. Blackrush becomes defeated.
2. Combat stops immediately.
3. Music and timeline progression stop.
4. A functional Game Over interface appears.
5. RESTART GAME starts an entirely new game session.
6. BACK TO TITLE stops the session and returns to TitleScene.

Use GameOverScene, or an equivalent independent UI scene, if necessary to keep menu input working while gameplay is paused.

Do not unpause enemy combat merely to make buttons clickable.

Do not allow repeated shield-depletion callbacks to create duplicate overlays or transitions.

#### RESTART GAME

Must:

- Stop existing music playback.
- Reset the timeline to Synth 0:00.
- Reset shield to 100.
- Reset score to zero.
- Reset camera position.
- Clear projectiles.
- Clear enemy laser effects.
- Remove old robot instances.
- Restore normal gameplay input.
- Restore the selected Classic or Assisted control mode.
- Start Synth playback after a valid user interaction.
- Create a clean GameScene.

#### BACK TO TITLE

Must:

- Stop music.
- Stop the current game session.
- Clean up game-owned physics objects and event listeners.
- Close the Game Over display.
- Return to TitleScene.

START GAME should work normally afterward.

Do not leave an invisible paused scene or overlay intercepting input.

Preserve the globally owned AudioDirector and TimelineDirector architecture.

### 4. Problem C — Armored robots are difficult to recognize

The developer reports encountering robots that resist energy bolts but appear too similar to ordinary robots.

After being hit, one appeared yellow, and an axe strike triggered the rendering crash.

The armor mechanic should be visually obvious.

#### Required visual improvements

Keep the current primitive graphics approach but distinguish the three robot types clearly.

**Pursuer**

- Small.
- Red or dark red.
- Single bright eye.
- Light mechanical appearance.

**Sentinel**

- Clearly identifiable ranged unit.
- Distinct body shape or antenna-like components.
- Bright targeting eye.
- Visually different from Pursuers.

**Armored Pursuer**

- Approximately 20–30% larger than an ordinary Pursuer.
- Bulky gray or steel-colored armor plates.
- Dark red structural body.
- Distinct outer silhouette.
- Easily recognizable before taking damage.

When an axe breaks its armor:

- Armor plates visibly disappear or detach.
- A few metallic fragments fly outward.
- Its exposed mechanical body becomes orange or yellow.
- The exposed core is clearly visible.
- The robot remains alive until struck by an energy bolt.

Once exposed, an energy bolt must destroy the robot.

Do not change the established damage values unless correcting a demonstrated bug.

### 5. Combat behavior verification

Confirm that the damage model still behaves as specified:

| Enemy | Energy bolts | Axe |
|---|---|---|
| Pursuer | One hit kills | One hit kills |
| Sentinel | Two hits kill | One hit kills |
| Armored Pursuer | Blocked while armored | Removes armor |
| Exposed Armored Pursuer | One hit kills | Follow existing configured behavior |

Inspect whether repeated energy hits against intact armor can accidentally damage health.

Check that armor breaks exactly once.

Check that destroyed robots cannot award duplicate scores.

Check that knockback and hit reactions complete without exceptions.

### 6. Phaser lifecycle and tween safety

Audit ownership of temporary visual effects.

Make sure:

- A robot's active tweens are cleaned up when it is destroyed.
- No tween continues updating a destroyed Graphics object.
- Repeated hits don't create uncontrolled numbers of tweens.
- Scene shutdown removes scene-owned listeners.
- Game Over does not leave active robot animations running.
- Replay does not retain old enemies or collision bodies.
- Seeking clears transient combat objects correctly.

Keep cleanup explicit and scoped to the objects that own the resources.

Do not call `removeAllListeners()` indiscriminately on persistent shared systems.

### 7. Controls

Preserve both working control modes.

**Classic:** WASD or arrows for movement, mouse for aiming and firing.

**Assisted:** Mouse-follow movement with keyboard override.

The developer has tested both modes and wants to retain their current behavior.

Do not change their sensitivity, dead zone, or mouse-outside-canvas behavior during this task.

Keep existing configurable input parameters.

### 8. Tests

Extend the existing automated tests where practical.

At minimum, verify:

1. Armor prevents energy damage.
2. Axe removes armor exactly once.
3. Exposed armored robot dies from one energy hit.
4. Robot destruction does not award duplicate score.
5. Rapid repeated hits do not create invalid animation state.
6. Shield depletion triggers defeat only once.
7. Restart resets shield and score.
8. Restart resets the musical session.
9. Back to Title stops the session.
10. Replay does not accumulate listeners or physics objects.

For Phaser-specific Graphics and tween compatibility, perform a browser smoke test if browser automation is available.

Pure Node.js tests alone cannot establish that Phaser rendering APIs are used correctly.

### 9. Browser verification

Test the following sequence:

1. Start game in Classic mode.
2. Destroy several Pursuers.
3. Destroy several Sentinels.
4. Fire repeated energy bolts into an armored robot.
5. Hit the armored robot with an axe.
6. Observe its armor breaking and core becoming exposed.
7. Finish it with an energy bolt.
8. Repeat the armored-robot test several times.
9. Allow the shield to deplete.
10. Click RESTART GAME.
11. Confirm the game starts from Synth 0:00 with full shield.
12. Allow shield depletion again.
13. Click BACK TO TITLE.
14. Start the game in Assisted mode.
15. Repeat combat tests.
16. Jump to Victory and use Replay.
17. Confirm no browser console errors.

Also verify that the camera continues descending before Synth 5:00 and remains fixed afterward.

### 10. Build and documentation

Run:

```bash
npm test
npm run build
```

Update `docs/DEVELOPMENT.md` with a Step 5.1 maintenance entry.

Document:

- Exact cause of the Graphics API error.
- Rendering correction.
- Game Over input failure and its fix.
- New placeholder visual distinctions.
- Test results.
- Any remaining limitations.

### 11. Scope restrictions

Do not implement:

- Additional robot types.
- Music-controlled swarm spawning.
- Environmental collision response.
- Shield pickups or regeneration.
- Proxy boss.
- Super-robot.
- Grenade sequence.
- Panzer tank.
- Lorelei NPC.
- Sound effects.
- New sprite assets.
- Mobile input.
- New difficulty systems.

Do not alter the original MP3 recordings.

Avoid unrelated refactoring.

### 12. Definition of done

Step 5.1 is complete when:

- Robot hit animations no longer throw `setTint` errors.
- All three robot types are visually distinguishable.
- Armored robots visibly lose their plating.
- Armored robots can be finished with one energy bolt after armor removal.
- Game Over buttons work.
- Restart creates a clean game session.
- Back to Title works.
- Timeline playback and seeking remain functional.
- Both control modes remain unchanged.
- Browser testing reveals no rendering exceptions.
- Automated tests pass.
- Production build succeeds.

Provide a concise completion report identifying the root causes, files changed, browser testing performed, and any remaining issues.

Stop after Step 5.1. Do not begin Step 6.