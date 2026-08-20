import React, { useState } from "react";
import { KyberSimulator } from "./KyberSimulator";
import { DilithiumSimulator } from "./DilithiumSimulator";
import { LatticeVisualizer } from "./LatticeVisualizer";
import { QuantumSecurityMatrix } from "./QuantumSecurityMatrix";
import { HybridEncryptionSandbox } from "./HybridEncryptionSandbox";
import { Lock, FileCheck, Grid, ShieldAlert, PackageCheck } from "lucide-react";

export const PQCWorkbench: React.FC = () => {
  const [subTab, setSubTab] = useState<"kyber" | "dilithium" | "lattice" | "matrix" | "sandbox">("kyber");

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
        <button
          onClick={() => setSubTab("kyber")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition-all ${
            subTab === "kyber"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>ML-KEM (Kyber)</span>
        </button>

        <button
          onClick={() => setSubTab("dilithium")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition-all ${
            subTab === "dilithium"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>ML-DSA (Dilithium)</span>
        </button>

        <button
          onClick={() => setSubTab("lattice")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition-all ${
            subTab === "lattice"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>Lattice Geometry (SVP/CVP)</span>
        </button>

        <button
          onClick={() => setSubTab("sandbox")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition-all ${
            subTab === "sandbox"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          <span>Hybrid Encryption Sandbox</span>
        </button>

        <button
          onClick={() => setSubTab("matrix")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium transition-all ${
            subTab === "matrix"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Shor Threat & Security Matrix</span>
        </button>
      </div>

      {/* Render Active Sub-tab Component */}
      {subTab === "kyber" && <KyberSimulator />}
      {subTab === "dilithium" && <DilithiumSimulator />}
      {subTab === "lattice" && <LatticeVisualizer />}
      {subTab === "sandbox" && <HybridEncryptionSandbox />}
      {subTab === "matrix" && <QuantumSecurityMatrix />}
    </div>
  );
};
