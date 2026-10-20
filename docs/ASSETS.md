# Asset Conventions - LORELEI: DESCENT

## Asset Directories
- `public/assets/audio/music/`: Original musical recordings.
- `public/assets/audio/sfx/`: Sound effects.
- `public/assets/sprites/`: Character and entity sprite sheets.
- `public/assets/images/`: UI graphics, backgrounds, and promotional images.

## Conventions

### Music
- Formats: MP3 and OGG (for broad browser compatibility).
- Timeline-driven events will be based on these tracks.

### Sound Effects
- Formats: WAV (high quality) or MP3/OGG.

### Sprites
- PixelLab source PNGs are located in `public/assets/source/pixellab/`.
- Source frames are organized by character/animation/direction.
- Directions: `north`, `north-east`, `east`, `south-east`, `south`, `south-west`, `west`, `north-west`.
- Atlases are generated using `npm run sprites`.
- Output: `public/assets/sprites/` contains character atlases (`.png`, `.json`) and a master `manifest.json`.
- Frame naming convention: `[animation]_[direction]_[frameNumber]`.
- Dimensions: Vary per animation (48x48, 64x64, etc.), but consistent within an animation.

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
