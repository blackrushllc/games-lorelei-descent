# JUNIE TASK — LORELEI: DESCENT
## Step 2: Game Skeleton, Scenes, and Placeholder Graphics

### 1. Project context

We are developing **LORELEI: DESCENT**, a browser-based top-down arcade shooter built with JavaScript, Phaser 3, and Vite.

Step 1 has been completed successfully.

Existing environment:

- Node.js 24.12.0
- npm 11.6.2
- Phaser 3.88.2
- Vite 8.3.4
- Logical resolution: 640 × 960
- Development server: `http://localhost:3000`

Read the existing project documentation and source code before making changes, particularly:

- `docs/GAME_DESIGN.md`
- `docs/DEVELOPMENT.md`
- `src/main.js`
- `src/config/gameConfig.js`
- `src/scenes/BootScene.js`

Preserve all working Step 1 functionality.

**Implement Step 2 only. Do not begin Step 3 or subsequent milestones.**

### 2. Objective

Create the basic game scene architecture and render a static demonstration of the underground Gamora complex.

When the developer opens the game:

1. A simple title screen appears.
2. The player can click START GAME.
3. A static underground chamber appears.
4. Blackrush is visible as a blue placeholder sprite.
5. Several inactive red robot placeholders are visible.
6. Industrial obstacles and chamber walls are visible.
7. A basic heads-up display appears.
8. The user can return to the title screen.

There is no movement, combat, or audio in this milestone.

The objective is to establish visual layout, scene management, entity placeholders, and the foundation for later scrolling gameplay.

### 3. Scene architecture

Implement the following Phaser scenes:

**BootScene**

Responsible for initial startup and transition into TitleScene.

Remove the previous Step 1 development-only display.

**TitleScene**

Display:

- LORELEI: DESCENT
- A subtitle: "Below Gamora Pharmaceuticals"
- A START GAME button.
- A small development version indicator such as "Prototype — Step 2".

The button must work with mouse and touch input.

**GameScene**

Responsible for rendering the underground chamber, static placeholder objects, the Blackrush representation, and a basic HUD.

For now, render a static scene.

**GameOverScene and EndingScene**

Create minimal functional placeholder scenes, but do not develop their eventual artwork or narrative content.

These scenes should display their names and have a working button to return to TitleScene.

They should not be reachable automatically from GameScene yet.

Scene transitions must clean up previous scene objects appropriately.

### 4. Coordinate system

This is a critical architectural requirement.

The logical viewport remains 640 × 960 pixels.

We want the experience to feel like Blackrush is moving deeper into an underground complex.

Use the following conventions:

- The game is viewed from directly overhead.
- Screen X increases from left to right.
- Screen Y increases from top to bottom.
- Increasing world Y represents deeper progression into the complex.
- The future automatic descent will be implemented by increasing camera scrollY.
- Player movement will eventually occur in world coordinates.
- Static obstacles should exist in world coordinates.
- HUD elements should remain fixed relative to the camera.

Do not implement automatic scrolling in this step.

However, structure GameScene so that a future scrolling camera can be implemented without rewriting all object positions.

Do not use CSS or DOM elements for world entities.

### 5. Chamber layout

Create a visually simple underground industrial chamber using Phaser graphics primitives.

Suggested visual design:

- Very dark blue-gray floor.
- Subtle grid lines or floor seams.
- Solid left and right perimeter walls.
- Industrial support pillars.
- Machinery blocks.
- Several large obstacles providing future cover.
- Darkened areas suggesting depth and industrial scale.

The chamber should be wider than the immediately accessible walking area only if there is a clear gameplay reason.

For now, use a simple world width matching the logical viewport width of 640 pixels.

Create a world approximately 3000 pixels tall, with enough objects distributed vertically to demonstrate that the chamber will eventually scroll.

Only the first 960 pixels need to be visible.

Separate environment generation into a reusable module, such as:

`src/systems/ChamberBuilder.js`

This module should be responsible for constructing the placeholder chamber and returning references to its objects or geometry as appropriate.

Keep walls, obstacles, and decorative floor graphics logically distinct. Future collision geometry should not depend on decorative graphics.

Do not implement physics collisions yet.

### 6. Blackrush placeholder

Create a simple placeholder representation of Blackrush.

Use Phaser graphics primitives or a generated texture.

Suggested appearance:

- Blue or cyan rectangular body.
- Contrasting head.
- Small directional indicator.
- Approximately 28 × 40 logical pixels.

Position Blackrush near the horizontal center of the initial viewport, around Y = 450.

Add a small label above or below the player: BLACKRUSH.

Place the placeholder in:

`src/entities/Blackrush.js`

The class may extend a suitable Phaser game object or provide a small factory for constructing the visual representation.

Do not implement:

- Keyboard input.
- Mouse aiming.
- Movement.
- Weapons.
- Health.
- Shield mechanics.
- Animation.

The placeholder should be a static visual object.

Its origin, position, and dimensions should be clearly defined to simplify future movement and collision implementation.

### 7. Robot placeholders

Create a simple reusable robot placeholder.

Suggested appearance:

- Red rectangular body.
- Bright red central eye.
- Approximately 30 × 30 logical pixels.
- Small mechanical details, if convenient.

Use a reusable module:

`src/entities/Robot.js`

Place approximately 8–12 inactive robots at different positions in the chamber.

A few should be visible in the initial viewport.

Do not implement:

- Robot AI.
- Robot movement.
- Shooting.
- Targeting.
- Damage.
- Death.
- Physics collisions.

These are static demonstration objects.

The code should make it straightforward to instantiate additional robots later.

### 8. Obstacles and environment

Create several industrial obstacles.

Examples:

- Square support columns.
- Rectangular machine housings.
- Large cylindrical tanks represented by circles.
- Broken industrial structures.
- Heavy concrete barriers.

Use no external artwork yet.

All objects should be represented with simple colored geometric primitives.

Keep their positions and sizes in data structures rather than scattering hardcoded drawing coordinates throughout GameScene.

Ensure there is a reasonably clear vertical pathway through the chamber.

Do not build a maze.

The eventual game should emphasize robot combat and survival, not navigation puzzles.

### 9. HUD

Create a separate module:

`src/ui/Hud.js`

The HUD should initially display:

- A shield bar at 100%.
- An energy weapon indicator reading READY.
- An axe indicator reading READY.
- A score display initialized to zero.
- A development phase label such as "CHAMBER DEMO".

Use simple Phaser text and graphics.

The HUD should remain fixed to the camera using `setScrollFactor(0)` or an equivalent technique.

Design the HUD so that future gameplay systems can update its values through clearly defined methods.

For example:

- `setShield(value, maximum)`
- `setScore(value)`
- `setWeaponStatus(weapon, status)`
- `setPhaseLabel(label)`

Only implement presentation and value updates.

Do not implement actual gameplay logic.

### 10. Navigation

The application should follow this sequence:

BootScene → TitleScene → GameScene.

Include a small EXIT or BACK TO TITLE control in GameScene for development purposes.

The control should work using mouse and touch input.

Returning to TitleScene and starting GameScene again must work correctly without duplicate objects or errors.

For the moment, do not implement keyboard navigation unless needed for accessibility.

### 11. Visual scaling

Preserve the existing Phaser Scale.FIT configuration and 640 × 960 logical resolution.

Ensure:

- No game content unintentionally spills outside the visible canvas.
- No page scrolling occurs.
- The interface remains legible on desktop.
- Touch controls on the title and game scenes respond on mobile.
- The chamber retains a portrait-oriented presentation.

Avoid tiny text for critical UI elements.

### 12. Code quality

Maintain the conventions established in Step 1.

Use JavaScript ES modules.

Prefer small modules and data-driven configuration.

Avoid global mutable state.

Avoid adding dependencies.

Keep gameplay configuration centralized where possible.

Use descriptive class and method names.

Do not prematurely implement a generalized entity-component system or other heavyweight architecture.

Keep rendering, world layout, and future gameplay behavior separated.

### 13. Testing and verification

Run:

```bash
npm run build
```

Verify that production compilation succeeds.

Run the development server and, if browser automation is available, verify the following:

1. The game loads.
2. TitleScene appears.
3. START GAME opens GameScene.
4. Blackrush is displayed.
5. Several robots are displayed.
6. Walls and obstacles are displayed.
7. The HUD is visible.
8. BACK TO TITLE works.
9. START GAME can be used again without errors.
10. The canvas retains its intended aspect ratio.

If browser automation is unavailable, provide manual verification instructions and clearly state which tests were not performed.

### 14. Documentation

Update:

- `docs/DEVELOPMENT.md` to indicate Step 2 completion.
- `README.md` if the application startup behavior has changed.

Do not modify the musical timeline specification except to clarify architecture if needed.

### 15. Scope restrictions

This milestone is strictly concerned with basic visual scene construction and navigation.

Do not implement:

- Audio playback.
- Music synchronization.
- TimelineDirector.
- Player movement.
- Weapon firing.
- Robot AI.
- Robot spawning.
- Damage or health logic.
- Collision physics.
- Automatic scrolling.
- Boss battles.
- Particle destruction effects.
- Game-over triggers.
- Gameplay scoring.
- Mobile gameplay controls.
- Actual sprite artwork.
- External asset downloads.

Do not start Step 3.

### 16. Definition of done

Step 2 is complete when:

- The application has functional Boot, Title, Game, GameOver, and Ending scenes.
- The developer can navigate between the title and static game demonstration.
- A primitive underground chamber is rendered.
- Blackrush and robot placeholders are visible.
- Obstacles and environmental details are visible.
- A static HUD is displayed.
- The project builds successfully.
- Documentation is updated.
- No gameplay mechanics from future milestones have been implemented.

Provide a concise completion report describing the changed files, implemented functionality, build results, and any unresolved issues.

Stop after Step 2.