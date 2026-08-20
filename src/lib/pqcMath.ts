import { KyberStepState, NISTPQCAlgorithm } from "../types";

// Prime modulus for Kyber (ML-KEM)
export const KYBER_Q = 3329;
export const POLY_DEGREE = 8; // Compact degree for visual interactive inspection (standard is 256)

/**
 * Centered Binomial Distribution CBD_eta sampler
 */
export function sampleCBD(eta: number = 2): number {
  let a = 0;
  let b = 0;
  for (let i = 0; i < eta; i++) {
    a += Math.random() > 0.5 ? 1 : 0;
    b += Math.random() > 0.5 ? 1 : 0;
  }
  return a - b;
}

/**
 * Generate a random polynomial in R_q = Z_q[X]/(X^N + 1)
 */
export function generateRandomPoly(degree: number = POLY_DEGREE, maxVal: number = KYBER_Q): number[] {
  const poly: number[] = [];
  for (let i = 0; i < degree; i++) {
    poly.push(Math.floor(Math.random() * maxVal));
  }
  return poly;
}

/**
 * Sample a noise polynomial with small coefficients from CBD
 */
export function sampleNoisePoly(degree: number = POLY_DEGREE, eta: number = 2): number[] {
  const poly: number[] = [];
  for (let i = 0; i < degree; i++) {
    poly.push(sampleCBD(eta));
  }
  return poly;
}

/**
 * Polynomial addition modulo Q
 */
export function polyAdd(a: number[], b: number[], q: number = KYBER_Q): number[] {
  const n = Math.max(a.length, b.length);
  const res: number[] = [];
  for (let i = 0; i < n; i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    let sum = (ai + bi) % q;
    if (sum < 0) sum += q;
    res.push(sum);
  }
  return res;
}

/**
 * Polynomial multiplication modulo (X^N + 1) and modulo Q
 */
export function polyMulRing(a: number[], b: number[], n: number = POLY_DEGREE, q: number = KYBER_Q): number[] {
  const result = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const coeff = ((a[i] || 0) * (b[j] || 0)) % q;
      const deg = i + j;
      if (deg < n) {
        result[deg] = (result[deg] + coeff) % q;
      } else {
        // X^n = -1 in Z_q[X]/(X^n + 1)
        result[deg - n] = (result[deg - n] - coeff + q) % q;
      }
    }
  }
  return result.map(v => (v % q + q) % q);
}

/**
 * Dot product of polynomial vectors modulo (X^n + 1) and q
 */
export function polyVectorDot(v1: number[][], v2: number[][], n: number = POLY_DEGREE, q: number = KYBER_Q): number[] {
  let sum = new Array(n).fill(0);
  const k = Math.min(v1.length, v2.length);
  for (let i = 0; i < k; i++) {
    const prod = polyMulRing(v1[i], v2[i], n, q);
    sum = polyAdd(sum, prod, q);
  }
  return sum;
}

/**
 * Matrix-vector multiplication for Module-LWE: result_i = sum_j (A[i][j] * v[j])
 */
export function polyMatrixVectorMul(
  matrix: number[][][],
  vector: number[][],
  n: number = POLY_DEGREE,
  q: number = KYBER_Q
): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];

  for (let i = 0; i < rows; i++) {
    let rowSum = new Array(n).fill(0);
    for (let j = 0; j < cols; j++) {
      const prod = polyMulRing(matrix[i][j], vector[j], n, q);
      rowSum = polyAdd(rowSum, prod, q);
    }
    result.push(rowSum);
  }
  return result;
}

/**
 * Simulates a full Kyber / ML-KEM Key Exchange Flow
 */
export function simulateKyberFlow(k: number = 3, messageBit: number = 1): KyberStepState {
  const n = POLY_DEGREE;
  const q = KYBER_Q;

  // 1. Generate Uniform Matrix A (k x k)
  const matrixA: number[][][] = [];
  for (let r = 0; r < k; r++) {
    const row: number[][] = [];
    for (let c = 0; c < k; c++) {
      row.push(generateRandomPoly(n, q));
    }
    matrixA.push(row);
  }

  // 2. Sample secret s and noise e from CBD
  const secretS: number[][] = [];
  const noiseE: number[][] = [];
  for (let i = 0; i < k; i++) {
    secretS.push(sampleNoisePoly(n, 2));
    noiseE.push(sampleNoisePoly(n, 2));
  }

  // 3. Compute Public Key: t = A * s + e (mod q)
  const As = polyMatrixVectorMul(matrixA, secretS, n, q);
  const publicKeyT: number[][] = [];
  for (let i = 0; i < k; i++) {
    publicKeyT.push(polyAdd(As[i], noiseE[i], q));
  }

  // 4. Encapsulation: Sample ephemeral r, e1, e2
  const ephemeralR: number[][] = [];
  const noiseE1: number[][] = [];
  for (let i = 0; i < k; i++) {
    ephemeralR.push(sampleNoisePoly(n, 2));
    noiseE1.push(sampleNoisePoly(n, 2));
  }
  const noiseE2 = sampleNoisePoly(n, 2);

  // Compute u = A^T * r + e1 (mod q)
  // Transpose matrix A
  const matrixAT: number[][][] = [];
  for (let c = 0; c < k; c++) {
    const colRow: number[][] = [];
    for (let r = 0; r < k; r++) {
      colRow.push(matrixA[r][c]);
    }
    matrixAT.push(colRow);
  }
  const ATr = polyMatrixVectorMul(matrixAT, ephemeralR, n, q);
  const ciphertextU: number[][] = [];
  for (let i = 0; i < k; i++) {
    ciphertextU.push(polyAdd(ATr[i], noiseE1[i], q));
  }

  // Compute v = t^T * r + e2 + round(q/2) * m
  const tTr = polyVectorDot(publicKeyT, ephemeralR, n, q);
  const msgPoly = new Array(n).fill(0);
  // Encode message bit into constant term or all terms
  const qHalf = Math.round(q / 2);
  msgPoly[0] = messageBit * qHalf;

  let v = polyAdd(tTr, noiseE2, q);
  v = polyAdd(v, msgPoly, q);

  // 5. Decapsulation: compute m_noisy = v - s^T * u
  const sTu = polyVectorDot(secretS, ciphertextU, n, q);
  const noisyMsg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let diff = (v[i] - sTu[i]) % q;
    if (diff < 0) diff += q;
    noisyMsg[i] = diff;
  }

  // Decode bit: if closer to q/2 -> 1, if closer to 0 or q -> 0
  const constCoeff = noisyMsg[0];
  const distZero = Math.min(constCoeff, q - constCoeff);
  const distHalf = Math.abs(constCoeff - qHalf);
  const recoveredBit = distHalf < distZero ? 1 : 0;

  // Generate SHA-3 style hex shared secret
  const seedStr = `${recoveredBit}-${publicKeyT[0].slice(0, 4).join(",")}-${ciphertextU[0].slice(0, 4).join(",")}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const sharedSecretHex = Math.abs(hash).toString(16).padStart(8, "0") + "a4f891b7e23cd819445bf7a10986de42".slice(8);

  return {
    step: 3,
    matrixA,
    secretS,
    noiseE,
    publicKeyT,
    ephemeralR,
    ciphertextU,
    ciphertextV: v,
    plainMessageBits: [messageBit],
    decryptedBits: [recoveredBit],
    sharedSecretHex,
    decapsulationSuccess: recoveredBit === messageBit,
    noiseVariance: 2.0,
  };
}

/**
 * Lattice Vector Math & Basis Reduction (Gram-Schmidt & SVP)
 */
export interface LatticePoint {
  x: number;
  y: number;
  isShortest?: boolean;
}

export function generate2DLatticeGrid(
  b1: [number, number],
  b2: [number, number],
  range: number = 4
): LatticePoint[] {
  const points: LatticePoint[] = [];
  let minNormSq = Infinity;

  // Find min norm for non-zero points
  for (let u = -range; u <= range; u++) {
    for (let v = -range; v <= range; v++) {
      if (u === 0 && v === 0) continue;
      const x = u * b1[0] + v * b2[0];
      const y = u * b1[1] + v * b2[1];
      const normSq = x * x + y * y;
      if (normSq < minNormSq) {
        minNormSq = normSq;
      }
    }
  }

  for (let u = -range; u <= range; u++) {
    for (let v = -range; v <= range; v++) {
      const x = u * b1[0] + v * b2[0];
      const y = u * b1[1] + v * b2[1];
      const normSq = x * x + y * y;
      const isShortest = u !== 0 || v !== 0 ? Math.abs(normSq - minNormSq) < 0.001 : false;
      points.push({ x, y, isShortest });
    }
  }
  return points;
}

/**
 * Gram Schmidt Orthogonalization for 2D vectors
 */
export function gramSchmidt2D(b1: [number, number], b2: [number, number]): {
  b1Star: [number, number];
  b2Star: [number, number];
  mu21: number;
} {
  const b1Star: [number, number] = [b1[0], b1[1]];
  const dot_b2_b1Star = b2[0] * b1Star[0] + b2[1] * b1Star[1];
  const norm_b1Star_sq = b1Star[0] * b1Star[0] + b1Star[1] * b1Star[1];
  const mu21 = norm_b1Star_sq === 0 ? 0 : dot_b2_b1Star / norm_b1Star_sq;

  const b2Star: [number, number] = [
    b2[0] - mu21 * b1Star[0],
    b2[1] - mu21 * b1Star[1]
  ];

  return { b1Star, b2Star, mu21 };
}

/**
 * Calculates Shannon Entropy of Cellular Automaton Grid State
 */
export function calculateGridEntropy(grid: Uint8Array, totalCells: number): {
  entropy: number;
  aliveCount: number;
  density: number;
  entropySeedHex: string;
} {
  let aliveCount = 0;
  for (let i = 0; i < totalCells; i++) {
    if (grid[i] > 0) aliveCount++;
  }

  const p1 = aliveCount / totalCells;
  const p0 = 1 - p1;

  let entropy = 0;
  if (p1 > 0 && p1 < 1) {
    entropy = -(p0 * Math.log2(p0) + p1 * Math.log2(p1));
  }

  // Construct 256-bit entropy seed from grid state
  let hash1 = 0x811c9dc5;
  let hash2 = 0x5b79a32c;
  for (let i = 0; i < Math.min(grid.length, 1024); i += 4) {
    const val = grid[i] | (grid[i + 1] << 2) | (grid[i + 2] << 4) | (grid[i + 3] << 6);
    hash1 = (hash1 ^ val) * 0x01000193;
    hash2 = (hash2 ^ (val + i)) * 0x01000193;
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, "0");
  const entropySeedHex = `${hex1}${hex2}${(entropy * 100000000).toFixed(0)}e98b417c`.slice(0, 32);

  return {
    entropy: Number(entropy.toFixed(4)),
    aliveCount,
    density: Number(p1.toFixed(4)),
    entropySeedHex,
  };
}

/**
 * NIST PQC Algorithm Database
 */
export const NIST_PQC_CATALOG: Record<NISTPQCAlgorithm, {
  name: string;
  type: "KEM" | "Signature";
  standard: "FIPS 203" | "FIPS 204" | "FIPS 205" | "Draft";
  securityLevel: 1 | 2 | 3 | 5;
  hardnessAssumption: string;
  publicKeyBytes: number;
  ciphertextOrSigBytes: number;
  privateKeyBytes: number;
  quantumGroverBits: number;
  quantumShorVulnerable: boolean;
  description: string;
}> = {
  "ML-KEM-512": {
    name: "ML-KEM-512 (Kyber-512)",
    type: "KEM",
    standard: "FIPS 203",
    securityLevel: 1,
    hardnessAssumption: "Module-LWE (k=2, q=3329)",
    publicKeyBytes: 800,
    ciphertextOrSigBytes: 768,
    privateKeyBytes: 1632,
    quantumGroverBits: 128,
    quantumShorVulnerable: false,
    description: "NIST Security Category 1 (AES-128 equivalent). Low bandwidth, optimized for constrained embedded IoT devices."
  },
  "ML-KEM-768": {
    name: "ML-KEM-768 (Kyber-768)",
    type: "KEM",
    standard: "FIPS 203",
    securityLevel: 3,
    hardnessAssumption: "Module-LWE (k=3, q=3329)",
    publicKeyBytes: 1184,
    ciphertextOrSigBytes: 1088,
    privateKeyBytes: 2400,
    quantumGroverBits: 192,
    quantumShorVulnerable: false,
    description: "NIST Primary Recommended General-Purpose KEM. Ideal balance of performance, high lattice dimension, and security."
  },
  "ML-KEM-1024": {
    name: "ML-KEM-1024 (Kyber-1024)",
    type: "KEM",
    standard: "FIPS 203",
    securityLevel: 5,
    hardnessAssumption: "Module-LWE (k=4, q=3329)",
    publicKeyBytes: 1568,
    ciphertextOrSigBytes: 1568,
    privateKeyBytes: 3168,
    quantumGroverBits: 256,
    quantumShorVulnerable: false,
    description: "NIST Security Category 5 (AES-256 equivalent). Maximum security tier for critical defense and ultra-long-term archiving."
  },
  "ML-DSA-44": {
    name: "ML-DSA-44 (Dilithium-2)",
    type: "Signature",
    standard: "FIPS 204",
    securityLevel: 2,
    hardnessAssumption: "Module-LWE & Module-SIS",
    publicKeyBytes: 1312,
    ciphertextOrSigBytes: 2420,
    privateKeyBytes: 2528,
    quantumGroverBits: 128,
    quantumShorVulnerable: false,
    description: "Primary lattice digital signature standard based on Fiat-Shamir with Aborts. Fast signing and verification."
  },
  "ML-DSA-65": {
    name: "ML-DSA-65 (Dilithium-3)",
    type: "Signature",
    standard: "FIPS 204",
    securityLevel: 3,
    hardnessAssumption: "Module-LWE & Module-SIS",
    publicKeyBytes: 1952,
    ciphertextOrSigBytes: 3293,
    privateKeyBytes: 4000,
    quantumGroverBits: 192,
    quantumShorVulnerable: false,
    description: "Medium-high security tier digital signature for TLS certificates, document signing, and quantum-safe PKI."
  },
  "ML-DSA-87": {
    name: "ML-DSA-87 (Dilithium-5)",
    type: "Signature",
    standard: "FIPS 204",
    securityLevel: 5,
    hardnessAssumption: "Module-LWE & Module-SIS",
    publicKeyBytes: 2592,
    ciphertextOrSigBytes: 4595,
    privateKeyBytes: 4864,
    quantumGroverBits: 256,
    quantumShorVulnerable: false,
    description: "Maximum post-quantum signature security level (AES-256 / SHA-512 equivalent) against quantum sieve heuristics."
  },
  "SLH-DSA-128": {
    name: "SLH-DSA-128 (SPHINCS+)",
    type: "Signature",
    standard: "FIPS 205",
    securityLevel: 1,
    hardnessAssumption: "Stateless Hash-Based (SHA2/SHAKE)",
    publicKeyBytes: 32,
    ciphertextOrSigBytes: 7856,
    privateKeyBytes: 64,
    quantumGroverBits: 128,
    quantumShorVulnerable: false,
    description: "Conservative stateless hash-based signature. Relies purely on collision/preimage resistance of cryptographic hashes."
  },
  "FALCON-512": {
    name: "FALCON-512",
    type: "Signature",
    standard: "Draft",
    securityLevel: 1,
    hardnessAssumption: "NTRU Lattice & Fast Fourier Sampling",
    publicKeyBytes: 897,
    ciphertextOrSigBytes: 666,
    privateKeyBytes: 1281,
    quantumGroverBits: 128,
    quantumShorVulnerable: false,
    description: "Compact lattice signature with smallest combined key + signature footprint, utilizing trapdoor Gaussian preimage sampling."
  }
};
