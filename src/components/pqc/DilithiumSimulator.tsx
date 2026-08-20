import React, { useState } from "react";
import { FileCheck, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, XCircle, Sliders } from "lucide-react";

export const DilithiumSimulator: React.FC = () => {
  const [message, setMessage] = useState<string>("Authentic Del AI Post-Quantum Cryptographic Payload");
  const [selectedVariant, setSelectedVariant] = useState<"ML-DSA-44" | "ML-DSA-65" | "ML-DSA-87">("ML-DSA-65");
  const [isSigned, setIsSigned] = useState<boolean>(true);
  const [tampered, setTampered] = useState<boolean>(false);
  const [abortsCount, setAbortsCount] = useState<number>(3); // Rejection sampling aborts
  const [signatureSeed, setSignatureSeed] = useState<number>(1048576);

  const variantInfo = {
    "ML-DSA-44": { name: "ML-DSA-44 (Dilithium-2)", nistLevel: "NIST Category 2", pkBytes: 1312, sigBytes: 2420, matrix: "4x4", gamma1: "2^17", beta: "78" },
    "ML-DSA-65": { name: "ML-DSA-65 (Dilithium-3)", nistLevel: "NIST Category 3", pkBytes: 1952, sigBytes: 3293, matrix: "6x5", gamma1: "2^19", beta: "120" },
    "ML-DSA-87": { name: "ML-DSA-87 (Dilithium-5)", nistLevel: "NIST Category 5", pkBytes: 2592, sigBytes: 4595, matrix: "8x7", gamma1: "2^19", beta: "120" },
  };

  const handleSign = () => {
    // Generate simulated signature and deterministic aborts count (Fiat-Shamir with Aborts)
    const simulatedAborts = Math.floor(Math.random() * 5) + 1;
    setAbortsCount(simulatedAborts);
    setSignatureSeed(Math.floor(Math.random() * 9000000) + 1000000);
    setIsSigned(true);
    setTampered(false);
  };

  const currentVariant = variantInfo[selectedVariant];
  const isValid = isSigned && !tampered;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-semibold">
                NIST FIPS 204 Standard
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                ML-DSA (CRYSTALS-Dilithium) Signature Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Lattice-based digital signatures based on the Short Integer Solution (SIS) and Module-LWE problems with Fiat-Shamir with Aborts.
            </p>
          </div>

          <button
            onClick={handleSign}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Generate New Signature</span>
          </button>
        </div>

        {/* Variant Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          {(["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"] as const).map((vKey) => (
            <button
              key={vKey}
              onClick={() => setSelectedVariant(vKey)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedVariant === vKey
                  ? "bg-emerald-950/60 border-emerald-500 text-slate-100 shadow-md shadow-emerald-950/50"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-300">
                  {variantInfo[vKey].name}
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {variantInfo[vKey].matrix}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {variantInfo[vKey].nistLevel}
              </p>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>PK: {variantInfo[vKey].pkBytes} B</span>
                <span>Sig: {variantInfo[vKey].sigBytes} B</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Signing & Verification Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Signer View */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>Message Payload Signing</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Matrix A ∈ R_q^{currentVariant.matrix}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Input Plaintext Message:</label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setIsSigned(false);
                }}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            {/* Rejection Sampling Metric */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Fiat-Shamir with Aborts (Rejection Sampling):</span>
                <span className="font-mono text-amber-400 font-bold">{abortsCount} Aborts before Accept</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Candidates where signature norm ||z||_inf &gt;= gamma_1 - beta are rejected to ensure the signature distribution is strictly independent of private key s.
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (1 / (abortsCount + 1)) * 100 * 3)}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSign}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Sign with {selectedVariant} Private Key</span>
          </button>
        </div>

        {/* Right: Verifier View */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Signature Verification ($Az - ct \pmod q$)</span>
              </h4>
              <button
                onClick={() => setTampered(!tampered)}
                className={`px-2.5 py-1 rounded-lg font-medium border text-[11px] transition-all ${
                  tampered
                    ? "bg-rose-950/80 text-rose-300 border-rose-800"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700"
                }`}
              >
                {tampered ? "Tamper Active (1 bit altered)" : "Simulate Payload Tamper"}
              </button>
            </div>

            {/* Signature Data Container */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Polynomial Vector z:</span>
                <span className="text-emerald-400">||z||_∞ &lt; {currentVariant.gamma1} - {currentVariant.beta}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 text-slate-300 break-all text-[10px]">
                0x{signatureSeed.toString(16)}a9f81bc4703e291884dc... [{currentVariant.sigBytes} bytes]
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Challenge Hash c = H(μ || w₁):</span>
                <span className="text-cyan-400">SHAKE256</span>
              </div>
              <div className="p-2 rounded bg-slate-900 text-cyan-300 break-all text-[10px]">
                0xd4e29b183ac9f716295ea71029471620...
              </div>
            </div>

            {/* Verification Result Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
                isValid
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800 text-rose-300"
              }`}
            >
              {isValid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {isValid ? "VALID POST-QUANTUM SIGNATURE" : "SIGNATURE VERIFICATION FAILED"}
                </div>
                <div className="text-[11px] opacity-80">
                  {isValid
                    ? `Mathematical proof verified under Module-SIS hardness on ${selectedVariant}.`
                    : "Lattice hash challenge mismatch or norm out-of-bounds error detected."}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] text-slate-400 border border-slate-800 flex justify-between">
            <span>Standard: NIST FIPS 204</span>
            <span className="font-mono text-emerald-400">Status: Standardized & Deployed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
