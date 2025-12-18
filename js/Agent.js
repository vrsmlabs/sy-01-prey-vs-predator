class Agent {
  constructor(x, y, dna) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    
    // gens
    // dna: { speed: float, size: float, sense: float, generation: int }
    // if no DNA provided, generate random based on config defaults
    this.dna = dna || this.generateDNA();
    
    this.generation = this.dna.generation || 1;
    
    this.size = this.dna.size;
    this.color = color(255);
  }

  generateDNA() {
    // override in subclasses
    return { speed: 1, size: 10, sense: 50 };
  }

  mutate(value, rate) {
    if (random() < rate) {
      return value * random(0.9, 1.1); // +/- 10% variation
    }
    return value;
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.checkEdges();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  checkEdges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }

  display() {
    noStroke();
    fill(this.color);
    ellipse(this.position.x, this.position.y, this.size);
  }
}
