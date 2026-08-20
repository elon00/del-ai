import React from "react";
import { Cpu, ShieldCheck, Sparkles, Binary, Lock, RefreshCw } from "lucide-react";
import { AgentPersona } from "../types";

interface HeaderProps {
  activeTab: "automaton" | "agent" | "pqc" | "bridge";
  setActiveTab: (tab: "automaton" | "agent" | "pqc" | "bridge") => void;
  activePersona: AgentPersona;
  setActivePersona: (persona: AgentPersona) => void;
  entropyValue: number;
  aliveCount: number;
  onResetWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activePersona,
  setActivePersona,
  entropyValue,
  aliveCount,
  onResetWorkspace,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Binary className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300">
                  Del AI
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  Automaton · Agentics · PQC
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Emergent Cellular Automata & NIST Post-Quantum Cryptography Suite
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-sm">
            <button
              id="nav-tab-automaton"
              onClick={() => setActiveTab("automaton")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "automaton"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span className="hidden md:inline">Automaton Lab</span>
            </button>

            <button
              id="nav-tab-pqc"
              onClick={() => setActiveTab("pqc")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "pqc"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Lock className="h-4 w-4" />
              <span className="hidden md:inline">PQC Quantum Core</span>
            </button>

            <button
              id="nav-tab-bridge"
              onClick={() => setActiveTab("bridge")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "bridge"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden md:inline">Entropy Bridge</span>
            </button>

            <button
              id="nav-tab-agent"
              onClick={() => setActiveTab("agent")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "agent"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Del AI Agent</span>
            </button>
          </nav>

          {/* Right Status indicators */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">Entropy:</span>
              <span className="font-mono font-semibold text-emerald-400">{entropyValue.toFixed(3)} bits</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Alive:</span>
              <span className="font-mono font-semibold text-cyan-400">{aliveCount}</span>
            </div>

            {onResetWorkspace && (
              <button
                onClick={onResetWorkspace}
                title="Reset Workspace"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
