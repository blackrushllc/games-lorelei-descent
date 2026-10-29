# Asset Conventions - LORELEI: DESCENT

## Asset Directories
- `public/assets/audio/music/`: Original musical recordings.
- `public/assets/audio/sfx/`: Sound effects.
- `public/assets/sprites/`: Compiled atlases and manifests.
- `public/assets/images/`: UI graphics, backgrounds, and promotional images.
- `public/assets/source/pixellab/`: Source PNGs for characters and bosses.

## Conventions

### Sprites (PixelLab Pipeline v2.0)
- **Source Structure**: `[entity]/[state]/[animation]/[direction]/frame_XXX.png`
- **Compiler**: `npm run sprites` (uses `scripts/assets/compile-sprites.mjs`)
- **Config**: `scripts/assets/sprite-config.mjs`
- **Output**: Multi-page atlases per entity in `public/assets/sprites/` and a central `manifest.json`.

### Animation IDs
Animations are registered in Phaser with the following key format:
`[entityId]__[stateKey]__[animKey]__[direction]`
Example: `blackrush__default__walk__south`

### Animation Mappings (Robots)
- **Pursuer**: `idle`, `walk`, `attack`.
- **Sentinel**: `idle`, `walk`, `run`.
  - Uses `laserAngle` for orientation during `TRACKING`, `LOCKED`, and `FIRING` phases.
  - Falls back to movement or player-facing when idle or in `COOLDOWN`.
- **Armored Robot**: (Procedural only for now).

### Dimensions
- Standard entities: 48x48 (Blackrush, Pursuer, Sentinel, Armored Robot, etc.)
- Large entities (Proxy): 64x64
- Boss entities (Giant Boss): 128x128
- The compiler supports arbitrary dimensions and packs them efficiently into 2048x2048 atlas pages.

## Sprite Compilation Pipeline
- **Compiler**: `scripts/assets/compile-sprites.mjs`
- **Config**: `scripts/assets/sprite-config.mjs`
- **Dependency**: Uses `sharp` for image processing.
- **Commands**:
  - `npm run sprites`: Compile all character atlases.
  - `npm run sprites:check`: Validate source assets without writing output.
  - `node scripts/assets/compile-sprites.mjs --character blackrush`: Compile only one character.

## How to add a new character/animation
1. Place source PNGs in the appropriate directory under `public/assets/source/pixellab/`.
2. Follow the direction/frame naming convention.
3. Add the character and animation details to `scripts/assets/sprite-config.mjs`.
4. Run `npm run sprites`.
5. The `SpriteAnimationRegistry` will automatically load and register the new animations at runtime.

### Images
- PNG for UI elements and transparent textures.
- JPG for large, non-transparent background elements if needed.

## Future Assets List
- `Below Gamorrah Synth` (Music)
- `Below Gamorrah Cathedral` (Music)
- `Below Gamorrah Studio` (Music)
- Blackrush sprite sheet.
- Proxy robot sprite sheet.
- Boss sprite sheets.
- UI elements (Health bar, weapon icons, HUD).
- Promotional book images.
