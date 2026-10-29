import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const TEMP_SOURCE = 'tests/temp_sprites_source';
const TEMP_OUTPUT = 'tests/temp_sprites_output';

function cleanup() {
  if (fs.existsSync(TEMP_SOURCE)) fs.rmSync(TEMP_SOURCE, { recursive: true, force: true });
  if (fs.existsSync(TEMP_OUTPUT)) fs.rmSync(TEMP_OUTPUT, { recursive: true, force: true });
}

async function createTestImage(filePath, width = 48, height = 48) {
  const sharp = (await import('sharp')).default;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  }).png().toFile(filePath);
}

test('Sprite Compiler: Basic functionality', async (t) => {
  cleanup();
  
  // Create dummy character source
  const dirs = [
    'north', 'north-east', 'east', 'south-east', 
    'south', 'south-west', 'west', 'north-west'
  ];
  
  for (const dir of dirs) {
    // Static idle
    await createTestImage(path.join(TEMP_SOURCE, 'testchar', 'idle', `${dir}.png`));
    // Animated walk (2 frames each)
    await createTestImage(path.join(TEMP_SOURCE, 'testchar', 'walk', dir, 'frame_000.png'));
    await createTestImage(path.join(TEMP_SOURCE, 'testchar', 'walk', dir, 'frame_001.png'));
  }

  // Create a temporary config
  const configContent = `
export const DIRECTIONS = ${JSON.stringify(dirs)};
export const CARDINAL_DIRECTIONS = ['north', 'east', 'south', 'west'];
export const SPRITE_CONFIG = {
  testchar: {
    source: 'testchar',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          idle: { fps: 1, loop: true, type: 'static', directions: 'eight' },
          walk: { fps: 10, loop: true, type: 'animated', directions: 'eight' }
        }
      }
    }
  }
};
  `;
  fs.writeFileSync('scripts/assets/sprite-config.test.mjs', configContent);

  // Run compiler (via node directly)
  const compilerScript = fs.readFileSync('scripts/assets/compile-sprites.mjs', 'utf8')
    .replace('./sprite-config.mjs', './sprite-config.test.mjs')
    .replace("const SOURCE_ROOT = 'public/assets/source/pixellab';", `const SOURCE_ROOT = '${TEMP_SOURCE}';`)
    .replace("const OUTPUT_ROOT = 'public/assets/sprites';", `const OUTPUT_ROOT = '${TEMP_OUTPUT}';`);
  
  fs.writeFileSync('scripts/assets/compile-sprites.test.mjs', compilerScript);

  const result = spawnSync('node', ['scripts/assets/compile-sprites.test.mjs'], { encoding: 'utf8' });
  
  if (result.status !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
  }

  assert.strictEqual(result.status, 0, 'Compiler should exit with 0');
  
  // Check output - nested path for testchar
  assert.ok(fs.existsSync(path.join(TEMP_OUTPUT, 'testchar', 'testchar_page_0.png')), 'Atlas PNG should exist');
  assert.ok(fs.existsSync(path.join(TEMP_OUTPUT, 'testchar', 'testchar_page_0.json')), 'Atlas JSON should exist');
  assert.ok(fs.existsSync(path.join(TEMP_OUTPUT, 'manifest.json')), 'Manifest should exist');

  const manifest = JSON.parse(fs.readFileSync(path.join(TEMP_OUTPUT, 'manifest.json'), 'utf8'));
  assert.strictEqual(manifest.schemaVersion, 2);
  assert.ok(manifest.entities.testchar, 'Manifest should contain testchar');
  assert.ok(manifest.entities.testchar.states.default.animations.walk.directions.north.includes('testchar__default__walk__north__000'), 'Manifest should have correct frame names');
  
  cleanup();
  fs.unlinkSync('scripts/assets/sprite-config.test.mjs');
  fs.unlinkSync('scripts/assets/compile-sprites.test.mjs');
});

test('Sprite Compiler: Validation - Missing Direction', async (t) => {
  cleanup();
  
  // Create only north for idle
  await createTestImage(path.join(TEMP_SOURCE, 'testchar', 'idle', 'north.png'));

  const configContent = `
export const DIRECTIONS = ['north', 'south'];
export const CARDINAL_DIRECTIONS = ['north', 'south'];
export const SPRITE_CONFIG = {
  testchar: {
    source: 'testchar',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          idle: { fps: 1, loop: true, type: 'static', directions: ['north', 'south'] }
        }
      }
    }
  }
};
  `;
  fs.writeFileSync('scripts/assets/sprite-config.test.mjs', configContent);

  const compilerScript = fs.readFileSync('scripts/assets/compile-sprites.mjs', 'utf8')
    .replace('./sprite-config.mjs', './sprite-config.test.mjs')
    .replace("const SOURCE_ROOT = 'public/assets/source/pixellab';", `const SOURCE_ROOT = '${TEMP_SOURCE}';`)
    .replace("const OUTPUT_ROOT = 'public/assets/sprites';", `const OUTPUT_ROOT = '${TEMP_OUTPUT}';`);
  fs.writeFileSync('scripts/assets/compile-sprites.test.mjs', compilerScript);

  const result = spawnSync('node', ['scripts/assets/compile-sprites.test.mjs'], { encoding: 'utf8' });
  
  // Should warn about missing south
  const output = result.stdout + result.stderr;
  assert.ok(output.includes('Warning: Missing direction "south"'), 'Should warn about missing direction');

  cleanup();
  fs.unlinkSync('scripts/assets/sprite-config.test.mjs');
  fs.unlinkSync('scripts/assets/compile-sprites.test.mjs');
});

test('Sprite Compiler: Multi-state and Source Overrides', async (t) => {
  cleanup();
  
  // Create source for entity1 state default (directly under entity1)
  await createTestImage(path.join(TEMP_SOURCE, 'entity1', 'idle', 'south.png'));
  
  // Create source for entity2 with explicit state subfolders
  await createTestImage(path.join(TEMP_SOURCE, 'entity2', 'default', 'walk', 'south', 'frame_000.png'));
  await createTestImage(path.join(TEMP_SOURCE, 'entity2', 'damaged', 'walk', 'south', 'frame_000.png'));
  
  // Create source for entity3 with absolute source override
  const OVERRIDE_SOURCE = path.join(TEMP_SOURCE, 'override_dir');
  await createTestImage(path.join(OVERRIDE_SOURCE, 'run', 'south', 'frame_000.png'));

  const configContent = `
export const DIRECTIONS = ['south'];
export const CARDINAL_DIRECTIONS = ['south'];
export const SPRITE_CONFIG = {
  entity1: {
    source: 'entity1',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          idle: { fps: 1, loop: true, type: 'static', directions: ['south'] }
        }
      }
    }
  },
  entity2: {
    source: 'entity2',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          walk: { fps: 10, loop: true, type: 'animated', directions: ['south'] }
        }
      },
      damaged: {
        animations: {
          walk: { fps: 10, loop: true, type: 'animated', directions: ['south'] }
        }
      }
    }
  },
  entity3: {
    displayScale: 2,
    states: {
      default: {
        source: 'override_dir',
        animations: {
          run: { fps: 14, loop: true, type: 'animated', directions: ['south'] }
        }
      }
    }
  }
};
  `;
  fs.writeFileSync('scripts/assets/sprite-config.test.mjs', configContent);

  const compilerScript = fs.readFileSync('scripts/assets/compile-sprites.mjs', 'utf8')
    .replace('./sprite-config.mjs', './sprite-config.test.mjs')
    .replace("const SOURCE_ROOT = 'public/assets/source/pixellab';", `const SOURCE_ROOT = '${TEMP_SOURCE}';`)
    .replace("const OUTPUT_ROOT = 'public/assets/sprites';", `const OUTPUT_ROOT = '${TEMP_OUTPUT}';`);
  fs.writeFileSync('scripts/assets/compile-sprites.test.mjs', compilerScript);

  const result = spawnSync('node', ['scripts/assets/compile-sprites.test.mjs'], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0, 'Compiler should exit with 0');

  const manifest = JSON.parse(fs.readFileSync(path.join(TEMP_OUTPUT, 'manifest.json'), 'utf8'));
  
  assert.ok(manifest.entities.entity1.states.default.animations.idle, 'entity1 idle exists');
  assert.ok(manifest.entities.entity2.states.default.animations.walk, 'entity2 default walk exists');
  assert.ok(manifest.entities.entity2.states.damaged.animations.walk, 'entity2 damaged walk exists');
  assert.ok(manifest.entities.entity3.states.default.animations.run, 'entity3 run exists');
  
  // Check frame names to verify they picked up frames from correct locations
  assert.ok(manifest.entities.entity3.states.default.animations.run.directions.south.includes('entity3__default__run__south__000'));

  cleanup();
  fs.unlinkSync('scripts/assets/sprite-config.test.mjs');
  fs.unlinkSync('scripts/assets/compile-sprites.test.mjs');
});
