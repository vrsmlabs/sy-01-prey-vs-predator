# Interaction Model

SY-01 is designed as an interactive study. The user acts as an external force capable of influencing the ecosystem's balance.

## Input Methods

The interaction model relies on simple, documented inputs.

| Action | Input | Result |
| :--- | :--- | :--- |
| **Introduce Prey** | **Click** (Left Mouse) | Spawns a single Prey agent at the cursor location. Consumes 1 Prey Sample. |
| **Introduce Predator** | **Long Press** (>600ms) | Spawns a single Predator agent. Consumes 1 Predator Sample. |
| **Introduce Predator** | **Hold 'A' + Click** | Alternative method to instantly spawn a Predator. Consumes 1 Predator Sample. |
| **Remove Agent** | **Spacebar** | Removes a random agent (Prey or Predator) from the simulation. |
| **Pause / Resume** | Click **Pause Icon** | Freezes or resumes the simulation loop. |
| **Reset** | Click **Reset Icon** | Clears all agents and restarts the simulation with initial populations and replenished samples. |
| **Switch Theme** | Click **Theme Icon** | Toggles between Dark and Light visual modes. |
| **Settings** | Click **Gear Icon** | Opens a panel to adjust simulation parameters (Reproduction, Hunger, etc.). |

## Agent Samples

Unlike infinite "god-mode" simulations, the user has a finite number of agents to introduce to the ecosystem.

-   **Initial Allocation**: The user starts with a randomized number of samples (e.g., 10-18 Prey, 5-14 Predators).
-   **Resource Management**: Every manual spawn consumes a sample.
-   **Exhaustion**: When samples reach zero, a non-invasive warning ("OUT OF AGENT SAMPLES") appears. Samples are only replenished upon a system **Reset**.

## Interface

The UI is minimal and functional, avoiding any decorative elements.

-   **Population Counters**: Real-time count of Prey and Predators (Top Left).
-   **Timer**: Duration of the current stable simulation (Top Right).
-   **Control Deck**: Icon-based controls for system states (Bottom Center).
-   **Settings Panel**: Configurable parameters for real-time tweaking (Top Right).
-   **Simulation Report**: A cinematic overlay appearing upon extinction, displaying stats and allowing restart.

## Feedback

-   **Visual**: 
    -   Immediate appearance of agents upon interaction.
    -   Floating text warnings for sample exhaustion and audio limits.
-   **Audio**: 
    -   **Soundtrack**: Dynamic background music (`soundtrack.ogg`) with a cinematic outro (`outro.ogg`) for reporting.
    -   **Effects**: Distinct sounds for spawn (`s1-s8`), despawn, and feeding (`nomnom1-nomnom4`).
    -   **UI Feedback**: Tactical `click` and `tap` sounds for all interface interactions.
    -   **Optimization**: Dynamic performance-based throttling and global voice limits. Feeding sounds are explicitly muted when population > Config Threshold (50) to prevent noise chaos.
