import Phaser from 'phaser';

export class SpriteAnimationRegistry {
  constructor(scene) {
    this.scene = scene;
    this.manifest = null;
    this.isInitialized = false;
    this.entityPages = new Map(); // entityId -> Array of page keys
  }

  async load(manifestPath = 'assets/sprites/manifest.json') {
    return new Promise((resolve, reject) => {
      const cacheKey = 'sprite_manifest_' + Date.now();
      const basePath = manifestPath.substring(0, manifestPath.lastIndexOf('/') + 1);
      
      this.scene.load.json(cacheKey, manifestPath);
      this.scene.load.once('complete', () => {
        this.manifest = this.scene.cache.json.get(cacheKey);
        if (!this.manifest || this.manifest.schemaVersion !== 2) {
           console.warn('[SPRITE_REGISTRY] Warning: Manifest schema version mismatch or invalid manifest.');
        }
        this.loadAtlases(basePath).then(resolve).catch(reject);
      });
      this.scene.load.once('loaderror', (file) => {
        if (file.key === cacheKey) {
            reject(new Error(`Failed to load manifest: ${manifestPath}`));
        }
      });
      this.scene.load.start();
    });
  }

  async loadAtlases(basePath = 'assets/sprites/') {
    if (!this.manifest) return;

    return new Promise((resolve) => {
      const entities = this.manifest.entities || {};
      const entityEntries = Object.entries(entities);

      if (entityEntries.length === 0) {
        resolve();
        return;
      }

      entityEntries.forEach(([entityId, entityData]) => {
        const pages = entityData.pages || [];
        const pageKeys = [];
        pages.forEach((page, index) => {
          // Use entityId for the first page to maintain compatibility with existing sprite creation
          const pageKey = index === 0 ? entityId : `${entityId}_page_${index}`;
          // Use provided basePath for atlas loading
          this.scene.load.atlas(pageKey, basePath + page.image, basePath + page.json);
          pageKeys.push(pageKey);
        });
        this.entityPages.set(entityId, pageKeys);
      });

      this.scene.load.once('complete', () => {
        this.registerAnimations();
        resolve();
      });
      this.scene.load.start();
    });
  }

  registerAnimations() {
    if (!this.manifest || !this.manifest.entities) return;

    Object.entries(this.manifest.entities).forEach(([entityId, entityData]) => {
      Object.entries(entityData.states).forEach(([stateKey, stateData]) => {
        if (!stateData.animations) return;

        Object.entries(stateData.animations).forEach(([animKey, animData]) => {
          if (animData.fallback || !animData.directions) return;

          Object.entries(animData.directions).forEach(([dir, frames]) => {
            const animId = `${entityId}__${stateKey}__${animKey}__${dir}`;
            
            if (!this.scene.anims.exists(animId)) {
              const animationFrames = [];
              const pageKeys = this.entityPages.get(entityId) || [];

              for (const frameId of frames) {
                  let textureKey = null;
                  for (const pk of pageKeys) {
                      if (this.scene.textures.get(pk).has(frameId)) {
                          textureKey = pk;
                          break;
                      }
                  }

                  if (textureKey) {
                      animationFrames.push({ key: textureKey, frame: frameId });
                  }
              }

              if (animationFrames.length > 0) {
                this.scene.anims.create({
                  key: animId,
                  frames: animationFrames,
                  frameRate: animData.fps || 10,
                  repeat: animData.loop ? -1 : 0
                });
              }
            }
          });
        });
      });
    });

    this.isInitialized = true;
    console.log('[SPRITE_REGISTRY] Animations registered.');
  }

  /**
   * Resolve a request for an animation key with fallbacks.
   * @param {Object} request { entity, state, animation, direction }
   */
  resolve(request) {
    const { entity, state, animation, direction = 'south' } = request;
    
    if (!this.manifest || !this.manifest.entities || !this.manifest.entities[entity]) {
      return null;
    }

    const entityData = this.manifest.entities[entity];
    const targetState = state || entityData.defaultState || 'default';
    
    return this._recursiveResolve(entity, targetState, animation, direction);
  }

  _recursiveResolve(entityId, stateKey, animKey, direction) {
    const entityData = this.manifest.entities[entityId];
    const stateData = entityData.states[stateKey];
    
    if (!stateData || !stateData.animations) return null;

    const animData = stateData.animations[animKey];
    if (!animData) return null;

    // Handle animation level fallback (e.g., walk -> run)
    if (animData.fallback) {
        return this._recursiveResolve(entityId, stateKey, animData.fallback, direction);
    }

    // Resolve direction
    const resolvedDir = this._resolveDirection(animData.directions, direction);
    if (!resolvedDir) return null;

    return `${entityId}__${stateKey}__${animKey}__${resolvedDir}`;
  }

  _resolveDirection(supportedDirections, requestedDir) {
    if (supportedDirections[requestedDir]) {
      return requestedDir;
    }

    // Deterministic cardinal fallback for diagonals
    const cardinalFallbacks = {
      'north-east': 'north',
      'south-east': 'south',
      'south-west': 'south',
      'north-west': 'north'
    };

    if (cardinalFallbacks[requestedDir] && supportedDirections[cardinalFallbacks[requestedDir]]) {
      return cardinalFallbacks[requestedDir];
    }
    
    const altCardinalFallbacks = {
        'north-east': 'east',
        'south-east': 'east',
        'south-west': 'west',
        'north-west': 'west'
    };
    if (altCardinalFallbacks[requestedDir] && supportedDirections[altCardinalFallbacks[requestedDir]]) {
        return altCardinalFallbacks[requestedDir];
    }

    if (supportedDirections['south']) return 'south';
    const available = Object.keys(supportedDirections);
    return available.length > 0 ? available[0] : null;
  }

  /**
   * Backward compatibility for Blackrush/Pursuer
   */
  getAnimationKey(character, animation, direction) {
    return this.resolve({
        entity: character,
        animation: animation,
        direction: direction
    });
  }

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
