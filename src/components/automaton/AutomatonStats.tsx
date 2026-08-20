import React from "react";
import { Activity, Zap, TrendingUp, Atom, ShieldAlert } from "lucide-react";

interface AutomatonStatsProps {
  generation: number;
  population: number;
  historyPop: number[];
  entropy: number;
  density: number;
  totalCells: number;
  onBridgeToPQC?: () => void;
}

export const AutomatonStats: React.FC<AutomatonStatsProps> = ({
  generation,
  population,
  historyPop,
  entropy,
  density,
  totalCells,
  onBridgeToPQC,
}) => {
  // Determine state dynamics
  let statusText = "Stable Vacuum";
  let statusColor = "text-slate-400 bg-slate-800/50 border-slate-700";

  if (population === 0 && generation > 0) {
    statusText = "Extinction / Inactive";
    statusColor = "text-rose-400 bg-rose-950/40 border-rose-800/50";
  } else if (entropy > 0.6) {
    statusText = "High Entropy Chaos";
    statusColor = "text-purple-400 bg-purple-950/40 border-purple-800/50";
  } else if (population > 0 && historyPop.length > 6) {
    const recent = historyPop.slice(-6);
    const variance = Math.max(...recent) - Math.min(...recent);
    if (variance === 0) {
      statusText = "Static Equilibrium";
      statusColor = "text-emerald-400 bg-emerald-950/40 border-emerald-800/50";
    } else if (variance < 10) {
      statusText = "Periodic Oscillator";
      statusColor = "text-cyan-400 bg-cyan-950/40 border-cyan-800/50";
    } else {
      statusText = "Dynamic Morphogenesis";
      statusColor = "text-amber-400 bg-amber-950/40 border-amber-800/50";
    }
  }

  // Mini sparkline generation
  const maxPop = Math.max(1, ...historyPop, 50);
  const sparkPoints = historyPop.map((val, idx) => {
    const x = (idx / Math.max(1, historyPop.length - 1)) * 120;
    const y = 30 - (val / maxPop) * 26;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Metric 1: Generation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Generation</span>
          <Zap className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
          {generation.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Discrete time steps</div>
      </div>

      {/* Metric 2: Living Population */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Live Cells</span>
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-emerald-400">
            {population.toLocaleString()}
          </span>
          {/* Mini Sparkline */}
          {historyPop.length > 2 && (
            <svg className="w-16 h-7 overflow-visible">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                points={sparkPoints}
              />
            </svg>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {((population / totalCells) * 100).toFixed(2)}% of total grid
        </div>
      </div>

      {/* Metric 3: Shannon Entropy */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Shannon Entropy</span>
          <Atom className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="mt-2 font-mono text-2xl font-bold text-cyan-400">
          {entropy.toFixed(3)} <span className="text-xs font-normal text-slate-400">bits</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Information complexity index</div>
      </div>

      {/* Metric 4: Dynamic State */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>System Regime</span>
          <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold border ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Equilibrium classification</div>
      </div>

      {/* Metric 5: Bridge Trigger */}
      <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-800/40 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-indigo-300">
          <span>PQC Seeder</span>
          <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="mt-2">
          {onBridgeToPQC && (
            <button
              onClick={onBridgeToPQC}
              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1"
            >
              <span>Seed PQC Lattice</span>
            </button>
          )}
        </div>
        <div className="text-[11px] text-indigo-300/70 mt-1">Extract live entropy vector</div>
      </div>
    </div>
  );
};
