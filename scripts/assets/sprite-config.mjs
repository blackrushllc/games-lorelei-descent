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

export const CARDINAL_DIRECTIONS = ['north', 'east', 'south', 'west'];

export const SPRITE_CONFIG = {
  blackrush: {
    source: 'blackrush',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 10, loop: true, type: 'animated', directions: 'eight' },
          'run': { fps: 14, loop: true, type: 'animated', directions: 'eight' },
          'force-idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'force-walk': { fps: 10, loop: true, type: 'animated', directions: 'eight' },
          'force-run': { fps: 14, loop: true, type: 'animated', directions: 'eight' },
          'axe-ready': { fps: 8, loop: true, type: 'animated', directions: 'eight' },
          'axe-throw': { fps: 18, loop: false, type: 'animated', directions: 'eight' }
        }
      }
    }
  },
  pursuer: {
    source: 'robots/persuer',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 11, loop: true, type: 'animated', directions: 'eight' },
          'attack': { fps: 12, loop: true, type: 'animated', directions: 'eight' }
        }
      }
    }
  },
  sentinel: {
    source: 'robots/sentinel',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' },
          'run': { fps: 12, loop: true, type: 'animated', directions: 'eight' }
        }
      }
    }
  },
  armored_robot: {
    source: 'robots/armored_robot', // Base source, will be overridden by state sources
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        source: 'robots/armored_robot',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 9, loop: true, type: 'animated', directions: 'eight' },
          'run': { fps: 12, loop: true, type: 'animated', directions: 'eight' }
        }
      },
      disarmed: {
        source: 'robots/armored_robot_disarmed',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 9, loop: true, type: 'animated', directions: 'eight' },
          // No run animation in disarmed state
          'run': { fallback: 'walk' }
        }
      }
    }
  },
  eclipse: {
    source: 'eclipse',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 10, loop: true, type: 'animated', directions: 'eight' },
          'run': { fps: 14, loop: true, type: 'animated', directions: 'eight' },
          'crouch': { fps: 10, loop: false, type: 'animated', directions: 'cardinal' }
        }
      }
    }
  },
  german_soldier: {
    source: 'german_soldier',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'run': { fps: 14, loop: true, type: 'animated', directions: 'eight' },
          'throw': { fps: 18, loop: false, type: 'animated', directions: 'eight' },
          'walk': { fallback: 'run' }
        }
      }
    }
  },
  lorelei: {
    source: 'lorelei',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' },
          'run': { fps: 12, loop: true, type: 'animated', directions: 'eight' }
        }
      }
    }
  },
  nadine: {
    source: 'nadine',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'run': { fps: 14, loop: true, type: 'animated', directions: 'eight' },
          'walk': { fallback: 'run' }
        }
      }
    }
  },
  proxy: {
    source: 'proxy',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        source: 'proxy/default',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' }
        }
      },
      carrying_nadine: {
        source: 'proxy/carrying_nadine',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'run': { fps: 14, loop: true, type: 'animated', directions: 'eight' },
          'walk': { fallback: 'run' }
        }
      },
      damage_1: {
        source: 'proxy/damage_1',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' }
        }
      },
      damage_2: {
        source: 'proxy/damage_2',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' }
        }
      },
      damage_3: {
        source: 'proxy/damage_3',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'collapse': { fps: 12, loop: false, type: 'animated', directions: ['south'] },
          'walk': { fallback: 'idle' }
        }
      }
    }
  },
  giant_boss: {
    source: 'giant_boss',
    displayScale: 2,
    defaultState: 'default',
    states: {
      default: {
        source: 'giant_boss/default',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' },
          'swing': { fps: 12, loop: false, type: 'animated', directions: 'cardinal' }
        }
      },
      damage_left: {
        source: 'giant_boss/damage_left',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' }
        }
      },
      damage_left_right: {
        source: 'giant_boss/damage_left_right',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' }
        }
      },
      damage_all: {
        source: 'giant_boss/damage_all',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: 'eight' },
          'walk': { fps: 8, loop: true, type: 'animated', directions: 'eight' },
          'collapse': { fps: 12, loop: false, type: 'animated', directions: ['south'] }
        }
      },
      destroyed: {
        source: 'giant_boss/destroyed',
        animations: {
          'idle': { fps: 1, loop: true, type: 'static', directions: ['south'] },
          'burning': { fps: 8, loop: true, type: 'animated', directions: ['south'] }
        }
      }
    }
  }
};
