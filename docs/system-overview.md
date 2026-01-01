# SY-01 System Overview

SY-01 is an interactive system study simulating predator–prey dynamics using autonomous agents. The project serves as an experimental exploration of emergent behavior within a balanced ecological simulation.

## Architecture

The system is built on **p5.js** and utilizes a modular architecture to ensure maintainability and clarity. The core logic is separated into distinct components:

-   **Simulation Engine**: Manages the global state, time, and entity lists.
-   **Agent System**: Defines the behaviors of Prey, Predator, and Obstacle entities, including genetic inheritance and mutation.
-   **UI Manager**: Handles the overlay interface, user controls, responsive mobile layouts, and the Settings Panel (Right Side).
-   **Sound Manager**: Manages the generative audio landscape, including dynamic layering and fade transitions.
-   **Configuration**: Centralized control for simulation parameters via `js/Config.js`, utilizing deep-merge logic for runtime robustness.

## Visual System

The visual design follows a rigorous editorial language (Pax Red), prioritizing clarity and data legibility.
-   **Themes**: The system supports both Dark (default) and Light modes.
    -   *Dark Mode*: Uses a lifted near-black (`#121212`) to reduce eye strain while maintaining contrast.
    -   *Light Mode*: Uses an inverted off-white (`#F0F0F0`) for high-light environments.
-   **Evolution Tiers**: Instead of fixed colors, agents evolve visually across generations.
    -   **Prey**: Progresses through **Green** (Base) → **Cyan** (Evolved) → **Deep Cyan/Blue** (Advanced).
    -   **Predator**: Progresses through **Pink** (Base) → **Red** (Evolved) → **Deep Red/Purple** (Advanced).
-   **Typography**: A single sans-serif typeface is used for all data and labels, ensuring a neutral, scientific presentation.
-   **UI**: Neutral Grey (`#888888` / `#666666`) to remain unobtrusive.

## Audio

The audio system provides functional feedback and atmospheric depth:
-   **Population Changes**:
    -   **Spawn**: Randomized melodic cues (`s1.mp3` - `s8.mp3`) triggered on agent birth.
    -   **Despawn**: A subtle `despawn.mp3` cue for natural agent expiration (active only at low population densities to avoid stacking noise).
    -   **Manual Kill**: A distinct `kill.mp3` triggered via user interaction.
-   **Feeding**: Variable "crunch" sounds (`nomnom1.mp3` - `nomnom4.mp3`) for predator success.
-   **Soundscape**: 
    -   **Soundtrack**: A looping background track establishes the simulation's tone.
    -   **Outro**: A specialized track for the Simulation Report (Cinematic Overlay).
    -   **Transitions**: 2.0s cross-fades for track changes and pauses.
-   **Audio Optimization**: Employs a dynamic throttling system that monitors performance (`frameRate`) and population density. It enforces a global limit of **12 concurrent voices** and adjusts sound stacking thresholds (200ms–600ms). Feeding sounds are automatically muted when population exceeds the configured threshold (default: 50), triggering a visual "AUDIO DENSITY: FEEDING MUTED" warning.
-   **Visual Feedback**: Includes non-invasive floating text warnings for resource exhaustion or system limits.
-   **Interactions**: Distinct `click.mp3` and `tap.mp3` for UI feedback.
