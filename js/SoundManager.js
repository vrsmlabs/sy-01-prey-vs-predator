class SoundManager {
  constructor() {
    this.soundtrack = null;
    this.outro = null;
    this.spawnSounds = [];
    this.clickSound = null;
    this.killSound = null;
    this.tapSound = null;
    this.despawnSound = null;
    this.nomnomSounds = [];
    this.isMuted = false;
    this.isMusicPaused = false;
    this.fadeDuration = 2.0;
    this.currentTrack = null;
    this.fadeTimer = null;
    
    // audio optimization stack management
    this.activeStacks = {
        spawn: [],
        eat: [],
        kill: [],
        despawn: []
    };
    
    // global voice counter
    this.totalActiveVoices = 0;
    this.voiceResetTime = 0;
    
    // initial config from default
    this.MAX_STACKS = Config.audio.optimization.maxStacksNormal;
    this.STACK_WINDOW = Config.audio.optimization.stackWindowNormal;
    this.isThrottled = false;
    
    // warning debounce
    this.lastAudioWarningTime = 0;
  }

  preload() {
    // music
    this.soundtrack = loadSound("assets/sound/soundtrack.ogg");
    this.outro = loadSound("assets/sound/outro.ogg");

    // interactions
    this.killSound = loadSound("assets/sound/interactions/kill.mp3");
    this.clickSound = loadSound("assets/sound/interactions/click.mp3");
    this.tapSound = loadSound("assets/sound/interactions/tap.mp3");
    
    // randomized spawn sounds
    this.spawnSounds = [];
    for (let i = 1; i <= 8; i++) {
        this.spawnSounds.push(loadSound(`assets/sound/interactions/spawn/s${i}.mp3`));
    }

    // despawn sound
    this.despawnSound = loadSound("assets/sound/interactions/despawn.mp3");
    
    this.nomnomSounds = [
      loadSound("assets/sound/interactions/nomnom/nomnom1.mp3"),
      loadSound("assets/sound/interactions/nomnom/nomnom2.mp3"),
      loadSound("assets/sound/interactions/nomnom/nomnom3.mp3"),
      loadSound("assets/sound/interactions/nomnom/nomnom4.mp3"),
    ];
  }

  setup() {
    // set play modes
    if (this.soundtrack) this.soundtrack.playMode('restart');
    if (this.outro) this.outro.playMode('restart');

    // normalize levels
    if (this.soundtrack) this.soundtrack.setVolume(Config.audio.musicVolume);
    if (this.outro) this.outro.setVolume(0);
    
    const sfxVol = Config.audio.sfxVolume;
    
    // apply boosts
    const tapVol = sfxVol * (Config.audio.tapVolumeBoost || 1.0);
    const clickVol = sfxVol * (Config.audio.clickVolumeBoost || 1.0);
    const killVol = sfxVol * (Config.audio.killVolumeBoost || 1.0);
    const spawnVol = sfxVol * (Config.audio.spawnVolumeBoost || 1.0);
    const despawnVol = sfxVol * (Config.audio.despawnVolumeBoost || 1.0);
    const nomnomVol = sfxVol * (Config.audio.nomnomVolumeBoost || 1.0);

    if (this.tapSound) this.setGain(this.tapSound, tapVol);
    if (this.clickSound) this.setGain(this.clickSound, clickVol);
    if (this.killSound) this.setGain(this.killSound, killVol);
    
    // spawn sounds volume
    if (this.spawnSounds) {
        this.spawnSounds.forEach(s => this.setGain(s, spawnVol));
    }
    
    // despawn sound volume
    if (this.despawnSound) this.setGain(this.despawnSound, despawnVol);
    if (this.glitchSound) this.setGain(this.glitchSound, sfxVol * (Config.audio.glitchVolumeBoost || 1.0));

    if (this.nomnomSounds) {
        this.nomnomSounds.forEach(s => this.setGain(s, nomnomVol));
    }

    // start soundtrack loop
    this.playTrack('soundtrack');
  }

  playTrack(trackName, forceRestart = false) {
      if (this.isMuted) return;

      if (trackName === 'soundtrack') {
          if (this.outro && this.outro.isPlaying()) {
              this.outro.setVolume(0, this.fadeDuration);
              setTimeout(() => { if (this.outro) this.outro.stop(); }, this.fadeDuration * 1000);
          }
          
          if (forceRestart) {
              if (this.soundtrack) {
                  this.soundtrack.stop();
              }
          }

          if (this.soundtrack && (!this.soundtrack.isPlaying() || forceRestart)) {
              this.soundtrack.loop();
              this.soundtrack.setVolume(0);
              this.soundtrack.setVolume(Config.audio.musicVolume, this.fadeDuration);
          }
          this.currentTrack = 'soundtrack';
      } else if (trackName === 'outro') {
          if (this.soundtrack && this.soundtrack.isPlaying()) {
              this.soundtrack.setVolume(0, this.fadeDuration);
              setTimeout(() => { if (this.soundtrack) this.soundtrack.pause(); }, this.fadeDuration * 1000);
          }
          
          if (this.outro && !this.outro.isPlaying()) {
              this.outro.loop();
              this.outro.setVolume(0);
              this.outro.setVolume(Config.audio.musicVolume, this.fadeDuration);
          }
          this.currentTrack = 'outro';
      }
  }

  update() {
    if (!Config.audio.optimization.enabled) return;
    
    // reset voice counter every frame (approx)
    const now = millis();
    if (now - this.voiceResetTime > 100) {
        this.totalActiveVoices = 0;
        this.voiceResetTime = now;
    }
    
    const fps = frameRate();
    const totalPop = (window.simulation && window.simulation.agents) ? window.simulation.agents.length : 0;
    
    // check thresholds
    const isLowFps = fps < Config.audio.optimization.lowFpsThreshold;
    const isCriticalFps = fps < Config.audio.optimization.criticalFpsThreshold;
    const isHighPop = totalPop > Config.audio.optimization.highPopThreshold;
    
    if (isCriticalFps || isHighPop) {
        // heavy throttling
        this.MAX_STACKS = Config.audio.optimization.maxStacksThrottled;
        this.STACK_WINDOW = Config.audio.optimization.stackWindowThrottled;
        this.isThrottled = true;
    } else if (isLowFps) {
        // mild throttling
        this.MAX_STACKS = 2;
        this.STACK_WINDOW = 400;
        this.isThrottled = true;
    } else {
        // normal
        this.MAX_STACKS = Config.audio.optimization.maxStacksNormal;
        this.STACK_WINDOW = Config.audio.optimization.stackWindowNormal;
        this.isThrottled = false;
    }
  }

  checkStack(type) {
      // global hard limit check
      if (this.totalActiveVoices >= Config.audio.maxVoices) return false;
      
      const now = millis();
      // filter out old timestamps
      this.activeStacks[type] = this.activeStacks[type].filter(t => now - t < this.STACK_WINDOW);
      
      // check count
      if (this.activeStacks[type].length >= this.MAX_STACKS) {
          return false;
      }
      
      // add new timestamp
      this.activeStacks[type].push(now);
      this.totalActiveVoices++;
      return true;
  }

  playSpawn() {
    if (!this.isMuted && this.spawnSounds.length > 0) {
        if (!this.checkStack('spawn')) return;
        
        const sound = random(this.spawnSounds);
        sound.play();
    }
  }

  playDespawn(totalPop) {
    if (this.isMuted) return;

    // default to 15 if not set
    const threshold = (Config.audio.despawnThreshold !== undefined) ? Config.audio.despawnThreshold : 15;
    
    // play if pop below threshold
    if (totalPop < threshold) {
        if (!this.checkStack('despawn')) return;
        if (this.despawnSound) this.despawnSound.play();
    }
  }

  playKill() {
    if (!this.isMuted && this.killSound) {
        if (!this.checkStack('kill')) return;
        this.killSound.play();
    }
  }

  playClick() {
    if (!this.isMuted && this.clickSound) this.clickSound.play();
  }

  playTap() {
    if (!this.isMuted && this.tapSound) this.tapSound.play();
  }

  playEat() {
    if (this.isMuted) return;

    // strict population limit for feeding sounds
    // enable nomnom only if the total population is below threshold
    const limit = (Config.audio.optimization && Config.audio.optimization.nomnomThreshold) ? Config.audio.optimization.nomnomThreshold : 50;
    
    let totalPop = 0;
    if (window.simulation && window.simulation.agents) {
        totalPop = window.simulation.agents.length; // assuming agents array or similar
    } else if (window.simulation) {
        totalPop = window.simulation.prey.length + window.simulation.predators.length;
    }

    if (totalPop > limit) {
        // trigger warning if not shown recently (debounce 4s)
        const now = millis();
        if (now - this.lastAudioWarningTime > 4000) {
            if (window.uiManager && window.uiManager.showWarning) {
                window.uiManager.showWarning("AUDIO DENSITY: FEEDING MUTED");
            }
            this.lastAudioWarningTime = now;
        }
        return;
    }

    if (this.nomnomSounds.length > 0) {
      if (!this.checkStack('eat')) return;
      const sound = random(this.nomnomSounds);
      sound.play();
    }
  }

  setGain(sound, volume) {
      if (!sound || !sound.output || !sound.output.gain) return;
      
      try {
          sound.output.gain.value = volume;
      } catch (e) {
          console.warn('failed to set gain', e);
          if (typeof sound.setVolume === 'function') sound.setVolume(volume);
      }
  }

  setMusicVolume(volume) {
      Config.audio.musicVolume = volume;
      if (this.isMusicPaused) return; // respect pause
      
      if (this.soundtrack) this.soundtrack.setVolume(volume);
      if (this.outro) this.outro.setVolume(volume);
  }

  // toggle music pause state
  toggleMusic() {
      this.isMusicPaused = !this.isMusicPaused;
      
      if (this.isMusicPaused) {
          this.pauseMusicTrack();
      } else {
          this.resumeMusicTrack();
      }
      return this.isMusicPaused;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.soundtrack) this.soundtrack.setVolume(0);
      if (this.outro) this.outro.setVolume(0);
    } else {
      if (!this.isMusicPaused) {
          const vol = Config.audio.musicVolume;
          if (this.currentTrack === 'soundtrack' && this.soundtrack) {
              this.soundtrack.setVolume(vol);
          } else if (this.currentTrack === 'outro' && this.outro) {
              this.outro.setVolume(vol);
          }
      }
    }
  }

  pause() {
      this.pauseMusicTrack();
  }

  resume() {
    if (this.isMusicPaused) return; // respect manual pause
    this.resumeMusicTrack();
  }

  // --- helpers ---

  pauseMusicTrack() {
    if (this.fadeTimer) clearTimeout(this.fadeTimer);

    if (this.soundtrack && this.soundtrack.isPlaying()) {
        this.soundtrack.setVolume(0, 0.5);
        this.fadeTimer = setTimeout(() => {
            if (this.soundtrack) this.soundtrack.pause();
        }, 500);
    }
    if (this.outro && this.outro.isPlaying()) {
        this.outro.setVolume(0, 0.5);
        this.fadeTimer = setTimeout(() => {
            if (this.outro) this.outro.pause();
        }, 500);
    }
  }

  resumeMusicTrack() {
    if (this.isMuted) return;
    
    if (this.fadeTimer) clearTimeout(this.fadeTimer);

    const vol = Config.audio.musicVolume;
    
    if (this.currentTrack === 'soundtrack' && this.soundtrack) {
        if (!this.soundtrack.isPlaying()) this.soundtrack.loop();
        this.soundtrack.setVolume(0); // start silent
        this.soundtrack.setVolume(vol, 0.5); // fade in
    } else if (this.currentTrack === 'outro' && this.outro) {
        if (!this.outro.isPlaying()) this.outro.loop();
        this.outro.setVolume(0);
        this.outro.setVolume(vol, 0.5);
    }
  }
  
  setVolume(vol, fade = 0) {
      if (this.isMuted) return;
      if (this.currentTrack === 'soundtrack' && this.soundtrack) {
          this.soundtrack.setVolume(vol, fade);
      } else if (this.currentTrack === 'outro' && this.outro) {
          this.outro.setVolume(vol, fade);
      }
  }
}
