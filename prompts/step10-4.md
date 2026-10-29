# JUNIE TASK — LORELEI: DESCENT
## Step 10.4 — Eclipse Super-Speed Companion and Perimeter Defense

### 1. Objective

Introduce Eclipse (Ebony), Blackrush's wife and fellow veteran superhero, as the game's second autonomous companion.

The game currently features:

- Blackrush — player-controlled superhero, force bolts, axe and NOVA.
- Lorelei — autonomous companion, following and powerful defensive telekinesis.
- Three ordinary robot archetypes: Pursuer, Sentinel and Armored Pursuer.
- Proxy and Giant Boss encounters.
- A music-driven timeline controlling scripted events.

Lorelei's behavior is now working exceptionally well. Her proximity-dependent protection has introduced a valuable tactical dimension: Blackrush can leave nearby Pursuers to Lorelei while concentrating on Sentinels and Armored Robots.

**Eclipse must add another tactical dimension without making Blackrush or Lorelei redundant.**

Her signature power is super-speed.

She should move naturally alongside the team, occasionally spot an isolated or threatening robot near the perimeter of the battlefield, crouch briefly, and launch herself into a spectacular super-speed interception. She eliminates the target and races back to Blackrush.

The result should feel like a superhero darting across the battlefield faster than the eye can follow.

She must act autonomously, require no additional player controls, and remain subject to reasonable range and cooldown restrictions.

This is Step 10.4 only. Do not implement boss-specific Eclipse choreography yet.

---

## PART A — PixelLab Artwork

### 2. Existing Eclipse assets

The PixelLab source artwork is already included in the v2 sprite compilation pipeline.

Canonical entity: `eclipse`

Source directory:

```text
public/assets/source/pixellab/eclipse/
    idle/
    walk/
    run/
    crouch/
```

The existing artwork includes:

- Idle — eight directions.
- Walk — eight directions.
- Run — eight directions.
- Crouch — four cardinal directions, five animation frames per direction.

The compiler already supports variable source frame dimensions and stable visual anchoring.

Use SpriteAnimationRegistry and the compiled atlas manifest.

Do not load individual source PNGs at runtime.

Do not modify the source artwork, compiler, or animation manifest unless a genuine integration defect is discovered.

### 3. Visual size and appearance

Eclipse should have an appropriate humanoid scale relative to Blackrush and Lorelei.

Preserve nearest-neighbor pixel rendering.

Use the existing stable anchoring system to prevent animation jitter.

Respect eight-way direction selection for idle, walk and run.

For crouch, use the registry's existing directional fallback to select the appropriate cardinal animation.

Do not manufacture missing diagonal crouch artwork.

Support the global PIXEL ART toggle and a procedural fallback consistent with the other entities.

---

## PART B — Spawn and Lifecycle

### 4. Spawn Eclipse at mission start

We recently resolved a persistent bug where Lorelei did not appear until Synth 0:45 because her creation depended on music-driven phase events.

**Do not repeat that architecture.**

Eclipse should spawn alongside Blackrush and Lorelei during initial GameScene setup.

She should appear at Synth 0:00, including the opening Proxy/Nadine chase.

Initialize her only after the relevant world, player, physics and sprite dependencies are available.

Do not require a CHASE, ROBOT_SWARM, onTrackStart or onPhaseChange event to create her initially.

Use the same reliable direct-initialization and centralized-presence pattern now established for Lorelei.

### 5. Companion lifecycle

Only one Eclipse instance may exist during a mission.

Preserve correct behavior across:

- Mission startup.
- Opening chase.
- Transition into ROBOT_SWARM.
- Timeline seeking.
- Restart.
- Game Over.
- Arena checkpoints.
- Return to title.
- Scene destruction.
- ESC pause/resume.

Eclipse should remain the same entity across the opening chase and robot swarm.

For now, she may depart or become inactive when the boss encounters begin, following the established Lorelei lifecycle policy.

Do not invent new boss behavior.

---

## PART C — Ordinary Companion Movement

### 6. Eclipse's normal behavior

When she is not performing a super-speed intervention, Eclipse should behave as a companion.

She follows Blackrush at a comfortable distance, selecting idle, walk or run animations according to her actual motion.

She should not occupy precisely the same position as Lorelei.

Prefer a loose team formation:

- Blackrush leads.
- Lorelei remains relatively close for defensive protection.
- Eclipse follows slightly offset to the opposite side or behind the team.

Do not enforce rigid formation positions.

The characters must navigate naturally around obstacles and one another.

### 7. Preserve Lorelei's behavior

Do not alter Lorelei's existing:

- Following speed.
- Follow distance.
- Threat detection.
- Support radius.
- Telekinetic cooldown.
- Knockback strength.
- Knockback duration.
- 50% destruction probability.
- Armored Robot disarming.
- Animation behavior.

Lorelei is already correctly tuned.

Eclipse must coexist with her without modifying her code unnecessarily.

### 8. Obstacle navigation

Reuse suitable existing navigation and steering logic.

Eclipse should respect:

- Pillars.
- Machinery.
- Tanks.
- Perimeter walls.
- Other solid environmental obstacles.

During normal movement, she should avoid becoming stuck.

She should not teleport through walls or machinery.

Do not create an entirely new navigation engine for Eclipse.

---

## PART D — Super-Speed Interception

### 9. Distinctive autonomous behavior

Eclipse's signature behavior is a brief, high-speed offensive excursion.

The intended sequence:

```text
FOLLOWING
    |
    v
ACQUIRE TARGET
    |
    v
CROUCH / PREPARE
    |
    v
SUPER-SPEED BURST
    |
    v
CONTACT ATTACK
    |
    v
RAPID RETURN
    |
    v
FOLLOWING / COOLDOWN
```

Use a simple, explicit state machine or equivalent existing architecture.

Each stage must have clear entry and exit conditions.

Avoid overlapping interceptions, repeated strikes, and contradictory movement commands.

### 10. Target selection

Eclipse specializes in enemies around the outer edge of the immediate battle.

Her preferred targets should be:

1. An isolated Sentinel that is threatening the team.
2. A Pursuer approaching from the edge of the visible battlefield.
3. Other suitable ordinary enemies that are not already within Lorelei's immediate defensive area.

Sentinels may receive a higher targeting priority, but Eclipse must not eliminate every Sentinel automatically.

Blackrush should still have meaningful opportunities to fight Sentinels himself.

Do not rely entirely on random target selection. Prefer sensible threat, distance, availability, and path-safety scoring.

Avoid targeting enemies already destroyed, being destroyed, or otherwise invalid.

For this first milestone, **exclude Armored Pursuers from Eclipse's automatic attacks**. Their armor-removal mechanic belongs to Blackrush and Lorelei for now.

### 11. Tactical range restrictions

Eclipse should not be able to eliminate enemies anywhere in the entire world.

An interception should require:

- A qualifying ordinary robot target.
- A reachable target within an appropriate tactical range.
- Eclipse being reasonably close to Blackrush before starting.
- Her super-speed ability being off cooldown.
- A sufficiently clear route to the target.
- An active, unpaused game session.

Use configurable maximum distance from Blackrush and from Eclipse.

Prefer enemies reasonably within or near the player's current view.

She should not dash hundreds of meters away to destroy an offscreen robot that the player never knew existed.

### 12. The crouch animation

Before launching into super-speed, Eclipse should briefly crouch.

This gives her an identifiable visual preparation and makes meaningful use of the existing PixelLab crouch animation.

The crouch should be brief enough not to interrupt the game's pace.

Use an appropriate cardinal-facing crouch animation.

Do not allow repeated crouching if she immediately abandons the attack and reacquires another target.

If a target becomes invalid during preparation, return safely to normal companion behavior.

### 13. Super-speed motion

When Eclipse begins her attack, she should accelerate dramatically and move much faster than ordinary walking or running characters.

Her movement must be visibly continuous, rather than instantly teleporting to the target.

Use the existing run animation during the burst.

Initial speed may be several times Blackrush's normal movement speed, subject to tuning against actual world scale and collision behavior.

Keep the burst brief and exciting.

Use delta-time-safe movement and take care with high-speed Arcade Physics behavior.

Do not implement a system that works only at one frame rate.

### 14. Collision and tunneling

Eclipse will move rapidly enough that ordinary physics overlap detection may become unreliable.

Inspect existing swept collision techniques used for Blackrush's projectiles in Step 10.2.1.

Use suitable path validation or continuous collision handling to avoid:

- Passing through solid obstacles.
- Missing the designated robot.
- Skipping collision checks at high speed.
- Accidentally damaging several robots along her route.
- Leaving Eclipse outside the navigable world.

If a safe route cannot be found, abandon the interception and return to normal following.

Do not make super-speed equivalent to unrestricted wall phasing.

### 15. Contact attack

Eclipse's successful interception should deliver one decisive contact attack against the selected robot.

For this milestone:

- A successfully struck Pursuer is destroyed.
- A successfully struck Sentinel is destroyed.
- Armored Pursuers are not valid targets.
- Proxy and Giant Boss components are not valid targets.

Use the existing robot destruction pathway and cleanup mechanisms.

Do not invent a separate robot-death implementation.

Do not award player points for autonomous Eclipse kills unless the existing companion scoring policy specifically requires that.

Prevent duplicate destruction callbacks or damage events.

### 16. Return to Blackrush

After attacking, Eclipse should return rapidly to Blackrush.

Her return should be visually apparent, preferably with a second burst of speed.

She should use his current position rather than blindly returning to where he stood when the attack started.

If Blackrush has moved substantially, use appropriate navigation and steering.

When Eclipse returns within her normal follow distance, resume ordinary companion behavior.

Do not keep her permanently in high-speed mode.

If the player is moving quickly, Eclipse may use a limited catch-up behavior to reconnect with the team.

Avoid visible teleportation.

### 17. Cooldown and pacing

Eclipse's super-speed interceptions must be occasional.

A reasonable initial cooldown might be approximately 8–12 seconds, subject to the existing encounter pace.

Use a configurable cooldown.

Her ability should remain meaningful but not fire continuously.

The goal is for players to notice her attack, appreciate the result, and then return their attention to their own decisions.

Do not automatically clear large numbers of enemies.

Limit each intervention to one deliberate target.

---

## PART E — Super-Speed Visual Effects

### 18. Distinctive appearance

Eclipse should look different from both Blackrush and Lorelei during her power use.

Blackrush uses force bolts and the axe.

Lorelei uses violet telekinetic shockwaves.

Eclipse should create a rapid streak or blur.

Suggested effects:

- A short trail of silver-white or pale-blue afterimages.
- Brief translucent motion streaks.
- A small flash at the strike location.
- Very short-lived visual echoes behind her.
- A fading trail as she returns.

Use procedural Phaser effects or inexpensive copies of the existing sprite appearance.

Do not require new art assets.

### 19. Keep the effect efficient

The game may eventually contain large robot swarms.

Avoid unbounded particle creation.

Reuse objects where practical.

Limit the number of simultaneous trail segments or afterimages.

Ensure proper cleanup at the end of a burst and during scene shutdown.

Preserve pixel-art clarity.

The effect should be fast and exciting, not an enormous glowing cloud obscuring the battlefield.

### 20. Visual readability

The player should be able to perceive:

1. Eclipse preparing to move.
2. Her streak across the battlefield.
3. The robot being struck.
4. Her return toward Blackrush.

The entire sequence should feel rapid, but not so instantaneous that the player cannot tell what happened.

Avoid long animations that delay ordinary gameplay.

---

## PART F — Tactical Balance

### 21. Preserve the emerging team dynamic

This is one of the most important requirements of Step 10.4.

The current gameplay is especially enjoyable because Lorelei's proximity-dependent defense allows the player to make strategic decisions.

The developer has observed that Blackrush can concentrate on Sentinels and Armored Robots while Lorelei handles nearby Pursuers.

Eclipse should extend that system without replacing it.

The desired division of labor is:

**Blackrush:** Player judgment, targeted attacks, armored threats and active positioning.

**Lorelei:** Powerful but proximity-dependent protection against nearby groups.

**Eclipse:** Occasional rapid interception of selected enemies at the perimeter.

The player must still make decisions.

Do not make Eclipse so effective that ordinary robots cease to be dangerous.

### 22. Companion positioning matters

Eclipse must be close enough to Blackrush to initiate her patrol attacks.

If Blackrush abandons the companions, their help becomes less reliable.

But Eclipse's support range may be larger than Lorelei's, reflecting their different powers.

Use separate support-distance configurations.

This should produce a natural tactical tradeoff:

- Staying with the team offers combined protection.
- Running away creates separation and vulnerability.
- Eclipse can briefly extend the team's reach but must return afterward.

Do not add companion-control keybindings.

### 23. No major balance changes

Do not change:

- Robot spawn rates.
- Robot movement speed.
- Sentinel laser behavior.
- Robot health.
- Armored Robot armor rules.
- Blackrush weapons.
- NOVA.
- Shield and heart systems.
- Lorelei's current parameters.
- Existing boss attack patterns.

We will adjust robot density and refine strategic obstacle layouts later.

This milestone is about adding Eclipse, not rebalancing the entire game.

---

## PART G — Audio, Pause and Timeline

### 24. Music synchronization

Preserve AudioDirector and TimelineDirector.

Eclipse must coexist with the existing music-driven encounter system.

Her attack timing may be based on gameplay cooldowns, but those cooldowns must obey game pause and restart behavior.

Do not add independent wall-clock timers that continue running while the game is paused.

Do not modify the musical phase boundaries.

### 25. ESC pause/resume

When ESC pauses the game:

- Eclipse stops moving.
- Any active super-speed dash freezes.
- Afterimages and flashes freeze or remain visually stable.
- Attack preparation freezes.
- Cooldowns freeze.
- Enemy destruction cannot occur while paused.

When the player resumes, Eclipse must continue from the same state.

Test pausing during each stage of an interception.

Do not restart her attack simply because the game resumed.

### 26. Boss transitions

For now, Eclipse's ordinary interception behavior must not operate during either boss encounter.

When entering the Proxy or Giant Boss phases, terminate or safely deactivate any active interception.

Do not leave her halfway through a dash against an entity that no longer exists.

She may depart according to the current companion lifecycle conventions.

Boss-specific companion choreography will be addressed later.

---

## PART H — Configuration and Debugging

### 27. Centralized configuration

Place Eclipse's settings in the existing appropriate configuration module.

Include tunable parameters for:

```javascript
eclipse: {
    followDistance: /* existing-scale appropriate */,
    walkSpeed: /* normal companion movement */,
    runSpeed: /* normal catch-up movement */,
    supportDistance: /* max distance from Blackrush */,
    interceptionRadius: /* target-search radius */,
    burstSpeed: /* super-speed travel */,
    preparationDuration: /* crouch/windup */,
    attackCooldown: /* approximate 8–12 seconds */,
    returnDistance: /* return-to-follow threshold */,
    maxBurstDuration: /* failsafe */
}
```

These names are illustrative.

Use existing conventions.

Avoid duplicate configuration values or scattered magic numbers.

### 28. Developer diagnostics

Extend TimelineDebugPanel under `?debug=1`.

Display:

- Eclipse present/absent.
- Current AI state.
- Distance to Blackrush.
- Current target.
- Cooldown remaining.
- Number of completed interceptions.
- Number of successful robot destructions.
- Current burst speed.
- Whether the planned path is valid.

Add a manual Eclipse spawn/trigger control if it fits the established tools.

Make sure manual spawning does not duplicate the automatically spawned companion.

Do not obscure the normal game with large debug overlays.

---

## PART I — Testing

### 29. Automated tests

Add focused tests covering:

1. Eclipse spawns directly during normal GameScene initialization.
2. Eclipse is present at Synth 0:00.
3. Eclipse remains present across the 0:45 swarm transition.
4. Eclipse is not duplicated after seeks or restarts.
5. PixelLab idle, walk and run animations resolve correctly.
6. Cardinal crouch fallback works.
7. Stable visual anchoring is preserved.
8. Ordinary following works.
9. Eclipse maintains a reasonable formation offset from Lorelei.
10. Obstacle navigation works during ordinary movement.
11. Eclipse acquires a reachable perimeter target.
12. Eclipse rejects invalid or destroyed targets.
13. Eclipse does not initiate an interception outside her support range.
14. Crouch preparation occurs before the burst.
15. Super-speed movement remains continuous.
16. High-speed movement does not tunnel through obstacles.
17. Unsafe interception paths are rejected.
18. A successful Pursuer strike destroys the target.
19. A successful Sentinel strike destroys the target.
20. Armored Pursuers are not targeted.
21. Bosses are unaffected.
22. Only one intended target is destroyed per interception.
23. Eclipse returns to Blackrush after an attack.
24. Cooldown prevents immediate repeated interceptions.
25. Eclipse retains correct state when paused and resumed.
26. Scene destruction cleans up afterimages and listeners.
27. Boss transitions safely terminate interceptions.
28. Lorelei's existing movement and telekinesis remain unchanged.
29. Blackrush's force bolts, axe and generous hit detection remain functional.
30. Existing mission and boss tests pass.

Run:

```bash
npm run sprites:check
npm test
npm run build
```

Do not alter existing tests simply to conceal regressions.

### 30. Manual browser playtest

The developer should be able to verify:

**Mission start**

- Blackrush, Lorelei and Eclipse are visible at 0:00.
- Each companion uses the proper PixelLab artwork.
- Both companions follow naturally.
- No duplicate characters appear.

**Ordinary movement**

- Eclipse walks and runs smoothly.
- Eclipse and Lorelei do not continually overlap.
- Eclipse avoids pillars and machinery.
- Existing Assisted controls remain enjoyable.

**Super-speed**

- Eclipse identifies an appropriate target.
- She briefly crouches.
- She streaks across the battlefield.
- A robot is destroyed on contact.
- She races back to Blackrush.
- The effect is visually clear but brief.

**Tactical behavior**

- Eclipse does not destroy all robots automatically.
- Blackrush still has meaningful targets.
- Lorelei still protects against nearby swarms.
- Eclipse becomes unavailable when sufficiently separated from Blackrush.
- Armored Robots remain primarily Blackrush's and Lorelei's responsibility.

**Lifecycle**

- ESC pauses Eclipse during a dash.
- Resume works correctly.
- Restart works.
- Timeline seeking works.
- Boss encounters are unchanged.
- No stale sprites, trails, or duplicate physics bodies remain.

---

## PART J — Scope Restrictions

### 31. Do not implement

- New player controls.
- New Eclipse art assets.
- Eclipse's boss-specific powers.
- Proxy/Nadine combination sprite correction.
- Armored Robot armor-break sounds or particles.
- New obstacle-generation rules.
- Strategic obstacle redesign.
- New enemy archetypes.
- Robot spawn-rate increases.
- Boss cinematics.
- German Soldier grenade choreography.
- Panzer tank sequences.
- Changes to Lorelei's telekinesis.
- Changes to the existing music timeline.

Do not redesign working subsystems.

### 32. Completion report

Report:

1. Files created and modified.
2. How Eclipse is spawned at mission start.
3. AI states and transitions.
4. Target selection policy.
5. Super-speed movement implementation.
6. Obstacle and collision handling.
7. Robot destruction handling.
8. Visual trail implementation.
9. Return and cooldown behavior.
10. Companion lifecycle and pause integration.
11. Automated test results.
12. Build results.
13. Actual browser verification, or explicitly state pending.
14. Suggested tuning values for the first playtest.

### Definition of done

Step 10.4 is complete when Eclipse accompanies Blackrush and Lorelei from mission start, autonomously performs occasional visually spectacular super-speed interceptions, eliminates individual ordinary robots, returns reliably, and preserves the game's established tactical balance.

**STOP AFTER STEP 10.4. Do not begin the next milestone.**