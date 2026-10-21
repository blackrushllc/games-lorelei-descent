# JUNIE TASK — LORELEI: DESCENT
## Step 9.7: Adaptive Assistance and Arena Checkpoints

### 1. Project context

LORELEI: DESCENT is a music-driven Phaser 3.88.2 arcade shooter.

Steps 1–9.6 are implemented, including:

- Classic and Assisted controls.
- Animated Blackrush and Pursuer sprites.
- Energy bolts, magical axe and NOVA.
- Six-heart survival system and regenerating shields.
- Conditional HEART_DROP musical events.
- Music-driven scripted encounters and ambient robots.
- Tactical retreats and boss clearing.
- Responsive 1280-pixel world.
- Proxy boss prototype.
- German soldier and grenade prototype.
- Game Over, restart, seeking and scene transitions.

NOVA, implemented in Step 9.6, has been manually tested and works correctly.

This milestone introduces two gameplay conveniences:

1. Invisible adaptive difficulty for players who collect hearts.
2. Arena checkpoints that let players retry boss encounters without replaying the entire descent.

Do not introduce new boss mechanics or change the existing soundtrack.

### PART A — Adaptive assistance

#### 2. Assistance rules

Every time Blackrush **collects** a HEART_DROP pickup, increase his mission assistance level by one.

Do not increase assistance when:

- A heart merely spawns.
- Blackrush loses a heart from damage.
- Blackrush spends a heart using NOVA.
- Blackrush respawns.
- The developer directly changes the heart count.

The assistance level persists for the current mission.

It resets when beginning an entirely new mission.

Use a central mission-level state variable rather than independently calculating difficulty from Blackrush's current heart count.

#### 3. Spawn multipliers

Suggested configurable table:

```javascript
export const ASSISTANCE_CONFIG = {
    spawnMultipliers: [1.0, 0.5, 0.35, 0.25],
    minimumFormationCount: 4,
    affectsAmbient: true,
    affectsScripted: true,
    appliesBeforeSynthTime: 300
};
```

Interpretation:

- Zero hearts collected: 100% normal spawning.
- One heart collected: 50%.
- Two hearts collected: 35%.
- Three or more hearts collected: 25%.

These numbers must be easy for the developer to tune.

Apply the multiplier to future spawn requests, not robots already active.

Preserve the composition of mixed formations as reasonably as possible.

Do not allow rounding to eliminate an entire small formation unintentionally; distinguish between minimum formation counts and already-small encounters.

Respect existing population caps.

Do not modify existing `encounterScore.js` timestamps or authored base counts.

#### 4. Preserve musical spectacles

Adaptive assistance must not completely eliminate important musical formations.

For example, a `SENTINEL_WALL` should remain recognizable as a formation even after multiple heart pickups.

Use configurable minimums and formation-aware rounding.

Do not introduce new spawn events.

The musical score remains the source of base encounter numbers.

#### 5. Scope of assistance

Adaptive assistance applies only during Synth descent before 5:00.

It must not scale:

- Proxy boss.
- Cathedral giant boss.
- Boss arena reinforcements.
- Grenade mechanics.
- NOVA damage.
- Player weapons.
- Shield or heart damage.

When Blackrush reaches the Proxy arena, the assistance level may remain stored for diagnostics but must no longer influence encounter spawning.

#### 6. Seeking and restart

Preserve the distinction between normal play and developer seeking.

Normal gameplay retains the actual collected-heart assistance level.

Developer seeking must not invent heart collections.

For reproducible testing, provide a debug control to set assistance level explicitly.

Starting a completely new mission resets assistance to zero.

Arena retries must not accidentally grant extra assistance.

### PART B — Arena checkpoints

#### 7. Checkpoint definitions

Implement configurable arena checkpoints:

```javascript
export const ARENA_CHECKPOINTS = {
    PROXY: {
        track: 'SYNTH',
        time: 300,
        startingHearts: 3,
        startingShield: 100
    },
    SUPER_ROBOT: {
        track: 'CATHEDRAL',
        time: 0,
        startingHearts: 3,
        startingShield: 100
    }
};
```

The Proxy checkpoint becomes available when Blackrush naturally reaches Synth 5:00.

The super-robot checkpoint becomes available when normal play transitions to Cathedral.

The Cathedral boss is not yet implemented. Build checkpoint infrastructure that will support it later.

Do not implement the super-robot during this milestone.

Checkpoint eligibility must reflect actual gameplay progression, not merely the existence of a configured checkpoint.

#### 8. Game Over continuation

If Blackrush loses his last heart during an arena encounter, GameOverScene should offer:

**CONTINUE FROM ARENA**

Also retain:

- Restart Mission.
- Back to Title.

The player should be able to choose the option deliberately, without mouse-event bleed-through.

Use the most recently reached eligible arena checkpoint.

Never send the player back to an earlier boss when a later checkpoint is available.

A player who dies during the descent before reaching any arena should see the existing Game Over behavior.

#### 9. Continue availability

Initially permit unlimited arena attempts.

Each attempt begins with:

- Three hearts.
- Full shield.
- Existing weapons.
- No additional pickups.
- Zero score changes from simply continuing.

Track the number of arena retries for diagnostics.

Do not require replaying the descent.

The player previously suggested a limited decision window. Implement a configurable 20-second countdown if straightforward, but do not automatically restart the game when it expires. The normal Restart Mission and Back to Title controls must remain accessible.

Prefer a reliable, understandable continue interaction over complicated timer behavior.

#### 10. Music and boss reconstruction

Continuing from Proxy:

- Start Synth at 5:00.
- Recreate the fixed arena.
- Recreate Blackrush safely.
- Restore three hearts and full shield.
- Recreate the Proxy in its initial combat state.
- Reset boss components and attack state.
- Clear old lasers, robots, grenade and soldier entities.
- Restore the appropriate boss reinforcement schedule.

Continuing from Cathedral:

- Start Cathedral at 0:00.
- Recreate the valid gameplay arena.
- Restore three hearts and full shield.
- Prepare the existing/future Cathedral encounter state.

Use the centralized session and scene lifecycle machinery.

Do not attempt to resurrect disposed Phaser physics objects.

Avoid stale listeners and duplicate track-start events.

#### 11. Checkpoint ownership

Store checkpoint information in mission-level state that survives GameScene shutdown and GameOverScene creation.

Do not rely exclusively on fields attached to a destroyed Blackrush entity.

Separate:

- Mission start.
- Arena checkpoint acquisition.
- Heart loss.
- Game Over.
- Arena continuation.
- Full mission restart.

Do not accidentally unlock a checkpoint because the developer moved the timeline slider unless explicitly running a debug test.

### PART C — NOVA compatibility

#### 12. Heart spending

NOVA continues to cost one heart.

It must not increase the assistance level.

The assistance level should change only after successful pickup collection.

NOVA must remain unavailable with one heart.

Arena retries begin with three hearts, so NOVA is available immediately.

Its behavior in the arena remains unchanged: ordinary robots are destroyed, bosses are unaffected.

### PART D — Developer tools

#### 13. Diagnostics

Add compact debug information:

- Current assistance level.
- Current spawn multiplier.
- Number of heart pickups collected.
- Current arena checkpoint.
- Arena continue eligibility.
- Arena retry count.

Useful controls:

- Set assistance level for testing.
- Simulate acquiring the Proxy checkpoint.
- Simulate acquiring the Cathedral checkpoint.
- Test arena continuation.

These controls must work through real gameplay APIs and must not create a second mission lifecycle implementation.

Keep normal non-debug gameplay unaffected.

### PART E — Verification

#### 14. Automated tests

Add tests covering:

1. Collecting a heart increments assistance.
2. Heart spawning without collection does not.
3. NOVA spending does not change assistance.
4. Damage and respawning do not change assistance.
5. Spawn multipliers apply correctly.
6. Minimum formation sizes are respected.
7. Mixed formations remain reasonably composed.
8. Assistance applies to ambient and scripted descent encounters.
9. Assistance does not affect boss reinforcements.
10. Assistance does not change existing active robots.
11. Full mission restart resets assistance.
12. Developer seeking does not fabricate heart pickups.
13. Proxy checkpoint unlocks at normal Synth 5:00 progression.
14. Cathedral checkpoint unlocks at normal Cathedral entry.
15. Death before an arena does not offer a continue.
16. Death during an arena offers Continue From Arena.
17. Continue restores three hearts and full shield.
18. Continue resets boss health and components.
19. Continue clears stale encounter objects.
20. Continue restarts at the correct music timestamp.
21. Repeated continues remain safe.
22. Back to Title works after Game Over.
23. Full mission restart still begins at Synth 0:00.
24. Existing NOVA and survival tests continue passing.
25. Natural Cathedral-to-Studio Victory remains functional.

Run `npm test` and `npm run build`.

#### 15. Browser verification

Test the actual game when available.

**Adaptive assistance**

- Begin with normal difficulty.
- Collect a heart during Synth.
- Verify subsequent encounter populations are reduced.
- Collect another heart.
- Verify further reduction.
- Confirm musical formations still appear.
- Use NOVA and verify assistance does not change.

**Proxy checkpoint**

- Reach Synth 5:00.
- Reduce hearts and die during the Proxy encounter.
- Select Continue From Arena.
- Confirm Synth restarts at 5:00, with the arena and Proxy reset.
- Confirm three hearts and full shield.
- Repeat to verify no lifecycle errors.

**Navigation**

- Restart entire mission.
- Return to title.
- Start again.
- Seek to Victory in debug mode.
- Confirm scene transitions remain functional.

If browser automation is unavailable, report these checks as requiring manual playtesting.

#### 16. Documentation

Update:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`

Document:

- Assistance multipliers.
- Heart collection rules.
- Formation minimums.
- Mission-level state.
- Arena checkpoint acquisition.
- Continue behavior.
- Music restart semantics.
- Developer testing controls.

### Scope restrictions

Do not implement:

- Giant super-robot.
- Panzer tank.
- Shadow Lorelei.
- New animations or sprites.
- New soundtrack.
- New ordinary robot types.
- Further Proxy combat development.
- Touchscreen controls.
- Additional weapons.
- Visual presentation redesign.
- Cutscenes or narrative sequences.

### Definition of done

Step 9.7 is complete when adaptive assistance reliably reduces future descent encounters following heart pickups, and arena continuation allows a player who dies during a boss fight to retry that arena without replaying the descent.

Preserve all existing working gameplay.

Report modified files, tests, browser verification and known limitations.

**Stop after Step 9.7.**