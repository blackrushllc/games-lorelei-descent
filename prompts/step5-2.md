# JUNIE TASK — LORELEI: DESCENT
## Step 5.2: Repair Combat Damage, Robot Destruction, and Game Restart State

### 1. Project Context

We are developing LORELEI: DESCENT, a browser-based arcade shooter using JavaScript, Phaser 3.88.2, Vite, and Phaser Arcade Physics.

Previous milestones established:

- Music-synchronized gameplay.
- Scrolling underground chamber.
- Fixed boss arena.
- Classic and Assisted movement.
- Energy bolts and throwing axes.
- Robot AI.
- Damage and armor mechanics.
- Shield depletion and Game Over.
- Developer timeline controls.

Step 5.1 corrected a Phaser Graphics `setTint()` exception, improved armored robot visuals, and repaired Game Over button interactions.

However, Step 5.1 introduced or exposed serious gameplay regressions.

**Your task is to diagnose and repair these regressions. Do not introduce Step 6 features.**

### 2. Observed Problems

#### Problem A: Ordinary robots cannot be killed

The developer reports:

- Energy bolts appear to have no effect on ordinary robots.
- Throwing axes appear ineffective against ordinary robots.
- Robot destruction is not occurring as expected.
- No JavaScript exceptions are reported.

Previously, robots could be killed before Step 5.1.

#### Problem B: Armored robots lose armor but remain invulnerable

After a full browser refresh:

- An axe can visibly knock armor off an armored robot.
- The robot changes appearance.
- Subsequent energy bolts do not destroy it.
- The damaged robot eventually scrolls away.

The intended mechanic is:

1. Armored robot begins protected.
2. Axe destroys armor.
3. Robot exposes a vulnerable core.
4. One energy bolt destroys it.

Verify every step of that state transition.

#### Problem C: Restart creates an incorrect encounter

After choosing RESTART GAME from Game Over:

- The game restarts.
- Only one robot appears near the center.
- The robot is apparently inactive or unable to move.
- The chamber scrolls past the robot.
- No additional enemies appear.
- Shooting the robot has no visible effect.

The first game after a browser refresh shows more robots.

The problem appears to be related to session reset or scene initialization.

#### Problem D: Occasional persistent white beam

On one restart, a robot displayed a continuous white beam directed at Blackrush.

The beam did not cause damage and was not reproduced consistently.

Investigate whether a stale targeting or laser Graphics object can survive robot cleanup or scene restart.

Treat this as a secondary symptom, not a confirmed separate defect.

### 3. Diagnostic approach — required before repairs

Do not immediately rewrite the combat system.

First inspect the existing code and trace the relevant execution paths.

Review:

- `src/entities/Robot.js`
- `src/entities/Projectile.js`
- `src/entities/Blackrush.js`
- `src/systems/WeaponSystem.js`
- `src/systems/CombatSystem.js`
- `src/scenes/GameScene.js`
- `src/systems/TimelineDirector.js`
- `src/systems/DescentController.js`
- Relevant robot encounter configuration.
- Relevant combat configuration.
- GameOverScene restart logic.

Also inspect changes made during Step 5.1, using Git history or available diffs where possible.

Identify whether the regressions were introduced during rendering changes, combat changes, or restart changes.

Provide exact root causes in the completion report.

Do not substitute speculative changes for investigation.

### 4. Trace projectile collisions and damage

Follow the entire damage pipeline:

1. Projectile creation.
2. Projectile activation.
3. Physics body initialization.
4. Projectile movement.
5. Physics overlap detection.
6. Collision callback.
7. Attack type and damage calculation.
8. Robot armor calculation.
9. Robot health modification.
10. Hit feedback.
11. Robot destruction.
12. Score award.
13. Projectile deactivation.

Verify that the correct objects are supplied to collision callbacks.

Check whether Phaser Physics Group callbacks are receiving group members in the expected argument order.

Confirm that the projectile's active state and physics body's enabled state are correct.

Check whether a projectile is deactivated before the damage callback can process its attack information.

Ensure visual hit reactions are not interfering with hit registration.

Do not rely solely on the appearance of a projectile passing through a robot.

Confirm the collision and damage path using instrumentation or tests.

### 5. Verify robot health and armor

The intended mechanics remain:

| Robot type | Energy bolts | Axe |
|---|---|---|
| Pursuer | One hit destroys | One hit destroys |
| Sentinel | Two hits destroy | One hit destroys |
| Armored Pursuer | Blocked while armored | Removes armor |
| Exposed Armored Pursuer | One hit destroys | Existing configured behavior |

Inspect:

- Robot health initialization.
- Maximum health.
- Armor integrity.
- Damage resistance.
- Attack type comparisons.
- Armor-break state changes.
- Death conditions.
- Destroyed-state transitions.

Make sure robot-specific configuration values are loaded correctly.

Check for mismatches between string attack identifiers, constants, and object properties.

Avoid broad changes to damage values.

The problem is not that the robots need weaker health. The problem is that the intended damage mechanics are not working.

### 6. Rendering and hitbox consistency

Step 5.1 changed robot appearance.

Check whether these rendering changes affected:

- The physics-enabled parent object.
- Physics body creation.
- Body dimensions.
- Body offsets.
- Texture size.
- Robot origin.
- Sprite position.
- Graphics child position.
- Collision group membership.

A robot's visible shape and its collision hitbox should remain reasonably aligned.

The armored robot can have larger visual dimensions without automatically requiring a larger collision body, but its hitbox should still be appropriate.

Do not use robot Graphics primitives as physics targets unless they are explicitly designed and enabled for that purpose.

Keep physics collisions attached to the intended parent game object.

### 7. Add temporary diagnostic instrumentation

Introduce developer-only diagnostics that can show what happens when a projectile hits a robot.

At minimum, log or display:

- Projectile type.
- Robot type.
- Robot ID.
- Whether collision was detected.
- Damage amount.
- Armor before and after.
- Health before and after.
- Damage result.
- Whether destruction was triggered.

Restrict this logging to developer mode.

Do not flood the console during normal gameplay.

Use a configurable debug flag.

Diagnostic output should be useful enough to determine whether the failure occurs at collision detection, damage resolution, or destruction.

Keep or remove the diagnostics according to their long-term usefulness.

Do not add heavy logging inside every frame update.

### 8. Repair Game Restart

Investigate how the RESTART GAME button interacts with:

- GameOverScene.
- GameScene.
- TimelineDirector.
- AudioDirector.
- Robot groups.
- Phaser physics groups.
- Test encounter initialization.
- DescentController.
- Spawned robot references.
- Collision registrations.

Trace the entire restart lifecycle.

The intended sequence is:

1. End old game session.
2. Stop old music.
3. Clean up active scene-owned objects.
4. Reset timeline to Synth 0:00.
5. Reset score.
6. Reset shield.
7. Reset camera position.
8. Create or reinitialize GameScene.
9. Create new physics groups.
10. Create initial test encounters.
11. Register fresh collision callbacks.
12. Restore selected input mode.
13. Begin Synth playback.

The exact implementation may differ, but all those outcomes are required.

Make sure that scene startup, creation, and shutdown occur in the correct order.

Do not allow global session state to retain references to destroyed robot groups.

Do not use duplicate initialization paths for the first game and restarted games.

Prefer one shared session-start mechanism for:

- START GAME.
- RESTART GAME.
- REPLAY.

Where necessary, distinguish normal session starts from developer timeline seeking, which reconstructs a test state at an arbitrary musical timestamp.

### 9. Restore deterministic encounters

The encounter configurations established in Step 5 should work consistently across restarts.

Verify:

- Same initial robot population after fresh start and restart.
- Same robot types.
- Same initial positions or deterministic seed.
- Same activation behavior.
- Same physics group membership.
- Same collision callbacks.
- Same score and shield initialization.

Do not require a full browser refresh to recover a functioning encounter.

Ensure that the robot placement system uses the current camera depth and fresh session state rather than stale positions.

If encounter activation depends on camera scrolling, verify that restarting at Synth 0:00 correctly restores the initial activation region.

### 10. Repair stale targeting effects

Review how Sentinel targeting lines and damaging beams are created.

Check:

- Their ownership.
- Their update lifecycle.
- Whether they are cleared when a robot dies.
- Whether they are cleared when a robot is deactivated.
- Whether they are destroyed during scene shutdown.
- Whether they survive unintendedly after restart.

No targeting beam should remain after its owner has been removed or after the old session has ended.

Ensure that a robot's targeting state does not survive into a newly created robot instance.

Do not rewrite laser attack behavior unless a specific defect is confirmed.

### 11. Scene and timeline lifecycle

Preserve the architecture established during Step 3.1.

TimelineDirector and AudioDirector are persistent application-level systems.

GameScene owns its combat objects, physics groups, and scene-specific subscriptions.

When GameScene shuts down:

- Unregister its listeners.
- Remove scene-owned input handlers.
- Clean up collision registrations.
- Stop scene-owned tweens.
- Clear robot and projectile references.
- Clean up temporary laser effects.

Never call removeAllListeners() on shared global systems merely to reset gameplay.

Restarting a scene must not destroy global timeline functionality.

Seeking from Victory back into gameplay must still work.

### 12. Deterministic regression tests

Extend the existing test suite.

Test damage behavior with the actual combat configuration values.

At minimum:

1. Pursuer energy hit causes destruction.
2. Pursuer axe hit causes destruction.
3. Sentinel first energy hit reduces health.
4. Sentinel second energy hit causes destruction.
5. Sentinel axe hit causes immediate destruction.
6. Armored robot blocks energy.
7. Axe breaks armor.
8. Energy destroys exposed armored robot.
9. Damage does not occur after destruction.
10. Score is awarded exactly once.
11. Physics overlap callback routes the proper attacker and target.
12. Projectile state remains valid until hit processing is complete.
13. Encounter construction returns the expected initial robot population.
14. Encounter construction produces the same population after a simulated restart.
15. Session reset restores shield and score.
16. Session reset removes old robot references.
17. Session reset does not preserve old laser effects.
18. Scene listeners do not accumulate over repeated restarts.

Prefer targeted tests over broad speculative refactoring.

Where Phaser runtime behavior is involved, add a browser-level smoke test or explicit manual verification.

Pure Node.js tests do not substitute for verifying Arcade Physics collision behavior.

### 13. Browser acceptance test

After repairs, perform this exact sequence if browser automation is available.

**Fresh launch**

1. Load the application.
2. Start Game.
3. Verify that the expected robot population appears.
4. Shoot a Pursuer once and confirm it explodes.
5. Shoot a Sentinel twice and confirm it explodes.
6. Hit a fresh Sentinel with an axe and confirm it explodes.
7. Shoot an armored robot and confirm armor resists.
8. Hit the armored robot with an axe.
9. Confirm armor is visibly removed.
10. Shoot the exposed core once.
11. Confirm robot destruction and correct score.

**Restart**

12. Allow shield depletion.
13. Click RESTART GAME.
14. Confirm Synth restarts at 0:00.
15. Confirm the initial encounter is fully restored.
16. Repeat the basic robot destruction tests.
17. Repeat Restart at least three times.

**Timeline**

18. Jump to Proxy.
19. Jump back to Swarm.
20. Jump to Cathedral.
21. Jump to Victory.
22. Click Replay.
23. Confirm the first encounter is restored and functional.

No runtime exceptions should occur during these tests.

If browser automation is unavailable, provide the developer with a concise manual acceptance checklist.

Do not report browser testing as completed unless it was actually performed.

### 14. Build verification

Run:

`npm test`

`npm run build`

Both must pass.

Investigate test failures rather than modifying assertions merely to make them pass.

### 15. Documentation

Update `docs/DEVELOPMENT.md` with a Step 5.2 maintenance entry.

Document:

- Exact damage regression root cause.
- Exact restart regression root cause.
- Files changed.
- Any adjustments to physics body initialization.
- Encounter lifecycle corrections.
- Regression tests added.
- Browser tests performed or requiring manual verification.

Do not modify musical cue timestamps.

### 16. Scope restrictions

Do not implement:

- Step 6 obstacle collisions.
- Step 7 music-controlled spawning.
- Additional enemy types.
- Shield pickups.
- Boss battles.
- Grenade sequence.
- Panzer tank.
- Lorelei companion.
- Mobile controls.
- New artwork.
- Sound effects.
- Additional player weapons.
- New control schemes.

Do not change the working mouse-assisted movement behavior.

Do not modify original music assets.

Avoid unrelated architectural changes.

### 17. Definition of done

Step 5.2 is complete when:

- Ordinary robots receive damage and die as intended.
- Armored robots correctly transition from armored to exposed to destroyed.
- Axes kill ordinary robots.
- Energy shots kill vulnerable robots.
- Destruction effects execute without exceptions.
- Scores update correctly.
- The initial robot population is recreated after every restart.
- Robot AI remains functional after restart.
- Laser effects are cleaned up correctly.
- Fresh Start, Restart, Replay, and developer seeking all produce valid gameplay states.
- No duplicate physics objects or stale listeners remain.
- Tests pass.
- Production build succeeds.

Provide a completion report with actual root causes and verification results.

Stop after Step 5.2. Do not implement Step 6.