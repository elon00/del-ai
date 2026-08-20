import React, { useState } from "react";
import { Play, Pause, SkipForward, Trash2, Dices, Palette, Flame, Sliders, Layers, Sparkles } from "lucide-react";
import { AutomatonRule, AutomatonTheme, PatternPreset } from "../../types";
import { CONWAY_PRESETS } from "../../lib/conwayPresets";

interface AutomatonControlsProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onClear: () => void;
  onRandomize: (density: number) => void;
  speedFps: number;
  onSpeedChange: (speed: number) => void;
  rule: AutomatonRule;
  onRuleChange: (rule: AutomatonRule) => void;
  theme: AutomatonTheme;
  onThemeChange: (theme: AutomatonTheme) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  onLoadPreset: (preset: PatternPreset) => void;
  onOpenAISynthesizer: () => void;
}

export const AutomatonControls: React.FC<AutomatonControlsProps> = ({
  isRunning,
  onToggleRun,
  onStep,
  onClear,
  onRandomize,
  speedFps,
  onSpeedChange,
  rule,
  onRuleChange,
  theme,
  onThemeChange,
  showHeatmap,
  onToggleHeatmap,
  onLoadPreset,
  onOpenAISynthesizer,
}) => {
  const [randomDensity, setRandomDensity] = useState<number>(0.2);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const ruleDescriptions: Record<AutomatonRule, { label: string; desc: string }> = {
    "B3/S23": { label: "Conway's Life (B3/S23)", desc: "Standard universe. Birth: 3 neighbors, Survival: 2 or 3." },
    "B36/S23": { label: "HighLife (B36/S23)", desc: "Includes self-replicating patterns (Replicator)." },
    "B3678/S34678": { label: "Day & Night (B3678/S34678)", desc: "Symmetric inversion: patterns evolve in dark or light." },
    "B2/S": { label: "Seeds (B2/S)", desc: "All living cells die each turn; birth requires 2. Hyper-chaotic." },
    "B34/S34": { label: "34 Life (B34/S34)", desc: "Forms dense rectangular gliders and organic mazes." },
    "B35678/S5678": { label: "Diamoeba (B35678/S5678)", desc: "Forms large oscillating cellular amoebae." },
    "B1357/S1357": { label: "Sierpinski Replicator (B1357/S1357)", desc: "Generates recursive 2D Sierpinski fractal triangles." },
  };

  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    const preset = CONWAY_PRESETS.find((p) => p.id === id);
    if (preset) {
      onLoadPreset(preset);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Primary Simulation Flow Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            id="btn-play-pause"
            onClick={onToggleRun}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Evolve</span>
              </>
            )}
          </button>

          <button
            id="btn-step-forward"
            onClick={onStep}
            disabled={isRunning}
            title="Step Forward 1 Generation"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 border border-slate-700/60 transition-colors"
          >
            <SkipForward className="h-4 w-4" />
            <span>Step</span>
          </button>

          <button
            id="btn-clear-grid"
            onClick={onClear}
            title="Clear all living cells"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Sliders className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Speed:</span>
          <input
            type="range"
            min="1"
            max="60"
            value={speedFps}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-24 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono text-emerald-400 font-bold w-12 text-right">{speedFps} FPS</span>
        </div>

        {/* Randomize Cluster Button & Density */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-random-seed"
            onClick={() => onRandomize(randomDensity)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
          >
            <Dices className="h-4 w-4 text-emerald-400" />
            <span>Randomize ({Math.round(randomDensity * 100)}%)</span>
          </button>
          <input
            type="range"
            min="0.05"
            max="0.60"
            step="0.05"
            value={randomDensity}
            onChange={(e) => setRandomDensity(Number(e.target.value))}
            className="w-16 accent-emerald-500 cursor-pointer"
            title="Adjust spawn density"
          />
        </div>
      </div>

      {/* Preset Library & AI Synthesizer Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Preset Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Pattern Library</span>
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Select iconic pattern...</option>
            {CONWAY_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Ruleset Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>Physics Ruleset</span>
          </label>
          <select
            value={rule}
            onChange={(e) => onRuleChange(e.target.value as AutomatonRule)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
          >
            {Object.entries(ruleDescriptions).map(([rKey, rVal]) => (
              <option key={rKey} value={rKey}>
                {rVal.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Palette className="h-3.5 w-3.5 text-pink-400" />
            <span>Canvas Visual Theme</span>
          </label>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as AutomatonTheme)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-pink-500"
          >
            <option value="cyber-matrix">Cyber Matrix (Emerald & Obsidian)</option>
            <option value="quantum-cyan">Quantum Cyan (Electric Blue)</option>
            <option value="bioluminescent">Bioluminescent (Neon Magenta/Purple)</option>
            <option value="amber-terminal">Amber Terminal (Retro CRT Phosphor)</option>
            <option value="monochrome-slate">Monochrome Slate (Minimal High-Contrast)</option>
          </select>
        </div>

        {/* Action Buttons: Heatmap & AI Generator */}
        <div className="flex items-end space-x-2">
          <button
            onClick={onToggleHeatmap}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-medium border transition-all ${
              showHeatmap
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>{showHeatmap ? "Heatmap Active" : "Heatmap View"}</span>
          </button>

          <button
            onClick={onOpenAISynthesizer}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Synthesizer</span>
          </button>
        </div>
      </div>

      {/* Ruleset Description pill */}
      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-300 mr-2">{ruleDescriptions[rule]?.label}:</span>
          <span>{ruleDescriptions[rule]?.desc}</span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Rule: {rule}
        </span>
      </div>
    </div>
  );
};
