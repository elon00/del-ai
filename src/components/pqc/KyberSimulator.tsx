import React, { useState, useEffect } from "react";
import { simulateKyberFlow, KYBER_Q } from "../../lib/pqcMath";
import { KyberStepState } from "../../types";
import { Key, Lock, Unlock, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

export const KyberSimulator: React.FC = () => {
  const [dimensionK, setDimensionK] = useState<number>(3); // 3 = ML-KEM-768
  const [messageBit, setMessageBit] = useState<number>(1);
  const [kyberState, setKyberState] = useState<KyberStepState>(() => simulateKyberFlow(3, 1));
  const [activeStepTab, setActiveStepTab] = useState<1 | 2 | 3>(1);

  const runSimulation = (k = dimensionK, bit = messageBit) => {
    setKyberState(simulateKyberFlow(k, bit));
  };

  useEffect(() => {
    runSimulation(dimensionK, messageBit);
  }, [dimensionK, messageBit]);

  const kLabels: Record<number, { name: string; category: string; desc: string }> = {
    2: { name: "ML-KEM-512", category: "NIST Category 1 (AES-128 equivalent)", desc: "2x2 Polynomial Matrix, Ring modulus q=3329, compact keys." },
    3: { name: "ML-KEM-768", category: "NIST Category 3 (AES-192 equivalent)", desc: "3x3 Polynomial Matrix. Primary recommended standard for global Internet & TLS." },
    4: { name: "ML-KEM-1024", category: "NIST Category 5 (AES-256 equivalent)", desc: "4x4 Polynomial Matrix. Highest post-quantum security tier." },
  };

  return (
    <div className="space-y-6">
      {/* Overview & Parameter Selector Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-mono font-semibold">
                NIST FIPS 203 Standard
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                ML-KEM (CRYSTALS-Kyber) Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Module Learning With Errors (M-LWE) Key Encapsulation Mechanism over polynomial ring Z_q[X]/(X^256 + 1) with q = 3329.
            </p>
          </div>

          <button
            onClick={() => runSimulation()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Re-sample Noise & Keys</span>
          </button>
        </div>

        {/* Algorithm Level Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          {[2, 3, 4].map((kVal) => (
            <button
              key={kVal}
              onClick={() => setDimensionK(kVal)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                dimensionK === kVal
                  ? "bg-indigo-950/60 border-indigo-500 text-slate-100 shadow-md shadow-indigo-950/50"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-300">
                  {kLabels[kVal].name}
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  k = {kVal}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {kLabels[kVal].category}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {kLabels[kVal].desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 text-xs font-medium pb-2">
        <button
          onClick={() => setActiveStepTab(1)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
            activeStepTab === 1
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="h-4 w-4" />
          <span>Stage 1: Key Generation (A, s, e → t)</span>
        </button>

        <button
          onClick={() => setActiveStepTab(2)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
            activeStepTab === 2
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Stage 2: Encapsulation (r, e₁ → u, v)</span>
        </button>

        <button
          onClick={() => setActiveStepTab(3)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
            activeStepTab === 3
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Unlock className="h-4 w-4" />
          <span>Stage 3: Decapsulation & Noise Removal</span>
        </button>
      </div>

      {/* Stage 1 Content */}
      {activeStepTab === 1 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Key className="h-4 w-4 text-indigo-400" />
              <span>Public & Private Key Derivation via Module-LWE</span>
            </h4>
            <span className="font-mono text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Formula: t = A · s + e (mod 3329)
            </span>
          </div>

          <p className="text-slate-400">
            A public uniform polynomial matrix A in R_q^(k x k) is multiplied by secret small noise vector s in R_q^k, then perturbed with Gaussian noise e in R_q^k. An eavesdropper cannot solve for s due to the hardness of the Module Learning with Errors problem.
          </p>

          {/* Matrix Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            {/* Matrix A sample */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
                <span>Uniform Matrix A ({dimensionK}×{dimensionK})</span>
                <span className="text-[10px] text-slate-500 font-mono">Public Seed</span>
              </div>
              <div className="space-y-1.5 font-mono text-[10px]">
                {kyberState.matrixA.map((row, rIdx) => (
                  <div key={rIdx} className="flex space-x-1.5 bg-slate-900 p-1.5 rounded">
                    {row.map((poly, cIdx) => (
                      <span key={cIdx} className="text-cyan-400 truncate max-w-[80px]" title={`Poly: [${poly.join(", ")}]`}>
                        [{poly.slice(0, 2).join(",")},...]
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Secret s & Error e */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
                <span>Secret Vector s & Noise e</span>
                <span className="text-[10px] text-rose-400 font-mono">CBD(η=2) Small Noise</span>
              </div>
              <div className="space-y-2 font-mono text-[10px]">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-400 block mb-1">Secret Key s:</span>
                  {kyberState.secretS.map((poly, idx) => (
                    <div key={idx} className="text-rose-300 truncate">
                      s[{idx}]: [{poly.join(", ")}]
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-400 block mb-1">Noise Error e:</span>
                  {kyberState.noiseE.map((poly, idx) => (
                    <div key={idx} className="text-amber-300 truncate">
                      e[{idx}]: [{poly.join(", ")}]
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Public Key t */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/60">
              <div className="flex items-center justify-between text-indigo-300 font-semibold mb-2">
                <span>Public Key t = A·s + e</span>
                <span className="text-[10px] text-emerald-400 font-mono">Shared Publicly</span>
              </div>
              <div className="space-y-1.5 font-mono text-[10px] bg-slate-900 p-2 rounded">
                {kyberState.publicKeyT.map((poly, idx) => (
                  <div key={idx} className="text-emerald-400 break-all">
                    t[{idx}] = [{poly.slice(0, 4).join(", ")}, ...]
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
                Public Key Size: {dimensionK === 2 ? "800" : dimensionK === 3 ? "1,184" : "1,568"} bytes
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 2 Content */}
      {activeStepTab === 2 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Lock className="h-4 w-4 text-indigo-400" />
              <span>Ciphertext Encapsulation & Message Embedding</span>
            </h4>
            <span className="font-mono text-cyan-400 text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              Ciphertext: (u, v) where u = A^T·r + e₁, v = t^T·r + e₂ + ⌈q/2⌋·m
            </span>
          </div>

          {/* Message bit selector */}
          <div className="flex items-center space-x-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-300 font-medium">Test Secret Bit payload (m):</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setMessageBit(0)}
                className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                  messageBit === 0
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Bit 0
              </button>
              <button
                onClick={() => setMessageBit(1)}
                className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                  messageBit === 1
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Bit 1 (Shift +1665)
              </button>
            </div>
            <span className="text-slate-500 text-[11px]">
              (In standard Kyber, 256 bits are encoded into polynomial coefficients)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block">Vector u = A^T · r + e₁</span>
              <p className="text-[11px] text-slate-400">
                Randomized lattice projection using ephemeral secret r.
              </p>
              <div className="bg-slate-900 p-2.5 rounded font-mono text-[10px] space-y-1 text-cyan-300">
                {kyberState.ciphertextU.map((poly, idx) => (
                  <div key={idx}>u[{idx}] = [{poly.slice(0, 4).join(", ")}, ...]</div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block">Scalar Poly v = t^T · r + e₂ + ⌈q/2⌋·m</span>
              <p className="text-[11px] text-slate-400">
                Masked polynomial containing shifted message payload + double lattice noise.
              </p>
              <div className="bg-slate-900 p-2.5 rounded font-mono text-[10px] text-emerald-300 truncate">
                v = [{kyberState.ciphertextV.slice(0, 8).join(", ")}]
              </div>
              <div className="text-[11px] text-slate-400">
                Encoding term $\lceil 3329/2 \rfloor = 1665$ for bit 1.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3 Content */}
      {activeStepTab === 3 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Unlock className="h-4 w-4 text-emerald-400" />
              <span>Decapsulation & Error-Tolerant Shared Secret Derivation</span>
            </h4>
            <div className="flex items-center space-x-1.5 font-mono text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Noise within Bound: Decapsulation Success</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <p className="text-slate-300">
              The recipient computes v - s^T · u = t^T · r + e_2 + ⌈q/2⌋·m - s^T(A^T · r + e_1).
              Since t = A·s + e, the large matrix term cancels out completely: (A·s + e)^T · r - s^T · A^T · r = e^T · r.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-indigo-300">
              Remaining Signal: ⌈q/2⌋·m + (e^T·r + e₂ - s^T·e₁)
            </div>
            <p className="text-slate-400">
              The combined noise term (e^T·r + e_2 - s^T·e_1) is strictly bounded (&lt; q/4), allowing exact recovery of message bit m.
            </p>
          </div>

          {/* Derived Shared Key */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-emerald-400 font-semibold block text-xs">
                Derived Quantum-Safe Shared Secret K (256-bit SHA-3 / SHAKE256):
              </span>
              <span className="font-mono text-sm font-bold text-slate-100 break-all select-all">
                0x{kyberState.sharedSecretHex}
              </span>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-700">
              Ready for AES-256-GCM
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
