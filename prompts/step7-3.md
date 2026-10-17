# LORELEI: DESCENT — Step 7.3
## Refine Encounter Pacing, Offscreen Spawning, and Swarm State Management

### Background

Step 7 has introduced a data-driven EncounterDirector, musical formation cues, robot retreats, catch-up bursts, and deterministic seeking.

After several debugging iterations, robots now spawn automatically and the game operates, but the developer reports two gameplay problems:

1. Robots arrive in large groups separated by long stretches of inactivity, leaving the battlefield feeling empty.
2. Robots sometimes appear suddenly within the visible viewport. Instead, the player should usually discover robots waiting below as the music-driven camera descends.

This task is a focused refinement of Step 7, not a new development milestone.

The developer has provided and reviewed the current implementations of:

- `src/config/encounterScore.js`
- `src/config/timeline.js`
- `src/config/combatConfig.js`
- `src/systems/EncounterDirector.js`
- `src/systems/TimelineDirector.js`

Inspect these files as they currently exist in the project, along with `GameScene`, `ChamberBuilder`, and robot lifecycle code.

Do not assume the earlier implementation reports accurately describe the current runtime behavior.

### 1. Preserve musical choreography

Keep all existing major musical cue timestamps.

Retain the dramatic Sentinel walls, heavy assaults, tactical retreats, and pre-boss evacuation.

Do not replace the score with uniform random spawning.

Separate two encounter layers:

**Scripted musical formations**

Major formations triggered at specific musical timestamps.

**Ambient resistance**

Small numbers of robots introduced between scripted formations to maintain a sense of continuous danger.

Both layers must remain under the EncounterDirector's population management.

### 2. Ambient resistance

Add a configurable ambient encounter policy to the score or a closely related configuration.

Suggested starting behavior:

- Begin ambient resistance at Synth 0:45.
- Target approximately 3–6 active ambient robots during ordinary descent.
- Add individual robots or pairs at irregular but deterministic intervals, approximately every 4–8 seconds when under the target.
- Vary Pursuers and Sentinels initially.
- Introduce occasional Armored Pursuers in later sections.
- Do not refill an active population automatically to a fixed maximum every frame.
- Do not generate ambient reinforcements during designated musical lulls.
- Suppress ambient spawning during tactical retreat preparation.
- Stop all ambient spawning permanently for the current descent at the CLEAR_FOR_BOSS cue.

Use musical playback time, not wall-clock timers, for scheduling.

Ambient placement and selection should be deterministic for a given seed and musical interval.

Avoid a repeated identical pattern that makes the spawning feel mechanical.

### 3. Spawn just below the visible viewport

For ordinary descending-chamber encounters, robots should normally be introduced immediately below the bottom edge of the camera.

They should not materialize visibly inside the playfield.

The player should see them enter naturally as the viewport descends.

Use the actual camera worldView, zoom, and configured logical dimensions instead of assuming all visible-world measurements are permanently 640 × 960.

Choose an offscreen entrance margin that accounts for the robot's physical bounds and an appropriate lead-in interval.

Avoid spawning so far down that a formation misses its intended musical passage.

For larger formations, consider creating the robots ahead of the exact musical cue so their entrance becomes visible near the cue.

This must be driven by explicit configurable lead times or world positioning, not by altering the musical master clock.

### 4. Rework spawn regions

Inspect the existing `TOP_RANDOM`, `TOP_ARC`, `TOP_FAN`, `SIDES`, `MIXED`, and `BOTTOM` region behaviors.

Currently, several region implementations place robots directly inside the visible area.

Redefine or replace regions as needed so that normal scheduled encounters enter naturally from below.

Suggested distinctions:

- `BOTTOM_APPROACH`: Just beyond the lower viewport edge.
- `BOTTOM_FAN`: Horizontally distributed below the viewport.
- `BOTTOM_ARC`: Curved formation staged below the viewport.
- `BOTTOM_PINCER`: Two flanking groups staged near opposite sides of the lower entrance.

Do not simply change all formations to the same point.

Preserve variation in horizontal distribution and formation structure.

Side entrances may remain available for special scripted moments, but should not become the default means of spawning.

Do not let robots phase through perimeter walls to enter.

### 5. Safe placement must preserve the entry region

Inspect `GameScene.findSafeSpawnPosition()` and related helper functions.

Confirm whether their safety-search logic moves an offscreen candidate into the visible viewport.

If necessary, implement a spawn-position method that accepts an explicit permitted region.

It should:

- Avoid solid geometry.
- Avoid invalid world bounds.
- Avoid overlapping robots.
- Preserve the intended offscreen entrance whenever possible.
- Find nearby alternative positions within that permitted region.
- Return a clear failure result if no safe location can be found.

Do not silently relocate an intended offscreen spawn into the middle of the battlefield.

If the position cannot be resolved, retry within the cue's valid window or discard that particular robot with a debug explanation.

### 6. Entrance timing and camera motion

The camera descends at approximately 75 world pixels per second during the principal descent.

Account for this movement when determining spawn positions and formation lead times.

A robot that is supposed to enter at a musical cue must not be created so far below the viewport that it appears many seconds late.

Similarly, robots should not enter long before their scheduled dramatic moment.

Keep the music as the authoritative clock.

The intended visual result is that Blackrush appears to discover robots already stationed below the complex, not that they teleport into existence.

### 7. Formation scheduling

Inspect the pending formation scheduler.

It currently accumulates a millisecond timer and creates robots at roughly 100ms intervals.

Verify that the timer units are consistent.

Use an accumulator that can handle elapsed time accurately and deterministically.

Avoid large unbounded bursts after a delayed frame, pause, or browser focus transition.

Define and implement expiration rules for pending formations.

When a cue expires, its unspawned robots should be discarded rather than arriving during the wrong musical passage.

Cancel pending formations when:

- A relevant RETREAT or LULL requires it.
- CLEAR_FOR_BOSS begins.
- The developer seeks.
- The owning GameScene shuts down.
- A new mission starts.

Do not allow previously queued robot arrivals to trigger unexpectedly after a lull.

### 8. Population count accuracy

Inspect `EncounterDirector.getActiveCount()`.

The current implementation uses `robotGroup.getLength()`.

Confirm whether the Phaser group may retain inactive or disabled robots after clearing or pooling.

Population caps should count the intended live population, including relevant active and retreating robots, but should not count retired or inactive objects.

Do not let stale group entries suppress later encounters.

Separate total pooled object count from active population count where necessary.

Check the behavior after:

- Killing robots.
- Friendly-fire destruction.
- Partial retreat.
- Full retreat.
- Developer seek.
- Restart.
- Boss clearing.

### 9. Director state after seeking

Inspect `EncounterDirector.onSeek()`.

Ensure seeking backward from the Proxy or Cathedral phases re-enables the encounter director correctly when returning to the Synth swarm.

Restore all relevant director state, including:

- Enabled state.
- Musical section.
- Population limits.
- Active cue bookkeeping.
- Lull state.
- Pending formations.
- Ambient schedule.
- Boss-clear state.

Do not rely on the previous musical position's mutable state.

Avoid a hardcoded 15-second lookback as the sole rule for reconstructing a representative encounter.

Prefer explicit score sections or seek-preview fixtures so the reconstructed encounter reflects the intended musical intensity.

Seeking into a lull should produce few or no robots.

Seeking into a major spectacle should create an appropriate testing formation.

Seeking to Proxy should clear ordinary enemies.

### 10. Retreat behavior

Preserve Step 7's tactical retreat implementation.

Ambient robots and scripted robots may both be selected for retreat according to cue rules.

Retreats must reduce active encounter pressure.

Keep robots visually moving toward legitimate exits.

Retreating robots must not continue firing.

Do not change the existing catch-up burst logic unless necessary for a confirmed defect.

Catch-up bursts must remain disabled for retreating robots.

### 11. Pre-boss evacuation

At approximately Synth 4:51, begin clearing ordinary enemies.

At Synth 5:00:

- No ambient robots should spawn.
- No scripted formations should remain queued.
- Ordinary robots should no longer interfere with the future Proxy boss.
- The camera should enter the established fixed arena mode.

Preserve the current boss boundary.

Do not implement the Proxy boss.

### 12. Developer diagnostics

Extend debug readouts to distinguish:

- Active ambient robots.
- Active scripted robots.
- Retreating robots.
- Inactive or pooled robots.
- Pending formations.
- Next ambient spawn time.
- Next scripted cue.
- Current musical section.
- Current population cap.

Log spawn decisions only in debug mode.

For each spawn, include:

- Musical time.
- Cue or ambient source.
- Robot type.
- Intended entry region.
- Final world position.
- Camera visible bounds.
- Whether safety placement adjusted the coordinates.
- Whether the spawn was rejected.

This will make offscreen spawning much easier to tune.

Do not log every frame.

### 13. Preserve developer tools

Retain the existing debug SPAWN buttons and encounter controls.

Manual developer spawning may continue to place robots within the visible area because its purpose is immediate combat testing.

This behavior is intentionally different from normal scheduled encounters, which should enter from below.

Make that distinction explicit in the implementation.

Debug panel clicks must not cause Blackrush to fire or move.

Preserve the global timeline slider, including cross-track seeking.

### 14. Automated tests

Add targeted tests covering:

1. Ambient reinforcement begins at the configured time.
2. Ambient spawning remains below the population target.
3. Ambient spawning is suppressed during a lull.
4. Ambient spawning stops before the boss arena.
5. Normal scheduled spawn positions begin outside the visible viewport.
6. Spawn safety searches preserve the permitted entry region.
7. No invalid positions are returned.
8. Formation layout produces horizontal variation.
9. Formation timing follows musical cues.
10. Pending formations expire or cancel appropriately.
11. Population counting excludes inactive robots.
12. Population counting includes active retreating robots where required.
13. Seeking backward correctly re-enables the director.
14. Seeking into a lull produces the expected test state.
15. Seeking into a swarm produces an appropriate fixture.
16. Seeking to Proxy produces no ordinary enemies.
17. Repeated seeks do not duplicate encounters.
18. Restart restores the original ambient and scripted schedules.
19. Natural track transitions remain safe.
20. The existing shield, hearts, and combat tests remain passing.

Use actual application code and configuration values where practical.

### 15. Browser verification

Test the following:

**Normal descent**

Play from Synth 0:00 through at least 2:30.

Confirm:

- First resistance appears around the beginning of the swarm.
- Smaller encounters occur between major deployments.
- Major formations remain recognizable as dramatic events.
- Robots enter naturally from below.
- No robots visibly materialize inside the battlefield.
- Musical lulls actually become calmer.

**Dense formation**

Seek just before the first Sentinel wall.

Confirm the formation enters as an organized group, rather than teleporting into view.

Confirm the performance remains acceptable.

**Population cleanup**

Allow robots to survive and accumulate.

Verify retreat orders lower population.

Confirm later formations are not blocked by inactive robots incorrectly counted against the cap.

**Seeking**

Seek from Proxy backward into the swarm.

Verify encounters resume.

Seek among quiet and intense sections.

Verify representative states.

**Lifecycle**

Test Restart, Replay, Game Over, Cathedral, and natural Studio victory.

Preserve all Step 6.1 lifecycle safety fixes.

If browser automation is unavailable, clearly identify the manual checks still requiring the developer's verification.

### 16. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`

Document ambient resistance versus scripted formations.

Document spawn lead times, region definitions, population targets, pending formation behavior, and seek-preview reconstruction.

Include examples showing how to change ambient pressure or formation arrival timing.

### 17. Scope restrictions

Do not implement:

- Additional robot types.
- Boss battles.
- German soldier.
- Grenade mechanics.
- Panzer tank.
- Lorelei companion.
- New music.
- Final sprites.
- Mobile controls.
- Additional weapons.
- Shield or heart rebalancing.
- Complex pathfinding.
- Major scene refactoring.

Preserve the working Classic and Assisted controls.

Preserve existing damage, lasers, armor, cover, hearts, regeneration, and respawning.

Do not modify the original music files.

### 18. Definition of done

Step 7.3 is complete when:

- Robots enter naturally from below the battlefield.
- Ambient resistance provides activity between major musical events.
- Lulls remain genuinely quieter.
- Musical spectacles retain their dramatic impact.
- Population caps use correct active counts.
- Pending formations are managed reliably.
- Retreats and boss clearing remain functional.
- Seeking correctly reconstructs the encounter state.
- Restart, Replay, and natural Victory remain functional.
- No visible spontaneous robot materialization occurs during normal scheduled encounters.
- Automated tests pass.
- Production build succeeds.
- Browser verification is completed or explicitly delegated for manual testing.

Provide a completion report identifying actual changes, verification results, and known limitations.

**Stop after Step 7.3. Do not begin Step 8.**