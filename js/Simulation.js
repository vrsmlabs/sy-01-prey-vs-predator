class Simulation {
  constructor() {
    this.prey = [];
    this.predators = [];
    this.timer = 0;
    this.isPaused = false;
    this.state = 1; // 1 title 2 sim 3 end
    
    // stats tracking
    this.peakPrey = 0;
    this.peakPredator = 0;
    this.maxGenerations = 1; // gen tracking
    
    // user sample limits
    this.userSamples = {
        prey: 0,
        predator: 0
    };
    
    // reproduction lock states
    this.preyReproductionLocked = false;
    this.predatorReproductionLocked = false;

    // obstacles
    this.obstacles = [];
    this.nextObstacleSpawn = -1; // next season start
    this.obstaclePeriodEnd = -1; // current season end
    this.nextIndividualSpawn = -1; // next single spawn
  }

  init() {
    this.state = 1;
    this.resetStats();
    
    // pre initialize samples before start
    this.initializeSamples();
  }

  start() {
    this.state = 2;
    this.reset();
  }

  initializeSamples() {
    // initialize random user samples
    
    if (typeof Config === 'undefined') {
        console.error("critical config undefined in initializesamples");
        return;
    }

    const samplesConfig = Config.interaction.maxSamples;
    
    if (!samplesConfig || !samplesConfig.prey || !samplesConfig.predator) {
        console.error("critical config structure incomplete", samplesConfig);
        return;
    }

    const pMin = samplesConfig.prey.min;
    const pMax = samplesConfig.prey.max;
    const predMin = samplesConfig.predator.min;
    const predMax = samplesConfig.predator.max;

    this.userSamples.prey = floor(random(pMin, pMax));
    this.userSamples.predator = floor(random(predMin, predMax));
    
    // safety check
    this.userSamples.prey = Math.max(0, this.userSamples.prey);
    this.userSamples.predator = Math.max(0, this.userSamples.predator);
    
    console.log("samples init", this.userSamples, "source config", samplesConfig);
  }

  reset() {
    this.prey = [];
    this.predators = [];
    this.timer = 0;
    this.isPaused = false;
    this.resetStats();
    
    this.preyReproductionLocked = false;
    this.predatorReproductionLocked = false;

    this.obstacles = [];
    this.nextObstacleSpawn = -1;
    this.obstaclePeriodEnd = -1;
    this.nextIndividualSpawn = -1;
    
    // re-roll samples on reset
    this.initializeSamples();

    // based on config
    
    if (typeof Config === 'undefined' || !Config.sim) {
        console.error("critical config.sim undefined in reset");
        return;
    }

    // prey start count
    let preyStartConfig = Config.sim.prey.startCount;
    let preyCount = 0;
    
    if (typeof preyStartConfig === 'object') {
        preyCount = floor(random(preyStartConfig.min, preyStartConfig.max));
    } else {
        preyCount = parseInt(preyStartConfig);
    }
    
    // predator start count
    let predStartConfig = Config.sim.predator.startCount;
    let predCount = 0;
    
    if (typeof predStartConfig === 'object') {
        predCount = floor(random(predStartConfig.min, predStartConfig.max));
    } else {
        predCount = parseInt(predStartConfig);
    }

    for (let i = 0; i < preyCount; i++) {
      this.addPrey(random(width), random(height), null, true);
    }
    for (let i = 0; i < predCount; i++) {
      this.addPredator(random(width), random(height), null, true);
    }
    
    // music playing
    if (typeof soundManager !== 'undefined') {
        soundManager.playTrack('soundtrack', true);
    }
    
    loop();
  }
  
  resetStats() {
      this.peakPrey = 0;
      this.peakPredator = 0;
      this.maxGenerations = 1;
  }

  update() {
    if (this.state !== 2 || this.isPaused) return;

    this.timer += deltaTime / 1000;

    // update stats
    if (this.prey.length > this.peakPrey) this.peakPrey = this.prey.length;
    if (this.predators.length > this.peakPredator) this.peakPredator = this.predators.length;

    // manage obstacles
    if (Config.sim.obstacles) {
        const obsCfg = Config.sim.obstacles;
        
        // Automatic Spawning Logic (Controlled by enabled flag)
        if (obsCfg.enabled) {
            // init start time if not set
            if (this.nextObstacleSpawn === -1 && this.obstaclePeriodEnd === -1) {
                 this.nextObstacleSpawn = obsCfg.startTime; 
            }

            // check start period (season)
            if (this.nextObstacleSpawn !== -1 && this.timer >= this.nextObstacleSpawn && this.obstaclePeriodEnd === -1) {
                 let duration = random(obsCfg.periodDuration.min, obsCfg.periodDuration.max);
                 this.obstaclePeriodEnd = this.timer + duration;
                 this.nextObstacleSpawn = -1; 
                 this.nextIndividualSpawn = this.timer; 
            }

            // inside active period
            if (this.obstaclePeriodEnd !== -1) {
                 if (this.timer >= this.nextIndividualSpawn && this.obstacles.length < obsCfg.maxCount) {
                     let padding = 100;
                     let lifespan = random(obsCfg.individualLifespan.min, obsCfg.individualLifespan.max);
                     
                     this.obstacles.push(new Obstacle(
                         random(padding, width - padding), 
                         random(padding, height - padding),
                         lifespan
                     ));
                     
                     let rate = random(obsCfg.spawnRate.min, obsCfg.spawnRate.max);
                     this.nextIndividualSpawn = this.timer + rate;
                 }
                 
                 if (this.timer >= this.obstaclePeriodEnd) {
                     this.obstaclePeriodEnd = -1;
                     this.nextIndividualSpawn = -1;
                     let interval = random(obsCfg.spawnInterval.min, obsCfg.spawnInterval.max);
                     this.nextObstacleSpawn = this.timer + interval;
                 }
            }
        }
        
        // Lifecycle Management (Runs ALWAYS regardless of enabled flag)
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (this.obstacles[i].lifespan && this.obstacles[i].lifespan !== Infinity) {
                if (this.timer - this.obstacles[i].birthTime > this.obstacles[i].lifespan) {
                    this.obstacles.splice(i, 1);
                }
            }
        }
    }

    // update prey
    for (let i = this.prey.length - 1; i >= 0; i--) {
      this.prey[i].update(this.prey, this.predators, this.obstacles);
    }

    // update predators
    for (let i = this.predators.length - 1; i >= 0; i--) {
      this.predators[i].update(this.prey, this.predators, this.obstacles);
    }

    // check extinction
    if (this.timer > 5 && this.prey.length === 0 && this.predators.length === 0) {
        this.end();
    }
    
    // update generation
    this.checkGeneration();
  }

  checkGeneration() {
      // logic: if over 50% population is new generation, advance
      // global tracking simplified metric
      let totalPop = this.prey.length + this.predators.length;
      if (totalPop === 0) return;
      
      let nextGenCount = 0;
      for (let p of this.prey) {
          if (p.generation > this.maxGenerations) nextGenCount++;
      }
      for (let p of this.predators) {
          if (p.generation > this.maxGenerations) nextGenCount++;
      }
      
      if (nextGenCount > totalPop * 0.5) {
          this.maxGenerations++;
      }
  }

  end() {
      this.state = 3;
      
      if (typeof soundManager !== 'undefined') {
          soundManager.playTrack('outro');
      }

      const formatTime = (s) => {
          const m = Math.floor(s / 60);
          const sec = Math.floor(s % 60);
          return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      };

      if (typeof uiManager !== 'undefined') {
          uiManager.showCinematicEnd({
              time: formatTime(this.timer),
              peak: this.peakPrey + this.peakPredator,
              generations: this.maxGenerations
          });
      }
  }

  removeRandomAgent() {
      // 50/50 chance to remove prey or predator
      let targetList = null;
      if (this.prey.length > 0 && this.predators.length > 0) {
          targetList = random() < 0.5 ? this.prey : this.predators;
      } else if (this.prey.length > 0) {
          targetList = this.prey;
      } else if (this.predators.length > 0) {
          targetList = this.predators;
      }

      if (targetList && targetList.length > 0) {
          const index = floor(random(targetList.length));
          targetList.splice(index, 1);
          soundManager.playKill();
      }
  }

  display() {
    if (this.state === 1) return; // title handled in sketch.js
    
    // display agents
    for (let o of this.obstacles) o.display();
    for (let p of this.prey) p.display();
    for (let p of this.predators) p.display();
  }

  addObstacle(x, y) {
    this.obstacles.push(new Obstacle(x, y, Infinity));
  }

  removeObstacleGlobal() {
      if (this.obstacles.length > 0) {
          // remove random one
          const index = floor(random(this.obstacles.length));
          this.obstacles.splice(index, 1);
      }
  }

  removeObstacleAt(x, y) {
    const mousePos = createVector(x, y);
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        // radius is roughly size/2. add margin for easier clicking
        if (obs.position.dist(mousePos) < (obs.size / 2) + 20) {
            this.obstacles.splice(i, 1);
            return; // remove one at a time
        }
    }
  }

  removeLastObstacle() {
      if (this.obstacles.length > 0) {
          this.obstacles.pop();
      }
  }

  addPrey(x, y, dna = null, ignoreSamples = false) {
    // if user initiated check samples
    if (!dna && !ignoreSamples) {
        if (this.state === 2 && this.userSamples.prey <= 0) {
            uiManager.showWarning("OUT OF PREY SAMPLES");
            return;
        }
        if (this.state === 2) this.userSamples.prey--;
    }

    // pass null so agent constructor calls generatedna
    const p = new Prey(x, y, dna);
    
    // force generation sync if user spawned
    if (!dna) {
        p.generation = this.maxGenerations;
    }
    
    this.prey.push(p);
  }

  addPredator(x, y, dna = null, ignoreSamples = false) {
    // if user initiated check samples
    if (!dna && !ignoreSamples) {
        if (this.state === 2 && this.userSamples.predator <= 0) {
            uiManager.showWarning("OUT OF PREDATOR SAMPLES");
            return;
        }
        if (this.state === 2) this.userSamples.predator--;
    }

    // do not create partial dna object here
    const p = new Predator(x, y, dna);
    
    if (!dna) {
        p.generation = this.maxGenerations;
    }
    
    this.predators.push(p);
  }

  togglePause() {
    if (this.state !== 2) return;

    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
        noLoop();
        soundManager.pause(); // stop with fade
    } else {
        loop();
        soundManager.resume();
    }
  }
  
  updateConfig(key, value) {
      value = parseFloat(value);
      switch(key) {
          case 'preyRate':
              // scale 0-100 to 0.0001 - 0.01
              Config.sim.prey.reproduction.chance = map(value, 0, 100, 0.0001, 0.01);
              break;
          case 'predHunt':
              // scale 1-10 to 1-10
              Config.sim.predator.reproduceThreshold = Math.floor(value);
              break;
          case 'mutation':
              // scale 0-100 to 0.0 - 1.0
              Config.sim.mutationRate = map(value, 0, 100, 0.0, 1.0);
              break;
          case 'musicVol':
              Config.audio.musicVolume = value / 100;
              if (soundManager) soundManager.setMusicVolume(Config.audio.musicVolume);
              break;
          case 'sfxVol':
              Config.audio.sfxVolume = value / 100;
              // update sfx volumes immediately
              if (soundManager) {
                  const sfxVol = Config.audio.sfxVolume;
                  if (soundManager.spawnSounds) {
                      soundManager.spawnSounds.forEach(s => soundManager.setGain(s, sfxVol * (Config.audio.spawnVolumeBoost || 1.0)));
                  }
                  soundManager.setGain(soundManager.tapSound, sfxVol * (Config.audio.tapVolumeBoost || 1.0));
                  soundManager.setGain(soundManager.clickSound, sfxVol * (Config.audio.clickVolumeBoost || 1.0));
                  soundManager.setGain(soundManager.killSound, sfxVol * (Config.audio.killVolumeBoost || 1.0));
                  soundManager.setGain(soundManager.despawnSound, sfxVol * (Config.audio.despawnVolumeBoost || 1.0));
                  soundManager.setGain(soundManager.glitchSound, sfxVol * (Config.audio.glitchVolumeBoost || 1.0));
                  
                  if (soundManager.nomnomSounds) {
                      soundManager.nomnomSounds.forEach(s => soundManager.setGain(s, sfxVol * (Config.audio.nomnomVolumeBoost || 1.0)));
                  }
              }
              break;
      }
  }
}
