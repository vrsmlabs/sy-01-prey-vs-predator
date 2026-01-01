class UIManager {
  constructor() {
    this.controls = {};
    this.theme = Config.theme.current;
  }

  setup() {
    // create ui container
    this.uiContainer = createDiv('');
    this.uiContainer.id('ui-layer');
    this.uiContainer.style('position', 'absolute');
    this.uiContainer.style('top', '0');
    this.uiContainer.style('left', '0');
    this.uiContainer.style('width', '100%');
    this.uiContainer.style('height', '100%');
    this.uiContainer.style('pointer-events', 'none');

    // cinematic overlay
    this.createCinematicOverlay();

    // stats card top left
    this.createStatsCard();

    // settings panel top right
    this.createSettingsPanel();

    // controls bottom center
    this.createControls();

    // footer credits bottom right
    this.createFooter();

    // user guidance bottom left
    this.createGuidance();

    // mobile action bar
    this.createMobileActionBar();

    // initial theme apply
    this.applyTheme();
    this.updateThemeColors(); // ensure colors are populated on start
    this.updateVisibility(simulation.state);
  }

  createCinematicOverlay() {
    this.overlay = createDiv(`
      <div class="academy-title">SIMULATION REPORT</div>
      <div class="academy-stat-label">ALL AGENTS HAVE DIED</div>
      <div class="academy-stats">
        <div class="academy-stat-item">
          <div class="academy-stat-value" id="final-time">00:00</div>
          <div class="academy-stat-label">DURATION</div>
        </div>
        <div class="academy-stat-item">
          <div class="academy-stat-value" id="peak-pop">0</div>
          <div class="academy-stat-label">PEAK POPULATION</div>
        </div>
        <div class="academy-stat-item">
          <div class="academy-stat-value" id="generation-count">0</div>
          <div class="academy-stat-label">MAX GENERATION</div>
        </div>
      </div>
      
      <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
         <a href="https://pax.red" target="_blank" class="footer-link pointer-events-auto" style="font-size: 14px; letter-spacing: 2px;">
            PAX RED <i class="ph ph-arrow-up-right footer-arrow"></i>
         </a>
         <div style="display: flex; gap: 16px;">
            <a href="https://github.com/pax-red/prey-predator-simulation" target="_blank" class="footer-link pointer-events-auto" style="font-size: 10px; opacity: 0.6;">
                GITHUB
            </a>
         </div>
      </div>

      <div style="margin-top: 60px;">
        <div class="blink-text" style="font-size: 12px; letter-spacing: 2px; opacity: 0.7;">
          CLICK ANYWHERE TO RESTART SIMULATION
        </div>
      </div>
    `);
    this.overlay.id('cinematic-overlay');
    this.overlay.class('cinematic-overlay');
    this.overlay.parent(this.uiContainer);
    
    // bind click anywhere logic
    this.overlay.mouseClicked(() => {
        if (simulation.state === 3) { // only if in end state
            simulation.start(); // restart fresh state 2
            document.getElementById('cinematic-overlay').classList.remove('visible');
        }
    });
  }

  createGuidance() {
    this.guidanceDiv = createDiv(`
      <div style="font-size: 10px; font-weight: bold; letter-spacing: 1px; color: #666; display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
        <span><i class="ph-bold ph-mouse-left-click" style="vertical-align: middle;"></i> SPAWN PREY</span>
        <span><span style="border: 1px solid #666; padding: 0 4px; border-radius: 2px;">A</span> + <i class="ph-bold ph-mouse-left-click" style="vertical-align: middle;"></i> OR HOLD TO SPAWN PREDATOR</span>
        <span><span style="border: 1px solid #666; padding: 0 4px; border-radius: 2px;">SPACE</span> REMOVE RANDOM AGENT</span>
      </div>
    `);
    this.guidanceDiv.class('guidance-container pointer-events-auto');
    this.guidanceDiv.parent(this.uiContainer);
    this.guidanceDiv.style('position', 'absolute');
    this.guidanceDiv.style('bottom', '40px');
    this.guidanceDiv.style('left', '40px');
    // this.guidanceDiv.class('pointer-events-auto'); // redundant and overwrites guidance-container
  }

  createStatsCard() {
    this.statsCard = createDiv(`
      <div class="stat-row">
        <span class="stat-label">
            <div id="prey-colors" style="display: flex; gap: 2px;"></div>
            PREY
        </span>
        <span class="font-bold" id="stat-prey-count">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">
            <div id="predator-colors" style="display: flex; gap: 2px;"></div>
            PREDATOR
        </span>
        <span class="font-bold" id="stat-predator-count">0</span>
      </div>
      
      <div class="stat-row" style="margin-top: 8px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 8px;">
        <span class="stat-label" style="font-size: 10px; opacity: 0.7; letter-spacing: 1px;">AVAILABLE SAMPLES</span>
      </div>
      <div class="stat-row" style="justify-content: flex-start; gap: 16px;">
        <span style="font-size: 11px; font-family: monospace; color: inherit; opacity: 0.8;">
            PREY: <span id="stat-prey-samples" style="font-weight: bold;">0</span>
        </span>
        <span style="font-size: 11px; font-family: monospace; color: inherit; opacity: 0.8;">
            PRED: <span id="stat-predator-samples" style="font-weight: bold;">0</span>
        </span>
      </div>

      <div class="stat-row" style="margin-top: 8px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 8px;">
        <span class="stat-label">GENERATION</span>
        <span class="font-bold" id="stat-generation">1</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">MUTATION IDX</span>
        <span class="font-bold" id="stat-mutation">0.2</span>
      </div>
      <div class="stat-row" style="margin-top: 8px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 8px;">
        <span class="stat-label">RUNTIME</span>
        <span class="font-bold" id="stat-timer">00:00</span>
      </div>
    `);
    this.statsCard.class('stats-card pointer-events-auto');
    this.statsCard.parent(this.uiContainer);
    this.statsCard.style('position', 'absolute');
    this.statsCard.style('top', '24px');
    this.statsCard.style('left', '24px');
    
    // create warning banner hidden by default
    this.warningBanner = createDiv('');
    this.warningBanner.class('warning-banner pointer-events-none');
    this.warningBanner.parent(this.uiContainer);
    this.warningBanner.style('position', 'absolute');
    this.warningBanner.style('top', '100px');
    this.warningBanner.style('left', '50%');
    this.warningBanner.style('transform', 'translateX(-50%)');
    this.warningBanner.style('background', 'transparent'); 
    this.warningBanner.style('color', '#666');
    this.warningBanner.style('padding', '8px 16px');
    this.warningBanner.style('font-size', '14px');
    this.warningBanner.style('font-weight', 'bold');
    this.warningBanner.style('letter-spacing', '1px');
    this.warningBanner.style('text-align', 'center');
    this.warningBanner.style('width', '100%');
    this.warningBanner.style('pointer-events', 'none');
    this.warningBanner.style('opacity', '0');
    this.warningBanner.style('transition', 'opacity 0.1s ease-in-out');
  }

  showWarning(text) {
      if (this.warningTimeout) clearTimeout(this.warningTimeout);
      this.warningBanner.html("OUT OF AGENT SAMPLES");
      this.warningBanner.style('opacity', '1');
      this.warningTimeout = setTimeout(() => {
          this.warningBanner.style('opacity', '0');
      }, 500); // 0.5s
  }

  createSettingsPanel() {
    // music toggle button
    this.musicToggleBtn = createDiv('<i class="ph-bold ph-music-note"></i>');
    this.musicToggleBtn.class('settings-trigger pointer-events-auto');
    this.musicToggleBtn.parent(this.uiContainer);
    this.musicToggleBtn.style('position', 'absolute');
    this.musicToggleBtn.style('top', '24px');
    this.musicToggleBtn.style('right', '70px');
    this.musicToggleBtn.style('display', 'flex');
    this.musicToggleBtn.style('align-items', 'center');
    this.musicToggleBtn.style('justify-content', 'center');
    
    this.musicToggleBtn.mouseClicked(() => {
        soundManager.playClick();
        
        // safety check for soundmanager
        if (typeof soundManager === 'undefined' || !soundManager) {
            console.error("SoundManager not initialized");
            return;
        }

        // use new togglemusic method
        if (typeof soundManager.toggleMusic === 'function') {
            const isPaused = soundManager.toggleMusic();
            
            // update icon
            const icon = this.musicToggleBtn.elt.querySelector('i');
            if (icon) {
                // clean up all potential classes
                icon.classList.remove('ph-music-note', 'ph-x');
                // show music note when playing x when paused
                icon.classList.add(isPaused ? 'ph-x' : 'ph-music-note');
            }
            
            // update slider state
            const slider = document.getElementById('music-slider');
            if (slider) {
                slider.disabled = isPaused;
                slider.style.opacity = isPaused ? '0.5' : '1';
                slider.style.pointerEvents = isPaused ? 'none' : 'auto';
            }
        } else {
            console.error("soundManager.toggleMusic is not a function. Check SoundManager.js version.");
        }
    });

    // settings trigger
    this.settingsBtn = createDiv('<i class="ph ph-gear"></i>');
    this.settingsBtn.class('settings-trigger pointer-events-auto');
    this.settingsBtn.parent(this.uiContainer);
    this.settingsBtn.style('position', 'absolute');
    this.settingsBtn.style('top', '24px');
    this.settingsBtn.style('right', '24px');
    this.settingsBtn.style('display', 'flex');
    this.settingsBtn.style('align-items', 'center');
    this.settingsBtn.style('justify-content', 'center');
    
    this.settingsBtn.mouseClicked(() => {
      soundManager.playClick();
      const panel = document.querySelector('.settings-panel');
      panel.classList.toggle('active');
    });

    // panel content
    this.settingsPanel = createDiv(`
      <div class="setting-header">SIMULATION PARAMETERS</div>
      
      <!-- Mobile Controls (Pause/Reset/Theme) -->
      <div class="mobile-settings-controls" style="margin-bottom: 24px; justify-content: space-between; gap: 8px;">
        <button class="mobile-settings-btn" id="btn-pause-mobile" title="Pause"><i class="ph-bold ph-pause"></i></button>
        <button class="mobile-settings-btn" id="btn-reset-mobile" title="Reset"><i class="ph-bold ph-arrow-counter-clockwise"></i></button>
        <button class="mobile-settings-btn" id="btn-theme-mobile" title="Theme"><i class="ph-bold ph-sun"></i></button>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">Prey Reproduction Rate</label>
        <input type="range" class="setting-slider pointer-events-auto" min="0" max="100" value="15" onchange="simulation.updateConfig('preyRate', this.value)">
      </div>
      
      <div class="setting-group">
        <label class="setting-label">Predator Hunt Need</label>
        <input type="range" class="setting-slider pointer-events-auto" min="1" max="10" value="2" onchange="simulation.updateConfig('predHunt', this.value)">
      </div>
      
      <div class="setting-group">
        <label class="setting-label">Mutation Rate</label>
        <input type="range" class="setting-slider pointer-events-auto" min="0" max="100" value="20" onchange="simulation.updateConfig('mutation', this.value)">
      </div>

      <div class="setting-header" style="margin-top: 24px;">AUDIO LEVELS</div>

      <div class="setting-group">
        <label class="setting-label">Music Volume</label>
        <input type="range" id="music-slider" class="setting-slider pointer-events-auto" min="0" max="100" value="30" onchange="simulation.updateConfig('musicVol', this.value)">
      </div>

      <div class="setting-group">
        <label class="setting-label">SFX Volume</label>
        <input type="range" class="setting-slider pointer-events-auto" min="0" max="100" value="60" onchange="simulation.updateConfig('sfxVol', this.value)">
      </div>
    `);
    this.settingsPanel.class('settings-panel pointer-events-auto');
    this.settingsPanel.parent(this.uiContainer);
    
    // initialize slider state if already muted
    setTimeout(() => {
        if (soundManager && soundManager.isMusicMuted) {
             const slider = document.getElementById('music-slider');
             if (slider) slider.disabled = true;
             
             const icon = this.musicToggleBtn.elt.querySelector('i');
             if (icon) icon.classList.replace('ph-speaker-high', 'ph-speaker-slash');
        }
        
        // Mobile controls listeners
        const btnPauseM = document.getElementById('btn-pause-mobile');
        const btnResetM = document.getElementById('btn-reset-mobile');
        const btnThemeM = document.getElementById('btn-theme-mobile');
        
        if (btnPauseM) {
            btnPauseM.onclick = () => {
                soundManager.playClick();
                simulation.togglePause();
                this.updatePauseIcons();
            };
        }
        if (btnResetM) {
            btnResetM.onclick = () => {
                soundManager.playClick();
                simulation.reset();
                this.updatePauseIcons();
            };
        }
        if (btnThemeM) {
            btnThemeM.onclick = () => {
                soundManager.playClick();
                this.toggleTheme();
            };
        }
    }, 100);
  }

  updatePauseIcons() {
      // update both desktop and mobile icons
      const icons = [
          document.querySelector('#btn-pause i'),
          document.querySelector('#btn-pause-mobile i')
      ];
      
      icons.forEach(icon => {
          if (!icon) return;
          if (simulation.isPaused) {
              icon.classList.remove('ph-pause');
              icon.classList.add('ph-play');
          } else {
              icon.classList.remove('ph-play');
              icon.classList.add('ph-pause');
          }
      });
  }

  createControls() {
    this.controlsDiv = createDiv(`
      <button class="control-btn" id="btn-pause" title="Pause"><i class="ph ph-pause"></i></button>
      <button class="control-btn" id="btn-reset" title="Reset"><i class="ph ph-arrow-counter-clockwise"></i></button>
      <button class="control-btn" id="btn-theme" title="Theme"><i class="ph ph-sun"></i></button>
    `);
    this.controlsDiv.class('controls-container desktop-controls pointer-events-auto');
    this.controlsDiv.parent(this.uiContainer);
    this.controlsDiv.style('position', 'absolute');
    this.controlsDiv.style('bottom', '40px');
    this.controlsDiv.style('left', '50%');
    this.controlsDiv.style('transform', 'translateX(-50%)');

    // event listeners
    setTimeout(() => {
        document.getElementById('btn-pause').onclick = () => {
            soundManager.playClick();
            simulation.togglePause();
            this.updatePauseIcons();
        };
        document.getElementById('btn-reset').onclick = () => {
            soundManager.playClick();
            simulation.reset();
            this.updatePauseIcons();
        };
        document.getElementById('btn-theme').onclick = () => {
            soundManager.playClick();
            this.toggleTheme();
        };
    }, 100);
  }

  createMobileActionBar() {
      this.mobileActionBar = createDiv(`
        <button class="mobile-action-btn" id="btn-spawn-prey" title="Spawn Prey"><i class="ph-bold ph-bug"></i></button>
        <button class="mobile-action-btn" id="btn-spawn-predator" title="Spawn Predator"><i class="ph-bold ph-skull"></i></button>
        <button class="mobile-action-btn" id="btn-remove-agent" title="Remove Agent"><i class="ph-bold ph-trash"></i></button>
        <div style="width: 1px; height: 24px; background: currentColor; opacity: 0.3;"></div>
        <button class="mobile-action-btn" id="btn-spawn-obstacle" title="Spawn Obstacle"><i class="ph-bold ph-square"></i></button>
        <button class="mobile-action-btn" id="btn-remove-obstacle" title="Remove Obstacle"><i class="ph-bold ph-eraser"></i></button>
      `);
      this.mobileActionBar.class('mobile-action-bar pointer-events-auto');
      this.mobileActionBar.parent(this.uiContainer);
      
      // event listeners
      setTimeout(() => {
          const bindClick = (id, fn) => {
              const btn = document.getElementById(id);
              if (btn) {
                  btn.onclick = () => {
                      if (window.soundManager) window.soundManager.playClick();
                      fn();
                  };
              }
          };
          
          bindClick('btn-spawn-prey', () => simulation.addPrey(random(width), random(height)));
          bindClick('btn-spawn-predator', () => simulation.addPredator(random(width), random(height)));
          bindClick('btn-remove-agent', () => simulation.removeRandomAgent());
          bindClick('btn-spawn-obstacle', () => simulation.addObstacle(random(width), random(height)));
          bindClick('btn-remove-obstacle', () => simulation.removeObstacleGlobal());
      }, 100);
  }

  createFooter() {
    this.footerDiv = createDiv(`
      <a href="https://pax.red" target="_blank" class="footer-link pointer-events-auto">PAX RED <i class="ph-bold ph-arrow-up-right footer-arrow"></i></a>
      <a href="https://github.com/vrsmlabs/sy-01-prey-vs-predator" target="_blank" class="footer-link pointer-events-auto">GITHUB <i class="ph-bold ph-arrow-up-right footer-arrow"></i></a>
      <a href="#" id="about-link" class="footer-link pointer-events-auto">ABOUT <i class="ph-bold ph-info footer-arrow"></i></a>
    `);
    this.footerDiv.class('footer pointer-events-auto');
    this.footerDiv.parent(this.uiContainer);
    this.footerDiv.style('position', 'absolute');
    this.footerDiv.style('bottom', '24px');
    this.footerDiv.style('right', '24px');
    this.footerDiv.style('display', 'flex');
    this.footerDiv.style('gap', '8px');
    this.footerDiv.style('flex-direction', 'column');
    this.footerDiv.style('align-items', 'flex-end');

    // binding about click
    setTimeout(() => {
        const aboutLink = document.getElementById('about-link');
        if (aboutLink) {
            aboutLink.onclick = (e) => {
                e.preventDefault();
                this.showAbout();
            };
        }
    }, 100);
  }

  showAbout() {
      // create about modal if not exists
      if (!document.getElementById('about-overlay')) {
          this.createAboutOverlay();
      }
      
      const overlay = document.getElementById('about-overlay');
      overlay.classList.add('visible');
      
      // pause game
      if (window.simulation && !window.simulation.isPaused) {
          document.getElementById('btn-pause').click(); // trigger pause click to update ui
      }
  }

  createAboutOverlay() {
      const overlay = createDiv(`
        <div class="about-content">
            <div class="about-header">
                <h2>ABOUT SY-01</h2>
                <button id="close-about" class="icon-btn"><i class="ph-bold ph-x"></i></button>
            </div>
            <p>SY-01 is a minimal simulation exploring emergent behavior in complex ecological systems.</p>
            <p>Observe how deterministic rules governing movement, hunger, and reproduction create dynamic population cycles and evolutionary pressure.</p>
            <p style="margin-top: 16px;">This project illustrates how simple agent-based interactions can lead collective patterns and system-level balance.</p>
            <p style="margin-top: 24px; font-size: 12px; opacity: 0.7;">DESIGNED BY PAX RED</p>
        </div>
      `);
      overlay.id('about-overlay');
      overlay.class('cinematic-overlay');
      overlay.parent(document.body);
      
      // close logic
      const close = () => {
          document.getElementById('about-overlay').classList.remove('visible');
          if (window.simulation && window.simulation.isPaused) {
              document.getElementById('btn-pause').click(); // pause click to resume and update ui
          }
      };
      
      // close on background click
      overlay.mouseClicked((e) => {
          if (e.target.id === 'about-overlay') close();
      });
      
      setTimeout(() => {
          const closeBtn = document.getElementById('close-about');
          if (closeBtn) closeBtn.onclick = close;
      }, 100);
      
      // ensure theme is applied immediately
      this.applyTheme();
  }

  updateThemeColors() {
      // helper to populate color boxes
      const populateColors = (containerId, colors) => {
          const container = document.getElementById(containerId);
          if (!container) return;
          
          container.innerHTML = ''; // clear existing
          
          // ensure colors is an array
          const colorList = Array.isArray(colors) ? colors : [colors];
          
          colorList.forEach(color => {
              const box = document.createElement('div');
              box.className = 'status-dot';
              box.style.backgroundColor = color;
              box.style.width = '12px';
              box.style.height = '12px';
              box.style.border = 'none';
              container.appendChild(box);
          });
      };

      try {
          const theme = Config.theme[this.theme].agents;
          populateColors('prey-colors', theme.prey);
          populateColors('predator-colors', theme.predator);
      } catch (e) {
          console.error("error updating theme colors", e);
      }
  }

  update(preyCount, predatorCount, timerValue) {
    this.updateVisibility(simulation.state);
    
    // only update contents if in sim or end state
    if (simulation.state === 1) return;

    // format timer
    const m = Math.floor(timerValue / 60);
    const s = Math.floor(timerValue % 60);
    const timerStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // direct dom update for performance
    const pPrey = document.getElementById('stat-prey-count');
    const pPred = document.getElementById('stat-predator-count');
    const pTime = document.getElementById('stat-timer');
    const pGen = document.getElementById('stat-generation');
    const pMutation = document.getElementById('stat-mutation');
    const pPreySamples = document.getElementById('stat-prey-samples');
    const pPredSamples = document.getElementById('stat-predator-samples');

    if (pPrey) pPrey.innerText = preyCount;
    if (pPred) pPred.innerText = predatorCount;
    if (pTime) pTime.innerText = timerStr;
    if (pGen) pGen.innerText = (window.simulation && window.simulation.maxGenerations) || 1;
    if (pMutation) pMutation.innerText = (Config.sim.mutationRate || 0.2).toFixed(2);
    
    // update samples display
    if (window.simulation && window.simulation.userSamples) {
        if (pPreySamples) pPreySamples.innerText = window.simulation.userSamples.prey;
        if (pPredSamples) pPredSamples.innerText = window.simulation.userSamples.predator;
    }
  }

  showCinematicEnd(data) {
    const overlay = document.getElementById('cinematic-overlay');
    if (overlay) {
        document.getElementById('final-time').innerText = data.time || "00:00";
        document.getElementById('peak-pop').innerText = data.peak || "0";
        document.getElementById('generation-count').innerText = data.generations || "0";
        overlay.classList.add('visible');
    }
  }

  updateVisibility(state) {
    // 1 title 2 sim 3 end
    const isSimOrEnd = state === 2 || state === 3;
    
    if (this.statsCard) this.statsCard.style('display', isSimOrEnd ? 'flex' : 'none');
    if (this.controlsDiv) this.controlsDiv.style('display', isSimOrEnd ? 'flex' : 'none');
    if (this.settingsBtn) this.settingsBtn.style('display', isSimOrEnd ? 'flex' : 'none');
    if (this.musicToggleBtn) this.musicToggleBtn.style('display', isSimOrEnd ? 'flex' : 'none');
    if (this.footerDiv) this.footerDiv.style('display', isSimOrEnd ? 'flex' : 'none');
    if (this.guidanceDiv) this.guidanceDiv.style('display', isSimOrEnd ? 'block' : 'none');
    
    // hide overlay if state is sim
    if (state === 2) {
        const overlay = document.getElementById('cinematic-overlay');
        if (overlay) overlay.classList.remove('visible');
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    Config.theme.current = this.theme;
    
    // update icon
    const icon = document.querySelector('#btn-theme i');
    if (icon) {
        if (this.theme === 'dark') {
            icon.classList.replace('ph-sun', 'ph-moon');
        } else {
            icon.classList.replace('ph-moon', 'ph-sun');
        }
    }

    this.applyTheme();
    this.updateThemeColors();
  }

  applyTheme() {
    const colors = Config.theme[this.theme];
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
    
    // update overlays cinematic and about
    const overlays = ['cinematic-overlay', 'about-overlay'];
    
    overlays.forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.style.background = colors.background;
            
            // text color update
            const texts = overlay.querySelectorAll('h2, p, .academy-title, .academy-stat-value, button');
            texts.forEach(el => el.style.color = colors.text);
            
            const labels = overlay.querySelectorAll('.academy-stat-label');
            labels.forEach(el => el.style.color = colors.ui);
            
            // icon buttons
            const btns = overlay.querySelectorAll('.icon-btn');
            btns.forEach(btn => {
                btn.style.color = colors.text;
                btn.style.borderColor = colors.text;
            });
        }
    });

    // update warning banner
    if (this.warningBanner) {
        this.warningBanner.style('color', colors.text);
    }

    // update mobile action bar
    if (this.mobileActionBar) {
        const bg = this.theme === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(240, 240, 240, 0.9)';
        this.mobileActionBar.style('background', bg);
        this.mobileActionBar.style('color', colors.text);
        this.mobileActionBar.style('border-top', `1px solid ${colors.ui}33`);
    }
  }
  
  getThemeColor(key) {
      return Config.theme[this.theme][key];
  }
}
