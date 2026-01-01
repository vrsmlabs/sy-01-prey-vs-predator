class Obstacle {
  constructor(x, y, lifespan = Infinity) {
    this.position = createVector(x, y);
    this.segments = []; // array of {p1: Vector, p2: Vector}
    this.type = random(['line', 'L', 'U', 'plus']);
    this.size = random(50, 150);
    this.lifespan = lifespan;
    this.birthTime = (window.simulation && window.simulation.timer) || 0;
    this.generateShape();
  }

  generateShape() {
    let s = this.size;
    let p = this.position;
    
    // random rotation
    let angle = random(TWO_PI);
    
    // helper to rotate point around center
    const getOffset = (ox, oy) => {
        let v = createVector(ox, oy);
        v.rotate(angle);
        return p5.Vector.add(p, v);
    };

    if (this.type === 'line') {
        this.segments.push({
            p1: getOffset(-s/2, 0),
            p2: getOffset(s/2, 0)
        });
    } else if (this.type === 'L') {
        let corner = getOffset(0, 0);
        this.segments.push({ p1: getOffset(-s/2, 0), p2: corner });
        this.segments.push({ p1: corner, p2: getOffset(0, s/2) });
    } else if (this.type === 'U') {
        let tl = getOffset(-s/2, -s/2);
        let bl = getOffset(-s/2, s/2);
        let br = getOffset(s/2, s/2);
        let tr = getOffset(s/2, -s/2);
        
        this.segments.push({ p1: tl, p2: bl });
        this.segments.push({ p1: bl, p2: br });
        this.segments.push({ p1: br, p2: tr });
    } else if (this.type === 'plus') {
        this.segments.push({ p1: getOffset(-s/2, 0), p2: getOffset(s/2, 0) });
        this.segments.push({ p1: getOffset(0, -s/2), p2: getOffset(0, s/2) });
    }
  }

  display() {
    stroke(Config.sim.obstacles.color || '#808080');
    strokeWeight(Config.sim.obstacles.wallThickness || 4);
    noFill();
    strokeCap(PROJECT); // crisp edges

    for (let seg of this.segments) {
        line(seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
    }
  }

  // simple AABB check first then detailed line distance
  checkCollision(agent) {
     // broad phase: distance to center < size
     if (p5.Vector.dist(agent.position, this.position) > this.size * 1.5) return false;

     let hit = false;
     let radius = agent.size / 2;
     
     for (let seg of this.segments) {
         // get closest point on line segment to agent
         let closest = this.closestPointOnLine(seg.p1, seg.p2, agent.position);
         let dist = p5.Vector.dist(agent.position, closest);
         
         if (dist < radius + (Config.sim.obstacles.wallThickness/2)) {
             // collision response: push back
             let normal = p5.Vector.sub(agent.position, closest).normalize();
             // slight bounce/slide
             agent.position = p5.Vector.add(closest, p5.Vector.mult(normal, radius + (Config.sim.obstacles.wallThickness/2) + 1));
             
             // reflect velocity slightly (optional, but helps sliding)
             // agent.velocity.reflect(normal); // p5 vector reflect might be useful but simple push is safer for stability
             
             hit = true;
         }
     }
     return hit;
  }
  
  // calculate repulsion force for predators
  getRepulsion(agent, range) {
      if (p5.Vector.dist(agent.position, this.position) > this.size + range) return createVector(0,0);
      
      let force = createVector(0,0);
      let count = 0;

      for (let seg of this.segments) {
          let closest = this.closestPointOnLine(seg.p1, seg.p2, agent.position);
          let d = p5.Vector.dist(agent.position, closest);
          
          if (d < range) {
              let diff = p5.Vector.sub(agent.position, closest);
              diff.normalize();
              diff.div(d); // weight by distance
              force.add(diff);
              count++;
          }
      }
      
      if (count > 0) {
          force.div(count);
      }
      return force;
  }

  closestPointOnLine(p1, p2, p) {
      let v = p5.Vector.sub(p2, p1);
      let u = p5.Vector.sub(p, p1);
      let t = u.dot(v) / v.dot(v);
      
      if (t < 0) return p1.copy();
      if (t > 1) return p2.copy();
      
      return p5.Vector.add(p1, p5.Vector.mult(v, t));
  }
}
