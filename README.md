# SY-01: Prey vs Predator System Study

SY-01 is an interactive simulation of predator–prey dynamics using autonomous agents. The project explores emergent behavior in a balanced ecological system governed by simple local rules.

## Documentation

Detailed system notes are available in the `docs/` directory:

- [**System Overview**](docs/system-overview.md): Architecture and visual system design.  
- [**Agent Logic**](docs/agent-logic.md): Behavioral rules for Prey and Predator agents.  
- [**Interaction Model**](docs/interaction-model.md): Controls and interface behavior.  
- [**Study Notes**](docs/STUDY_NOTES.md): Supplementary system observations and exploratory ideas.

## Quick Start

### Web Experience
The simulation is accessible at [**sy01.pax.red**](https://sy01.pax.red).

### Local Execution
To run the simulation locally, serve the project root via a local web server to ensure proper asset loading.

1. Serve the project root and open `index.html` in a modern web browser.  
2. **Click** to spawn Prey (consumes 1 Prey Sample).  
3. **Long Press** or **Hold A + Click** to spawn Predator (consumes 1 Predator Sample).  
4. **Press Spacebar** to remove a random agent.  
5. Use the on-screen controls to **Pause**, **Reset**, or toggle the **Theme**.

## Simulation Previews

### Autonomous Run
<video src="preview/autonom.mp4" controls muted playsinline width="100%"></video>

### Interactive Exploration
<video src="preview/interactive.mp4" controls muted playsinline width="100%"></video>

## Development

Core logic is organized in the `js/` directory:

- `Config.js`: Simulation parameters, theme settings, and balancing rules.  
- `Simulation.js`: Core state management.  
- `Agent.js`, `Prey.js`, `Predator.js`: Entity logic.  
- `UIManager.js`, `SoundManager.js`: Interface and audio handling.

## License

Apache License 2.0
