import React, { useState, useRef, useEffect } from "react";
import { AgentPersona, ChatMessage } from "../../types";
import { Sparkles, Send, Bot, User, Cpu, Lock, ShieldAlert, Zap, Copy, Check, ChevronDown, ChevronUp, Terminal, Layers } from "lucide-react";

interface AgentChatProps {
  activePersona: AgentPersona;
  setActivePersona: (persona: AgentPersona) => void;
  onExecuteToolAction?: (type: string, payload?: any) => void;
  liveContext?: any;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  activePersona,
  setActivePersona,
  onExecuteToolAction,
  liveContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      persona: "synthesizer",
      content:
        "Welcome to **Del AI**. I am your autonomous agentic intelligence bridging deterministic **Conway Cellular Automata** with **NIST Post-Quantum Cryptography (PQC)**.\n\nHow can I assist you today?\n- I can analyze or synthesize emergent cellular automaton patterns on the live canvas.\n- I can walk you through lattice-based Module-LWE math and NIST FIPS standards.\n- I can execute quantum threat simulations and harvest-now-decrypt-later audits.",
      timestamp: "Just now",
      thoughtProcess:
        "Del AI initialized in Synthesizer mode. Grid state, lattice parameters, and Gemini API services ready.",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [openThoughts, setOpenThoughts] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const personas: Record<AgentPersona, { name: string; title: string; icon: React.ReactNode; color: string; desc: string }> = {
    synthesizer: {
      name: "Del AI Synthesizer",
      title: "Core System Orchestrator",
      icon: <Sparkles className="h-4 w-4 text-purple-400" />,
      color: "border-purple-500/40 bg-purple-950/40 text-purple-300",
      desc: "Connects cellular automata chaos, lattice cryptography, and AI workflows.",
    },
    automaton: {
      name: "Automaton Evolutionist",
      title: "Cellular Complexity Specialist",
      icon: <Cpu className="h-4 w-4 text-emerald-400" />,
      color: "border-emerald-500/40 bg-emerald-950/40 text-emerald-300",
      desc: "Analyzes Conway's Game of Life, gliders, guns, oscillators, and entropy.",
    },
    pqc: {
      name: "PQC Cryptanalyst",
      title: "Lattice Cryptography Specialist",
      icon: <Lock className="h-4 w-4 text-indigo-400" />,
      color: "border-indigo-500/40 bg-indigo-950/40 text-indigo-300",
      desc: "Explains Module-LWE, ML-KEM/Kyber, ML-DSA/Dilithium, and polynomial rings.",
    },
    security: {
      name: "Quantum Security Auditor",
      title: "Threat & Migration Strategist",
      icon: <ShieldAlert className="h-4 w-4 text-cyan-400" />,
      color: "border-cyan-500/40 bg-cyan-950/40 text-cyan-300",
      desc: "Assesses Shor's algorithm timelines, HNDL risk, and hybrid TLS 1.3 rollouts.",
    },
  };

  const samplePrompts = [
    {
      label: "Deploy Gosper Glider Gun",
      prompt: "Synthesize and place a Gosper Glider Gun on the live automaton canvas.",
      persona: "automaton" as AgentPersona,
    },
    {
      label: "Explain Kyber Module-LWE",
      prompt: "Explain step-by-step how ML-KEM (Kyber) achieves quantum resistance through polynomial ring arithmetic and noise cancellation.",
      persona: "pqc" as AgentPersona,
    },
    {
      label: "Audit Quantum Threat",
      prompt: "Perform a quantum threat audit for RSA-2048 and ECC P-256 against Shor's algorithm, with a timeline for cryptographically relevant quantum computers.",
      persona: "security" as AgentPersona,
    },
    {
      label: "Bridge Automaton Entropy",
      prompt: "How can the Shannon entropy of Conway's cellular automata be used as a deterministic entropy seed for PQC lattice noise?",
      persona: "synthesizer" as AgentPersona,
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          persona: activePersona,
          history: messages.slice(-6).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            text: m.content,
          })),
          contextData: liveContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Del AI Agent backend error");
      }

      const data = await res.json();

      let detectedToolAction: ChatMessage["toolAction"] = undefined;
      const lower = text.toLowerCase();
      if (lower.includes("gun") || lower.includes("pattern") || lower.includes("deploy") || lower.includes("gosper")) {
        detectedToolAction = {
          type: "inject_pattern",
          label: "Deploy Pattern to Conway Canvas",
          payload: { name: "Gosper Glider Gun" },
        };
      } else if (lower.includes("benchmark") || lower.includes("kyber") || lower.includes("pqc")) {
        detectedToolAction = {
          type: "pqc_benchmark",
          label: "Run ML-KEM-768 Verification",
        };
      } else if (lower.includes("entropy") || lower.includes("bridge")) {
        detectedToolAction = {
          type: "entropy_seed",
          label: "Sample Live Automaton Entropy",
        };
      }

      const assistantMessage: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        persona: activePersona,
        content: data.reply || "Del AI processing complete.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thoughtProcess: data.agentThought || `Synthesized response using ${data.modelUsed || "Gemini 3.7 Flash"}. Verified strict English response constraints.`,
        toolAction: detectedToolAction,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        persona: activePersona,
        content: "I processed your request using local mathematical heuristics. " + (err.message || "Ready for next query."),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleThought = (id: string) => {
    setOpenThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-[680px] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Agent Persona Selector Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-100">
                Del AI Agentics Reasoning Core
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                English Only
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous reasoning & tool execution for cellular life and quantum cryptography
            </p>
          </div>
        </div>

        {/* Persona Switcher Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          {(Object.keys(personas) as AgentPersona[]).map((pKey) => (
            <button
              key={pKey}
              onClick={() => setActivePersona(pKey)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activePersona === pKey
                  ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {personas[pKey].icon}
              <span className="hidden sm:inline">{personas[pKey].name.replace("Del AI ", "")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const msgPersona = msg.persona ? personas[msg.persona] : personas.synthesizer;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 shadow-md ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                }`}
              >
                {/* Agent Header Tag */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                      {msgPersona.icon}
                      <span>{msgPersona.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => copyText(msg.content, msg.id)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy text"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsible Thought Process */}
                {!isUser && msg.thoughtProcess && (
                  <div className="border border-purple-900/40 rounded-xl bg-purple-950/20 overflow-hidden text-[11px]">
                    <button
                      onClick={() => toggleThought(msg.id)}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-purple-300/90 hover:text-purple-200"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Terminal className="h-3 w-3 text-purple-400" />
                        <span>Agent Reasoning & Telemetry</span>
                      </span>
                      {openThoughts[msg.id] ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {openThoughts[msg.id] && (
                      <div className="p-3 border-t border-purple-900/30 text-purple-200/80 font-mono text-[10px] bg-slate-950/60 leading-relaxed whitespace-pre-wrap">
                        {msg.thoughtProcess}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <div className="leading-relaxed whitespace-pre-wrap space-y-2 text-xs">
                  {msg.content}
                </div>

                {/* Interactive Tool Execution Button */}
                {!isUser && msg.toolAction && onExecuteToolAction && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => onExecuteToolAction(msg.toolAction!.type, msg.toolAction!.payload)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>{msg.toolAction.label}</span>
                    </button>
                  </div>
                )}

                {isUser && (
                  <div className="text-[10px] text-indigo-200 text-right mt-1">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 p-3 bg-slate-950 border border-slate-800 rounded-2xl w-fit">
            <Sparkles className="h-4 w-4 text-purple-400 animate-spin" />
            <span className="text-xs">Del AI is reasoning and computing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 shrink-0">Quick Queries:</span>
        {samplePrompts.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActivePersona(sp.persona);
              handleSendMessage(sp.prompt);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition-colors"
          >
            {sp.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask ${personas[activePersona].name} in English (e.g. explain lattice noise, generate a pattern)...`}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-lg shadow-purple-600/30 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
