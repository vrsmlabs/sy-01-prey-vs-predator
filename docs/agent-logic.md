# Agent Logic

The simulation drives two distinct agent types: **Prey** and **Predator**. Each agent operates autonomously based on local perception and internal state.

## Prey

Prey are the primary resource in the ecosystem. Their goal is to survive and reproduce.

### Behaviors
1.  **Movement & Stamina**: 
    -   **Variable Speed**: Prey are born with genetic speed traits (Base: 2.5), allowing some to outrun predators naturally.
    -   **Stamina System**: When fleeing, prey sprint at **Burst Speed** (2.0x multiplier) until stamina is depleted. Exhausted prey move sluggishly (0.5x multiplier).
2.  **Flee & Dodge**: 
    -   When a Predator enters the `fleeRadius` (160px), the Prey flees.
    -   **Dodge**: If a Predator gets dangerously close (<40% of vision), the Prey performs a sharp, lateral "sway" maneuver (perpendicular force) to break the Predator's tracking line.
3.  **Reproduction & Dependency**:
    -   Asexual reproduction occurs if the agent survives past `ageThreshold`.
    -   **Genetics**: Offspring inherit traits (Speed, Size, Sense) with a chance of **Mutation** (±20% variation), driving evolution.
    -   **Evolution Tiers**: Visual indicators of genetic progress:
        -   **Green**: Base (Gen 0-2)
        -   **Cyan**: Evolved (Gen 3-5)
        -   **Deep Cyan/Blue**: Advanced (Gen 6+)
    -   **Strict Dependency**: Prey reproduction is strictly coupled to predator presence. If the predator population drops below **20%** of the prey population, reproduction halts entirely. This simulates the lack of evolutionary pressure.
    -   **Population Cap & Dynamic Lock**: 
        -   Population is capped to prevent performance degradation.
        -   Once the population hits the cap, reproduction is **Locked** globally.
        -   Reproduction remains disabled until the population drops to **50% of the cap**, creating distinct population waves.
4.  **Lifespan**: Each Prey has a fixed lifespan. Upon exceeding this limit, the agent dies (despawns).

## Predator

Predators are the regulatory force. Their goal is to hunt Prey to sustain themselves.

### Behaviors
1.  **Movement**: Moves with a wandering velocity.
2.  **Hunt & Scarcity Response**:
    -   Scans for the nearest Prey agent.
    -   If a Prey is detected, the Predator applies a steering force towards it.
    -   Predators also use **Stamina** to sprint (Burst Speed) during chases, balancing the speed advantage of Prey.
    -   **Scarcity Response**: If the prey population drops below **60%** of the predator population, predators voluntarily stop hunting and switch to a low-energy wandering state. This prevents them from wiping out their food source entirely.
3.  **Starvation**:
    -   Predators have a `starvationTime`.
    -   Successfully eating a Prey resets this timer.
    -   Failure to eat within the time limit results in death.
4.  **Lifespan**:
    -   Predators age and die naturally (range 60-100s) to prevent immortal agents from dominating the simulation long-term.
5.  **Reproduction (Streak & Evolution)**:
    -   **Evolution Tiers**: Visual indicators of genetic progress:
        -   **Pink**: Base (Gen 0-2)
        -   **Red**: Evolved (Gen 3-5)
        -   **Deep Red/Purple**: Advanced (Gen 6+)
    -   **Hunt Streak System**: Predators use a streak system to determine reproduction based on recent success (within a 4s window):
        -   **1 Hunt**: Low chance (0.5%).
        -   **2 Hunts**: Moderate chance (10%).
        -   **3 Hunts**: High chance (40%).
        -   **5+ Hunts**: Guaranteed reproduction (100%).
    -   **Population Cap & Dynamic Lock**: Similar to prey, predator reproduction locks at the cap and only unlocks when the population drops to 50% of the cap.

## Balancing

The system is balanced to create cycles of boom and bust.
-   **Prey Growth**: Limited by lifespan, predation, and a hard population cap.
-   **Predator Growth**: Limited by food availability, hunting skill, and a hard population cap.

Parameters can be tuned in `js/Config.js` to observe different ecological outcomes.
