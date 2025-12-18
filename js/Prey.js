class Prey extends Agent {
  constructor(x, y, dna) {
    super(x, y, dna);
    this.velocity = p5.Vector.random2D().mult(this.dna.speed);
    this.birthTime = simulation.timer; // use timer in seconds
    this.lifespan = random(Config.sim.prey.lifespan.min, Config.sim.prey.lifespan.max);
    this.stamina = Config.sim.prey.stamina.max;
    this.color = Config.theme[Config.theme.current].agents.prey;
  }

  generateDNA() {
    let speedVal = Config.sim.prey.speed;
    // handle both number and object for speed
    let baseSpeed = (typeof speedVal === 'object') ? 
        random(speedVal.min, speedVal.max) : speedVal;

    return {
      speed: baseSpeed, 
      size: random(Config.sim.prey.size.min, Config.sim.prey.size.max),
      sense: Config.sim.prey.fleeRadius
    };
  }

  update(preyArray, predators) {
    // flee behavior
    this.flee(predators);
    
    super.update();
    
    // check life
    if (simulation.timer - this.birthTime > this.lifespan) {
      this.die(preyArray);
    }
    
    // reproduction
    const age = simulation.timer - this.birthTime;
    const repConfig = Config.sim.prey.reproduction;
    const cap = repConfig.cap || 100;
    const halfCap = cap * 0.5;

    // dynamic reproduction lock logic
    if (preyArray.length >= cap) {
        simulation.preyReproductionLocked = true;
    } else if (preyArray.length <= halfCap && simulation.preyReproductionLocked) {
        simulation.preyReproductionLocked = false;
    }
    
    // strict dependency: if no predators reproduction is zero
    // this overrides everything
    if (predators.length === 0) {
        return;
    }
    
    // only reproduce if below cap and not locked
    const canReproduce = !simulation.preyReproductionLocked && preyArray.length < cap;

    // dynamic reproduction rate
    let dynamicChance = repConfig.chance;
    
    if (Config.dynamic && Config.dynamic.enabled) {
        const dyn = Config.dynamic.prey;
        const currentPop = preyArray.length;
        
        // dependency check
        if (dyn.dependency && dyn.dependency.enabled) {
            const minRatio = dyn.dependency.minPredatorRatio || 0.2;
            if (predators.length < currentPop * minRatio) {
                 return; // strict cutoff if ratio is bad
            }
        }
        
        // population density checks
        if (currentPop > dyn.highPopThreshold) {
            dynamicChance *= dyn.reproductionNerf; // overpopulation dampening
        } else if (currentPop < dyn.lowPopThreshold) {
            dynamicChance *= dyn.reproductionBuff; // endangered species protection
        }
        
        // ecosystem balance checks
        const predPop = predators.length;
        if (currentPop > 0 && Config.dynamic.ratio) {
            const ratio = predPop / currentPop;
            const ratioCfg = Config.dynamic.ratio;

            if (ratio > ratioCfg.high) {
                // too many predators panic breeding
                dynamicChance *= dyn.highRatioBuff;
            } else if (ratio < ratioCfg.low) {
                // too few predators relax breeding
                dynamicChance *= dyn.lowRatioNerf;
            }
        }
    } else {
        // fallback to legacy behavior if dynamic disabled
        const predatorCount = predators.length;
        let pressure = map(predatorCount, 0, 10, 0.3, 1.5, true); 
        dynamicChance *= pressure;
    }

    if (canReproduce && age > repConfig.ageThreshold && random() < dynamicChance) {
      this.reproduce(preyArray);
    }
  }

  flee(predators) {
    let fleeVector = createVector();
    let count = 0;
    
    // optimization: pre-calculate squared sense radius
    const senseSq = this.dna.sense * this.dna.sense;

    for (let predator of predators) {
      // optimization: manual squared distance calculation
      let dx = this.position.x - predator.position.x;
      let dy = this.position.y - predator.position.y;
      let distSq = dx * dx + dy * dy;
      
      if (distSq < senseSq) {
        let away = p5.Vector.sub(this.position, predator.position);
        away.normalize();
        // accuracy: need actual distance for division
        let distance = Math.sqrt(distSq);
        away.div(distance); 
        fleeVector.add(away);
        count++;
      }
    }
    
    if (count > 0) {
      // strong steering behavior
      let desired = fleeVector.copy();
      
      // determine max speed based on stamina
      let maxSpeed = this.dna.speed;
      if (this.stamina > 0) {
          maxSpeed *= Config.sim.prey.burstSpeedMultiplier;
          this.stamina -= Config.sim.prey.stamina.drainRate * (deltaTime / 1000);
      } else {
          maxSpeed *= Config.sim.prey.exhaustedSpeedMultiplier;
      }
      
      desired.setMag(maxSpeed);
      
      // steering = desired - velocity
      let steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(0.5); // high steering force for quick reaction
      
      this.applyForce(steer);
    } else {
        // recovery
        if (this.stamina < Config.sim.prey.stamina.max) {
            this.stamina += Config.sim.prey.stamina.recoveryRate * (deltaTime / 1000);
        }
        // limit to normal speed if not fleeing
        this.velocity.limit(this.dna.speed);
    }
  }

  reproduce(preyArray) {
    // pass mutated dna to child
    const childDNA = {
      speed: this.mutate(this.dna.speed, Config.sim.mutationRate),
      size: this.mutate(this.dna.size, Config.sim.mutationRate),
      sense: this.mutate(this.dna.sense, Config.sim.mutationRate),
      generation: this.generation + 1
    };
    preyArray.push(new Prey(this.position.x, this.position.y, childDNA));
  }

  die(preyArray) {
    let index = preyArray.indexOf(this);
    if (index > -1) {
      preyArray.splice(index, 1);
      
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
    
    // safety check: position and size
    if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.size)) {
        return; 
    }

    // robust color retrieval
    let theme, preyColors;
    
    try {
        if (Config && Config.theme && Config.theme.current) {
            theme = Config.theme[Config.theme.current].agents;
            preyColors = theme.prey; // array or string
        } else {
            throw new Error("config not ready");
        }
    } catch (e) {
        // fallback
        preyColors = ['#00FF99', '#00FFFF', '#9D00FF']; 
    }

    // determine color based on generation (evolution tiers)
    let colorHex;
    if (Array.isArray(preyColors)) {
        let tier = 0;
        if (this.generation >= 6) tier = 2; // advanced
        else if (this.generation >= 3) tier = 1; // evolved
        // else tier 0 (base)
        
        colorHex = preyColors[Math.min(tier, preyColors.length - 1)];
    } else {
        colorHex = preyColors; // fallback for legacy string config
    }

    fill(colorHex);
    ellipse(this.position.x, this.position.y, this.size);
  }
}
