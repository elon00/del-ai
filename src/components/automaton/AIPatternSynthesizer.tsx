import React, { useState } from "react";
import { Sparkles, X, Check, Loader2, Wand2, Info } from "lucide-react";

interface AIPatternSynthesizerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPattern: (cells: [number, number][], name: string) => void;
}

export const AIPatternSynthesizer: React.FC<AIPatternSynthesizerProps> = ({
  isOpen,
  onClose,
  onApplyPattern,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPattern, setGeneratedPattern] = useState<{
    name: string;
    description: string;
    rule: string;
    cells: [number, number][];
    properties?: {
      symmetry?: string;
      estimatedPeriod?: string;
      entropyRating?: string;
    };
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const suggestions = [
    "Symmetric quad-oscillator matrix with pulsating core",
    "Glider squadron on diagonal collision vector",
    "High-entropy organic methuselah seed",
    "Dense defensive perimeter with stable eater blocks",
    "Quantum superposition dual-resonator",
  ];

  const handleGenerate = async (queryText?: string) => {
    const textToUse = queryText || prompt;
    if (!textToUse.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/automaton/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToUse }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate pattern from Del AI server.");
      }

      const data = await res.json();
      setGeneratedPattern(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate automaton pattern.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedPattern && generatedPattern.cells) {
      onApplyPattern(generatedPattern.cells, generatedPattern.name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Del AI Pattern Synthesizer
              </h3>
              <p className="text-xs text-slate-400">
                Generate novel cellular automata topologies using AI reasoning
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Prompt Input Form */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center justify-between">
              <span>Describe the desired automaton architecture:</span>
              <span className="text-slate-500 font-mono text-[11px]">English only</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. Asymmetric chaotic cluster that emits escaping gliders..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Prompts */}
          <div className="space-y-1.5">
            <span className="text-slate-400 font-medium">Quick Concept Starters:</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(s);
                    handleGenerate(s);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedPattern && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-purple-300">
                    {generatedPattern.name}
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {generatedPattern.description}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-[11px] font-mono">
                  {generatedPattern.cells.length} Active Cells
                </span>
              </div>

              {generatedPattern.properties && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Symmetry:</span>
                    <span className="font-semibold text-slate-200">
                      {generatedPattern.properties.symmetry || "Asymmetric"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Period:</span>
                    <span className="font-semibold text-slate-200">
                      {generatedPattern.properties.estimatedPeriod || "Dynamic"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Entropy Rating:</span>
                    <span className="font-semibold text-emerald-400">
                      {generatedPattern.properties.entropyRating || "High"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Seed will be centered on current viewport</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!generatedPattern}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Deploy to Grid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
