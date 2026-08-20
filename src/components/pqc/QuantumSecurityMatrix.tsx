import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, ArrowRight, Check, X } from "lucide-react";

export const QuantumSecurityMatrix: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<string>("ML-KEM-768");
  const [shorTarget, setShorTarget] = useState<"RSA-2048" | "RSA-4096" | "ECC-P256" | "ECC-P384">("RSA-2048");

  const comparisonData = [
    {
      name: "RSA-2048",
      type: "Classical KEM / Sig",
      standard: "PKCS #1 / FIPS 186-4",
      pkSize: "256 B",
      sigOrCtSize: "256 B",
      classicalBits: 112,
      quantumShor: "BROKEN in ~4,098 logical qubits ($O(n^3)$ polynomial time)",
      isQuantumSafe: false,
      hardness: "Integer Factorization",
    },
    {
      name: "ECDSA / ECDH P-256",
      type: "Classical Sig / KEM",
      standard: "FIPS 186-4 / SECG",
      pkSize: "64 B",
      sigOrCtSize: "64 B",
      classicalBits: 128,
      quantumShor: "BROKEN in ~2,330 logical qubits ($O(n^3)$ polynomial time)",
      isQuantumSafe: false,
      hardness: "Elliptic Curve Discrete Logarithm (ECDLP)",
    },
    {
      name: "ML-KEM-768 (Kyber)",
      type: "Post-Quantum KEM",
      standard: "NIST FIPS 203",
      pkSize: "1,184 B",
      sigOrCtSize: "1,088 B",
      classicalBits: 192,
      quantumShor: "SECURE (Exponential lattice sieve bound $2^{0.292k}$)",
      isQuantumSafe: true,
      hardness: "Module Learning With Errors (M-LWE)",
    },
    {
      name: "ML-DSA-65 (Dilithium)",
      type: "Post-Quantum Signature",
      standard: "NIST FIPS 204",
      pkSize: "1,952 B",
      sigOrCtSize: "3,293 B",
      classicalBits: 192,
      quantumShor: "SECURE (Exponential Module-SIS lattice bound)",
      isQuantumSafe: true,
      hardness: "Module-SIS & Module-LWE with Aborts",
    },
    {
      name: "SLH-DSA-128 (SPHINCS+)",
      type: "Post-Quantum Signature",
      standard: "NIST FIPS 205",
      pkSize: "32 B",
      sigOrCtSize: "7,856 B",
      classicalBits: 128,
      quantumShor: "SECURE (Stateless hash tree collision resistance)",
      isQuantumSafe: true,
      hardness: "Cryptographic Hash Functions (SHA-256/SHAKE)",
    },
    {
      name: "FALCON-512",
      type: "Post-Quantum Signature",
      standard: "NIST Draft Standard",
      pkSize: "897 B",
      sigOrCtSize: "666 B",
      classicalBits: 128,
      quantumShor: "SECURE (Fast Fourier Gaussian lattice sampling)",
      isQuantumSafe: true,
      hardness: "NTRU Lattice Shortest Vector",
    },
  ];

  const shorCalculations: Record<string, { logicalQubits: number; physicalQubitsEstimate: string; toffoliGates: string; status: string }> = {
    "RSA-2048": {
      logicalQubits: 4098,
      physicalQubitsEstimate: "4.1M – 20M physical qubits (surface-17 code)",
      toffoliGates: "2.7 × 10⁹ Toffoli gates",
      status: "Critical Risk to 'Harvest Now, Decrypt Later' adversaries",
    },
    "RSA-4096": {
      logicalQubits: 8194,
      physicalQubitsEstimate: "8.2M – 40M physical qubits",
      toffoliGates: "2.1 × 10¹⁰ Toffoli gates",
      status: "High long-term risk",
    },
    "ECC-P256": {
      logicalQubits: 2330,
      physicalQubitsEstimate: "2.3M – 10M physical qubits",
      toffoliGates: "1.2 × 10⁸ Toffoli gates",
      status: "Critical risk for classical TLS handshakes and bitcoin signatures",
    },
    "ECC-P384": {
      logicalQubits: 3484,
      physicalQubitsEstimate: "3.5M – 15M physical qubits",
      toffoliGates: "4.3 × 10⁸ Toffoli gates",
      status: "Critical risk under quantum phase estimation",
    },
  };

  const shorActive = shorCalculations[shorTarget];

  return (
    <div className="space-y-6">
      {/* Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-xs font-mono font-semibold">
            NIST Security Standards
          </span>
          <h3 className="text-lg font-bold text-slate-100">
            Classical vs Post-Quantum Cryptography Comparison
          </h3>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="p-3">Cryptosystem</th>
                <th className="p-3">Type & Standard</th>
                <th className="p-3">Public Key</th>
                <th className="p-3">Sig / Ciphertext</th>
                <th className="p-3">Shor Quantum Immunity</th>
                <th className="p-3">Security Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.isQuantumSafe ? "bg-emerald-950/10" : "bg-rose-950/10"
                  }`}
                >
                  <td className="p-3 font-bold text-slate-200">
                    <div className="flex items-center space-x-1.5">
                      {row.isQuantumSafe ? (
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-400">
                    <span className="text-slate-300 font-medium block">{row.type}</span>
                    <span className="text-[10px] text-slate-500">{row.standard}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{row.pkSize}</td>
                  <td className="p-3 font-mono text-slate-300">{row.sigOrCtSize}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                        row.isQuantumSafe
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      }`}
                    >
                      {row.isQuantumSafe ? "Quantum Immune" : "Vulnerable to Shor"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    <span className="font-mono text-cyan-400 font-semibold">{row.classicalBits} bits</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shor's Algorithm Qubit & Resource Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-rose-400" />
              <span>Shor's Algorithm Quantum Resource Estimator</span>
            </h4>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
              Polynomial Time O(n³)
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-medium">Select Target Classical Algorithm to Break:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["RSA-2048", "RSA-4096", "ECC-P256", "ECC-P384"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setShorTarget(t)}
                  className={`p-2 rounded-xl text-center font-mono font-bold transition-all ${
                    shorTarget === t
                      ? "bg-rose-950 border border-rose-500 text-rose-300 shadow-md shadow-rose-950/50"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Output */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-900">
              <span className="text-slate-400">Logical Qubits Required:</span>
              <span className="text-rose-400 font-bold text-sm">{shorActive.logicalQubits.toLocaleString()} Qubits</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-900">
              <span className="text-slate-400">Physical Qubit Estimate (at 10⁻³ error):</span>
              <span className="text-amber-400 font-bold text-xs">{shorActive.physicalQubitsEstimate}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Quantum Circuit Depth:</span>
              <span className="text-cyan-400 font-bold text-xs">{shorActive.toffoliGates}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-[11px] flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Threat status: {shorActive.status}.</span>
          </div>
        </div>

        {/* Right: Hybrid Cryptography Architecture */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Hybrid Classical + PQC Transition Architecture</span>
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              IETF & FIPS Recommended
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            During the post-quantum migration era, industry standards require <strong>Dual Hybrid Key Encapsulation</strong> (e.g. Combining classical <code>X25519</code> ECDH with post-quantum <code>ML-KEM-768</code>).
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300">Hybrid Key Derivation Formula:</span>
            <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-emerald-300">
              SharedKey = HKDF-Extract-Expand(SS_ECDH || SS_MLKEM, salt, "TLS 1.3 hybrid")
            </div>
            <p className="text-[11px] text-slate-500">
              Even if the lattice problem is solved in the future, classical ECDH protects the connection; if a quantum computer attacks ECDH, ML-KEM protects the payload.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">Harvest Now Decrypt Later:</span>
              <span className="text-emerald-400">Neutralized instantly upon hybrid key encapsulation deployment.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-1">FIPS 140-3 Compliance:</span>
              <span className="text-cyan-400">FIPS 203 & 204 certifications ensure seamless transition.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
