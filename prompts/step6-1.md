# JUNIE TASK — LORELEI: DESCENT
## Step 6.1: Repair Cathedral-to-Studio Transition and Scene Lifecycle Safety

### Project Context

LORELEI: DESCENT is a Phaser 3.88.2 browser arcade shooter using JavaScript ES modules, Vite, and Phaser Arcade Physics.

Steps 1 through 6 are implemented. The developer has manually verified that combat, environmental collisions, hearts, respawning, seeking, and restart are now working well.

One reproducible exception remains during the **natural transition from Cathedral to Studio**.

Do not begin Step 7. This is a focused maintenance task.

### 1. Confirmed runtime failure

The developer reproduced the issue by seeking to PANZER 2 during Cathedral and allowing the track to finish naturally.

The Studio piano music begins, but the arena remains visible instead of showing the MISSION COMPLETE EndingScene.

The browser reports:

```text
AudioDirector: Playing track studio (studio)
TimelineDirector: Event VICTORY_START fired at 0s
TimelineDirector: Phase changed to VICTORY
main.js: Switching to EndingScene
EndingScene: Loaded.
GameScene: TRACK_START: STUDIO

Uncaught TypeError:
Cannot read properties of undefined (reading 'size')
    at PhysicsGroup.clear
    at WeaponSystem.reset (WeaponSystem.js:105)
    at TimelineDirector.onTrackStart (GameScene.js:689)
    at TimelineDirector.emit
    at TimelineDirector.startTrack
    at TimelineDirector.onTrackComplete
```

After the exception, the game may become unresponsive to developer seeking and restart controls.

However, seeking directly to VICTORY from the initial game works.

### 2. Probable cause

There appears to be a lifecycle race or stale event subscription.

When Studio starts, `main.js` initiates the scene transition to EndingScene.

A `trackStart` listener registered by GameScene also runs, apparently after GameScene's physics resources have been invalidated.

That handler calls `WeaponSystem.reset()`, which tries to clear an invalid Phaser physics group.

This is a hypothesis supported by the log, not a substitute for source inspection.

**Inspect the actual execution order and identify the precise root cause.**

### 3. Inspect the relevant implementation

Review:

- `src/main.js`
- `src/scenes/GameScene.js`
- `src/scenes/EndingScene.js`
- `src/systems/WeaponSystem.js`
- `src/systems/TimelineDirector.js`
- `src/systems/AudioDirector.js`
- Scene shutdown handlers
- Timeline event subscriptions
- Mission/session transition logic
- Developer seeking and restart logic

Examine how GameScene subscribes and unsubscribes to `trackStart`, `phaseChanged`, and timeline events.

Pay special attention to synchronous event dispatch and listener registration order.

### 4. Correct scene ownership

Establish the following invariant:

**GameScene must not operate on its Phaser objects after the scene has begun shutting down or has been destroyed.**

Only process GameScene-owned track events while GameScene is active and its resources are valid.

Studio belongs to EndingScene, not GameScene.

A Studio `trackStart` must not cause GameScene to rebuild combat, reset weapons, or access physics groups.

The application-level scene coordinator in `main.js` must remain responsible for scene transitions.

Preserve the centralized mission architecture from Step 5.3.

Do not add another independent scene-start path.

### 5. Listener cleanup

Ensure that GameScene removes its named timeline listeners during shutdown.

Use precise listener references for unsubscription.

Do not globally remove all listeners from TimelineDirector or AudioDirector.

Check for:

- Listeners remaining after GameScene shutdown.
- Listener callbacks invoked during a synchronous scene transition.
- Listeners registered twice after restarting or seeking.
- Callbacks that capture destroyed scene-owned objects.
- Old session callbacks affecting a newer mission.

Where relevant, guard event callbacks against inactive, shutting-down, or destroyed scenes.

A callback should never assume that Phaser resources still exist merely because it was originally registered by GameScene.

### 6. WeaponSystem.reset lifecycle safety

Inspect `WeaponSystem.reset()` and its use of Phaser Physics Groups.

The reset method must be safe when invoked during a normal, active gameplay reset.

It must not attempt to clear a destroyed physics group.

If possible, distinguish between:

- Resetting active weapons during gameplay.
- Disposing weapons during scene shutdown.

Avoid calling reset after ownership of the physics groups has ended.

Do not merely wrap `PhysicsGroup.clear()` in a broad try/catch.

Correct the ownership or call ordering.

A defensive validity check may be appropriate, but it should supplement the lifecycle repair rather than conceal a broken transition.

### 7. Preserve intended track transitions

The normal musical sequence is:

1. Synth.
2. Cathedral.
3. Studio.

Expected behavior:

**Synth to Cathedral**

- GameScene remains active.
- Correct arena camera and geometry remain in place.
- Player, hearts, shield, and score persist.
- Combat continues.

**Cathedral to Studio**

- Combat ceases.
- GameScene shuts down cleanly.
- Scene-owned physics objects, lasers, projectiles, and listeners are cleaned up.
- EndingScene becomes visible.
- Studio music plays.
- The MISSION COMPLETE victory interface is displayed.

Do not accidentally reset the entire mission when transitioning between tracks.

Do not alter track durations, timestamps, or the original MP3 assets.

### 8. Developer seeking

Preserve direct seeking to:

- CHASE.
- SWARM.
- PROXY.
- CATHEDRAL.
- PANZER 1.
- PANZER 2.
- VICTORY.

The scene and soundtrack must always agree.

Seeking to VICTORY must display EndingScene.

Seeking backward from VICTORY into gameplay must recreate a valid GameScene with working weapons, robot encounters, player, shield, hearts, and collision geometry.

Seeking while EndingScene is active must not invoke GameScene callbacks on destroyed resources.

### 9. End-state UI

Once Studio starts naturally, the expected screen must be the same EndingScene that appears when the developer selects VICTORY directly.

The developer should see:

- MISSION COMPLETE.
- Existing victory presentation.
- Working replay/navigation controls.
- Continued Studio piano music according to current design.

Do not introduce a new victory presentation.

Do not change the existing ending design.

### 10. Tests

Extend automated tests with targeted lifecycle and event-dispatch checks.

Test:

1. Synth-to-Cathedral leaves GameScene active.
2. Cathedral-to-Studio requests EndingScene exactly once.
3. GameScene ignores Studio-specific combat reset behavior.
4. GameScene removes scene-owned timeline listeners on shutdown.
5. No stale listener accesses disposed physics groups.
6. WeaponSystem reset works during an active GameScene.
7. WeaponSystem disposal does not access invalid Physics Groups.
8. Direct seeking to VICTORY works.
9. Natural transition to VICTORY works.
10. Seeking backward from EndingScene rebuilds gameplay.
11. Repeated transitions do not accumulate listeners.
12. Restart after victory begins a clean mission.

Use the real listener and transition logic wherever possible.

Do not test only mock implementations that omit the problematic synchronous event sequence.

### 11. Browser acceptance verification

Test these exact scenarios if browser automation is available.

**Scenario A — Original reproduction**

1. Start game.
2. Jump to PANZER 2.
3. Allow Cathedral to complete naturally.
4. Verify Studio music begins.
5. Verify the arena disappears.
6. Verify EndingScene displays MISSION COMPLETE.
7. Verify there are no console exceptions.

**Scenario B — Direct seek**

1. Start game.
2. Jump directly to VICTORY.
3. Verify EndingScene displays.
4. Jump back to SWARM.
5. Confirm combat works.
6. Jump to VICTORY again.

**Scenario C — Repeated transitions**

1. Jump to PANZER 2.
2. Allow natural victory.
3. Replay.
4. Jump to PANZER 2 again.
5. Allow natural victory again.
6. Confirm the second transition works identically.

**Scenario D — Normal track transition**

1. Jump near the end of Synth.
2. Allow it to enter Cathedral naturally.
3. Confirm GameScene remains healthy.
4. Confirm player and encounters remain functional.

**Scenario E — Robustness with combat effects**

1. Spawn several Sentinels near the end of Cathedral.
2. Allow them to target and fire.
3. Let Cathedral finish during active combat.
4. Confirm EndingScene appears correctly without stale laser or physics errors.

This final scenario is particularly important because the developer reproduced the issue while fighting multiple Sentinels.

If browser automation is unavailable, provide explicit manual steps and report that they remain unverified.

### 12. Build and documentation

Run:

`npm test`

`npm run build`

Update `docs/DEVELOPMENT.md` with:

- Exact root cause.
- Listener or scene-lifecycle correction.
- WeaponSystem correction, if required.
- Tests added.
- Verification results.
- Any remaining limitations.

### 13. Scope restrictions

Do not implement:

- Music-controlled swarms.
- New robot attacks.
- Catch-up movement.
- More enemy archetypes.
- New obstacles.
- New weapons.
- Boss encounters.
- Artwork.
- Additional audio.
- UI redesign.
- Survival-system rebalance.

Preserve Classic and Assisted controls.

Preserve the existing six-heart system.

Preserve all working environmental collision behavior.

### 14. Definition of done

Step 6.1 is complete when:

- Cathedral naturally transitions to Studio.
- EndingScene appears reliably.
- GameScene no longer accesses destroyed physics groups.
- WeaponSystem cleanup is safe.
- The developer can jump between gameplay and victory repeatedly.
- Restart and Replay still work.
- No stale timeline listeners cause exceptions.
- All automated tests pass.
- Production build succeeds.
- Browser-level behavior is verified or clearly identified as requiring manual testing.

Provide a completion report identifying the root cause, modified files, tests, browser verification, and any outstanding issues.

Stop after Step 6.1.