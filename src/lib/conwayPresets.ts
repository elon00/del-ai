import { PatternPreset } from "../types";

export const CONWAY_PRESETS: PatternPreset[] = [
  {
    id: "gosper-gun",
    name: "Gosper Glider Gun",
    category: "Guns & Fleets",
    description: "The first known gun constructed by Bill Gosper in 1970. Spawns an endless stream of traveling gliders every 30 generations.",
    rule: "B3/S23",
    author: "Bill Gosper (1970)",
    cells: [
      [5, 1], [5, 2], [6, 1], [6, 2],
      [5, 11], [6, 11], [7, 11], [4, 12], [8, 12], [3, 13], [9, 13], [3, 14], [9, 14],
      [6, 15], [4, 16], [8, 16], [5, 17], [6, 17], [7, 17], [6, 18],
      [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22], [2, 23], [6, 23],
      [1, 25], [2, 25], [6, 25], [7, 25],
      [3, 35], [4, 35], [3, 36], [4, 36]
    ]
  },
  {
    id: "pulsar",
    name: "Pulsar Oscillator",
    category: "Oscillators",
    description: "A period-3 oscillator discovered by John Conway. Features pristine 4-fold reflective symmetry with 48 living cells in its active state.",
    rule: "B3/S23",
    author: "John Conway",
    cells: [
      [2, 4], [2, 5], [2, 6], [2, 10], [2, 11], [2, 12],
      [4, 2], [4, 7], [4, 9], [4, 14],
      [5, 2], [5, 7], [5, 9], [5, 14],
      [6, 2], [6, 7], [6, 9], [6, 14],
      [7, 4], [7, 5], [7, 6], [7, 10], [7, 11], [7, 12],
      [9, 4], [9, 5], [9, 6], [9, 10], [9, 11], [9, 12],
      [10, 2], [10, 7], [10, 9], [10, 14],
      [11, 2], [11, 7], [11, 9], [11, 14],
      [12, 2], [12, 7], [12, 9], [12, 14],
      [14, 4], [14, 5], [14, 6], [14, 10], [14, 11], [14, 12]
    ]
  },
  {
    id: "pentadecathlon",
    name: "Pentadecathlon",
    category: "Oscillators",
    description: "A high-stability period-15 oscillator discovered by John Conway. Often used as an optical reflector in cellular circuits.",
    rule: "B3/S23",
    author: "John Conway",
    cells: [
      [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [4, 12], [4, 13], [4, 14]
    ]
  },
  {
    id: "acorn",
    name: "Acorn Methuselah",
    category: "Methuselahs",
    description: "A 7-cell seed that takes 5,206 generations to stabilize, generating 13 escaping gliders and a final population of 633 cells.",
    rule: "B3/S23",
    author: "Charles Corderman",
    cells: [
      [2, 1], [3, 3], [4, 0], [4, 1], [4, 4], [4, 5], [4, 6]
    ]
  },
  {
    id: "r-pentomino",
    name: "R-Pentomino",
    category: "Methuselahs",
    description: "The most famous 5-cell methuselah. It evolves dynamically for 1,103 generations before settling into 116 living cells.",
    rule: "B3/S23",
    author: "John Conway",
    cells: [
      [1, 2], [1, 3], [2, 1], [2, 2], [3, 2]
    ]
  },
  {
    id: "lwss-fleet",
    name: "Lightweight Spaceships (LWSS)",
    category: "Spaceships",
    description: "Speed c/2 orthogonal traveling spaceships that traverse the grid, shifting 2 units every 4 generations.",
    rule: "B3/S23",
    cells: [
      [2, 2], [2, 5], [3, 6], [4, 2], [4, 6], [5, 3], [5, 4], [5, 5], [5, 6],
      [10, 4], [10, 7], [11, 8], [12, 4], [12, 8], [13, 5], [13, 6], [13, 7], [13, 8]
    ]
  },
  {
    id: "highlife-replicator",
    name: "HighLife Replicator",
    category: "Exotic",
    description: "Under HighLife (B36/S23), this 12-cell pattern recursively clones itself every 12 generations.",
    rule: "B36/S23",
    cells: [
      [2, 3], [2, 4], [2, 5],
      [3, 2], [3, 5],
      [4, 2], [4, 5],
      [5, 2], [5, 3], [5, 4]
    ]
  },
  {
    id: "glider-matrix",
    name: "Converging Glider Collision",
    category: "Guns & Fleets",
    description: "Four gliders flying towards a central coordinate from opposite diagonal quadrants, creating a sudden energetic phase transition.",
    rule: "B3/S23",
    cells: [
      // Top-Left Glider
      [2, 3], [3, 4], [4, 2], [4, 3], [4, 4],
      // Top-Right Glider
      [2, 20], [3, 19], [4, 19], [4, 20], [4, 21],
      // Bottom-Left Glider
      [20, 3], [19, 4], [18, 2], [18, 3], [18, 4],
      // Bottom-Right Glider
      [20, 20], [19, 19], [18, 19], [18, 20], [18, 21]
    ]
  }
];
