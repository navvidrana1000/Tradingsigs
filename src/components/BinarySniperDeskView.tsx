import React, { useState, useEffect } from "react";
import {
  Timer,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Sliders,
  Percent,
} from "lucide-react";
import { UnifiedScannedAsset } from "../data/universe84";
import { BinaryExpiryHorizon } from "../utils/quantMath";

interface BinarySniperDeskViewProps {
  assets: UnifiedScannedAsset[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showAllAssets: boolean;
  onToggleShowAll: (showAll: boolean) => void;
  onSelectAsset: (asset: UnifiedScannedAsset) => void;
  selectedAsset: UnifiedScannedAsset | null;
  assetClassFilter?: string;
  onAssetClassFilterChange?: (cat: string) => void;
}

export const BinarySniperDeskView: React.FC<BinarySniperDeskViewProps> = ({
  assets,
  searchQuery,
  onSearchChange,
  showAllAssets,
  onToggleShowAll,
  onSelectAsset,
  selectedAsset,
  assetClassFilter = "ALL",
  onAssetClassFilterChange,
}) => {
  const [expiryFilter, setExpiryFilter] = useState<"ALL" | BinaryExpiryHorizon>("ALL");
  const [secondsTick, setSecondsTick] = useState<number>(0);

  // Live timer tick for countdown displays
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsTick((prev) => (prev + 1) % 3600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isSearchActive = searchQuery.trim().length > 0;

  // Filter assets for binary desk
  const binaryAssets = assets.filter((asset) => {
    if (assetClassFilter !== "ALL" && asset.assetClass !== assetClassFilter) {
      return false;
    }
    // Expiry filter
    if (expiryFilter !== "ALL" && asset.binarySignal.expiryHorizon !== expiryFilter) {
      return false;
    }
    return true;
  });

  const highConvictionBinaryCount = binaryAssets.filter(
    (a) => a.binarySignal.confidenceScore >= 75.0
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold shadow-md shadow-cyan-500/20">
            <Timer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Binary Options Sniper Desk
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                1m / 3m / 5m Fixed-Time Expiries
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isSearchActive
                ? `Omnisearch filter active for "${searchQuery}" (Bypassing 75% filter)`
                : `Showing ${binaryAssets.length} ${showAllAssets ? "total scanned assets" : "high-conviction setups (≥75%)"} governed by Brownian Bridge + O-U Math`}
            </p>
          </div>
        </div>

        {/* Show All Toggle */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={showAllAssets}
              onChange={(e) => onToggleShowAll(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span>Show All 84 Markets (Include &lt;75% Neutral)</span>
          </label>
        </div>
      </div>

      {/* Broker-Style Asset Class Category Tabs with Live Signal Counters */}
      {onAssetClassFilterChange && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { id: "ALL", label: "All Asset Classes", icon: "🌐" },
            { id: "CRYPTO", label: "Crypto (30)", icon: "🪙" },
            { id: "FOREX", label: "Forex (24)", icon: "💱" },
            { id: "COMMODITIES", label: "Commodities (10)", icon: "🛢️" },
            { id: "INDEX_STOCK", label: "Indices & CFDs (20)", icon: "📈" },
          ].map((tab) => {
            const count =
              tab.id === "ALL"
                ? assets.filter((a) => a.binarySetup.active || a.binarySignal.confidenceScore >= 75.0).length
                : assets.filter(
                    (a) =>
                      a.assetClass === tab.id &&
                      (a.binarySetup.active || a.binarySignal.confidenceScore >= 75.0)
                  ).length;
            const isSelected = assetClassFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onAssetClassFilterChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-slate-950/70 text-cyan-300 border border-cyan-400/40"
                      : count > 0
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Expiry Sub-Tabs & Mathematical Explainer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/80">
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {[
            { id: "ALL", label: "All Expiries", count: binaryAssets.length },
            {
              id: "1m",
              label: "1-Min Turbo",
              desc: "τ ≤ 1.2m",
              count: binaryAssets.filter((a) => a.binarySignal.expiryHorizon === "1m").length,
            },
            {
              id: "3m",
              label: "3-Min Sniper",
              desc: "1.2m < τ ≤ 3.2m",
              count: binaryAssets.filter((a) => a.binarySignal.expiryHorizon === "3m").length,
            },
            {
              id: "5m",
              label: "5-Min Structural",
              desc: "τ > 3.2m",
              count: binaryAssets.filter((a) => a.binarySignal.expiryHorizon === "5m").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setExpiryFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                expiryFilter === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 px-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Microstructure: dS = -θ(S-VWAP)dt + σdW</span>
        </div>
      </div>

      {/* Binary Sniper Cards / Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Instrument</th>
                <th className="py-3 px-4 font-bold">Binary Action & Strike</th>
                <th className="py-3 px-4 font-bold">Auto Expiry Horizon</th>
                <th className="py-3 px-4 font-bold">Execution Timers</th>
                <th className="py-3 px-4 font-bold">O-U Win Probability</th>
                <th className="py-3 px-4 font-bold">Quant Microstructure</th>
                <th className="py-3 px-4 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {binaryAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-mono text-xs">
                    {isSearchActive
                      ? `No binary setup matches "${searchQuery}".`
                      : "No binary options signals currently meet the ≥75% confidence threshold. Toggle 'Show All' above to view neutral setups."}
                  </td>
                </tr>
              ) : (
                binaryAssets.map((asset) => {
                  const bin = asset.binarySignal;
                  const isCall = bin.action.includes("CALL");
                  const isSelected = selectedAsset?.symbol === asset.symbol;

                  // Timers derived from tick & symbol hash for realistic countdowns
                  const symbolHash = asset.symbol.charCodeAt(0) + asset.symbol.charCodeAt(1);
                  const entrySecondsLeft = Math.max(1, 45 - ((secondsTick + symbolHash) % 45));
                  const expiryMinutesTotal = bin.expiryHorizon === "1m" ? 1 : bin.expiryHorizon === "3m" ? 3 : 5;
                  const expirySecondsLeft = Math.max(5, (expiryMinutesTotal * 60) - ((secondsTick + symbolHash * 2) % (expiryMinutesTotal * 60)));
                  const expiryMins = Math.floor(expirySecondsLeft / 60);
                  const expirySecs = expirySecondsLeft % 60;

                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => onSelectAsset(asset)}
                      className={`transition-colors cursor-pointer group hover:bg-slate-800/50 ${
                        isSelected ? "bg-slate-800/70 border-l-2 border-cyan-500" : ""
                      }`}
                    >
                      {/* Column 1: Instrument */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-xs text-cyan-400">
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                                {asset.symbol}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                                {asset.categoryLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {asset.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Binary Action & Strike */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-black text-xs uppercase tracking-wide border shadow-sm ${
                                isCall
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10"
                                  : "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/10"
                              }`}
                            >
                              {isCall ? (
                                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                              )}
                              {isCall ? "BUY CALL (HIGHER)" : "BUY PUT (LOWER)"}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-slate-300">
                            Strike: <strong className="text-white">${bin.strikePrice.toLocaleString(undefined, { minimumFractionDigits: asset.precision, maximumFractionDigits: asset.precision })}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Auto Expiry Horizon */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono text-[11px] font-bold">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {bin.expiryHorizon === "1m" ? "1 MINUTE (Turbo)" : bin.expiryHorizon === "3m" ? "3 MINUTES (Sniper)" : "5 MINUTES (Structural)"}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400">
                            O-U Half-Life: <span className="text-slate-200 font-semibold">{bin.ouHalfLife}m</span> (θ: {bin.ouTheta})
                          </p>
                        </div>
                      </td>

                      {/* Column 4: Execution Timers */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 font-mono text-xs">
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Entry Window: <strong>00:{String(entrySecondsLeft).padStart(2, "0")}s</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-cyan-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>Expiry: <strong>{String(expiryMins).padStart(2, "0")}:{String(expirySecs).padStart(2, "0")}s</strong></span>
                          </div>
                        </div>
                      </td>

                      {/* Column 5: O-U Win Probability */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5 min-w-[130px]">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span
                              className={`font-black ${
                                bin.confidenceScore >= 80
                                  ? "text-emerald-400"
                                  : bin.confidenceScore >= 75
                                  ? "text-cyan-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {bin.confidenceScore.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Φ(z): {bin.terminalProbability.toFixed(3)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                bin.confidenceScore >= 80
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                  : bin.confidenceScore >= 75
                                  ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                  : "bg-slate-600"
                              }`}
                              style={{ width: `${Math.min(bin.confidenceScore, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Quant Microstructure */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        <div className="space-y-0.5">
                          <p>
                            Drift μ: <span className={bin.microstructureDrift >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{(bin.microstructureDrift * 100).toFixed(2)}%</span>
                          </p>
                          <p>
                            G-K Vol: <span className="text-slate-200">{(bin.realizedVol * 100).toFixed(2)}%</span>
                          </p>
                        </div>
                      </td>

                      {/* Column 7: Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(asset);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold transition-all inline-flex items-center gap-1 group-hover:translate-x-0.5"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
