export const DIRECTIONS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west'
];

export const SPRITE_CONFIG = {
  blackrush: {
    sourceDir: 'public/assets/source/pixellab/blackrush',
    outputDir: 'public/assets/sprites/blackrush',
    atlasName: 'blackrush',
    frameWidth: 48,
    frameHeight: 48,
    displayScale: 2,
    animations: {
      'idle': { fps: 1, loop: true, type: 'static' },
      'walk': { fps: 10, loop: true, type: 'animated' },
      'run': { fps: 14, loop: true, type: 'animated' },
      'force-idle': { fps: 1, loop: true, type: 'static' },
      'force-walk': { fps: 10, loop: true, type: 'animated' },
      'force-run': { fps: 14, loop: true, type: 'animated' },
      'axe-ready': { fps: 8, loop: true, type: 'animated' },
      'axe-throw': { fps: 18, loop: false, type: 'animated' }
    }
  },
  pursuer: {
    sourceDir: 'public/assets/source/pixellab/robots/persuer',
    outputDir: 'public/assets/sprites/robots/pursuer',
    atlasName: 'pursuer',
    frameWidth: 48,
    frameHeight: 48,
    displayScale: 2,
    animations: {
      'idle': { fps: 1, loop: true, type: 'static' },
      'walk': { fps: 8, loop: true, type: 'animated' },
      'attack': { fps: 12, loop: true, type: 'animated' }
    }
  },
  lorelei: {
    sourceDir: 'public/assets/source/pixellab/lorelei',
    outputDir: 'public/assets/sprites/lorelei',
    atlasName: 'lorelei',
    frameWidth: 48,
    frameHeight: 48,
    displayScale: 2,
    animations: {
      'idle': { fps: 1, loop: true, type: 'static' },
      'walk': { fps: 8, loop: true, type: 'animated' }
    }
  }
};
