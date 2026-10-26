# JUNIE TASK — LORELEI: DESCENT
## Step 9.8: Fair Laser Telegraphing and Complete Boss Finales

### 1. Project context

LORELEI: DESCENT is a Phaser 3.88.2 music-driven arcade shooter with a 1280-pixel-wide world, responsive camera, animated Blackrush and Pursuer sprites, and three original musical tracks.

Steps through 9.7 are complete and manually tested.

Working gameplay includes:

- Classic and Assisted controls.
- Energy weapon, magical axe, and NOVA.
- Six hearts, shields, respawning, and pickups.
- Adaptive descent difficulty.
- Arena continues with three hearts and full shields.
- Ordinary robot encounters and formations.
- Proxy and giant robot bosses with destructible components.
- Musical timeline seeking and boss checkpoints.

The developer confirms that both bosses already have functioning component-damage mechanics. Repeated attacks gradually disable their circular defensive components.

However, boss destruction is not yet fully implemented. Currently the player can survive until the musical timeline ends without a satisfying mechanical resolution.

The developer also reports that targeted laser attacks appear impossible to dodge even when Blackrush moves away from their warning beams.

**The purpose of Step 9.8 is to make enemy targeting fair and to complete both bosses' gameplay conclusions.**

Do not introduce additional sprites, new enemies, cinematic presentations, or soundtrack changes.

---

## PART A — Fair laser targeting

### 2. Inspect existing laser systems

Identify all relevant laser implementations, including:

- Ordinary Sentinel targeting.
- Proxy boss targeting.
- Giant robot targeting, if implemented.
- Any shared laser attack utilities.

Determine how each currently acquires a target, displays warnings, fires, and applies damage.

Prefer a shared targeting solution where practical, but do not undertake an unnecessary major combat refactor.

### 3. Telegraph → lock → fire

Implement or standardize a three-stage attack sequence:

**ACQUIRE / TRACK**

The enemy tracks Blackrush's current position and displays a warning beam.

**LOCK**

The enemy stops adjusting its aim.

The warning beam remains visible briefly at its final direction.

Suggested initial duration: 250 milliseconds.

**FIRE**

The attack fires along the locked trajectory.

Do not recalculate its direction toward Blackrush after lock.

Suggested configurable total warning time: approximately 800–1200 milliseconds, including the final locked interval.

The existing soundtrack timing and enemy attack cadence should remain approximately intact.

### 4. Dodging must work

During the final lock interval, Blackrush should be able to move away from the indicated trajectory.

Damage must be determined from the **actual beam geometry when the weapon fires**, not whether Blackrush was originally targeted.

A player who successfully leaves the beam's collision area before firing should take no damage.

A player still inside the fired beam should take damage normally, subject to existing shield and invulnerability rules.

Do not use a guaranteed-hit attack that bypasses this geometry.

### 5. Beam collision and cover

Preserve environmental blocking.

Laser beams must stop at solid machinery or other appropriate blocking obstacles.

Do not damage Blackrush through cover.

Avoid applying duplicate damage every physics frame while one attack is active.

Preserve existing invulnerability handling.

Bosses may use wider or more powerful beams than Sentinels, but all aimed attacks should remain meaningfully avoidable.

### 6. Visual warning clarity

Use the existing procedural warning graphics.

Distinguish the tracking and locked states sufficiently for the player to recognize that the beam has stopped following them.

For example:

- Tracking: narrow targeting line.
- Locked: brighter line or brief pulse.
- Firing: full damaging beam.

Keep these cues short and readable during dense combat.

Do not create new final art or sound effects.

### 7. Configuration

Centralize the relevant values, such as:

```javascript
{
    trackingMs: 650,
    lockedMs: 300,
    firingMs: 180,
    beamWidth: 12
}
```

These are suggested starting values.

Maintain separate configurable attack profiles for Sentinel, Proxy, and giant robot where needed.

Do not adjust unrelated weapon or enemy damage values.

---

## PART B — Proxy boss conclusion

### 8. Preserve existing Proxy combat

The Proxy already has damageable components and armor.

Keep those mechanics intact.

Do not replace its current weak-point system.

Confirm that destruction of external components exposes or weakens the core according to existing rules.

Player attacks must continue to have visible consequences.

### 9. Complete soldier and grenade interaction

Inspect the actual implementation of:

- `GermanSoldier`.
- `Grenade`.
- `ProxyBoss`.
- Relevant GameScene boss logic.
- Existing Synth musical events.

The developer previously observed that the soldier appears but does not produce a meaningful finale.

Correct this.

At the established grenade cue:

1. The soldier performs the existing intended grenade action.
2. Blackrush has a reasonable opportunity to participate using the current grenade interaction mechanics.
3. A successful player intervention results in a meaningful finishing action.
4. If the player misses the opportunity, a scripted fallback still resolves the encounter.

Do not make the encounter impossible to complete because the player failed to catch a small moving object.

Ensure the grenade genuinely interacts with the Proxy's damage/defeat mechanics rather than merely appearing as scenery.

Do not add cutscenes or dialogue.

### 10. Musical timing

The Proxy encounter begins at approximately Synth 5:00.

Existing score events have previously included:

- `PROXY_RELEASES_NADINE` at 300 seconds.
- `PROXY_ATTACK` at 315 seconds.
- `GERMAN_SOLDIER_APPEARS` at 340 seconds.
- `GRENADE_SEQUENCE` at 350 seconds.
- `PROXY_COLLAPSE` at 358 seconds.

**Inspect the current timeline configuration and use its actual authoritative event IDs and times.**

Do not overwrite developer-edited musical values based solely on the examples above.

At the configured Proxy collapse cue, the boss must enter a definitive defeated state.

### 11. Mechanical destruction

On Proxy defeat:

- Disable all further boss attacks.
- Cancel targeting beams.
- Stop boss movement.
- Disable remaining active components.
- Trigger simple procedural component destruction effects.
- Retire arena reinforcements as appropriate.
- Remove or disable the boss's damaging physics bodies.
- Prevent duplicate defeat processing.

A brief procedural breakup, explosion, or collapse effect is appropriate.

Do not create a cinematic presentation.

Preserve the soundtrack's natural transition into Cathedral.

There must not be an immobilized, still-active Proxy remaining in the arena after its defeat.

---

## PART C — Giant robot conclusion

### 12. Inspect existing giant robot implementation

The developer reports that the giant robot already exists as a procedural boss with four circular defensive components that can be progressively damaged.

Inspect the actual entity and encounter implementation before modifying anything.

Reuse its existing damage and component state.

Do not replace it with a new boss architecture.

### 13. Component progression

Ensure that the component states have gameplay consequences.

As components are disabled, the robot should become progressively more vulnerable or less capable.

Possible consequences, depending on the existing architecture:

- Reduced attack options.
- Disabled individual weapon emitters.
- Core vulnerability.
- Reduced armor.

Prefer simple, deterministic effects.

Avoid large new attack systems.

Make sure attacks against disabled components do not continue consuming player effort without any effect.

### 14. Panzer impact hooks

The Cathedral soundtrack contains two planned major impact moments around 3:00 and 3:30.

The broader story intends these to be Panzer tank shots against the giant robot.

For this milestone, implement the **mechanical damage hooks** needed at the appropriate configured musical cues.

Do not implement the complete Panzer tank entity, tank driving, or final tank artwork.

If explicit Panzer event cues already exist, reuse them.

If they do not exist, expose configurable boss-impact events without inventing or silently changing existing musical timing.

Each impact should visibly affect the giant robot's armor or component state.

Use simple placeholder impact effects.

The eventual Panzer gameplay presentation will be handled separately.

### 15. Giant robot final defeat

At its existing final musical climax:

- Resolve any remaining required boss damage through the scripted finale.
- Disable remaining attacks and targeting beams.
- Complete the boss's component destruction.
- Trigger a visible procedural destruction effect.
- Remove damaging physics bodies.
- Ensure no additional attacks occur after defeat.
- Allow the existing music and scene progression to continue.

The player should be able to meaningfully weaken the boss throughout combat.

A skilled player may disable most components before the finale.

A less skilled player should still reach the musical resolution if they survive.

Do not end the Cathedral soundtrack early because all components have been destroyed.

Do not leave the boss active indefinitely after the final cue.

---

## PART D — Musical and session lifecycle

### 16. Music remains authoritative

Do not alter the original music files.

Do not change the defined duration or sequence of Synth, Cathedral, and Studio.

Boss damage influences gameplay state but must not disrupt the musical clock.

All finalization logic should be idempotent.

Musical events must not produce repeated grenade explosions or duplicate boss deaths.

### 17. Arena continues

Preserve Step 9.7 checkpoint behavior.

On Proxy continuation:

- Restore the Proxy's initial component state.
- Clear prior grenade and soldier objects.
- Clear prior laser attacks.
- Restore the encounter's correct musical starting state.
- Give Blackrush three hearts and full shield.

On Cathedral continuation:

- Restore the giant robot's initial components.
- Clear existing impact and destruction effects.
- Restore the Cathedral timeline.
- Give Blackrush three hearts and full shield.

No defeated boss state may leak into a fresh attempt.

### 18. Developer seeking

Support representative reconstruction when seeking directly into:

- Proxy opening.
- Proxy combat.
- Grenade sequence.
- Proxy defeat.
- Cathedral opening.
- Cathedral component-damage phases.
- Cathedral final defeat.
- Studio victory.

Do not replay every earlier physical action to reconstruct a seek.

Use deterministic representative component states.

Do not trigger duplicate damage when reconstructing a previously passed cue.

### 19. Cleanup

Pay particular attention to previous scene-lifecycle problems.

Remove event listeners and timers when scenes shut down.

Avoid callbacks referencing disposed physics objects.

Ensure resize handlers are correctly unregistered.

Ensure laser graphics, collision objects, boss components, grenade entities, and particle effects clean up correctly.

Preserve the now-working title screen, Game Over screen, arena continues, and victory flow.

---

## PART E — Tests and validation

### 20. Automated tests

Add focused tests for:

1. Laser tracking follows the target before lock.
2. Laser direction freezes during lock.
3. Laser firing preserves its locked trajectory.
4. Moving outside the trajectory avoids damage.
5. Remaining inside the trajectory causes damage.
6. Cover blocks laser damage.
7. A beam cannot apply duplicate damage improperly.
8. NOVA cleanup cancels ordinary Sentinel attacks.
9. Proxy component damage remains functional.
10. Soldier arrives at the configured cue.
11. Grenade interaction affects the Proxy.
12. Grenade fallback works.
13. Proxy final defeat disables all attacks.
14. Proxy defeat cannot execute twice.
15. Cathedral boss components remain damageable.
16. Configured major impacts affect Cathedral boss components.
17. Giant robot final defeat disables attacks.
18. Boss defeat does not stop music early.
19. Proxy arena continuation resets combat state.
20. Cathedral continuation resets combat state.
21. Seeking reconstructs defeated and active boss states.
22. Restart and scene transitions clean up all boss objects.
23. Existing hearts, assistance, NOVA, and sprite tests remain passing.

Run:

```bash
npm test
npm run build
```

### 21. Manual browser acceptance

**Sentinel dodging**

- Allow a Sentinel to acquire Blackrush.
- Move while the warning beam tracks.
- Observe it lock.
- Move sideways after lock.
- Confirm the attack misses.
- Stand in a locked beam deliberately.
- Confirm the attack hits.

**Proxy**

- Fight the Proxy and damage several components.
- Confirm its targeting beams are avoidable.
- Observe the German soldier's arrival.
- Attempt the grenade interaction successfully.
- Retry and deliberately miss the grenade opportunity.
- Confirm both paths ultimately reach the musical finale.
- Verify the Proxy is defeated and stops attacking.
- Confirm Cathedral starts naturally.

**Giant robot**

- Attack and disable components.
- Verify the component changes matter mechanically.
- Observe both configured major impact events.
- Confirm final destruction occurs at the musical climax.
- Verify ordinary gameplay progression reaches Studio.

**Regression**

- Test NOVA during intense combat.
- Test arena continues for both bosses.
- Test normal restart and Back to Title.
- Test developer seeking in both directions.
- Verify there are no console exceptions.

Clearly distinguish real browser testing from code review.

### 22. Documentation

Update `docs/GAME_DESIGN.md` and `docs/DEVELOPMENT.md`.

Document:

- Laser tracking and locking behavior.
- Dodge windows.
- Boss damage and component progression.
- Grenade finale.
- Giant robot impact hooks.
- Boss defeat states.
- Arena retry reconstruction.
- Musical event synchronization.

### 23. Scope restrictions

Do not implement:

- New character sprites.
- Lorelei companion AI.
- Final Panzer tank entity.
- Final boss artwork.
- Cutscenes.
- Dialogue.
- New music.
- New enemies.
- New difficulty settings.
- Additional weapons.
- Touchscreen controls.
- Changes to the adaptive assistance model.

This milestone is for combat fairness and boss gameplay completion.

### 24. Definition of done

Step 9.8 is complete when:

- Targeting lasers provide a real opportunity to dodge.
- Sentinel and boss beams fire along locked trajectories.
- Environmental cover continues to work.
- Proxy grenade gameplay resolves correctly.
- Proxy is defeated at its configured musical conclusion.
- Giant robot components remain meaningful.
- The giant robot reaches a clear defeated state at its musical conclusion.
- Natural music transitions work.
- Arena continues restore each boss properly.
- Seeking and restart remain stable.
- Automated tests pass.
- Production build succeeds.
- No existing working gameplay is broken.

Report the exact implementations, any missing configured musical cues, tests, manual verification status, and remaining limitations.

**Stop after Step 9.8. Do not begin another milestone without authorization.**