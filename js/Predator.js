class Predator extends Agent {
  constructor(x, y, dna) {
    super(x, y, dna);
    this.velocity = p5.Vector.random2D().mult(this.dna.speed);
    this.birthTime = simulation.timer; // birth time for lifespam
    this.lifespan = random(Config.sim.predator.lifespan.min, Config.sim.predator.lifespan.max);
    this.lastMealTime = simulation.timer; // use timer (secs)
    this.starvationTime = random(Config.sim.predator.starvationTime.min, Config.sim.predator.starvationTime.max);
    this.huntCount = 0;
    this.huntHistory = [];
    this.stamina = Config.sim.predator.stamina.max;
    this.color = Config.theme[Config.theme.current].agents.predator;
  }

  generateDNA() {
    return {
      speed: random(Config.sim.predator.speed.min, Config.sim.predator.speed.max),
      size: random(Config.sim.predator.size.min, Config.sim.predator.size.max),
      sense: Config.sim.predator.huntRadius
    };
  }

  update(preyArray, predators) {
    this.hunt(preyArray);
    super.update();

    // lifespan death
    if (simulation.timer - this.birthTime > this.lifespan) {
      this.die(predators);
      return; // stop update if ded
    }

    // starvation
    if (simulation.timer - this.lastMealTime > this.starvationTime) {
      this.die(predators);
    }
  }

  hunt(preyArray) {
    // scarcity logic. stop hunting if prey are scarce (conservation)
// prevents overhunting when prey pop is very low relative to preds
    if (Config.dynamic && Config.dynamic.enabled && Config.dynamic.predator.scarcity && Config.dynamic.predator.scarcity.enabled) {
        const minRatio = Config.dynamic.predator.scarcity.minPreyRatio || 0.6;
        // if prey count is less than (predators * 0.6), stop hunting to allow recovery
        if (preyArray.length > 0 && preyArray.length < window.simulation.predators.length * minRatio) {
            // recover stamina while waiting
            if (this.stamina < Config.sim.predator.stamina.max) {
                this.stamina += Config.sim.predator.stamina.recoveryRate * (deltaTime / 1000);
            }
            this.velocity.limit(this.dna.speed);
            return;
        }
    }

    let closestPrey = null;
    let closestDistSq = Infinity;
    const senseSq = this.dna.sense * this.dna.sense;
    const sizeSq = this.size * this.size; // approx for eating range

    // find closest prey
    for (let i = preyArray.length - 1; i >= 0; i--) {
      // ptimization manual squared distance calculation
      let dx = this.position.x - preyArray[i].position.x;
      let dy = this.position.y - preyArray[i].position.y;
      let dSq = dx * dx + dy * dy;
      
      // eat if close enough (using squared size as rough eat radius)
      if (dSq < sizeSq) { 
        this.eat(preyArray, i);
        continue;
      }

      // ccheck vision
      if (dSq < senseSq && dSq < closestDistSq) {
        closestDistSq = dSq;
        closestPrey = preyArray[i];
      }
    }

    // dont let them escape bro
    if (closestPrey) {
      let currentSpeed = this.dna.speed;
      
      // stamina Logic
      if (this.stamina > 0) {
          // burst
          currentSpeed *= Config.sim.predator.burstSpeedMultiplier;
          this.stamina -= Config.sim.predator.stamina.drainRate * (deltaTime / 1000);
      } else {
          // exhausted
          currentSpeed *= Config.sim.predator.exhaustedSpeedMultiplier;
      }

      let desired = p5.Vector.sub(closestPrey.position, this.position);
      desired.setMag(currentSpeed);
      let steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(0.2); // better agility
      this.applyForce(steer);
    } else {
        // stamina recovery
        if (this.stamina < Config.sim.predator.stamina.max) {
            this.stamina += Config.sim.predator.stamina.recoveryRate * (deltaTime / 1000);
        }
        // wander if not chasing (optional, but good for realism)
        // super.update() handles movement based on velocity, but we might want to slow down if not chasing?
        // current agent logic just adds velocity.
        // limit velocity to normal speed if not chasing
        this.velocity.limit(this.dna.speed);
    }
  }

  eat(preyArray, index) {
    preyArray.splice(index, 1);
    soundManager.playEat();
    this.lastMealTime = simulation.timer;
    
    // add to history
    this.huntHistory.push(simulation.timer);
    // keep only last 5 (eventho we filter by time anyway)
    if (this.huntHistory.length > 5) this.huntHistory.shift();
    
    this.checkReproduction();
  }

  checkReproduction() {
    // check pop cap & dynamic lock
    const cap = Config.sim.predator.populationCap || 50;
    const halfCap = cap * 0.5;

    if (window.simulation) {
        if (window.simulation.predators.length >= cap) {
            window.simulation.predatorReproductionLocked = true;
        } else if (window.simulation.predators.length <= halfCap && window.simulation.predatorReproductionLocked) {
            window.simulation.predatorReproductionLocked = false;
        }
        
        if (window.simulation.predatorReproductionLocked || window.simulation.predators.length >= cap) return;
    }

    const now = simulation.timer;
    const config = Config.sim.predator.reproduction;
    const windowTime = config.window || 4.0;

    // filter hunts that happened within the time window
    const recentHunts = this.huntHistory.filter(t => (now - t) <= windowTime);
    const count = recentHunts.length;

    // determine chance based on streak
    let chance = 0;
    if (count >= 5) chance = config.chanceMassive;      // 100%
    else if (count >= 3) chance = config.chanceTriple;  // 50%
    else if (count >= 2) chance = config.chanceDouble;  // 20%
    else if (count >= 1) chance = config.chanceSingle;  // 0.5%

    // dynamic reproduction rate (feedback loop)
    if (Config.dynamic && Config.dynamic.enabled && window.simulation) {
        const dyn = Config.dynamic.predator;
        const currentPop = window.simulation.predators.length;
        const preyPop = window.simulation.prey.length;
        
        // absolute population checks
        if (currentPop > dyn.highPopThreshold) {
            chance *= dyn.reproductionNerf;
        } else if (currentPop < dyn.lowPopThreshold) {
            chance *= dyn.reproductionBuff;
        }

        // relative ecosystem balance checks
        if (preyPop > 0 && Config.dynamic.ratio) {
            const ratio = currentPop / preyPop;
            const ratioCfg = Config.dynamic.ratio;

            if (ratio > ratioCfg.high) {
                // too many predators per prey? starvation/competition nerf
                chance *= dyn.highRatioNerf;
            } else if (ratio < ratioCfg.low) {
                // lots of food per predator? thriving buff
                chance *= dyn.lowRatioBuff;
            }
        }
    }

    if (random() < chance) {
      this.reproduce();
    }
  }

  reproduce() {
    const childDNA = {
        speed: this.mutate(this.dna.speed, Config.sim.mutationRate),
        size: this.mutate(this.dna.size, Config.sim.mutationRate),
        sense: this.dna.sense, // keeping infinite for now
        generation: this.generation + 1
    };

    if (window.simulation) {
        window.simulation.addPredator(this.position.x, this.position.y, childDNA);
    }
  }

  die(predators) {
    let index = predators.indexOf(this);
    if (index > -1) {
      predators.splice(index, 1);
      
      // calculate total population for sound logic
      let totalPop = 0;
      if (window.simulation) {
          totalPop = window.simulation.prey.length + window.simulation.predators.length;
      }
      soundManager.playDespawn(totalPop);
    }
  }

  display() {
    noStroke();

    // safety Check: Position and Size
    if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.size)) {
        return; 
    }
    
    // robust Color Retrieval
    let theme, predColors;
    try {
        if (Config && Config.theme && Config.theme.current) {
            theme = Config.theme[Config.theme.current].agents;
            predColors = theme.predator;
        } else {
            throw new Error("Config not ready");
        }
    } catch (e) {
        predColors = ['#FF4444', '#D2691E', '#FFFFFF'];
    }
    
    // determine color based on generation (evolution tiers)
    let colorHex;
    if (Array.isArray(predColors)) {
        let tier = 0;
        if (this.generation >= 6) tier = 2; // advanced (adaptive)
        else if (this.generation >= 3) tier = 1; // evolved
        // else Tier 0 (base)
        
        colorHex = predColors[Math.min(tier, predColors.length - 1)];
    } else {
        colorHex = predColors || '#FF0000';
    }
    
    fill(colorHex);
    ellipse(this.position.x, this.position.y, this.size);
  }
}
