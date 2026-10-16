# JUNIE TASK — LORELEI: DESCENT
## Step 7: Music-Driven Swarm Director, Choreographed Encounters, Catch-Up Bursts, and Tactical Retreats

### 1. Project context

We are developing **LORELEI: DESCENT**, a top-down browser arcade shooter using:

- JavaScript ES modules
- Phaser 3.88.2
- Phaser Arcade Physics
- Vite 8.3.4
- Node.js 24
- Logical resolution 640 × 960

The game's original soundtrack provides the authoritative timeline for scripted progression.

Previous milestones are complete through Step 6.1.

The developer has personally verified:

- Classic and Assisted controls.
- Player aiming, energy bolts, and throwing axes.
- Pursuer, Sentinel, and Armored Pursuer combat.
- Robot destruction and armor breaking.
- Sentinel targeting lasers and friendly fire.
- Solid environmental obstacles and cover.
- Robot obstacle avoidance.
- Shield regeneration.
- Six hearts and automatic respawning.
- Low-heart warnings.
- Deterministic environment reconstruction.
- Stable restarts, replays, seeking, and natural soundtrack transitions.
- Natural Cathedral-to-Studio transition into EndingScene.

The developer commits working milestones to Git, so preserve existing functionality and avoid unrelated refactoring.

**Implement Step 7 only. Do not begin the Proxy boss encounter.**

### 2. Overall vision

The goal is not a continuously increasing random swarm.

The goal is a **musically choreographed action sequence** with dramatic peaks and valleys.

Enemy encounters should complement the original Synth recording.

Some passages should feel relatively calm.

Others should suddenly become spectacularly dangerous, with many robots and converging laser beams.

The player may not immediately realize the encounters have been choreographed to the soundtrack, but the game should feel naturally synchronized with it.

The developer must be able to adjust musical cue timestamps, robot compositions, attack formations, and population limits through configuration data.

### 3. Musical structure

The first track is:

`public/assets/audio/music/below-gamorrah-synth.mp3`

Total duration approximately 362 seconds.

Established sections:

- 0:00–0:45: Opening chase.
- 0:45–5:00: Underground descent and robot combat.
- 5:00–6:02: Fixed Proxy boss arena.

The camera descends until Synth 5:00, then stops.

The second track, Cathedral, remains reserved for the super-robot sequence.

The third track, Studio, remains reserved for victory and credits.

Do not modify these recordings or their established phase boundaries.

Do not modify AudioDirector's authority over track playback.

### 4. Implement EncounterDirector

Introduce a dedicated encounter orchestration system.

Suggested module:

`src/systems/EncounterDirector.js`

The director should:

- Read encounter definitions from configuration.
- Watch authoritative musical progression.
- Dispatch encounter events at their scheduled times.
- Manage active robot population.
- Track which encounter cues have fired.
- Support deterministic developer seeking.
- Dispatch tactical retreat commands.
- Apply encounter-specific pressure limits.
- Stop ordinary spawning before the boss encounter.
- Dispose of its own state and listeners on scene shutdown.

Avoid placing the entire implementation directly into GameScene.

GameScene should own physical robot objects and provide a narrow interface for the director to create, count, command, or retire robots.

Do not introduce a new unrelated authoritative clock.

### 5. Data-driven encounter score

Create a configuration file such as:

`src/config/encounterScore.js`

The score must be readable and easy for the developer to edit manually.

Use named cue definitions containing fields such as:

- `id`
- `time`
- `type`
- `formation`
- `robotTypes`
- `counts`
- `spawnRegion`
- `duration`
- `maxActive`
- `pressure`
- `retreatFraction`
- `retreatDuration`
- `priority`
- `seed`

Not every command needs every field.

Use an extensible but simple structure.

Suggested command vocabulary:

**SPAWN**

Introduce a small number of robots.

**FORMATION**

Introduce a coordinated group in a particular formation.

**PRESSURE**

Adjust the current desired encounter density or reinforcement behavior.

**RETREAT**

Order a configurable fraction of active enemies to retreat.

**LULL**

Suspend ordinary new spawns for a specified interval.

**CLEAR_FOR_BOSS**

Order all surviving ordinary enemies to withdraw before the Proxy encounter.

Prefer data that can be edited without modifying spawning code.

Keep configuration validation practical and lightweight.

Invalid timestamps, robot types, or counts should produce clear development diagnostics.

### 6. Initial encounter timeline

Implement the following first-pass choreography.

These timestamps are provisional and intentionally easy to adjust.

| Musical time | Event | Desired behavior |
|---|---|---|
| 0:00–0:45 | Opening | No large combat waves; retain existing opening gameplay |
| 0:45 | First patrol | 3–4 Pursuers |
| 1:05 | Reinforcements | 4 Pursuers, mixed approach |
| 1:25 | Laser introduction | 3 Sentinels and 3 Pursuers |
| 1:48 | Pressure increase | Mixed group of approximately 7–9 robots |
| 2:05 | First spectacle | Coordinated Sentinel-heavy deployment, approximately 12–16 robots total in the formation |
| 2:20 | Retreat | Reduce surviving population significantly |
| 2:25–2:50 | Lull | Few or no new robots |
| 2:50 | Armored advance | 3 Armored Pursuers with supporting Pursuers |
| 3:10 | Crossfire | Sentinels approach from opposing sides |
| 3:30 | Reinforcements | Mixed Pursuers, Sentinels, and Armored Pursuers |
| 3:40 | Retreat | Partial withdrawal |
| 3:40–4:00 | Lull | Reduced encounter pressure |
| 4:00 | Heavy assault | Large mixed formation |
| 4:20 | Laser crescendo | Major Sentinel-focused deployment |
| 4:42 | Final deployment | Dramatic mixed swarm, respecting population cap |
| 4:51 | Evacuation | Begin withdrawal of all ordinary enemies |
| 5:00 | Boss boundary | No ordinary enemies remain active; arena reserved for Proxy |

The exact group sizes should remain configurable.

Do not blindly spawn the full configured group if it would exceed the active population cap.

The choreography should retain strong peaks and valleys.

Do not transform the score into uniform spawning every few seconds.

### 7. Encounter formation types

Support several reusable formations.

#### PATROL

A small loosely spaced group.

Suitable for the early descent.

#### FAN

Robots distributed across much of the visible horizontal space.

Do not fill the entire width with unavoidable collisions.

#### PINCER

Enemies enter from different sides and converge.

Useful for encouraging Blackrush to move.

#### SENTINEL_WALL

A dramatic line or arc of Sentinels that produces numerous converging targeting beams.

This formation should recreate the impressive visual effect the developer observed after manually spawning approximately thirty Sentinels.

Begin with a smaller configurable group, approximately 12–16, and allow experimentation.

Do not require all Sentinels to fire on exactly the same simulation frame.

Small deterministic staggering is acceptable for readability.

#### MIXED_SWARM

Pursuers, Sentinels, and Armored Pursuers in a coordinated group.

#### HEAVY_ADVANCE

Armored robots supported by lighter robots.

All formations must consider the visible camera area, obstacles, and existing robots.

### 8. Safe spawn placement

The developer reports that the Step 6 manual spawn corrections are working well.

Reuse the existing safe spawn logic where appropriate.

Spawn positions must:

- Be inside the current gameplay region or a valid near-viewport entry region.
- Avoid solid obstacles.
- Avoid overlapping Blackrush.
- Avoid excessive robot overlap.
- Respect camera depth.
- Work in the descending chamber.
- Be reproducible given the same timeline position and seed.

Avoid always spawning enemies directly above Blackrush.

Mix side approaches, forward approaches, and small groups entering from behind where appropriate.

For dense formations, distribute arrivals over a short configurable interval.

A dramatic deployment can take approximately one to three seconds to complete.

Do not attempt to create dozens of active physics entities on one frame when staggered creation would achieve the intended effect more safely.

### 9. Population management

Introduce configurable encounter population limits.

Suggested initial values:

- Soft target during ordinary combat: 10–16 active robots.
- Normal hard cap: 24 active robots.
- Spectacle hard cap: 36 active robots.
- Retreat preparation threshold: configurable per cue.

These values are starting points, not permanent balance decisions.

The soft target is not a requirement to continually refill the battlefield.

During a lull, the director should allow the population to fall without replacing destroyed robots.

During a scripted spectacle, it may temporarily allow a much larger group.

If a spawn event requests more enemies than the available capacity:

- Prioritize the intended composition.
- Reduce the event's actual spawned count.
- Log the adjustment in debug mode.
- Do not silently exceed the hard cap.

The count should include active and retreating robots until they have actually exited or been retired.

Avoid unlimited backlog queues that unexpectedly deploy old waves during later musical passages.

If an event's spawning window expires, discard unspawned reinforcements rather than delivering them at the wrong musical moment.

### 10. Tactical retreat system

This feature is particularly important.

The developer suggests that, when musical choreography requires a reduction in enemies, surviving robots should appear to run away instead of simply vanishing.

Implement an explicit retreat behavior.

Suggested robot AI state:

`RETREATING`

When a retreat command is issued:

1. Select eligible robots.
2. Assign them a retreat destination.
3. Determine whether the left or right edge is closer.
4. Move them toward that edge.
5. Increase their movement speed during retreat.
6. Allow a brief visible departure.
7. Remove them safely after they leave the active viewport through a valid exit.

The player should see robots deliberately abandoning the fight.

Retreating robots should generally stop acquiring new targets and firing weapons.

A robot already firing should cleanly cancel or finish its current attack according to a simple consistent policy.

It should not leave targeting beams or laser effects behind.

Retreating robots may still be destroyed by the player's weapons.

Do not instantly remove them from collision and combat while they remain visibly on screen.

### 11. Retreating through environmental geometry

The chamber now contains perimeter walls and solid obstacles.

Do not implement retreat by simply pushing robots horizontally through solid walls.

Determine how the existing level geometry can support plausible exits.

Acceptable strategies:

- Designate valid side passageways in selected chunks.
- Add unobtrusive industrial access openings.
- Route retreating robots around nearby obstacles.
- Use a short exit corridor or suitable navigation target.

Avoid requiring a complete navigation-mesh system.

If a robot cannot reach an exit in the allotted time, use a graceful fallback when it is no longer visible, rather than leaving it permanently stuck in the scene.

Do not allow a robot to visibly clip through a support column or perimeter wall merely because it has entered RETREATING state.

If necessary, add small cosmetic exit features at appropriate chamber edges, but do not redesign the entire environment.

### 12. Partial retreats

A `RETREAT` cue may order only some robots to withdraw.

Support a configurable fraction, for example:

- 25%.
- 50%.
- 75%.
- 100%.

Selection should be deterministic for a given cue and seed.

Useful selection policies include:

- Oldest surviving robots first.
- Robots furthest from Blackrush first.
- Robots already trailing behind the camera.
- A deterministic mixture.

Do not select solely by robot array iteration order unless that order is intentionally stable.

When a partial retreat occurs, enough robots may remain to maintain some danger.

The goal is to produce a controlled dramatic valley, not necessarily an empty battlefield.

### 13. Clear for Proxy

The camera stops descending at Synth 5:00.

The Proxy fight begins in this fixed arena in a later milestone.

By the time the arena is reached, ordinary robots should have withdrawn.

Issue a `CLEAR_FOR_BOSS` event sufficiently ahead of 5:00, initially around 4:51.

The director should:

- Stop generating ordinary reinforcements.
- Cancel pending formation deployments.
- Order all surviving ordinary robots to retreat.
- Prevent new ordinary encounter cues from activating.
- Allow a visually plausible withdrawal period.
- Ensure no ordinary enemies remain to interfere with the boss sequence at 5:00.

At the exact boss boundary, safely retire any residual ordinary enemies that have not completed their retreat.

If an enemy is still visible, prefer a rapid visually motivated exit or another acceptable cleanup effect rather than an unexplained pop.

Do not permit robots to remain indefinitely solely to preserve the retreat animation.

Do not spawn the Proxy.

Do not implement the boss fight.

### 14. Catch-up bursts

Implement a limited catch-up behavior for selected Pursuers and Armored Pursuers.

The purpose is to create occasional surprise acceleration when robots begin falling behind the scrolling battlefield.

Requirements:

- Only eligible robots can perform a burst.
- Burst speed multiplier is configurable.
- Burst duration is short, approximately 0.5–1.5 seconds.
- Burst cooldown prevents continuous acceleration.
- Bursts respect solid obstacle collision.
- Bursts cannot bypass walls.
- Bursts should not unfairly teleport robots.
- Do not cause unavoidable contact damage.
- Do not let a robot re-enter from arbitrarily far behind.

Suggested initial speed multiplier: 1.8.

When a robot is near the trailing viewport boundary, the director or robot AI may trigger a catch-up burst toward the playable area.

Use deterministic, configurable eligibility or probability.

Do not trigger bursts during RETREATING state.

Do not trigger bursts during the pre-boss evacuation.

Robots sufficiently far outside the encounter region should eventually be retired.

Catch-up bursts should create uncertainty, not indefinitely preserve every enemy.

### 15. Encounter difficulty and fairness

The game should remain approachable to a casual player.

Ordinary robots are intentionally easy to destroy.

Do not increase robot health or weapon resistance merely because large swarms are introduced.

Preserve:

- One energy hit destroys a Pursuer.
- Two energy hits destroy a Sentinel.
- Axe destroys ordinary robots.
- Axe removes armored plating.
- One subsequent energy bolt destroys an exposed Armored Pursuer.

Use spatial arrangements, attack timing, and numbers to create challenge.

Avoid unavoidable instant death from simultaneous Sentinel lasers.

For dramatic laser-wall events, use slight deterministic staggering and existing targeting warnings.

The player should generally have some opportunity to move behind cover.

Do not allow the encounter director to overwrite the current six-heart or regenerating-shield mechanics.

### 16. Musical timeline synchronization

The soundtrack remains authoritative.

Encounter events should execute when playback crosses their configured times during normal forward playback.

Do not implement musical cues using independent wall-clock `setTimeout()` calls.

Do not rely on frame counts.

Do not require exact equality between the current track time and an event timestamp.

Handle crossing between frames, including small frame-time jumps.

Each one-shot encounter cue must fire at most once during its intended normal playback crossing.

Pause must freeze pending spawn sequences and robot encounter behavior.

Resume must continue without replaying already fired cues.

Normal track progression must preserve hearts and score.

### 17. Developer seeking

Developer seeking must remain deterministic and fast.

When jumping directly to a timestamp:

- Do not replay every earlier spawn event.
- Do not retroactively inflict combat damage.
- Do not reconstruct every robot killed or evaded in a hypothetical earlier history.
- Clear outdated active combat and encounter objects.
- Determine the relevant score section.
- Recreate a representative fixture for the destination time.
- Restore the correct camera position.
- Restore the correct collision geometry.
- Restore Blackrush in a safe position.
- Reset encounter cue bookkeeping appropriately.
- Prevent immediately re-firing already represented encounter cues.

A developer seek to the middle of a major swarm should produce an appropriate test swarm.

A developer seek into a lull should produce few or no enemies.

A developer seek to Proxy should produce no ordinary robots.

Consider explicitly defining `seekPreview` encounter fixtures or section snapshots in configuration.

Distinguish:

**Normal playback:** Real gameplay history is preserved.

**Developer seek:** An intentional reconstruction of a representative test state.

If the user seeks backward and allows music to advance naturally again, upcoming encounter cues must fire once at the correct times.

### 18. Synth-to-Cathedral and Studio safety

Step 6.1 fixed a serious lifecycle race involving track changes and destroyed physics groups.

Preserve that repair.

The EncounterDirector must stop issuing commands after its owning scene or session is shutting down.

It must not act on destroyed robot groups.

It must not retain stale references to old GameScene objects after a restart.

It must not handle Studio's track-start event as a gameplay spawn event.

The natural transition from Cathedral to Studio must continue displaying EndingScene.

Developer jumps backward from Victory must restore a valid gameplay scene.

Do not introduce duplicate timeline listeners.

### 19. Debug panel additions

Extend the existing debug panel with a modest Encounter Director section.

Suggested readouts:

- Current musical section.
- Current encounter cue.
- Active robot count.
- Retreating robot count.
- Population cap.
- Pending formation count.
- EncounterDirector enabled/disabled state.
- Next musical encounter cue.

Suggested controls:

- Enable/disable automatic encounters.
- Trigger a small patrol.
- Trigger a Sentinel wall.
- Trigger partial retreat.
- Trigger full retreat.
- Trigger clear-for-boss.
- Toggle catch-up burst behavior.

These controls must use the actual EncounterDirector interfaces.

Do not implement separate dummy behavior solely for debug controls.

Do not let debug interactions trigger player weapons or Assisted movement.

Existing developer controls must continue working.

### 20. Diagnostics

Add useful debug logging for encounter operations.

Examples:

`[ENCOUNTER] 125.0s SENTINEL_WALL requested=16 spawned=14 cap=24`

`[ENCOUNTER] RETREAT selected=9 active=17`

`[ENCOUNTER] CLEAR_FOR_BOSS active=0`

Use the existing session identifier where available.

Avoid per-frame console flooding.

Log meaningful state transitions, not every movement update.

### 21. Performance and cleanup

The user has manually spawned approximately thirty Sentinels and found the resulting effects impressive.

This is encouraging, but the director must manage such loads carefully.

Requirements:

- Respect configurable hard caps.
- Avoid unlimited projectile or laser creation.
- Reuse existing pooling where appropriate.
- Remove destroyed robots from active encounter tracking.
- Remove completed retreating robots.
- Stop robot AI when objects are deactivated.
- Avoid retaining references to previous sessions.
- Keep obstacle collision interactions efficient.
- Limit per-frame formation generation work.

Target smooth operation with approximately 30–36 active robots on a typical desktop system.

Do not claim performance benchmarks unless actually measured.

### 22. Automated tests

Extend the existing tests.

At minimum verify:

1. Encounter score timestamps are valid and ordered.
2. Spawn commands use the configured robot types.
3. Normal playback fires a cue once.
4. Pausing does not fire new cues.
5. Resuming does not duplicate cues.
6. Multiple cues crossed in a frame execute in chronological order.
7. Normal hard caps are respected.
8. Spectacle hard caps are respected.
9. A formation can be reduced when population is near its cap.
10. A spawn sequence does not continue after its musical window expires.
11. A seek does not replay historical spawn events.
12. A seek into a lull creates the appropriate quiet fixture.
13. A seek into a swarm creates the appropriate test fixture.
14. Seeking backward rearms future cues correctly.
15. Retreat selection is deterministic.
16. A partial retreat selects the configured fraction.
17. Retreating robots stop ordinary attack acquisition.
18. Retreating robots can still be destroyed.
19. Retreat completion removes robots from active tracking.
20. Catch-up bursts respect cooldown and duration.
21. Catch-up bursts do not activate during retreat.
22. Catch-up bursts obey obstacle collision rules.
23. `CLEAR_FOR_BOSS` cancels pending spawns.
24. No ordinary robots remain at Synth 5:00.
25. Normal Synth-to-Cathedral progression preserves survival state.
26. EncounterDirector shutdown removes scene-owned subscriptions.
27. Restart initializes a fresh encounter state.
28. Natural Cathedral-to-Studio transition still works.

Use actual application logic where practical.

Do not merely test mock substitutes for the core scheduling behavior.

### 23. Browser acceptance tests

Perform browser testing if available, otherwise provide a precise manual checklist.

#### Musical progression

- Start at Synth 0:00.
- Allow the soundtrack to progress naturally.
- Verify encounter intensity rises and falls according to the configured score.
- Verify major formations appear near their designated musical timestamps.
- Verify quiet periods actually feel calmer.

#### Spectacle

- Seek shortly before the first major Sentinel wall.
- Let the event trigger naturally.
- Verify a dramatic number of targeting beams appear.
- Confirm the player can still dodge and fight.
- Confirm no large frame-rate collapse or exceptions.

#### Tactical retreat

- Allow several enemies to survive.
- Trigger partial retreat.
- Observe selected robots running toward the nearest suitable side exit.
- Confirm they do not simply vanish in the middle of the visible playing field.
- Confirm they cannot phase through solid machinery.
- Confirm remaining robots can continue combat.

#### Catch-up behavior

- Allow a Pursuer to fall behind.
- Verify occasional speed bursts.
- Confirm robots eventually retire if too far behind.
- Confirm bursts stop during retreat and boss preparation.

#### Boss boundary

- Seek to approximately 4:40.
- Allow the final swarm event to occur.
- Observe the evacuation beginning before 5:00.
- Confirm the battlefield is cleared at 5:00.
- Confirm the camera stops normally.
- Confirm no Proxy boss is created yet.

#### Seeking and lifecycle

- Seek into an early patrol.
- Seek into a major swarm.
- Seek into a lull.
- Seek to Proxy.
- Seek to Cathedral.
- Seek to Victory.
- Replay.
- Confirm correct encounter reconstruction, no stale robots, and no exceptions.

#### Survival

- Lose a heart during a major swarm.
- Confirm respawning works.
- Confirm music and scheduled encounters continue.
- Confirm shields regenerate normally.
- Confirm final defeat stops gameplay.
- Restart and confirm fresh encounter scheduling.

### 24. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `README.md`

Document:

- EncounterDirector architecture.
- Encounter score schema.
- Editable musical cue timestamps.
- Formation types.
- Population cap behavior.
- Tactical retreat commands.
- Retreat exit behavior.
- Catch-up bursts.
- Seeking and deterministic reconstruction.
- Boss-boundary clearing.
- Developer controls.
- Performance considerations.
- Test results and known limitations.

Include a short practical example showing how the developer can change the number and timing of robots in a specific encounter without modifying JavaScript game logic.

### 25. Strict scope restrictions

Do not implement:

- Proxy boss.
- German soldier.
- Grenade mechanics.
- Giant super-robot.
- Panzer tank.
- Lorelei companion.
- Police NPCs.
- New robot archetypes.
- New player weapons.
- Permanent upgrades.
- Extra-heart pickups.
- Destructible environment geometry.
- Full mobile controls.
- Final artwork.
- New musical recordings.
- A procedural music generator.
- Adaptive soundtrack tempo.

Do not modify the original MP3 recordings.

Do not change established timeline phase boundaries.

Do not redesign the working controls.

Do not change existing weapon damage values.

Do not change the survival balance during this milestone.

### 26. Definition of done

Step 7 is complete when:

- EncounterDirector is implemented.
- Encounter choreography is data-driven.
- Musical cues spawn formations at the configured times.
- Major dramatic peaks and quieter valleys are present.
- Spectacular Sentinel-heavy deployments work.
- Population limits prevent unbounded swarms.
- Robots can receive partial and full retreat orders.
- Retreating robots visibly move toward appropriate exits.
- Retreat behavior respects environmental collisions.
- Catch-up bursts work with appropriate limits.
- Clear-for-boss removes surviving ordinary robots before the Proxy phase.
- Musical seeking reconstructs appropriate encounter states.
- Restart and Replay remain stable.
- Hearts, shields, respawning, and combat remain functional.
- The natural ending still works.
- Automated tests pass.
- Production build succeeds.
- Browser verification passes or remaining manual verification is clearly reported.

Provide a detailed completion report describing:

1. New and modified files.
2. EncounterDirector architecture.
3. Encounter score configuration.
4. Musical cue handling.
5. Formation spawning.
6. Population management.
7. Retreat behavior.
8. Catch-up bursts.
9. Seeking and lifecycle behavior.
10. Automated tests.
11. Browser verification.
12. Known limitations.

**Stop after Step 7. Do not begin Step 8 without authorization.**