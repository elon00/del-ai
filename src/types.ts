export type AutomatonRule =
  | "B3/S23" // Standard Conway
  | "B36/S23" // HighLife (Replicator)
  | "B3678/S34678" // Day & Night
  | "B2/S" // Seeds
  | "B34/S34" // 34 Life
  | "B35678/S5678" // Diamoeba
  | "B1357/S1357"; // Replicator / Sierpinski

export interface PatternPreset {
  id: string;
  name: string;
  category: "Guns & Fleets" | "Oscillators" | "Methuselahs" | "Spaceships" | "Exotic";
  description: string;
  rule: AutomatonRule;
  cells: [number, number][]; // [row, col] relative coordinates
  author?: string;
}

export type AutomatonTheme = "cyber-matrix" | "quantum-cyan" | "bioluminescent" | "amber-terminal" | "monochrome-slate";

export interface AutomatonState {
  grid: Uint8Array; // 0 = dead, >0 = age/alive
  width: number;
  height: number;
  generation: number;
  population: number;
  isRunning: boolean;
  speedFps: number;
  rule: AutomatonRule;
  theme: AutomatonTheme;
  showHeatmap: boolean;
  historyPop: number[];
  entropy: number;
}

export type AgentPersona = "synthesizer" | "automaton" | "pqc" | "security";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  persona?: AgentPersona;
  content: string;
  timestamp: string;
  thoughtProcess?: string;
  toolAction?: {
    type: "inject_pattern" | "pqc_benchmark" | "entropy_seed" | "audit_security";
    label: string;
    payload?: any;
  };
}

export interface LatticeVector {
  x: number;
  y: number;
}

export type NISTPQCAlgorithm =
  | "ML-KEM-512" // Kyber-512 (NIST Cat 1)
  | "ML-KEM-768" // Kyber-768 (NIST Cat 3)
  | "ML-KEM-1024" // Kyber-1024 (NIST Cat 5)
  | "ML-DSA-44" // Dilithium-2 (NIST Cat 2)
  | "ML-DSA-65" // Dilithium-3 (NIST Cat 3)
  | "ML-DSA-87" // Dilithium-5 (NIST Cat 5)
  | "SLH-DSA-128" // SPHINCS+
  | "FALCON-512"; // Falcon

export interface PQCAnalysisReport {
  algorithm: string;
  nistCategory: string;
  securityCategory: string;
  quantumResistance: string;
  keySizes: {
    publicKeyBytes: number;
    ciphertextBytes: number;
    privateKeyBytes: number;
  };
  summary: string;
  migrationRecommendation: string;
}

export interface KyberStepState {
  step: 1 | 2 | 3; // 1: KeyGen, 2: Encapsulation, 3: Decapsulation
  matrixA: number[][][]; // k x k polynomial matrix sample
  secretS: number[][]; // k polynomials (noise)
  noiseE: number[][]; // k polynomials (noise)
  publicKeyT: number[][]; // t = A*s + e
  ephemeralR: number[][]; // encapsulation secret
  ciphertextU: number[][]; // u = A^T * r + e1
  ciphertextV: number[]; // v = t^T * r + e2 + Decompress(m)
  plainMessageBits: number[]; // 256 bits or byte sample
  decryptedBits: number[];
  sharedSecretHex: string;
  decapsulationSuccess: boolean;
  noiseVariance: number;
}
