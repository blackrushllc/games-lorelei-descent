# Game Design Document - LORELEI: DESCENT

## Concept
LORELEI: DESCENT is a browser-based, top-down, vertically scrolling arcade shooter. It serves as a promotional companion to the Lorelei superhero novel series. The game is inspired by classics such as Robotron: 2084 and Berzerk.

## Perspective
- Top-down view.
- Vertically scrolling playfield (scrolling downwards, creating the appearance of moving deeper underground).

## Musical Timeline & Encounters
The game follows a fixed-duration, music-driven timeline. Progression and enemy encounters are choreographed to the soundtrack.

### 1. Below Gamorrah Synth (0:00 - 6:00)
- **0:00–0:45:** Opening sequence; Nadine is captured; Blackrush pursues the Proxy robots underground.
- **0:45–5:00:** Choreographed robot swarm; dramatic peaks and valleys synced with the music (Descent Mode).
- **5:00–6:02:** Fixed Proxy boss arena.

### Encounter Choreography
Encounters follow a data-driven "score" with two distinct layers:
- **Scripted Musical Formations:** Major choreographed events triggered at specific musical timestamps (Patrol, Fan, Pincer, Sentinel Wall, Mixed Swarm).
- **Ambient Resistance:** Small groups of robots introduced at irregular, deterministic intervals between scripted formations to maintain continuous pressure.

Both layers are governed by:
- **SPAWN:** Deterministic offscreen spawning just below the camera view.
- **PRESSURE:** Adjustments to the active robot population cap (Soft cap 16, Hard cap 36, Ambient target 3-6).
- **RETREAT:** Survival drama where surviving robots abandon the fight by fleeing toward side exits.
- **LULL:** Scripted valleys to provide dramatic contrast; ambient spawning is suppressed during lulls.
- **CLEAR_FOR_BOSS:** Final evacuation of all ordinary enemies before the boss arena.

## Characters & Entities
- **Blackrush:** The playable character. Equipped with a primary energy weapon and a secondary throwing axe.
- **Robot Archetypes:**
    - **Pursuer:** Basic close-range enemy. One-hit kill. Features "Catch-up Bursts" to stay near the player.
    - **Sentinel:** Ranged attacker with targeting lasers. Can be deployed in massive "Sentinel Walls".
    - **Armored Pursuer:** Tougher enemy with heavy plates requiring axe hits to expose the core.
- **The Old Man's Proxy:** Mid-game boss encountered in the Fixed Arena. Composed of multiple damageable components (Head, Arms, Core) and features laser attacks and tactical repositioning.
- **German Soldier:** Scripted ally appearing during the Proxy finale to deliver the finishing blow via a grenade.
- **Giant Super-Robot:** Final boss.

## Combat Mechanics
- **Shield System:** Blackrush has 100 shield points. Taking damage from contact or lasers reduces the shield. When depleted, the player loses one heart.
- **Survival Model:** 
    - **Shield Regeneration:** If Blackrush avoids damage for 4 seconds, the shield begins regenerating at 12 points per second.
    - **Hearts:** Blackrush has 6 hearts (lives). Losing all hearts results in final defeat.
    - **Automatic Respawn:** If hearts remain after shield depletion, Blackrush automatically respawns in a safe position after 1.2 seconds with 3 seconds of invulnerability.
    - **Low-Life Warning:** A Nintendo-style two-note electronic warning repeats when 2 hearts remain (every 4s) or 1 heart remains (every 2s).
- **NOVA Weapon:** An emergency area-clear attack. Pressing **SPACE** consumes one heart to instantly destroy all ordinary robots within the arena and provides 1 second of invulnerability. Only available when 2 or more hearts remain.
- **Adaptive Assistance:** Collecting HEART_DROP pickups increases mission-level assistance, reducing future descent encounter sizes (up to 25% population at 3+ hearts).
- **Arena Checkpoints:** Reaching boss arenas (Proxy, Cathedral) unlocks checkpoints, allowing players to continue with 3 hearts and full shield after a Game Over.
- **Energy Bolts:** Rapid-fire projectiles. Effective against unarmored robots but bounce off armor.
- **Throwing Axe:** Heavy weapon that penetrates ordinary robots and strips armor from Armored Pursuers. Applies significant knockback.
- **AI Behaviors:** Robots feature a state-machine AI (Idle, Pursue, Target, Firing, Staggered).
- **Destruction:** Satisfying visual effects including mechanical fragments, sparks, and impact flashes.
- **Scoring:** Points awarded for destroying robots and breaking armor.

## Controls and Mechanics (Desktop)
- **Control Modes**:
    - **Classic**: Keyboard (WASD/Arrows) to move, mouse to aim.
    - **Assisted**: Mouse-follow movement with keyboard override. Blackrush moves toward the cursor when it is outside a central dead zone.
- **Movement**: Vertical scrolling is automatic during the descent, but Blackrush can move freely within the 1280px wide viewport. On narrow displays, the camera tracks Blackrush horizontally to keep him centered.
- **Aiming**: Mouse pointer. The character aims independently of movement direction.
- **Primary Weapon**: Left Mouse Button fires a continuous stream of energy bolts.
- **Secondary Weapon**: Right Mouse Button throws a spinning axe (cooldown required).
- **NOVA (Emergency)**: Space Key triggers a heart-consuming area-clear attack.
- **Descent**: The game scrolls downward at a constant rate during the Synth track, smoothly decelerating into the fixed Boss Arena at 5:00.

## Environment & Obstacles
- **Deterministic Generation**: The underground complex is generated using a seeded random algorithm, ensuring the same layout for every playthrough.
- **Chunked Loading**: To maintain performance, only obstacles near the camera are active in the physics world.
- **Obstacle Types**:
    - **Pillars & Machine Blocks**: Solid rectangular obstacles that block movement, projectiles, and lasers.
    - **Industrial Tanks**: Solid circular obstacles (approximated as rectangles for physics).
    - **Perimeter Walls**: Solid boundaries that keep the action within the 1280px wide corridor.
- **Cover Mechanics**: Both the player and robots can use solid obstacles as cover. Lasers and projectiles terminate upon hitting an obstacle.
- **Friendly Fire**: Sentinel lasers can damage other robots if they are in the line of fire.

## core Objective
Survival and combat against waves of robots while descending into the Gamora complex. The game is intended to be fun, accessible, and visually satisfying.
