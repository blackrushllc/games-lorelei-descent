# Development Roadmap - LORELEI: DESCENT

## Milestones

1.  **Project setup and prerequisites** (Completed)
2.  **Game skeleton and scenes** (Completed)
3.  **Music integration and master timeline** (Completed)
3.1 **Maintenance: Lifecycle, Debug Panel, and Centering** (Completed)
4.  **Blackrush movement and weapons** (Completed)
4.1 **Maintenance: Projectile Physics and Startup Fixes** (Completed)
4.2 **Fixed Boss Arena and Mouse-Assisted Movement** (Completed)
4.3 **Maintenance: Assisted Movement Crash Fix** (Completed)
5.  **Robot combat and destruction** (Completed)
5.1 **Maintenance: Robot Visuals, Crashes, and Game Over** (Completed)
5.2 **Maintenance: Combat Repair and Restart Lifecycle** (Completed)
5.3 **Maintenance: Mission Lifecycle, Player Restoration, and Shield HUD** (Completed)
5.4 **Shield HUD Repair, Regeneration, Hearts, and Respawning** (Completed)
6.  **Solid Obstacles, Environmental Cover, and Robot Navigation** (Completed)
7.  **Encounter Director, choreographed encounters, and tactical retreats** (Completed)
7.3 **Ambient Resistance and Offscreen Spawning** (Completed)
8.  **Opening chase** (Completed)
9.  **Proxy boss and German soldier** (Completed)
10. **Super-robot and Panzer**
11. **Ending and promotion**
12. **Character and environment artwork**
13. **Sound effects and visual/audio polish**
14. **Mobile controls and playtesting**
15. **Production deployment**

## Verification

### Step 9 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Heart Drops**:
    - Reduce hearts to 2 (using **COMBAT TOOLS**).
    - Seek to 155s.
    - Observe `HEART_1` triggering at 160s.
    - Collect the heart; verify it restores 1 life.
    - Verify collecting with 6 hearts does nothing but consumes the item.
4. **Expanded Battlefield**:
    - Observe the 1280px wide arena and descent corridor.
    - Verify camera tracks player horizontally when the window is narrow.
    - Verify mouse aiming and assisted movement work at the edges of the 1280px world.
5. **Proxy Boss**:
    - Seek to **PROXY** (300s).
    - Observe the Proxy releasing Nadine and becoming active at 315s.
    - Attack the Proxy; verify components (HEAD, ARMS) can be damaged.
    - Verify Core is exposed after 2 components are broken.
    - Observe Proxy laser attacks and tactical moves.
6. **Soldier & Grenade**:
    - Observe German Soldier appearing at 340s.
    - At 350s, watch the soldier throw the grenade.
    - Attempt to intercept the grenade; if successful, deliver it to the boss.
    - Observe `PROXY_COLLAPSE` at 358s.
7. **Reinforcements**:
    - Verify small groups of robots spawn during the boss battle.
    - Confirm all robots are cleared at 350s for the finale.
8. **Tests**: Run `npm test` and verify all 71 tests pass (including new Step 9 tests).

### Step 7 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Choreographed Encounters**:
    - Start game; observe robots spawning at scripted times (0:45, 1:05, etc.).
    - Verify that intensity rises and falls (peaks and valleys).
    - Observe the "Sentinel Wall" at 2:05 and 4:20; verify impressive laser count.
4. **Tactical Retreat**:
    - Observe robots abandoning the fight at 2:20 and 3:40.
    - Confirm they move toward side exits and do not phase through obstacles.
    - Confirm retreating robots stop attacking.
5. **Catch-up Bursts**:
    - Watch Pursuers that fall behind the camera.
    - Confirm they occasionally accelerate to catch up to the playable area.
6. **Boss Boundary**:
    - Seek to 4:40.
    - Watch the final swarm transition into evacuation starting at 4:51.
    - Verify that by 5:00, all ordinary robots have left the field and spawning is disabled.
7. **Developer Controls**:
    - Open **ENCOUNTER TOOLS** in the debug panel.
    - Test **PATROL**, **SENTINEL WALL**, **PARTIAL RETREAT**, and **FULL RETREAT** buttons.
    - Verify they trigger the expected behavior immediately.
8. **Tests**: Run `npm test` and verify all 53 tests pass (including new Step 7 encounter tests).

### Step 5.2 Maintenance Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. Click **START GAME**.
4. **Combat Verification**:
    - Shoot Pursuers once; verify they explode and are removed.
    - Shoot Sentinels twice; verify they explode.
    - Hit Armored Pursuers with an axe; verify armor breaks.
    - Shoot exposed core; verify it is destroyed by 1 bolt.
5. **Restart Verification**:
    - Allow shield to deplete or click RESTART in debug panel.
    - Click **RESTART MISSION** in game over screen.
    - Verify all initial robots are present and active (moving/attacking).
    - Verify music restarts at 0:00.
    - Verify no persistent white beams from previous session.
6. **Diagnostics**:
    - Open browser console (F12) while in debug mode.
    - Verify combat logs appear: `[COMBAT] Attack: ...`, `[COLLISION] ...`, etc.
7. **Tests**: Run `npm test` and verify all 34 tests pass.

### Step 5.3 Maintenance Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Mission Lifecycle**:
    - Start game; note **Session: 1** in debug panel.
    - Click **RESTART** in debug panel; verify Session remains 1 (track restart).
    - Click **RESTART MISSION** after defeat; verify Session becomes 2 (new mission).
4. **Player Restoration**:
    - Allow Blackrush to die.
    - Click **RESTART MISSION** or use debug panel to seek.
    - Verify Blackrush is visible, active, and can be damaged again (not immortal).
5. **Encounter Restoration**:
    - Seek forward to **PROXY**.
    - Seek back to **CHASE**.
    - Verify robots appear at the start of the chamber, not thousands of pixels away.
6. **Shield HUD**:
    - Take damage; verify the shield bar shrinks proportionally.
    - Verify color changes: Green (>60%) -> Yellow (60-31%) -> Red (<=30%).
7. **Diagnostics**:
    - Open **TECHNICAL DIAGNOSTICS**; verify Session ID, Active Scene, and Physics status are correct.
8. **Tests**: Run `npm test` and verify all 34 tests pass (including new Step 5.3 lifecycle tests).

### Step 6 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Collision Geometry**:
    - Toggle **TOGGLE COLLISION** in the debug panel; verify hitboxes are visible for obstacles, player, and robots.
    - Confirm obstacles are chunk-loaded (appear below the camera and disappear far above).
4. **Cover and Blocking**:
    - Position Blackrush behind a machine block or column.
    - Confirm Sentinel targeting lines stop at the obstacle.
    - Confirm destructive lasers stop at the obstacle and do no damage.
5. **Friendly Fire**:
    - Lure a Pursuer into the path of a Sentinel laser.
    - Confirm the laser damages or destroys the Pursuer.
    - Confirm "FRIENDLY FIRE" indicator appears and no player points are awarded.
6. **Robot Navigation**:
    - Observe robots trying to reach the player; confirm they steer perpendicularly when blocked by obstacles.
7. **Respawn Safety**:
    - Lose a heart; confirm Blackrush respawns in a position that does not overlap obstacles.
8. **Warning Cadence**:
    - Set hearts to 2; confirm warning sound every 4 seconds.
    - Set hearts to 1; confirm warning sound every 2 seconds.
9. **Tests**: Run `npm test` and verify all 45 tests pass.

### Step 5.4 Maintenance Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Shield HUD**:
    - Verify the shield bar shows numerical values (e.g., `SHIELD 100 / 100`).
    - Use **COMBAT TOOLS** -> **SET SHIELD** (100, 75, 50, 25, 5, 0).
    - Confirm proportional width and color changes (Green > 60%, Yellow 60-31%, Red <= 30%).
    - Confirm bar is empty at 0.
4. **Regeneration**:
    - Set shield to 50.
    - Wait 4 seconds; verify shield begins refilling (12 pts/s).
    - Verify HUD and developer diagnostics (`Regen: ACTIVE`) update.
5. **Hearts and Respawn**:
    - Use **LOSE HEART** in debug panel.
    - Verify shield collapse effect, temporary player removal, and 1.2s delay.
    - Verify respawn at a safe position with full shield and 3s invulnerability.
    - Verify heart icons in HUD update (lost hearts are dark/outlined).
6. **Survival Alarms**:
    - Set hearts to 2; verify low-life warning sound plays every 8 seconds.
    - Set hearts to 1; verify low-life warning sound plays every 4 seconds.
7. **Final Defeat**:
    - Lose all 6 hearts; verify **SHIELD DEPLETED** screen appears and music pauses.
    - Click **RESTART MISSION**; verify 6 hearts and 100 shield are restored.
8. **Tests**: Run `npm test` and verify all 40 tests pass.

### Step 6.1 Maintenance Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Transition Verification**:
    - Jump to **PANZER 2** (near the end of Cathedral).
    - Allow the track to finish naturally.
    - Verify the game switches to **EndingScene** (MISSION COMPLETE) correctly.
    - Confirm NO `TypeError: Cannot read properties of undefined (reading 'size')` appears in the console.
4. **Seeking Robustness**:
    - Jump directly to **VICTORY**.
    - Jump back to **SWARM** or **CHASE**.
    - Confirm combat still works and Blackrush is fully functional.
    - Jump back to **VICTORY** again.
5. **Repeated Missions**:
    - Complete a mission, then click **REPLAY**.
    - Verify the new mission starts correctly and transitions to victory again at the end.
6. **Tests**: Run `npm test` and verify all 47 tests pass (including new lifecycle safety tests).

### Development Build
Run the following command to start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Production Build
Run the following command to generate a production build:
```bash
npm run build
```
The output will be in the `dist/` directory.

### Step 3 Verification
1. Run `npm install` and `npm run dev`.
2. Open `http://localhost:3000/?debug=1` in your browser.
3. Click **START GAME**.
4. Observe the **DEVELOPMENT TOOLS** panel on the right.
5. Verify that:
    - The Synth track starts playing.
    - The phase label in the HUD and debug panel changes at 45s and 300s.
    - Seeking using the slider or jump buttons updates the phase correctly.
    - Pausing stops both music and timeline.
    - Resuming continues from the same position.
    - Transitions to Cathedral and Studio are automatic.
    - EndingScene displays credits and promotion at the correct times.
    - The game canvas is horizontally and vertically centered.

### Step 3.1 Maintenance
- **Lifecycle Bug**: Fixed `TypeError` after Victory by properly unregistering timeline listeners in `GameScene` and `EndingScene` using the `shutdown` event.
- **Debug Panel**: Moved timeline and debug updates to a global loop in `main.js` to prevent the panel from freezing during scene transitions.
- **Canvas Centering**: Replaced Phaser's `autoCenter` with CSS Flexbox centering for better reliability and fixed the right-side offset.
- **Scene Reconciliation**: Implemented global track-based scene management to support seamless transitions and seeking between gameplay and ending tracks.

### Step 4 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. Click **START GAME**.
4. **Movement**: Use WASD or Arrow keys to move Blackrush. Verify movement is smooth and diagonal speed is normalized.
5. **Aiming**: Move the mouse; verify the yellow triangle on Blackrush points toward the cursor.
6. **Energy Weapon**: Hold Left Mouse Button. Verify rapid cyan bolts fire toward the cursor.
7. **Throwing Axe**: Click Right Mouse Button. Verify a spinning axe is thrown. Check the HUD for "AXE: %" recharge status.
8. **Descent**: Observe that the camera scrolls downward automatically at 75 px/s.
9. **Boundaries**: Try to move off-screen or above the HUD. Blackrush should be constrained.
10. **Pause/Resume**: Click PAUSE in the debug panel. Verify both music and player movement stop.
11. **Seeking**: Jump to different phases (e.g., SWARM, PANZER). Verify the camera jumps to the correct depth and projectiles are cleared.
12. **Technical Diagnostics**: Click "[+] TECHNICAL DIAGNOSTICS" in the debug panel to see real-time coordinates and object counts.

### Step 4.1 Maintenance Verification
1. Run `npm run dev`.
2. Click **START GAME**. Verify the Title Scene disappears and Game Scene becomes visible immediately.
3. Verify music starts and no console errors appear.
4. Verify that Blackrush does NOT fire immediately upon entering the scene.
5. Hold Left Mouse Button. Verify energy bolts fire and travel correctly.
6. Verify technical diagnostics show projectile count increasing while firing and decreasing as they expire.
7. Click Right Mouse Button. Verify axe is thrown and recharges.
8. Seek to different tracks and verify no physics errors occur.

### Step 4.2 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Control Mode Selection**: On the Title Scene, verify you can toggle between CLASSIC and ASSISTED modes. The selection should persist after a page refresh.
4. Click **START GAME**.
5. **Assisted Movement**: If in ASSISTED mode, move the mouse away from Blackrush. Verify he follows the cursor when it's outside the dead zone (110px).
6. **Keyboard Override**: While Blackrush is moving toward the mouse, press WASD. Keyboard input must take priority.
7. **Arena Transition**: Use the debug panel to jump to the PROXY phase (Synth 5:00).
8. Observe the camera: It should smoothly decelerate starting at 4:57 and stop completely at 5:00.
9. **Arena Visuals**: Verify the environment changes to an open industrial arena with markings and side supports.
10. **Fixed Camera**: Move Blackrush around the arena. The camera should remain stationary.
11. **Cathedral Sync**: Verify the camera remains in the arena during the entire Cathedral track.
12. **Seeking**: Seek back to 2:00 (SWARM). The camera should restore its descending state and depth correctly.

### Step 4.3 Maintenance Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. Select **ASSISTED** control mode on the Title Scene.
4. Click **START GAME**. Verify no Javascript error occurs.
5. Verify Blackrush moves toward the mouse when it is outside the 110px dead zone.
6. Verify Blackrush stops moving when the mouse is inside the dead zone or outside the canvas.
7. Verify WASD keys override mouse-assisted movement immediately.
8. Verify Right-Click axe throwing suppresses assisted movement immediately.
9. Verify diagnostics in the debug panel correctly show "Assisted Active: YES/NO".
10. Verify seeking to different tracks and returning from Victory work without exceptions.
11. Run `npm test` to verify all project tests pass.

### Step 5 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. Click **START GAME**.
4. **Combat**: Fire energy bolts at robots.
    - Pursuers (Red) should be destroyed by 1 bolt.
    - Sentinels (Red with glow) should require 2 bolts.
    - Armored Pursuers (Gray plates) should resist bolts.
5. **Axe**: Throw an axe (Right-Click).
    - Ordinary robots should be destroyed instantly.
    - Armored robots should lose their plates and become orange/vulnerable.
6. **AI**:
    - Pursuers should follow you.
    - Sentinels should stop, project a red line, and fire a beam.
7. **Shield**: Verify the HUD shield bar decreases when you are hit. Invulnerability flashes should occur.
8. **Defeat**: Let your shield reach zero. Verify the "SHIELD DEPLETED" overlay appears and music/gameplay pauses.
9. **Scoring**: Verify the score increases (Pursuer: 100, Sentinel: 200, Armored: 300, Armor Break: 50).
10. **Destruction**: Observe fragments and sparks when robots explode.
11. **Debug Tools**: Open "[+] COMBAT TOOLS". Test resetting shield, clearing robots, and spawning specific archetypes.
12. **Tests**: Run `npm test` to verify all 33 combat and regression tests pass.

### Step 5.1 Maintenance Verification
1. Run `npm run dev`.
2. **Archetype Visuals**: Verify robot types are distinct:
    - **Pursuer**: Small, red, single eye.
    - **Sentinel**: Antennae, larger eye, distinct ranged behavior.
    - **Armored Pursuer**: 25% larger, bulky gray plates, dark red body.
3. **Armor Break**: Hit an Armored Pursuer with an axe. Verify:
    - Gray plates disappear.
    - Body becomes orange/yellow.
    - Robot remains alive but vulnerable to one energy bolt.
4. **No Crashes**: Hit robots (especially Armored with axe) and confirm no `setTint` TypeError in console.
5. **Game Over Buttons**: Allow shield to reach zero.
    - Verify "SHIELD DEPLETED" screen appears.
    - Click **RESTART MISSION**: Verify game restarts from 0:00 with full shield and score reset.
    - Click **BACK TO TITLE**: Verify game returns to title screen.
6. **Tests**: Run `npm test` and verify all 31 tests pass (including new Step 5.1 tests).

### Step 7.3 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. **Ambient Resistance**:
    - Start game; wait until 0:45.
    - Observe small numbers of robots (3-6) spawning between major cues.
    - Verify `Ambient (Active)` in the debug panel reflects these robots.
4. **Offscreen Spawning**:
    - Observe all scheduled spawns (Ambient and Scripted).
    - Confirm they enter from below the viewport naturally.
    - No robots should visibly materialize inside the playfield during descent.
5. **Population Tracking**:
    - Check **ENCOUNTER TOOLS** diagnostics.
    - `Inactive/Pooled` count should increase as robots die, while `Scripted/Ambient` counts should reflect only live robots.
6. **Seeking Reconstruction**:
    - Seek to various points in the Synth track.
    - Confirm that swarms are reconstructed correctly based on the intensity of the musical section.
7. **Lull Suppression**:
    - During scripted lulls (e.g., 2:20), verify that ambient spawning stops.
8. **Boss Evacuation**:
    - Seek to 4:50.
    - Confirm that all spawning stops after the `EVACUATION` cue at 4:51.
9. **Tests**: Run `npm test` and verify all 58 tests pass (including new Step 7.3 tests).

### Step 8 Verification
1. Run `npm run dev`.
2. Open `http://localhost:3000/?debug=1`.
3. Click **START GAME**.
4. **Opening Escape**:
    - Immediately at 0:00, observe the **PROXY (NADINE)** entity (purple placeholder) ahead of Blackrush.
    - Verify the Proxy flees straight downward at high speed.
    - Verify the Proxy leaves the screen within ~3.5 seconds.
5. **Interaction**:
    - Fire energy bolts and throw axes at the Proxy; verify they have no effect (bolts pass through or hit background).
    - Verify the Proxy does not damage Blackrush or block his movement.
6. **Corridor Safety**:
    - Observe the environment during the escape. Verify the central vertical corridor (X=320) remains clear of machinery until the Proxy has passed.
7. **Seeking**:
    - Seek to 0:00, 0:01, 0:02. Verify the Proxy's position is restored deterministically.
    - Seek past 0:04. Verify the Proxy is gone.
    - Seek backward from 0:10 to 0:00. Verify the Proxy reappears.
8. **Diagnostics**:
    - Check the `Opening Proxy` diagnostic in the debug panel. It should show `ACTIVE` while visible and `INACTIVE` otherwise.
9. **Tests**: Run `npm test` and verify all 63 tests pass (including new Step 8 tests).
