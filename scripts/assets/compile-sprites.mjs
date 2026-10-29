import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { SPRITE_CONFIG, DIRECTIONS, CARDINAL_DIRECTIONS } from './sprite-config.mjs';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const targetCharacter = args.find((_, i) => args[i - 1] === '--character');

const MAX_ATLAS_SIZE = 2048;
const PADDING = 2;
const SOURCE_ROOT = 'public/assets/source/pixellab';
const OUTPUT_ROOT = 'public/assets/sprites';

async function getContentBounds(filePath) {
    try {
        const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        let minY = info.height, maxY = 0;
        let hasPixels = false;
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const alpha = data[(y * info.width + x) * 4 + 3];
                if (alpha > 0) {
                    hasPixels = true;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        return hasPixels ? { minY, maxY, width: info.width, height: info.height } : null;
    } catch (err) {
        console.error(`[SPRITES] Error getting bounds for ${filePath}:`, err.message);
        return null;
    }
}

async function compileSprites() {
  console.log('[SPRITES] Starting compilation...');
  
  const entities = targetCharacter ? [targetCharacter] : Object.keys(SPRITE_CONFIG);
  const manifest = {
    schemaVersion: 2,
    entities: {}
  };

  for (const entityId of entities) {
    const config = SPRITE_CONFIG[entityId];
    if (!config) {
      console.error(`[SPRITES] Error: Entity config not found for "${entityId}"`);
      continue;
    }

    try {
      const entityResult = await processEntity(entityId, config);
      if (entityResult) {
        manifest.entities[entityId] = entityResult;
      }
    } catch (err) {
      console.error(`[SPRITES] Failed to process entity "${entityId}":`, err.message);
      if (!checkOnly) {
        console.error(err.stack);
        process.exit(1);
      }
    }
  }

  if (!checkOnly) {
    const manifestPath = path.join(OUTPUT_ROOT, 'manifest.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`[SPRITES] Manifest written to ${manifestPath}`);
  }

  console.log('[SPRITES] Compilation complete.');
}

async function processEntity(entityId, config) {
  console.log(`[SPRITES] Processing entity: ${entityId}`);
  
  const entityManifest = {
    id: entityId,
    displayScale: config.displayScale || 2,
    defaultState: config.defaultState || 'default',
    states: {}
  };

  const allFrames = [];
  const entitySourceRoot = path.join(SOURCE_ROOT, config.source || entityId);

  // 1. Discover Frames
  for (const [stateKey, stateConfig] of Object.entries(config.states)) {
    const stateManifest = {
      animations: {}
    };

    const stateSourceDir = stateConfig.source 
      ? path.join(SOURCE_ROOT, stateConfig.source) 
      : (config.states.length > 1 || stateKey !== 'default' 
          ? path.join(entitySourceRoot, stateKey) 
          : entitySourceRoot);
    
    let effectiveStateSourceDir = stateSourceDir;
    if (!fs.existsSync(effectiveStateSourceDir) && stateKey === 'default') {
        effectiveStateSourceDir = entitySourceRoot;
    }

    if (!fs.existsSync(effectiveStateSourceDir)) {
      console.warn(`[SPRITES] Warning: Source directory for state "${stateKey}" not found at ${effectiveStateSourceDir}`);
      continue;
    }

    for (const [animKey, animConfig] of Object.entries(stateConfig.animations)) {
      if (animConfig.fallback) {
        stateManifest.animations[animKey] = { fallback: animConfig.fallback };
        continue;
      }

      const animManifest = {
        fps: animConfig.fps || 10,
        loop: animConfig.loop !== undefined ? animConfig.loop : true,
        directions: {}
      };

      let directionsToProcess = [];
      if (animConfig.directions === 'eight') directionsToProcess = DIRECTIONS;
      else if (animConfig.directions === 'cardinal') directionsToProcess = CARDINAL_DIRECTIONS;
      else if (Array.isArray(animConfig.directions)) directionsToProcess = animConfig.directions;
      else directionsToProcess = DIRECTIONS;

      for (const dir of directionsToProcess) {
        const dirPath = path.join(effectiveStateSourceDir, animKey, dir);
        let frameFiles = [];

        if (animConfig.type === 'static') {
          const staticFilePath = path.join(effectiveStateSourceDir, animKey, `${dir}.png`);
          if (fs.existsSync(staticFilePath)) {
            frameFiles = [staticFilePath];
          }
        } else if (fs.existsSync(dirPath)) {
          frameFiles = fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.png'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || 0);
                const numB = parseInt(b.match(/\d+/)?.[0] || 0);
                return numA - numB;
            })
            .map(f => path.join(dirPath, f));
        }

        if (frameFiles.length === 0) {
          console.warn(`[SPRITES] Warning: Missing direction "${dir}" for animation "${animKey}" in state "${stateKey}" of entity "${entityId}"`);
          continue;
        }

        const dirFrames = [];
        for (let i = 0; i < frameFiles.length; i++) {
          const frameFile = frameFiles[i];
          const frameId = `${entityId}__${stateKey}__${animKey}__${dir}__${String(i).padStart(3, '0')}`;
          
          const metadata = await sharp(frameFile).metadata();
          
          const frameData = {
            id: frameId,
            path: frameFile,
            width: metadata.width,
            height: metadata.height,
            entityId,
            stateKey,
            animKey,
            dir,
            index: i
          };
          
          allFrames.push(frameData);
          dirFrames.push(frameId);
        }
        animManifest.directions[dir] = dirFrames;
      }
      stateManifest.animations[animKey] = animManifest;
    }
    entityManifest.states[stateKey] = stateManifest;
  }

  if (allFrames.length === 0) {
    console.warn(`[SPRITES] No frames found for entity "${entityId}"`);
    return null;
  }

  // 2. Variable Dimension Support and Anchor Calculation
  const dimensionCounts = {};
  let maxW = 0;
  let maxH = 0;
  for (const frame of allFrames) {
    const dim = `${frame.width}x${frame.height}`;
    dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
    if (frame.width > maxW) maxW = frame.width;
    if (frame.height > maxH) maxH = frame.height;
  }
  
  console.log(`[SPRITES] ${entityId} dimensions distribution:`);
  Object.entries(dimensionCounts).forEach(([dim, count]) => {
    console.log(`  - ${dim}: ${count} frames`);
  });

  entityManifest.maxSourceWidth = maxW;
  entityManifest.maxSourceHeight = maxH;

  // Stable Anchor Calculation
  // Find a reference frame to establish the ground point
  let refFrame = allFrames.find(f => f.animKey === 'idle' && f.dir === 'south') 
               || allFrames.find(f => f.animKey === 'idle')
               || allFrames[0];
  
  let groundOffset = 0; // Relative to canvas center
  if (config.groundOffset !== undefined) {
    groundOffset = config.groundOffset;
  } else {
    const bounds = await getContentBounds(refFrame.path);
    if (bounds) {
      groundOffset = bounds.maxY - (bounds.height / 2);
    }
  }
  entityManifest.groundOffset = groundOffset;
  
  // Logical anchor point (relative to logical max size)
  entityManifest.anchorX = 0.5;
  entityManifest.anchorY = (maxH / 2 + groundOffset) / maxH;
  
  console.log(`[SPRITES] ${entityId} stable anchor: (${entityManifest.anchorX.toFixed(3)}, ${entityManifest.anchorY.toFixed(3)}) [Offset: ${groundOffset}]`);

  if (checkOnly) {
    console.log(`[SPRITES] Validated ${allFrames.length} frames for "${entityId}"`);
    return entityManifest;
  }

  // 2. Atlas Paging and Generation
  const pages = packFrames(allFrames, MAX_ATLAS_SIZE, PADDING);
  entityManifest.pages = [];

  const entityOutputDir = path.join(OUTPUT_ROOT, entityId === 'pursuer' ? 'robots/pursuer' : (entityId === 'sentinel' ? 'robots/sentinel' : (entityId === 'armored_robot' ? 'robots/armored_robot' : entityId)));
  fs.mkdirSync(entityOutputDir, { recursive: true });

  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const pageName = `${entityId}_page_${p}`;
    const atlasImgPath = path.join(entityOutputDir, `${pageName}.png`);
    const atlasJsonPath = path.join(entityOutputDir, `${pageName}.json`);

    await generateAtlasPage(page, atlasImgPath, atlasJsonPath, pageName, entityManifest);
    entityManifest.pages.push({
        image: path.relative(OUTPUT_ROOT, atlasImgPath).replace(/\\/g, '/'),
        json: path.relative(OUTPUT_ROOT, atlasJsonPath).replace(/\\/g, '/')
    });
  }

  console.log(`[SPRITES] Generated ${pages.length} atlas pages for "${entityId}"`);
  return entityManifest;
}

function packFrames(frames, maxSize, padding) {
    const pages = [];
    let currentFrames = [...frames];

    while (currentFrames.length > 0) {
        const page = {
            width: 0,
            height: 0,
            frames: []
        };

        // Simple grid packing for now, improved to respect maxSize
        const maxFrameW = Math.max(...currentFrames.map(f => f.width));
        const maxFrameH = Math.max(...currentFrames.map(f => f.height));
        
        const cols = Math.floor((maxSize - padding) / (maxFrameW + padding));
        const rows = Math.floor((maxSize - padding) / (maxFrameH + padding));
        const framesPerPage = cols * rows;

        if (framesPerPage <= 0) {
            throw new Error(`Frame size too large for atlas: ${maxFrameW}x${maxFrameH}`);
        }

        const pageFrames = currentFrames.splice(0, framesPerPage);
        
        const actualCols = Math.min(pageFrames.length, cols);
        const actualRows = Math.ceil(pageFrames.length / actualCols);
        
        page.width = actualCols * (maxFrameW + padding) + padding;
        page.height = actualRows * (maxFrameH + padding) + padding;

        for (let i = 0; i < pageFrames.length; i++) {
            const f = pageFrames[i];
            const c = i % actualCols;
            const r = Math.floor(i / actualCols);
            page.frames.push({
                ...f,
                x: c * (maxFrameW + padding) + padding,
                y: r * (maxFrameH + padding) + padding
            });
        }

        pages.push(page);
    }

    return pages;
}

async function generateAtlasPage(page, imgPath, jsonPath, pageName, entityManifest) {
    const compositeOperations = page.frames.map(f => ({
        input: f.path,
        left: f.x,
        top: f.y
    }));

    await sharp({
        create: {
            width: page.width,
            height: page.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite(compositeOperations)
    .png()
    .toFile(imgPath);

    const phaserJson = {
        frames: page.frames.map(f => {
            // Stability logic: center the frame within the logical sourceSize
            const offsetX = Math.floor((entityManifest.maxSourceWidth - f.width) / 2);
            const offsetY = Math.floor((entityManifest.maxSourceHeight - f.height) / 2);

            return {
                filename: f.id,
                frame: { x: f.x, y: f.y, w: f.width, h: f.height },
                rotated: false,
                trimmed: true,
                spriteSourceSize: { x: offsetX, y: offsetY, w: f.width, h: f.height },
                sourceSize: { w: entityManifest.maxSourceWidth, h: entityManifest.maxSourceHeight },
                pivot: { x: entityManifest.anchorX, y: entityManifest.anchorY }
            };
        }),
        meta: {
            app: 'Lorelei Sprite Compiler',
            version: '2.0',
            image: path.basename(imgPath),
            format: 'RGBA8888',
            size: { w: page.width, h: page.height },
            scale: '1'
        }
    };

    fs.writeFileSync(jsonPath, JSON.stringify(phaserJson, null, 2));
}

compileSprites().catch(err => {
  console.error('[SPRITES] Uncaught error:', err);
  process.exit(1);
});
