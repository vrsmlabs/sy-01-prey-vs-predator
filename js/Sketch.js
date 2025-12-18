let uiManager;
let soundManager;
let simulation;
let configData;

let touchStartTime = 0;
let longPressTriggered = false;

// global error handler for debugging on screen
window.onerror = function(msg, url, line, col, error) {
   const errorDiv = document.createElement('div');
   errorDiv.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:rgba(0,0,0,0.8); color:#ff5555; padding:20px; z-index:10000; font-family:monospace; white-space:pre-wrap;';
   errorDiv.innerHTML = `RUNTIME ERROR:\n${msg}\n\nLocation: ${url}:${line}:${col}\n\nStack:\n${error ? error.stack : 'N/A'}`;
   document.body.appendChild(errorDiv);
   console.error('global error', msg, error);
   return false;
};

function setup() {
  console.log('setup started');
  
  // create canvas first
  createCanvas(windowWidth, windowHeight);

  // initialize managers
  uiManager = new UIManager();
  // soundmanager is initialized in preload
  simulation = new Simulation();
  
  // expose for debugging
  window.simulation = simulation; 
  window.soundManager = soundManager;
  
  // config loaded via config.js
  console.log('config loaded');

  // load sounds with error handling
  try {
      // soundmanager.preload() called in preload()
      soundManager.setup();
  } catch (e) {
      console.error('soundmanager init failed', e);
  }

  // initialize simulation
  simulation.init();
  uiManager.setup();
  
  // disable context menu
  document.oncontextmenu = () => false;
  
  console.log('setup complete');
}

function preload() {
    // config is js file no need to loadjson
    
    // initialize and preload sounds
    soundManager = new SoundManager();
    soundManager.preload();
}

function draw() {
  // apply theme background
  let theme = Config.theme[Config.theme.current];
  background(theme.background);

  if (simulation.state === 1) {
    // title screen
    fill(theme.text);
    textAlign(CENTER, CENTER);
    
    // main title
    textSize(32);
    textStyle(BOLD);
    text("SY-01", width / 2, height / 2 - 40);
    
    // subtitle
    textSize(16);
    textStyle(NORMAL);
    text("PREDATOR VS PREY SIMULATION", width / 2, height / 2);
    
    // instruction
    textSize(12);
    textStyle(NORMAL);
    
    // pulse effect (matches css blinker: 2s cycle)
    let t = (millis() % 2000) / 2000;
    let blinkAlpha = t < 0.5 ? lerp(255, 0, t * 2) : lerp(0, 255, (t - 0.5) * 2);
    let instrColor = color(theme.ui);
    instrColor.setAlpha(blinkAlpha);
    fill(instrColor);
    
    text("CLICK ANYWHERE TO START", width / 2, height / 2 + 60);
  } else {
      if (simulation) {
          // check for long press
          if (!simulation.isPaused && touchStartTime > 0 && mouseIsPressed) {
              const duration = millis() - touchStartTime;
              const threshold = (Config.interaction && Config.interaction.predatorSpawnDelay) || 2000;
              
              if (duration >= threshold && !longPressTriggered) {
                  simulation.addPredator(mouseX, mouseY);
                  soundManager.playSpawn();
                  longPressTriggered = true;
                  
                  // optional visual feedback
                  noFill();
                  let pColors = Config.theme[Config.theme.current].agents.predator;
                  stroke(Array.isArray(pColors) ? pColors[0] : pColors);
                  strokeWeight(2);
                  ellipse(mouseX, mouseY, 50, 50);
              }
          }

          simulation.update();
          simulation.display();
      }
      
      if (uiManager && simulation) {
          uiManager.update(simulation.prey.length, simulation.predators.length, simulation.timer);
      }
      
      if (soundManager) {
          soundManager.update();
      }
  }
}

function mousePressed() {
  if (event && event.target.tagName !== 'CANVAS') return;

  if (simulation.state === 1) {
    simulation.start();
    soundManager.playTap(); 
  } else if (simulation.state === 2 && !simulation.isPaused) {
    // check for a + click instant predator spawn
    if (keyIsDown(65)) { // 65 is 'a' key
        simulation.addPredator(mouseX, mouseY);
        soundManager.playSpawn();
        
        // prevent tap/long press logic. would be good for tablets or mobile devices
        touchStartTime = 0; 
        longPressTriggered = true; 
        
        // visual feedback
        noFill();
        let pColors = Config.theme[Config.theme.current].agents.predator;
        stroke(Array.isArray(pColors) ? pColors[0] : pColors);
        strokeWeight(2);
        ellipse(mouseX, mouseY, 50, 50);
    } else {
        touchStartTime = millis();
        longPressTriggered = false;
    }
  }
}

function mouseReleased() {
  if (event && event.target.tagName !== 'CANVAS') return;
  
  if (simulation.state === 2 && !simulation.isPaused && touchStartTime > 0) {
      // if not triggered long press it is a tap spawn prey
      if (!longPressTriggered) {
          simulation.addPrey(mouseX, mouseY);
          soundManager.playSpawn();
      }
      // if longpresstriggered we already spawned predator

      touchStartTime = 0;
      longPressTriggered = false;
  }
}

function keyPressed() {
  if (keyCode === 32) { // spacebar
    if (simulation && simulation.state === 2 && !simulation.isPaused) {
      simulation.removeRandomAgent();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key]) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
