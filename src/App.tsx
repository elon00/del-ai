import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  TrendingUp, 
  ShieldCheck, 
  Play, 
  Square, 
  RefreshCw, 
  Zap, 
  ExternalLink, 
  Award, 
  DollarSign, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Settings, 
  BookOpen, 
  Cpu, 
  BarChart3, 
  Activity,
  Radio,
  Sliders,
  Check
} from "lucide-react";
import { DelphiMarket, TradeOpportunity, PositionRecord, BotState, BotConfig, MarketForecast } from "./delphi/types";

export default function App() {
  const [botState, setBotState] = useState<BotState>({
    status: "IDLE",
    lastScanTime: null,
    bankroll: 1000.0,
    allocatedCapital: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalTrades: 0,
    winCount: 0,
    lossCount: 0,
    activePositionsCount: 0,
    logs: []
  });

  const [config, setConfig] = useState<BotConfig>({
    network: "competition-testnet",
    signerType: "private_key",
    walletAddress: "0x0000000000000000000000000000000000000000",
    privateKey: "",
    delphiApiKey: "",
    geminiApiKey: "",
    dryRun: false,
    minEdge: 0.05,
    kellyMultiplier: 0.30,
    maxSingleBetPct: 0.12,
    maxTotalExposurePct: 0.80,
    minConfidence: 0.60,
    pollIntervalMs: 180000,
    autoRedeem: true,
  });

  const [isLoopRunning, setIsLoopRunning] = useState<boolean>(false);
  const [markets, setMarkets] = useState<DelphiMarket[]>([]);
  const [forecastsMap, setForecastsMap] = useState<Record<string, MarketForecast>>({});
  const [opportunities, setOpportunities] = useState<TradeOpportunity[]>([]);
  const [positions, setPositions] = useState<PositionRecord[]>([]);

  const [activeTab, setActiveTab] = useState<"markets" | "positions" | "logs" | "settings" | "guide">("markets");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Settings inputs
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>(config.geminiApiKey);
  const [privateKeyInput, setPrivateKeyInput] = useState<string>(config.privateKey);
  const [delphiApiKeyInput, setDelphiApiKeyInput] = useState<string>(config.delphiApiKey);
  const [saveMessage, setSaveMessage] = useState<string>("");

  const fetchState = async () => {
    try {
      const res = await fetch("/api/delphi/state");
      if (res.ok) {
        const data = await res.json();
        if (data.state) setBotState(data.state);
        if (data.config) {
          setConfig(data.config);
          if (!geminiKeyInput && data.config.geminiApiKey) setGeminiKeyInput(data.config.geminiApiKey);
          if (!delphiApiKeyInput && data.config.delphiApiKey) setDelphiApiKeyInput(data.config.delphiApiKey);
          if (!privateKeyInput && data.config.privateKey) setPrivateKeyInput(data.config.privateKey);
        }
        if (data.isLoopRunning !== undefined) setIsLoopRunning(data.isLoopRunning);
        if (data.markets) setMarkets(data.markets);
        if (data.opportunities) setOpportunities(data.opportunities);
        if (data.positions) setPositions(data.positions);
        if (data.forecasts) {
          const fMap: Record<string, MarketForecast> = {};
          data.forecasts.forEach((item: any) => {
            fMap[item.id] = item.forecast;
          });
          setForecastsMap(fMap);
        }
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoLoop = async () => {
    setIsProcessing(true);
    try {
      const endpoint = isLoopRunning ? "/api/delphi/stop" : "/api/delphi/start";
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsLoopRunning(data.isLoopRunning);
      }
    } catch (err) {
      console.error(err);
    }
    await fetchState();
    setIsProcessing(false);
  };

  const handleRunSingleCycle = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/delphi/cycle", { method: "POST" });
      await fetchState();
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const handleManualTrade = async (opp: TradeOpportunity) => {
    setIsProcessing(true);
    try {
      await fetch("/api/delphi/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: opp })
      });
      await fetchState();
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...config,
      geminiApiKey: geminiKeyInput.trim(),
      privateKey: privateKeyInput.trim(),
      delphiApiKey: delphiApiKeyInput.trim(),
      dryRun: false // Enforced Live Reality Mode
    };
    try {
      await fetch("/api/delphi/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updated })
      });
      setSaveMessage("Configuration successfully saved to Live Reality Mode!");
      setTimeout(() => setSaveMessage(""), 3500);
      await fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPnL = botState.realizedPnL + botState.unrealizedPnL;

  const displayMarkets = markets.length > 0 
    ? markets 
    : [
        {
          id: "delphi-comp-01",
          question: "Will the US Federal Reserve cut interest rates at the next FOMC meeting?",
          category: "Economics" as const,
          outcomes: [
            { id: "cut_yes", name: "Yes (Cut)", price: 0.38, shares: 1250 },
            { id: "cut_no", name: "No (Hold/Hike)", price: 0.62, shares: 2040 }
          ],
          totalVolume: 3290,
          resolved: false
        },
        {
          id: "delphi-comp-02",
          question: "Will Bitcoin (BTC) exceed $105,000 before the end of August 2026?",
          category: "Crypto" as const,
          outcomes: [
            { id: "btc_yes", name: "Yes (>= $105k)", price: 0.31, shares: 1800 },
            { id: "btc_no", name: "No (< $105k)", price: 0.69, shares: 4100 }
          ],
          totalVolume: 5900,
          resolved: false
        },
        {
          id: "delphi-comp-03",
          question: "Which LLM architecture will hold #1 rank on LMSYS Chatbot Arena by Sept 1?",
          category: "Technology" as const,
          outcomes: [
            { id: "m_gemini", name: "Google Gemini (Ultra/Flash)", price: 0.44, shares: 1400 },
            { id: "m_openai", name: "OpenAI (GPT-5/o3)", price: 0.32, shares: 1020 },
            { id: "m_claude", name: "Anthropic Claude (3.7/Opus)", price: 0.18, shares: 580 },
            { id: "m_other", name: "Other / DeepSeek", price: 0.06, shares: 190 }
          ],
          totalVolume: 3190,
          resolved: false
        }
      ];

  const filteredMarkets = selectedCategory === "All" 
    ? displayMarkets 
    : displayMarkets.filter(m => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Main Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">Delphi Alpha Arena</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> $10,000 Prize Agent
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> LIVE ON-CHAIN (Gensyn Testnet)
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Information Market Forecaster • LMSR Slippage & Kelly Engine</p>
            </div>
          </div>

          {/* Prominent Header Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunSingleCycle}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2 transition disabled:opacity-50 border border-slate-700 shadow"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isProcessing ? "Analyzing..." : "Scan & Trade Once"}</span>
            </button>

            <button
              onClick={handleToggleAutoLoop}
              disabled={isProcessing}
              className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide flex items-center space-x-2 transition shadow-xl ${
                isLoopRunning
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 animate-pulse ring-2 ring-rose-400/50"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/50"
              }`}
            >
              {isLoopRunning ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP 24/7 BOT</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START 24/7 AUTONOMOUS BOT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Bot Control & Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className={`w-3.5 h-3.5 rounded-full ${
              isLoopRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`} />
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trading Engine State</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isLoopRunning ? "🟢 24/7 AUTONOMOUS TRADING ACTIVE" : "🟡 BOT READY (IDLE)"}</span>
                <span className="text-xs font-normal text-slate-400">({botState.status})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button
              onClick={handleToggleAutoLoop}
              className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                isLoopRunning
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              }`}
            >
              {isLoopRunning ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>PAUSE TRADING BOT</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START 24/7 AUTONOMOUS BOT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Key Portfolio Metrics Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Available Bankroll</span>
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {botState.bankroll.toFixed(1)} <span className="text-xs font-medium text-slate-400">$TST</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Capital Deployed</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 mt-1">
              {botState.allocatedCapital.toFixed(1)} <span className="text-xs font-medium text-slate-400">$TST</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Total P&L</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-lg font-bold mt-1 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnL >= 0 ? `+${totalPnL.toFixed(1)}` : totalPnL.toFixed(1)} <span className="text-xs font-medium text-slate-400">$TST</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Active Positions</span>
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {botState.activePositionsCount} <span className="text-xs text-slate-400 font-normal">({botState.winCount} Won / {botState.lossCount} Lost)</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Execution Network</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-emerald-300 mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Gensyn (Chain 685685)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <div className="flex space-x-1 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("markets")}
            className={`px-4 py-2.5 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "markets"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Market Alpha Radar ({displayMarkets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("positions")}
            className={`px-4 py-2.5 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "positions"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Positions & Settlements ({positions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "logs"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>AI Brain Activity Logs ({botState.logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "settings"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Risk & Keys Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-4 py-2.5 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "guide"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Guide</span>
          </button>
        </div>

        {/* TAB 1: MARKETS & ALPHA RADAR */}
        {activeTab === "markets" && (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium mr-1">Categories:</span>
              {["All", "Politics", "Economics", "Sports", "Crypto", "Technology"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg transition font-medium ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Markets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMarkets.map((market) => {
                const forecast = forecastsMap[market.id];
                const marketOpps = opportunities.filter(o => o.marketId === market.id);

                return (
                  <div key={market.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {market.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Vol: {market.totalVolume} $TST
                        </span>
                      </div>

                      <h3 className="font-semibold text-white text-base leading-snug mb-3">
                        {market.question}
                      </h3>

                      {forecast && (
                        <div className="bg-slate-950/60 rounded-lg p-2.5 mb-3 border border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between text-indigo-300 font-semibold mb-1">
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" /> AI Superforecaster Confidence:
                            </span>
                            <span>{(forecast.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-slate-400 italic text-[11px] line-clamp-2">
                            "{forecast.reasoning[0] || 'Calibrated reference class forecast.'}"
                          </p>
                        </div>
                      )}

                      {/* Outcomes Table */}
                      <div className="space-y-2 mb-4">
                        {market.outcomes.map((outcome) => {
                          const fairP = forecast?.estimatedProbabilities[outcome.id];
                          const edge = fairP !== undefined ? fairP - outcome.price : 0;
                          const hasEdge = edge >= config.minEdge;
                          const matchingOpp = marketOpps.find(o => o.outcomeId === outcome.id);

                          return (
                            <div
                              key={outcome.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                hasEdge
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                                  : "bg-slate-950/40 border-slate-800 text-slate-300"
                              }`}
                            >
                              <div className="flex-1 pr-2">
                                <div className="font-medium text-slate-200 flex items-center gap-1.5">
                                  {outcome.name}
                                  {hasEdge && (
                                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold uppercase">
                                      Alpha +{(edge * 100).toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                  Delphi Price: <strong className="text-slate-200">{(outcome.price * 100).toFixed(1)}¢</strong>
                                  {fairP !== undefined && (
                                    <span className="ml-2 text-indigo-300">
                                      AI Fair: <strong>{(fairP * 100).toFixed(1)}%</strong>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                {matchingOpp ? (
                                  <button
                                    onClick={() => handleManualTrade(matchingOpp)}
                                    disabled={isProcessing}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition shadow flex items-center gap-1"
                                  >
                                    <Zap className="w-3 h-3 fill-current" />
                                    Trade {matchingOpp.recommendedAmount.toFixed(0)} $TST
                                  </button>
                                ) : (
                                  <span className="text-slate-500 text-[11px] italic">Neutral</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span>LMSR b: {market.liquidityB || 100}</span>
                      <span className="text-slate-400">AI Oracles Settle 1:0</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: POSITIONS & SETTLEMENTS */}
        {activeTab === "positions" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" /> Open Positions & Live Mark-to-Market
                </h3>
                <span className="text-xs text-slate-400">
                  Winning shares automatically redeem to 1 $TST upon settlement
                </span>
              </div>

              {positions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No active positions yet. Click "Scan & Trade Once" or enable "Start 24/7 Autonomous Bot" to deploy capital!
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {positions.map((pos) => (
                    <div key={pos.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.status === "REDEEMED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                            pos.status === "SETTLED_LOST" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          }`}>
                            {pos.status}
                          </span>
                          <span className="font-bold text-white text-sm">{pos.outcomeName}</span>
                        </div>
                        <p className="text-slate-400 mt-1 font-medium">{pos.marketQuestion}</p>
                        <div className="text-slate-400 text-[11px] mt-1 flex gap-3">
                          <span>Shares: <strong className="text-slate-200">{pos.shares.toFixed(1)}</strong></span>
                          <span>Cost: <strong className="text-slate-200">{pos.costBasis.toFixed(1)} $TST</strong></span>
                          <span>Avg Entry: <strong className="text-slate-200">{(pos.avgEntryPrice * 100).toFixed(1)}¢</strong></span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                        <div className="text-right">
                          <div className="text-slate-400 text-[11px]">Unrealized P&L</div>
                          <div className={`text-sm font-bold ${pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pos.unrealizedPnL >= 0 ? `+${pos.unrealizedPnL.toFixed(1)}` : pos.unrealizedPnL.toFixed(1)} $TST
                          </div>
                        </div>
                        {pos.realizedPnL !== 0 && (
                          <div className="text-right mt-1">
                            <span className="text-[10px] text-slate-400">Realized: </span>
                            <span className={`text-xs font-bold ${pos.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos.realizedPnL >= 0 ? `+${pos.realizedPnL.toFixed(1)}` : pos.realizedPnL.toFixed(1)} $TST
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOGS & BRAIN ACTIVITY */}
        {activeTab === "logs" && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold font-sans">
                <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Superforecaster Execution Logs
              </span>
              <span>Total Logs: {botState.logs.length}</span>
            </div>

            <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto">
              {botState.logs.length === 0 ? (
                <div className="text-slate-600 text-center py-6">No logs available yet. Start the bot to begin.</div>
              ) : (
                botState.logs.map((log) => {
                  const color =
                    log.level === "TRADE" ? "text-emerald-400 bg-emerald-950/20 border-emerald-900/50" :
                    log.level === "ALPHA" ? "text-cyan-300 bg-cyan-950/20 border-cyan-900/50" :
                    log.level === "REDEEM" ? "text-purple-300 bg-purple-950/20 border-purple-900/50" :
                    log.level === "WARN" ? "text-amber-400 bg-amber-950/20 border-amber-900/50" :
                    log.level === "ERROR" ? "text-rose-400 bg-rose-950/20 border-rose-900/50" :
                    "text-slate-300 bg-slate-900/50 border-slate-800";

                  return (
                    <div key={log.id} className={`p-2 rounded border ${color} flex items-start space-x-2`}>
                      <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-bold text-[10px] px-1 py-0.2 rounded bg-black/40 shrink-0">
                        {log.level}
                      </span>
                      <span className="flex-1 break-words">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RISK & SETTINGS */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-amber-400" /> Risk Management & API Credentials
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Configure your credentials for Live On-Chain Reality Trading on Gensyn Testnet.
            </p>

            {saveMessage && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" /> {saveMessage}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Google Gemini API Key (for AI Superforecaster)
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AQ... / AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Wallet Private Key (for Gensyn Testnet Trading)
                </label>
                <input
                  type="password"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Delphi API Key
                </label>
                <input
                  type="text"
                  value={delphiApiKeyInput}
                  onChange={(e) => setDelphiApiKeyInput(e.target.value)}
                  placeholder="16bf28..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Minimum Edge Filter: {(config.minEdge * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.02"
                    max="0.25"
                    step="0.01"
                    value={config.minEdge}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setConfig({ ...config, minEdge: val });
                    }}
                    className="w-full"
                  />
                  <span className="text-[10px] text-slate-500">Only executes trades with edge ≥ {(config.minEdge * 100).toFixed(0)}%</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Fractional Kelly Multiplier: {(config.kellyMultiplier * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.10"
                    max="0.50"
                    step="0.05"
                    value={config.kellyMultiplier}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setConfig({ ...config, kellyMultiplier: val });
                    }}
                    className="w-full"
                  />
                  <span className="text-[10px] text-slate-500">Optimal bankroll growth with drawdown protection</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold rounded-xl shadow-lg transition"
                >
                  Save Configuration (Live Reality Mode)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: OFFICIAL GUIDE */}
        {activeTab === "guide" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Award className="w-6 h-6 text-amber-400" /> Delphi Agent Arena: Official Competition Architecture
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Autonomous agent trading on Gensyn's Logarithmic Market Scoring Rule (LMSR) prediction protocol. Ranked strictly by Profit & Loss ($TST) across official competition markets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> 1. Cross-Market Alpha
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Fetches live odds from Polymarket & Kalshi APIs to spot mispricings on Delphi LMSR contracts instantly.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> 2. AI Superforecaster
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Uses Gemini AI to evaluate reference classes, base rates, and real-time news to output strictly calibrated outcome probabilities.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> 3. Kelly Sizing & Slippage Engine
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Exact LMSR cost simulation C(q) + Fractional Kelly Criterion to prevent ruin and maximize compounding growth.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 4. Auto-Compounding Redeemer
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Automatically claims 1 $TST for winning shares upon market settlement and immediately redeploys into high-edge opportunities.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Delphi Agent Arena • Powered by Gensyn Protocol & AI Superforecasting
      </footer>
    </div>
  );
}
