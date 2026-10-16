# LORELEI: DESCENT

A browser-based, top-down, vertically scrolling arcade shooter inspired by classic games like Robotron: 2084 and Berzerk. Promotional companion to the Lorelei superhero novel series.

## Technology Stack
- **Engine:** Phaser 3
- **Build Tool:** Vite
- **Runtime:** Node.js 24 LTS
- **Language:** JavaScript (ESM)

## Prerequisites
- Node.js 24 LTS
- npm

## Installation
```bash
npm install
```

## Development
```bash
npm run dev
```
Starts the Vite development server.

## Production
```bash
npm run build
```
Generates static files in the `dist/` directory.

## Preview
```bash
npm run preview
```
Serves the production build locally.

## Directory Structure
- `public/assets/`: Static game assets.
- `src/`: Source code.
  - `config/`: Game and gameplay configurations.
  - `scenes/`: Phaser scenes.
  - `entities/`: Game objects (player, enemies).
  - `systems/`: Gameplay systems.
  - `controls/`: Input handling.
  - `ui/`: In-game interfaces.
  - `styles/`: CSS styles.
- `tests/`: Test suite.
- `docs/`: Project documentation.

## Current Milestone
**Step 5: Robot combat and destruction** (Completed)

## Browser Compatibility
Compatible with modern versions of Chrome, Firefox, Safari, and Edge.
