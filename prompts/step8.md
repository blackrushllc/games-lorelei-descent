
# LORELEI: DESCENT — STEP 8
## Initial Proxy Escape — Minimal Gameplay Implementation

### Objective

Implement one brief gameplay event at the beginning of the Synth track.

At the start of a new game, Blackrush and the Proxy are both visible. The Proxy immediately runs downward and disappears beyond the bottom of the camera viewport.

The player understands that Blackrush is pursuing the Proxy.

**Keep this implementation deliberately small. Do not build a cinematic introduction.**

### 1. Opening behavior

At Synth 0:00:

- Blackrush appears in his normal starting position.
- A temporary Proxy entity is visible ahead of him, toward the lower portion of the playable area.
- The Proxy immediately moves downward.
- It travels faster than Blackrush can move.
- It exits through the bottom of the visible camera area.
- Once fully outside the viewport, it is safely deactivated or removed.
- Normal gameplay continues without interruption.

The Proxy should be visible only briefly, approximately 2–4 seconds.

There should be no lengthy pursuit sequence or scripted camera movement.

### 2. Proxy appearance

The developer will supply the final sprite artwork separately.

The sprite will depict the Proxy carrying Nadine.

For now:

- Use a simple placeholder representation.
- Make the placeholder visually distinct from ordinary robots.
- Provide an easily replaceable asset reference or texture key.
- Keep its visual dimensions configurable.

Do not generate artwork.

Do not create elaborate animations or procedural visual effects.

Do not attempt to draw Nadine separately.

The eventual Proxy-carrying-Nadine sprite should replace the placeholder without requiring gameplay changes.

### 3. Proxy movement

The opening Proxy is a simple scripted entity.

Its movement should be:

- Straight downward.
- Fast enough that Blackrush cannot catch it.
- Relative to the current world and camera position.
- Deterministic from Synth musical time.

The Proxy must remain ahead of Blackrush until it disappears.

Do not implement sophisticated AI or pathfinding.

Do not allow ordinary obstacle collisions to interrupt its escape. Choose a clear starting corridor or a valid escape path through the environment rather than letting it visibly pass through solid machinery.

Do not modify the existing chamber layout unnecessarily.

### 4. Player interaction

Blackrush remains fully controllable.

However:

- Player energy bolts cannot damage the opening Proxy.
- Throwing axes cannot damage it.
- The Proxy has no health or armor.
- The Proxy does not attack Blackrush.
- The Proxy does not cause contact damage.
- The Proxy does not block Blackrush's movement.
- Blackrush cannot overtake it.

The simplest implementation is to exclude the opening Proxy from ordinary combat and physics collision groups.

Do not register it as a normal robot.

### 5. Musical synchronization

The Synth recording remains the authoritative timeline.

The opening Proxy's position and visibility should derive from the current musical timestamp.

Use a small configuration entry defining:

- Appearance time.
- Starting position.
- Escape speed or deterministic movement path.
- Exit time.
- Placeholder sprite key.

Use the current audio time to determine the Proxy's position.

Do not use independent timers for its disappearance.

The developer will separately add Nadine's cry for help to the musical recording.

**Do not modify, replace, or generate audio.**

Do not attempt to detect Nadine's cry programmatically.

### 6. Seeking and restarting

Developer seeking must remain reliable.

Expected behavior:

- Seek to Synth 0:00: Proxy appears in its initial position.
- Seek to Synth 0:01: Proxy is partway through its escape.
- Seek to Synth 0:03: Proxy is near or beyond the lower viewport boundary, depending on configured timing.
- Seek to Synth 0:10: Proxy is gone.
- Seek backward to Synth 0:00: Proxy reappears correctly.
- Restart Mission: Proxy appears again at the beginning.
- Seek to another track: No opening Proxy remains.

Do not leave stale entities or event listeners after seeking, restarting, or leaving GameScene.

### 7. Existing gameplay

Preserve everything that currently works:

- Classic and Assisted movement.
- Music-driven descent.
- Energy bolts and throwing axes.
- Robot AI and encounters.
- Solid obstacles and tactical cover.
- Hearts and shields.
- Respawning.
- EncounterDirector.
- Musical swarms and retreats.
- Fixed arena.
- Developer tools.
- Natural victory transitions.
- Restart and Replay.

The existing robot swarm still begins at Synth 0:45.

Do not change its timing or choreography.

### 8. Future compatibility

The opening Proxy is not the full Proxy boss.

The full Proxy boss will be implemented in a later milestone and may use a different sprite representing the Proxy without Nadine.

Keep the opening escape implementation independent from future boss mechanics.

Do not implement the boss now.

### 9. Tests

Add focused tests confirming:

1. Opening Proxy exists at Synth 0:00.
2. Proxy moves downward as musical time advances.
3. Proxy remains ahead of Blackrush.
4. Proxy disappears after its brief escape.
5. Player attacks cannot damage it.
6. Proxy does not cause player damage or physical obstruction.
7. Seeking backward recreates its state.
8. Restart recreates it.
9. Normal swarm spawning still begins at 0:45.
10. Scene cleanup removes the temporary entity safely.

Run:

`npm test`

`npm run build`

### 10. Manual verification

Verify:

- Start game: Blackrush and Proxy are visible.
- Proxy immediately flees downward.
- Proxy leaves the screen within a few seconds.
- Blackrush can move and shoot normally.
- Attacks have no effect on the Proxy.
- Seeking backward recreates the escape.
- Restart works.
- The swarm begins normally afterward.
- No JavaScript errors occur.

### 11. Strict scope exclusions

Do not implement:

- Cinematic intro.
- Cutscenes.
- Narration.
- Dialogue boxes.
- Title animations.
- Mood or atmospheric effects.
- Additional lighting effects.
- New soundtrack or sound effects.
- Nadine's voice.
- Full Proxy boss.
- German soldier.
- Grenade.
- Lorelei companion.
- Widescreen conversion.
- Outro or ending presentation.
- New environmental artwork.

Do not alter the original musical recordings.

Do not introduce a new gameplay scene.

### Definition of done

Step 8 is complete when the Proxy appears at the beginning, immediately flees offscreen carrying the implied Nadine, cannot be attacked or caught, and disappears cleanly while normal gameplay proceeds.

Provide a brief completion report covering changed files, behavior, tests, and any limitations.

**Stop after Step 8. Do not begin Step 8.5 or Step 9.**