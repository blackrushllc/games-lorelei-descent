# Game Design Document - LORELEI: DESCENT

## Concept
LORELEI: DESCENT is a browser-based, top-down, vertically scrolling arcade shooter. It serves as a promotional companion to the Lorelei superhero novel series. The game is inspired by classics such as Robotron: 2084 and Berzerk.

## Perspective
- Top-down view.
- Vertically scrolling playfield (scrolling downwards, creating the appearance of moving deeper underground).

## Gameplay Progression
The game follows a fixed-duration, music-driven timeline. Progression is automatic based on the soundtrack, rather than player-controlled.

### Two-Stage Environment
1. **The Descent (Synth 0:00 - 5:00)**: The camera scrolls downward automatically as Blackrush fights through the complex.
2. **The Boss Arena (Synth 5:00 - Cathedral End)**: The camera stops and locks into a fixed combat arena for the Proxy and Super-Robot boss battles.

## Musical Timeline

### 1. Below Gamorrah Synth (0:00 - 6:00)
- **0:00–0:45:** Opening sequence; Nadine is captured; Blackrush pursues the Proxy robots underground.
- **0:45–5:00:** Increasing robot swarm; survival combat (Descent Mode).
- **5:00–6:00:** Proxy boss fight; German soldier's grenade; Proxy destruction; ceiling collapse (Arena Mode).

### 2. Below Gamorrah Cathedral (0:00 - 4:00)
- **0:00:** Giant super-robot boss appears (Arena Mode).
- **~3:00:** Panzer fires first shell.
- **~3:30:** Panzer fires second shell.
- **Final sequence:** Exposed weak points; destruction of boss; Nadine emerges.

### 3. Below Gamorrah Studio (~4:00)
- Ending sequence.
- Credits.
- Lorelei book promotion.
- Share and replay options.

## Characters & Entities
- **Blackrush:** The playable character. Equipped with a primary energy weapon and a secondary throwing axe. Features a shield that protects against damage.
- **Nadine:** Captured ally to be rescued.
- **Robot Archetypes:**
    - **Pursuer:** Basic close-range enemy. One-hit kill.
    - **Sentinel:** Ranged attacker. Projects a red targeting laser before firing a destructive beam. Requires two hits to destroy.
    - **Armored Pursuer:** Tougher enemy with heavy plates. Armor must be stripped by an axe before the robot becomes vulnerable to energy bolts.
- **The Old Man's Proxy:** Mid-game boss.
- **Giant Super-Robot:** Final boss.

## Combat Mechanics
- **Shield System:** Blackrush has 100 shield points. Taking damage from contact or lasers reduces the shield. When depleted, the player loses one heart.
- **Survival Model:** 
    - **Shield Regeneration:** If Blackrush avoids damage for 4 seconds, the shield begins regenerating at 12 points per second.
    - **Hearts:** Blackrush has 6 hearts (lives). Losing all hearts results in final defeat.
    - **Automatic Respawn:** If hearts remain after shield depletion, Blackrush automatically respawns in a safe position after 1.2 seconds with 3 seconds of invulnerability.
    - **Low-Life Warning:** A Nintendo-style two-note electronic warning repeats when 2 hearts remain (every 8s) or 1 heart remains (every 4s).
- **Energy Bolts:** Rapid-fire projectiles. Effective against unarmored robots but bounce off armor.
- **Throwing Axe:** Heavy weapon that penetrates ordinary robots and strips armor from Armored Pursuers. Applies significant knockback.
- **AI Behaviors:** Robots feature a state-machine AI (Idle, Pursue, Target, Firing, Staggered).
- **Destruction:** Satisfying visual effects including mechanical fragments, sparks, and impact flashes.
- **Scoring:** Points awarded for destroying robots and breaking armor.

## Controls and Mechanics (Desktop)
- **Control Modes**:
    - **Classic**: Keyboard (WASD/Arrows) to move, mouse to aim.
    - **Assisted**: Mouse-follow movement with keyboard override. Blackrush moves toward the cursor when it is outside a central dead zone.
- **Movement**: Vertical scrolling is automatic during the descent, but Blackrush can move freely within the viewport. Camera stops during boss battles.
- **Aiming**: Mouse pointer. The character aims independently of movement direction.
- **Primary Weapon**: Left Mouse Button fires a continuous stream of energy bolts.
- **Secondary Weapon**: Right Mouse Button throws a spinning axe (cooldown required).
- **Descent**: The game scrolls downward at a constant rate during the Synth track, smoothly decelerating into the fixed Boss Arena at 5:00.

## Environment & Obstacles
- **Deterministic Generation**: The underground complex is generated using a seeded random algorithm, ensuring the same layout for every playthrough.
- **Chunked Loading**: To maintain performance, only obstacles near the camera are active in the physics world.
- **Obstacle Types**:
    - **Pillars & Machine Blocks**: Solid rectangular obstacles that block movement, projectiles, and lasers.
    - **Industrial Tanks**: Solid circular obstacles (approximated as rectangles for physics).
    - **Perimeter Walls**: Solid boundaries that keep the action within the 640px wide corridor.
- **Cover Mechanics**: Both the player and robots can use solid obstacles as cover. Lasers and projectiles terminate upon hitting an obstacle.
- **Friendly Fire**: Sentinel lasers can damage other robots if they are in the line of fire.

## core Objective
Survival and combat against waves of robots while descending into the Gamora complex. The game is intended to be fun, accessible, and visually satisfying.
