import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { SPRITE_CONFIG, DIRECTIONS } from './sprite-config.mjs';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const targetCharacter = args.find((_, i) => args[i - 1] === '--character');

async function compileSprites() {
  console.log('[SPRITES] Starting compilation...');
  
  const characters = targetCharacter ? [targetCharacter] : Object.keys(SPRITE_CONFIG);
  const manifest = {};

  for (const charKey of characters) {
    const config = SPRITE_CONFIG[charKey];
    if (!config) {
      console.error(`[SPRITES] Error: Character config not found for "${charKey}"`);
      continue;
    }

    try {
      const charResult = await processCharacter(charKey, config);
      if (charResult) {
        manifest[charKey] = charResult;
      }
    } catch (err) {
      console.error(`[SPRITES] Failed to process character "${charKey}":`, err.message);
      if (!checkOnly) process.exit(1);
    }
  }

  if (!checkOnly) {
    const manifestPath = path.join('public/assets/sprites', 'manifest.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`[SPRITES] Manifest written to ${manifestPath}`);
  }

  console.log('[SPRITES] Compilation complete.');
}

async function processCharacter(charKey, config) {
  console.log(`[SPRITES] Processing character: ${charKey}`);
  
  if (!fs.existsSync(config.sourceDir)) {
    throw new Error(`Source directory does not exist: ${config.sourceDir}`);
  }

  const frames = [];
  const charManifest = {
    character: charKey,
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    displayScale: config.displayScale,
    animations: {}
  };

  for (const [animKey, animConfig] of Object.entries(config.animations)) {
    charManifest.animations[animKey] = {
      fps: animConfig.fps,
      loop: animConfig.loop,
      directions: {}
    };

    for (const dir of DIRECTIONS) {
      const dirPath = path.join(config.sourceDir, animKey, dir);
      let frameFiles = [];

      if (animConfig.type === 'static') {
        const staticFilePath = path.join(config.sourceDir, animKey, `${dir}.png`);
        if (fs.existsSync(staticFilePath)) {
          frameFiles = [staticFilePath];
        }
      } else if (fs.existsSync(dirPath)) {
        frameFiles = fs.readdirSync(dirPath)
          .filter(f => f.endsWith('.png'))
          .sort()
          .map(f => path.join(dirPath, f));
      }

      if (frameFiles.length === 0) {
        console.warn(`[SPRITES] Warning: Missing direction "${dir}" for animation "${animKey}" in character "${charKey}"`);
        continue;
      }

      const dirFrames = [];
      let animWidth = 0;
      let animHeight = 0;

      for (let i = 0; i < frameFiles.length; i++) {
        const frameFile = frameFiles[i];
        const frameName = `${animKey}_${dir}_${String(i).padStart(3, '0')}`;
        
        // Validate image
        const metadata = await sharp(frameFile).metadata();
        
        if (animWidth === 0) {
          animWidth = metadata.width;
          animHeight = metadata.height;
        } else if (metadata.width !== animWidth || metadata.height !== animHeight) {
          console.warn(`[SPRITES] Warning: Frame ${frameFile} has inconsistent dimensions: ${metadata.width}x${metadata.height} (expected ${animWidth}x${animHeight} for animation "${animKey}")`);
        }

        frames.push({
          name: frameName,
          path: frameFile,
          width: metadata.width,
          height: metadata.height
        });
        dirFrames.push(frameName);
      }
      charManifest.animations[animKey].directions[dir] = dirFrames;
      charManifest.animations[animKey].width = animWidth;
      charManifest.animations[animKey].height = animHeight;
    }
  }

  if (frames.length === 0) {
    console.warn(`[SPRITES] No frames found for character "${charKey}"`);
    return null;
  }

  if (checkOnly) {
    console.log(`[SPRITES] Validated ${frames.length} frames for "${charKey}"`);
    return charManifest;
  }

  // Atlas Generation
  const padding = 2;
  // Calculate a reasonable atlas size. We don't have a fixed frame size anymore, 
  // so we'll just use a simple packing or a grid based on the largest frame.
  const maxW = Math.max(...frames.map(f => f.width));
  const maxH = Math.max(...frames.map(f => f.height));

  const columns = Math.ceil(Math.sqrt(frames.length));
  const atlasWidth = columns * (maxW + padding) + padding;
  const atlasHeight = Math.ceil(frames.length / columns) * (maxH + padding) + padding;

  const compositeOperations = [];
  const phaserFrames = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * (maxW + padding) + padding;
    const y = row * (maxH + padding) + padding;

    compositeOperations.push({
      input: frame.path,
      left: x,
      top: y
    });

    phaserFrames.push({
      filename: frame.name,
      frame: { x, y, w: frame.width, h: frame.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frame.width, h: frame.height },
      sourceSize: { w: frame.width, h: frame.height }
    });
  }

  const outputBase = path.join(config.outputDir, config.atlasName);
  fs.mkdirSync(path.dirname(outputBase), { recursive: true });

  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(compositeOperations)
    .png()
    .toFile(`${outputBase}.png`);

  const phaserJson = {
    frames: phaserFrames,
    meta: {
      app: 'Lorelei Sprite Compiler',
      version: '1.0',
      image: `${config.atlasName}.png`,
      format: 'RGBA8888',
      size: { w: atlasWidth, h: atlasHeight },
      scale: '1'
    }
  };

  fs.writeFileSync(`${outputBase}.json`, JSON.stringify(phaserJson, null, 2));
  console.log(`[SPRITES] Atlas generated: ${outputBase}.png (${frames.length} frames)`);

  return charManifest;
}

compileSprites().catch(err => {
  console.error('[SPRITES] Uncaught error:', err);
  process.exit(1);
});
