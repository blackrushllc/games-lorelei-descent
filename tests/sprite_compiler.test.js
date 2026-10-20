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
export const SPRITE_CONFIG = {
  testchar: {
    sourceDir: '${TEMP_SOURCE}/testchar',
    outputDir: '${TEMP_OUTPUT}/testchar',
    atlasName: 'testchar',
    frameWidth: 48,
    frameHeight: 48,
    displayScale: 2,
    animations: {
      idle: { fps: 1, loop: true, type: 'static' },
      walk: { fps: 10, loop: true, type: 'animated' }
    }
  }
};
  `;
  fs.writeFileSync('scripts/assets/sprite-config.test.mjs', configContent);

  // Run compiler (via node directly)
  // We need to point the compiler to use our test config. 
  // I'll modify compile-sprites.mjs slightly to allow overriding config via env var or similar if needed, 
  // or just use search_replace to change the import.
  // Actually, I'll just create a temporary compiler script that imports the test config.
  const compilerScript = fs.readFileSync('scripts/assets/compile-sprites.mjs', 'utf8')
    .replace('./sprite-config.mjs', './sprite-config.test.mjs')
    .replace('public/assets/sprites', TEMP_OUTPUT);
  
  fs.writeFileSync('scripts/assets/compile-sprites.test.mjs', compilerScript);

  const result = spawnSync('node', ['scripts/assets/compile-sprites.test.mjs'], { encoding: 'utf8' });
  
  // console.log(result.stdout);
  // console.log(result.stderr);

  assert.strictEqual(result.status, 0, 'Compiler should exit with 0');
  
  // Check output
  assert.ok(fs.existsSync(path.join(TEMP_OUTPUT, 'testchar', 'testchar.png')), 'Atlas PNG should exist');
  assert.ok(fs.existsSync(path.join(TEMP_OUTPUT, 'testchar', 'testchar.json')), 'Atlas JSON should exist');
  assert.ok(fs.existsSync(path.join(TEMP_OUTPUT, 'manifest.json')), 'Manifest should exist');

  const manifest = JSON.parse(fs.readFileSync(path.join(TEMP_OUTPUT, 'manifest.json'), 'utf8'));
  assert.ok(manifest.testchar, 'Manifest should contain testchar');
  assert.ok(manifest.testchar.animations.walk.directions.north.includes('walk_north_000'), 'Manifest should have correct frame names');
  
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
export const SPRITE_CONFIG = {
  testchar: {
    sourceDir: '${TEMP_SOURCE}/testchar',
    outputDir: '${TEMP_OUTPUT}/testchar',
    atlasName: 'testchar',
    frameWidth: 48,
    frameHeight: 48,
    displayScale: 2,
    animations: {
      idle: { fps: 1, loop: true, type: 'static' }
    }
  }
};
  `;
  fs.writeFileSync('scripts/assets/sprite-config.test.mjs', configContent);

  const compilerScript = fs.readFileSync('scripts/assets/compile-sprites.mjs', 'utf8')
    .replace('./sprite-config.mjs', './sprite-config.test.mjs')
    .replace('public/assets/sprites', TEMP_OUTPUT);
  fs.writeFileSync('scripts/assets/compile-sprites.test.mjs', compilerScript);

  const result = spawnSync('node', ['scripts/assets/compile-sprites.test.mjs'], { encoding: 'utf8' });
  
  // Should warn about missing south
  const output = result.stdout + result.stderr;
  assert.ok(output.includes('Warning: Missing direction "south"'), 'Should warn about missing direction');
  
  cleanup();
  fs.unlinkSync('scripts/assets/sprite-config.test.mjs');
  fs.unlinkSync('scripts/assets/compile-sprites.test.mjs');
});
