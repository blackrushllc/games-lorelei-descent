# JUNIE TASK — LORELEI: DESCENT
## Step 1: Project Foundation, Phaser Installation, and Development Environment

### Project Overview

We are beginning development of **LORELEI: DESCENT**, a browser-based, top-down, vertically scrolling arcade shooter inspired by classic games such as Robotron: 2084 and Berzerk.

The game is based on the original *Lorelei* superhero novel series and serves primarily as a promotional companion to the books.

Development will be incremental, with clearly defined milestones. Your task is to complete **Step 1 only**.

**Do not implement gameplay or begin later milestones.**

The developer has already created an empty JavaScript project in JetBrains WebStorm. Work directly in the existing project root. Do not generate a nested application directory or replace existing project configuration unnecessarily.

## 1. Technology Requirements

Use the following technology stack:

- JavaScript (modern ECMAScript modules).
- Phaser 3, using the current stable Phaser 3 release.
- Vite for development and production builds.
- Node.js 24 LTS.
- npm for package management.
- Standard HTML5 and CSS3.
- Git for version control.
- No TypeScript.
- No React, Vue, Angular, or other application framework.
- No backend, database, or server-side application code.

Use npm to install the necessary dependencies.

Phaser should be a regular application dependency, while Vite should be a development dependency.

Use exact installed versions as recorded in `package-lock.json`, rather than inventing version numbers.

Do not add any additional dependencies unless they are strictly required for this milestone.

## 2. Project Inspection and Initialization

Before making changes:

1. Inspect the existing project directory.
2. Determine whether `package.json`, `package-lock.json`, `.gitignore`, or Git configuration already exists.
3. Preserve any existing useful configuration.
4. Verify that Node.js, npm, and Git are available.
5. Check the Node.js version and report any incompatibility with Node.js 24.
6. Initialize npm if necessary.
7. Install Phaser and Vite.
8. Initialize Git only if the directory is not already a Git repository.

Do not perform destructive operations.

Do not automatically commit changes to Git.

## 3. Directory Structure

Create the following structure as the foundation for later milestones.

```text
lorelei-descent/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
├── README.md
│
├── public/
│   └── assets/
│       ├── audio/
│       │   ├── music/
│       │   └── sfx/
│       ├── sprites/
│       └── images/
│
├── src/
│   ├── main.js
│   ├── config/
│   │   ├── gameConfig.js
│   │   ├── gameplayConfig.js
│   │   └── timeline.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── TitleScene.js
│   │   ├── GameScene.js
│   │   ├── GameOverScene.js
│   │   └── EndingScene.js
│   ├── entities/
│   ├── systems/
│   ├── controls/
│   ├── ui/
│   └── styles/
│       └── main.css
│
├── tests/
│
└── docs/
    ├── GAME_DESIGN.md
    ├── DEVELOPMENT.md
    └── ASSETS.md
```

These directories provide the intended long-term structure. However, **do not create unnecessary JavaScript class implementations merely to fill the directory tree**.

For this milestone, implement only the files needed to successfully initialize Phaser and display a minimal application.

Empty directories can be preserved with `.gitkeep` files where appropriate.

Files reserved for future steps can be omitted for now, provided their intended locations are documented.

### Directory responsibilities

**`src/config/`**

Central configuration, including logical resolution, gameplay constants, and eventually the musical timeline.

**`src/scenes/`**

Phaser scenes responsible for initialization, title screens, gameplay, game-over states, and ending screens.

**`src/entities/`**

Future player characters, enemies, bosses, projectiles, and other interactive game objects.

**`src/systems/`**

Reusable gameplay systems, including combat, spawning, effects, audio, and timeline control.

**`src/controls/`**

Desktop and mobile input abstractions.

**`src/ui/`**

Heads-up display and other in-game interfaces.

**`public/assets/`**

Static game assets served by Vite without transformation.

**`docs/`**

Human-readable development documentation.

## 4. Minimal Phaser Initialization

Implement a minimal Phaser application.

Use `src/main.js` as the entry point.

The application should:

1. Initialize Phaser correctly.
2. Attach the game canvas to a dedicated element in `index.html`.
3. Display a dark background.
4. Display the text `LORELEI: DESCENT`.
5. Display a smaller subtitle reading `Development Foundation — Step 1`.
6. Display the logical game resolution.
7. Resize appropriately within the browser viewport without distorting the logical canvas.
8. Initialize without browser console errors.

Use Phaser's scene lifecycle correctly.

A minimal `BootScene` or equivalent is sufficient. You may transition to a minimal `TitleScene` if doing so simplifies the long-term architecture.

Do not implement a Start Game button yet unless it is strictly necessary for a clean bootstrap. We will implement the complete title scene in Step 2.

Do not implement GameScene gameplay.

### Logical rendering resolution

Configure the default logical resolution as:

- Width: 640
- Height: 960
- Orientation: Portrait
- Scaling: Phaser Scale.FIT
- Centering: Phaser Scale.CENTER_BOTH

The canvas should retain its aspect ratio.

On desktop, allow empty space to appear on either side of the game canvas.

On mobile, the canvas should scale down to fit the available viewport without introducing page scrolling.

Do not stretch the canvas to fill a differently proportioned display.

Configure rendering with Phaser AUTO and support browser hardware acceleration where available.

Use a solid dark background, such as `#10151f`.

Pixel-perfect sprite rendering can be considered in later steps. Do not make irreversible rendering assumptions before we have finalized the artwork.

## 5. Vite Configuration

Configure Vite for the existing project.

The following npm scripts are required:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Create `vite.config.js` if appropriate.

Requirements:

- Development should use Vite's local development server.
- Production should generate static files in `dist/`.
- Assets in `public/assets/` must be available at runtime.
- Source maps should remain suitable for local development.
- Avoid unnecessary plugins.
- Do not add a custom backend.
- Do not hardcode a development hostname or IP address.
- Keep the Vite base-path configuration easy to adjust if we eventually deploy into a subdirectory.

The application must work without requiring a server-side runtime after compilation.

We expect eventual deployment to an ordinary Apache HTTPS virtual host.

## 6. CSS and Browser Layout

Implement minimal CSS in `src/styles/main.css`.

Requirements:

- Remove default body margins.
- Use a dark page background.
- Center the Phaser canvas.
- Prevent horizontal and vertical overflow caused by the game canvas.
- Preserve the 640 × 960 logical aspect ratio.
- Support desktop and mobile browser sizes.
- Avoid unnecessary global styling.
- Do not introduce a CSS framework.

Use a viewport meta tag appropriate for mobile devices.

The user must not need to scroll the browser page to see the game area.

Do not disable normal browser accessibility features unnecessarily.

## 7. Long-Term Architecture Conventions

The following conventions must be documented and respected, even though most systems will not be implemented until future steps.

### A. Music-driven timeline

The game will eventually consist of three original musical tracks:

1. `Below Gamorrah Synth` — approximately six minutes.
2. `Below Gamorrah Cathedral` — approximately four minutes.
3. `Below Gamorrah Studio` — approximately four minutes.

The first ten minutes constitute the principal gameplay experience.

The Studio track plays during the ending and credits screen.

Gameplay events will follow the musical timeline rather than player-controlled progression.

Future architecture will include:

- `TimelineDirector`
- `AudioDirector`
- `SpawnDirector`

The audio playback position, together with an explicit pause/synchronization policy, will ultimately determine the current musical segment and associated game events.

Event triggers must be designed to fire exactly once and handle frame delays correctly.

Future developer tools will allow seeking directly to significant musical events for testing.

**Do not implement these systems in Step 1.**

Only document these requirements in `docs/GAME_DESIGN.md`.

### B. Fixed-duration progression

The game will progress automatically through its scheduled events.

The player can succeed, fail, survive, or earn different narrative outcomes but cannot arbitrarily delay the soundtrack.

The playfield scrolls vertically, creating the appearance of moving deeper into the underground Gamora complex.

The primary objective is survival and combat, not maze navigation.

### C. Game controls

Future desktop controls:

- WASD or arrow keys: movement.
- Mouse: aim.
- Left mouse button: energy weapon.
- Right mouse button: throwing axe.
- Space: radial shockwave.

Future mobile controls:

- Automatic downward progression.
- Touch aiming and firing.
- Simplified or assisted lateral movement.
- Large touch controls for special weapons.

Input handling must eventually be separated from character mechanics so that desktop and mobile control systems can share the same gameplay code.

**Do not implement input in Step 1.**

### D. Entity architecture

The following entities will eventually be required:

- Blackrush, the playable character.
- Proxy robots.
- The Old Man's Proxy boss.
- A giant super-robot boss.
- Nadine.
- A mysterious German soldier.
- A Panzer tank.
- Projectile and weapon effects.
- Potential future companion NPCs, including Lorelei.

Entities should be modular and avoid dependencies on the input devices themselves.

### E. Combat architecture

Future combat features include:

- Energy projectiles.
- Throwing axes and knockback.
- Protective shield.
- Radial shockwave.
- Enemy lasers with targeting warnings.
- Destructible robot armor.
- Boss weak points.
- Particle explosions and other visual effects.

A future `WeakPointSystem` must accommodate attacks by Blackrush and eventually Lorelei's telekinesis.

**None of this should be implemented in Step 1.**

### F. Configuration over hardcoding

Future gameplay parameters should be stored in centralized configuration files where practical.

Examples include:

- Player movement speed.
- Weapon damage.
- Shield capacity.
- Robot hit points.
- Enemy spawn rates.
- Laser warning duration.
- Encounter difficulty.
- Musical event timestamps.
- Boss vulnerability windows.

Avoid embedding tunable gameplay values throughout unrelated classes.

### G. JavaScript coding conventions

Use these conventions consistently:

- ECMAScript modules with `import` and `export`.
- Classes for Phaser scenes and stateful game entities.
- Plain objects and functions for static configuration and utility code.
- `const` by default, `let` where reassignment is needed.
- No `var`.
- Descriptive class, function, and variable names.
- PascalCase for class names.
- camelCase for function names, fields, and variables.
- UPPER_SNAKE_CASE for exported immutable constants where appropriate.
- Small, focused modules.
- No unnecessary inheritance hierarchies.
- Avoid global mutable state.
- No unnecessary third-party dependencies.
- Prefer readable code over elaborate abstractions.
- Use JSDoc comments where they clarify public interfaces or non-obvious behavior.

Code should be compatible with modern Chrome, Firefox, Safari, and Edge.

## 8. Project Documentation

Create the following documentation files.

### `README.md`

Include:

- Project title.
- Brief description.
- Technology stack.
- Prerequisites.
- Installation instructions.
- Development server commands.
- Production build commands.
- Preview commands.
- Directory structure overview.
- Current development milestone.
- Expected browser compatibility.

### `docs/GAME_DESIGN.md`

Create a concise, high-level game design document.

Include the game's concept, characters, gameplay perspective, overall soundtrack-driven progression, and major narrative events.

Document the initial timeline:

**Below Gamorrah Synth — 0:00 to 6:00**

- 0:00–0:45: Nadine is captured; Blackrush pursues the Proxy underground.
- 0:45–5:00: Increasingly intense robot swarm.
- 5:00–6:00: Proxy boss fight, German soldier's grenade, Proxy destruction, ceiling collapse.

**Below Gamorrah Cathedral — 0:00 to 4:00**

- 0:00: Giant super-robot appears.
- Approximately 3:00: Panzer fires first shell.
- Approximately 3:30: Panzer fires second shell.
- Final sequence: Exposed weak points, destruction of boss, Nadine emerges.

**Below Gamorrah Studio — approximately four minutes**

- Ending sequence.
- Credits.
- Lorelei book promotion.
- Share and replay options.

Musical timing is provisional until the actual recordings are integrated.

Document that the game is intended to be fun, accessible, relatively easy to play, and visually and sonically satisfying.

### `docs/DEVELOPMENT.md`

Document the development roadmap.

Include these fifteen milestones:

1. Project setup and prerequisites.
2. Game skeleton and scenes.
3. Music integration and master timeline.
4. Blackrush movement and weapons.
5. Robot combat and destruction.
6. Scrolling chamber and defenses.
7. Encounter director and difficulty.
8. Opening chase.
9. Proxy boss and German soldier.
10. Super-robot and Panzer.
11. Ending and promotion.
12. Character and environment artwork.
13. Sound effects and visual/audio polish.
14. Mobile controls and playtesting.
15. Production deployment.

Mark Step 1 as the current milestone. Do not claim later milestones are completed.

Also document how the developer can verify the development and production builds.

### `docs/ASSETS.md`

Document the expected asset directories.

Describe intended conventions for:

- Musical recordings.
- Sound effects.
- Character sprite sheets.
- Environmental textures.
- UI graphics.
- Promotional images.

Do not invent, download, or generate any actual game assets.

Avoid requiring exact sprite dimensions or audio encoding choices before those decisions are finalized.

Use placeholders only where necessary for directory preservation.

## 9. Git Configuration

Ensure `.gitignore` excludes:

```gitignore
node_modules/
dist/
.vite/
.env
.env.*
!.env.example
*.log
```

Include reasonable operating-system and JetBrains local-workspace exclusions without blindly deleting existing IDE configuration.

Do not ignore `package-lock.json`.

The repository should be ready for a clean initial commit, but do not create the commit unless specifically instructed.

## 10. Verify the Development Build

Run the appropriate installation and development commands.

Confirm that:

- npm dependencies install successfully.
- Phaser imports correctly.
- Vite starts successfully.
- The entry point resolves.
- The Phaser application initializes.
- No missing asset references occur.
- The initial scene can render.

If browser automation is available, perform a browser smoke test.

If browser automation is unavailable, report the local development URL and provide concise manual verification instructions.

Do not claim that a browser smoke test occurred if one was not actually performed.

Terminate temporary development server processes appropriately after testing.

## 11. Verify the Production Build

Execute:

```bash
npm run build
```

Confirm that Vite creates the expected `dist/` output.

Execute the preview command where practical:

```bash
npm run preview
```

Verify that the production output can be served as a static website.

Make sure the build does not depend on files outside its generated output.

The resulting application must be suitable for eventual deployment to an Apache HTTPS server.

## 12. Completion Report

When finished, provide a concise report containing:

1. Installed Node.js, npm, Phaser, and Vite versions.
2. Summary of files created or modified.
3. Explanation of the Phaser entry point and scene initialization.
4. Development server command and URL.
5. Production build command and result.
6. Any warnings or unresolved problems.
7. Short instructions for verifying the initial Phaser application in WebStorm.
8. Confirmation that later gameplay milestones were not implemented.

If you cannot complete an item, explain why rather than claiming success.

## 13. Scope Restrictions — Very Important

This is **Step 1: Project Foundation**.

Do not implement:

- Player movement.
- Player shooting.
- Robot enemies.
- Robot AI.
- Collision-based combat.
- Weapons.
- Shields.
- Health systems.
- Scrolling gameplay.
- Musical playback or synchronization.
- Timeline event dispatching.
- Bosses.
- Cinematics.
- Developer timeline scrubber.
- Touchscreen controls.
- Sprite sheet animations.
- Sound effects.
- Game-over logic.
- Promotional screens.
- Analytics.
- Backend services.

Do not generate artwork, music, or sound effects.

Do not introduce speculative code for future systems.

Do not spend time polishing the initial title screen.

**The goal is a minimal, clean, correctly organized Phaser application that builds and runs reliably.**

## 14. Definition of Done

Step 1 is complete when:

- The existing WebStorm project is successfully configured.
- Phaser and Vite are installed.
- The project uses modern JavaScript modules.
- The initial Phaser scene displays correctly at a 640 × 960 logical resolution.
- The browser layout scales appropriately.
- All required documentation is present.
- The directory structure supports future milestones.
- `npm run dev` works.
- `npm run build` succeeds.
- The production build can be previewed.
- No subsequent game milestones have been implemented.

Stop after completing these tasks and provide the completion report.

Do not begin Step 2 without explicit authorization.