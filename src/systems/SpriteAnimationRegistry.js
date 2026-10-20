import Phaser from 'phaser';

export class SpriteAnimationRegistry {
  constructor(scene) {
    this.scene = scene;
    this.manifest = null;
    this.isInitialized = false;
  }

  async load(manifestPath = 'assets/sprites/manifest.json') {
    return new Promise((resolve, reject) => {
      this.scene.load.json('sprite_manifest', manifestPath);
      this.scene.load.once('complete', () => {
        this.manifest = this.scene.cache.json.get('sprite_manifest');
        this.loadAtlases().then(resolve).catch(reject);
      });
      this.scene.load.start();
    });
  }

  async loadAtlases() {
    if (!this.manifest) return;

    return new Promise((resolve) => {
      const entries = Object.entries(this.manifest);
      let loadedCount = 0;

      if (entries.length === 0) {
        resolve();
        return;
      }

      entries.forEach(([key, charData]) => {
        const atlasBase = `assets/sprites/${charData.character === 'pursuer' ? 'robots/pursuer' : (charData.character === 'blackrush' ? 'blackrush' : charData.character)}/${charData.character}`;
        
        // Use normalized paths based on character
        let pathPrefix = `assets/sprites/${charData.character}/`;
        if (charData.character === 'pursuer') {
          pathPrefix = 'assets/sprites/robots/pursuer/';
        } else if (charData.character === 'lorelei') {
          pathPrefix = 'assets/sprites/lorelei/';
        }

        const atlasImg = `${pathPrefix}${charData.character}.png`;
        const atlasJson = `${pathPrefix}${charData.character}.json`;

        this.scene.load.atlas(charData.character, atlasImg, atlasJson);
      });

      this.scene.load.once('complete', () => {
        this.registerAnimations();
        resolve();
      });
      this.scene.load.start();
    });
  }

  registerAnimations() {
    if (!this.manifest) return;

    Object.entries(this.manifest).forEach(([charKey, charData]) => {
      Object.entries(charData.animations).forEach(([animKey, animData]) => {
        Object.entries(animData.directions).forEach(([dir, frames]) => {
          const animId = `${charKey}_${animKey}_${dir}`;
          
          if (!this.scene.anims.exists(animId)) {
            this.scene.anims.create({
              key: animId,
              frames: frames.map(f => ({ key: charKey, frame: f })),
              frameRate: animData.fps,
              repeat: animData.loop ? -1 : 0
            });
          }
        });
      });
    });

    this.isInitialized = true;
    console.log('[SPRITE_REGISTRY] Animations registered.');
  }

  /**
   * Get the animation key for a character, state, and direction.
   */
  getAnimationKey(character, animation, direction) {
    const key = `${character}_${animation}_${direction}`;
    if (this.scene.anims.exists(key)) {
      return key;
    }
    // Fallback to south if direction missing
    const fallback = `${character}_${animation}_south`;
    if (this.scene.anims.exists(fallback)) {
      return fallback;
    }
    return null;
  }

  /**
   * Quantize an angle (in radians) into one of the 8 canonical directions.
   */
  get8WayDirection(angle) {
    let normalized = Phaser.Math.Angle.Normalize(angle);
    let degrees = Phaser.Math.RadToDeg(normalized);
    if (degrees < 0) degrees += 360;

    if (degrees >= 337.5 || degrees < 22.5) return 'east';
    if (degrees >= 22.5 && degrees < 67.5) return 'south-east';
    if (degrees >= 67.5 && degrees < 112.5) return 'south';
    if (degrees >= 112.5 && degrees < 157.5) return 'south-west';
    if (degrees >= 157.5 && degrees < 202.5) return 'west';
    if (degrees >= 202.5 && degrees < 247.5) return 'north-west';
    if (degrees >= 247.5 && degrees < 292.5) return 'north';
    if (degrees >= 292.5 && degrees < 337.5) return 'north-east';

    return 'south';
  }
}
