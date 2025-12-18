const Config = {

  theme: {
    current: 'light',
    dark: {
      background: '#121212',
      text: '#E0E0E0',
      ui: '#888888',
      agents: {
        prey: ['#00FF99', '#00FFFF', '#00c3ffff'],
        preyEnd: '#0088FF',
        predator: ['#ff44a2ff', '#ff1d43ff', '#d200daff']
      }
    },
    light: {
      background: '#F0F0F0',
      text: '#121212',
      ui: '#666666',
      agents: {
        prey: ['#01a362ff', '#09c2c2ff', '#1aa2ccff'],
        preyEnd: '#0170d1ff',
        predator: ['#ce317fff', '#c51e3aff', '#0a0002ff']
      }
    }
  },

  interaction: {
    predatorSpawnDelay: 600,
    maxSamples: {
        prey: { min: 5, max: 25 },
        predator: { min: 5, max: 25 }
    }
  },

  sim: {
    mutationRate: 0.2, // global
    prey: {
      startCount: { min: 5, max: 270 },
      size: { min: 5, max: 10 },
      lifespan: { min: 10, max: 25 },
      reproduction: {
        ageThreshold: 2, // sec
        chance: 0.0015,
        cap: 800
      },
      speed: 2.5,
      burstSpeedMultiplier: 2.0, // flee speed boost
      exhaustedSpeedMultiplier: 0.5,
      stamina: {
          max: 3.0,
          recoveryRate: 0.5,
          drainRate: 1.0
      },
      fleeRadius: 160
    },
    predator: {
      populationCap: 200,
      startCount: { min: 3, max: 100 },
      size: { min: 6, max: 9 },
      lifespan: { min: 60, max: 100 },
      speed: { min: 2.5, max: 3.0 },
      burstSpeedMultiplier: 3.0,
      exhaustedSpeedMultiplier: 0.4,
      stamina: {
          max: 4.0,
          recoveryRate: 0.8,
          drainRate: 1.0
      },
      huntRadius: 110,
      starvationTime: { min: 15, max: 30 },
      reproduction: {
          window: 4.0,
          chanceSingle: 0.05,
          chanceDouble: 0.10,
          chanceTriple: 0.40,
          chanceMassive: 1.0
      },
      reproduceThreshold: 2,
      reproduceChance: 0.4
    }
  },

  // dynamics
  dynamic: {
    enabled: true,
    // ecosys ratio
    ratio: {
        optimal: 0.2,       // ideal: 1 pred per 5 prey
        high: 0.35,         // > 0.35: too many predators
        low: 0.10           // < 0.10: too few predators
    },
    prey: {
        highPopThreshold: 800, // above this, nerf birth rate
        lowPopThreshold: 70,   // below this, buff birth rate
        reproductionNerf: 0.3, 
        reproductionBuff: 1.5,
        highRatioBuff: 1.8,    // panic breeding when predators are rampant
        lowRatioNerf: 0.8,     // relaxed breeding when safe
        // dependency: reproduction stops if insufficient preds
        dependency: {
            enabled: true,
            minPredatorRatio: 0.20 // need at least 20% predator pop to reproduce
        }
    },
    predator: {
        highPopThreshold: 200,
        lowPopThreshold: 15,
        reproductionNerf: 0.3,
        reproductionBuff: 2.0,
        highRatioNerf: 0.2,    // intense competition when overcrowded relative to prey
        lowRatioBuff: 1.5,     // thriving when food is abundant relative to population
        
        // hunting neeed nerfs if insufficient prey
        scarcity: {
            enabled: true,
            minPreyRatio: 0.60
        },
        // endangered buff
        lowPopSpeedBoost: 1.2,
        lowPopHuntBoost: 1.5
    }
  },

  // audio
  audio: {
    musicVolume: 0.3,
    sfxVolume: 0.6,
    despawnThreshold: 15,
    spawnVolumeBoost: 1.0,
    despawnVolumeBoost: 0.2,
    killVolumeBoost: 1.0,
    tapVolumeBoost: 1.0,
    clickVolumeBoost: 2.0,
    nomnomVolumeBoost: 1.0,
    
    // optimization settings
    maxVoices: 12, // hard limit on concurrent sounds
    optimization: {
        enabled: true,
        lowFpsThreshold: 45, // below this, throttle audio
        criticalFpsThreshold: 30, // below this, minimal audio
        highPopThreshold: 400, // mute minor sounds above this
        nomnomThreshold: 150, // mute feeding sounds above this population
        stackWindowNormal: 200,
        stackWindowThrottled: 600,
        maxStacksNormal: 3,
        maxStacksThrottled: 1
    }
  }
};
