# JUNIE TASK — LORELEI: DESCENT
## Step 9.6: NOVA — Emergency Area-Clear Weapon

### Objective

Implement a new emergency attack for Blackrush called NOVA.

NOVA allows the player to sacrifice one heart to instantly destroy all active ordinary robots.

The purpose is to give the player a last-resort escape from overwhelming swarms without removing the challenge of ordinary combat.

This is a focused gameplay milestone.

Do not implement new bosses, art, music, difficulty modes, or unrelated systems.

### 1. Activation

Bind NOVA to the SPACE key.

Requirements:

- NOVA activates only on a fresh key press.
- Holding SPACE must not trigger multiple activations.
- SPACE must be released before another NOVA can fire.
- Do not activate NOVA while the game is paused, unfocused, showing the title screen, showing Game Over, or transitioning scenes.
- Do not interfere with existing Classic or Assisted movement controls.
- Do not interfere with mouse aiming, shooting, or axe throwing.

### 2. Heart cost

NOVA costs exactly one heart.

Activation is permitted only when Blackrush has at least two hearts.

When only one heart remains, NOVA is unavailable.

Spending a heart must not:

- Trigger the normal death sequence.
- Activate the respawn delay.
- Reset the player's position.
- Stop or restart music.
- Refill shields.
- Reset score.
- Reset encounter progress.

Add a dedicated heart-spending method to the existing survival system or Blackrush entity.

Do not simulate voluntary heart expenditure by inflicting damage until a heart is lost.

Update the HUD immediately.

Ensure low-heart warning behavior responds correctly to the new heart count.

### 3. Weapon effect

When NOVA fires:

- Destroy every active ordinary robot.
- Include Pursuers, Sentinels, and Armored Pursuers.
- Include active retreating robots.
- Cancel their current attack and targeting states.
- Remove existing Sentinel warning beams and firing beams.
- Prevent any stale robot attack from delivering damage after the robot has been destroyed.
- Use existing robot death/cleanup mechanisms where possible.

Boss entities must not be damaged.

Do not destroy:

- ProxyBoss.
- Future super-robot bosses.
- GermanSoldier.
- Lorelei companion entities.
- Heart pickups.
- Grenades.
- Environmental objects.

NOVA may destroy ordinary supporting robots during boss encounters.

### 4. Scoring

NOVA kills award no points.

Preserve points already earned through regular combat.

Do not trigger ordinary robot scoring callbacks from the NOVA elimination path.

Ensure robots killed by NOVA cannot later award points through delayed attack or death callbacks.

### 5. Pending encounter formations

Coordinate with EncounterDirector.

When NOVA activates:

- Cancel robots still queued in the currently deploying formation.
- Leave future musical cues intact.
- Preserve the authoritative timeline.
- Do not mark future encounter events as passed.
- Do not reset the EncounterDirector.
- Do not re-create robots immediately from the same queued formation.

Suspend ambient reinforcement for a configurable short period, initially two seconds of active musical playback.

The pause should respect the game's musical time and pause behavior.

Do not delay or restart the soundtrack.

Future scripted formations should occur at their scheduled musical times.

### 6. Visual feedback

Implement a simple procedural NOVA effect.

Suggested behavior:

- A cyan/white ring expands outward from Blackrush.
- The ring reaches the visible arena boundaries rapidly, within approximately 350–500ms.
- A brief pulse effect communicates the attack's extraordinary strength.
- Robots vanish or play their normal destruction effects as the energy wave reaches them.

The effect must remain lightweight.

Do not create final artwork.

Do not add external audio assets.

Do not make large opaque flashes that obscure gameplay.

The gameplay effect should resolve reliably even if visual animation is interrupted.

### 7. Temporary protection

Grant Blackrush approximately one second of invulnerability after NOVA activates.

Reuse the existing invulnerability framework.

Do not overwrite or shorten a longer existing invulnerability period.

The purpose is to prevent an enemy laser already in flight from immediately damaging Blackrush after he spends a heart.

### 8. Arena compatibility

NOVA must function during:

- Synth descent.
- Proxy boss encounter.
- Cathedral super-robot arena in a future milestone.

It must not damage bosses.

It may destroy ordinary supporting robots in boss arenas.

It must not interfere with the scripted Proxy grenade finale or the existing musical climax.

### 9. Sprite compatibility

Blackrush now uses PixelLab sprite animations.

Preserve all current animation behavior:

- Eight-direction movement.
- Force firing poses.
- Magical axe poses.
- Independent axe projectile.
- Pixel-art toggle.

NOVA can briefly override the visual state if useful, but do not introduce new required artwork.

Use procedural visual effects that work with either pixel-art or placeholder rendering.

### 10. HUD and developer tools

Add a compact NOVA availability indicator to the HUD.

Suggested display:

`NOVA [SPACE] — COST: 1 HEART`

When only one heart remains, show NOVA as unavailable.

Keep the display within the visible playing field.

Do not redesign the HUD.

Add a small debug readout or test control for NOVA in the existing developer panel if useful.

Developer panel interaction must not trigger game controls.

### 11. Seeking, restarting, and lifecycle

NOVA must not compromise the established scene lifecycle.

Test:

- Seeking to Synth.
- Seeking to Proxy.
- Seeking to Cathedral.
- Seeking to Victory.
- Restart after Game Over.
- Replay after Victory.
- Resuming after browser focus loss.

All NOVA-related visual effects, input listeners, and pending callbacks must be cleaned up on scene shutdown.

No NOVA callback should access destroyed Phaser objects.

### 12. Automated tests

Add focused tests for:

1. SPACE triggers NOVA once per press.
2. Holding SPACE does not repeat NOVA.
3. NOVA costs exactly one heart.
4. NOVA is unavailable at one heart.
5. NOVA does not activate during pause.
6. NOVA does not trigger respawning.
7. NOVA does not refill shields.
8. NOVA eliminates all ordinary robot archetypes.
9. NOVA includes retreating robots.
10. NOVA cancels Sentinel lasers.
11. NOVA awards no score.
12. NOVA does not damage ProxyBoss.
13. NOVA does not destroy pickups or allied entities.
14. NOVA cancels current pending formations.
15. Future musical cues still fire.
16. Ambient reinforcement resumes after its grace period.
17. Invulnerability is applied without shortening existing protection.
18. HUD updates immediately.
19. Restart resets NOVA state.
20. No scene lifecycle errors are introduced.

Run:

```bash
npm test
npm run build
```

### 13. Browser verification

Test with:

- Six hearts.
- Two hearts.
- One heart.
- Dense Sentinel swarm.
- Mixed armored and ordinary robots.
- Proxy boss and supporting robots.
- Pixel art enabled and disabled.
- Assisted and Classic controls.
- Repeated SPACE presses.
- Holding SPACE.
- Pause and resume.
- Game Over and restart.

Confirm the visual pulse is readable, ordinary enemies are eliminated, and music continues uninterrupted.

If browser testing is unavailable, provide explicit manual verification steps.

### 14. Documentation

Update `docs/GAME_DESIGN.md` and `docs/DEVELOPMENT.md`.

Document NOVA controls, heart cost, encounter behavior, scoring policy, protection window, and boss exemptions.

### 15. Completion criteria

Step 9.6 is complete when:

- SPACE activates NOVA.
- One heart is consumed.
- One heart always remains.
- Active ordinary robots are eliminated.
- Bosses remain unaffected.
- No NOVA kills award points.
- Pending formations are canceled correctly.
- Future musical choreography continues.
- Blackrush receives brief protection.
- Gameplay and soundtrack remain synchronized.
- Pixel art and procedural rendering both work.
- Automated tests pass.
- Production build succeeds.

**Stop after Step 9.6. Do not begin other milestones.**