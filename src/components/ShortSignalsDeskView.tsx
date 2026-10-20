import React from "react";
import {
  TrendingDown,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  Target,
  Sparkles,
  BarChart2,
  DollarSign,
  Activity,
  Zap,
} from "lucide-react";
import { UnifiedScannedAsset } from "../data/universe84";

interface ShortSignalsDeskViewProps {
  assets: UnifiedScannedAsset[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showAllAssets: boolean;
  onToggleShowAll: (showAll: boolean) => void;
  onSelectAsset: (asset: UnifiedScannedAsset) => void;
  selectedAsset: UnifiedScannedAsset | null;
  assetClassFilter: string;
  onAssetClassFilterChange: (cat: string) => void;
}

export const ShortSignalsDeskView: React.FC<ShortSignalsDeskViewProps> = ({
  assets,
  searchQuery,
  onSearchChange,
  showAllAssets,
  onToggleShowAll,
  onSelectAsset,
  selectedAsset,
  assetClassFilter,
  onAssetClassFilterChange,
}) => {
  const isSearchActive = searchQuery.trim().length > 0;

  // Filter for short desk
  const shortAssets = assets.filter((asset) => {
    if (assetClassFilter !== "ALL" && asset.assetClass !== assetClassFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white font-bold shadow-md shadow-rose-500/20">
            <TrendingDown className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Short Signals Desk
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Spot, CFD & Perps Shorting
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isSearchActive
                ? `Omnisearch filter active for "${searchQuery}" (Bypassing 75% hurdle)`
                : `Showing ${shortAssets.length} ${showAllAssets ? "total scanned short setups" : "high-conviction short setups (≥75%)"} exploiting mean-reversion & delta absorption`}
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
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
            <span>Show All 84 Markets (Include &lt;75% Neutral)</span>
          </label>
        </div>
      </div>

      {/* Broker-Style Asset Class Category Tabs with Live Signal Counters */}
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
              ? assets.filter((a) => a.shortSetup.active || a.shortSignal.confidenceScore >= 75.0).length
              : assets.filter(
                  (a) =>
                    a.assetClass === tab.id &&
                    (a.shortSetup.active || a.shortSignal.confidenceScore >= 75.0)
                ).length;
          const isSelected = assetClassFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onAssetClassFilterChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-rose-600 text-white font-bold shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-slate-950/70 text-rose-300 border border-rose-400/40"
                    : count > 0
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Short Signals Desk Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Instrument</th>
                <th className="py-3 px-4 font-bold">Live Price & 24h</th>
                <th className="py-3 px-4 font-bold">Short Confidence</th>
                <th className="py-3 px-4 font-bold">Execution Levels (Entry / SL / TP1 / TP2)</th>
                <th className="py-3 px-4 font-bold">Risk : Reward</th>
                <th className="py-3 px-4 font-bold">Delta & VWAP Z</th>
                <th className="py-3 px-4 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {shortAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-mono text-xs">
                    {isSearchActive
                      ? `No short setup found matching "${searchQuery}".`
                      : "No short signals currently reach the ≥75% confidence threshold. Toggle 'Show All' above to inspect all setups."}
                  </td>
                </tr>
              ) : (
                shortAssets.map((asset) => {
                  const s = asset.shortSignal;
                  const isSelected = selectedAsset?.symbol === asset.symbol;
                  const isGreen = asset.change24h >= 0;

                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => onSelectAsset(asset)}
                      className={`transition-colors cursor-pointer group hover:bg-slate-800/50 ${
                        isSelected ? "bg-slate-800/70 border-l-2 border-rose-500" : ""
                      }`}
                    >
                      {/* Column 1: Instrument */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-xs text-rose-400">
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
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

                      {/* Column 2: Live Price & 24h */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-sm font-black text-white">
                          ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.precision, maximumFractionDigits: asset.precision })}
                        </div>
                        <div className={`text-[11px] flex items-center gap-0.5 font-bold ${isGreen ? "text-emerald-400" : "text-rose-400"}`}>
                          {isGreen ? "+" : ""}{asset.change24h.toFixed(2)}%
                        </div>
                      </td>

                      {/* Column 3: Short Confidence */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5 min-w-[130px]">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span
                              className={`font-black flex items-center gap-1 ${
                                s.confidenceScore >= 80
                                  ? "text-rose-400"
                                  : s.confidenceScore >= 75
                                  ? "text-amber-400"
                                  : "text-slate-400"
                              }`}
                            >
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              {s.confidenceScore.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.confidenceScore >= 75 ? "HIGH-CONV" : "NEUTRAL"}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                s.confidenceScore >= 80
                                  ? "bg-gradient-to-r from-rose-500 to-amber-500"
                                  : s.confidenceScore >= 75
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                  : "bg-slate-600"
                              }`}
                              style={{ width: `${Math.min(s.confidenceScore, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Execution Levels */}
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          <span className="text-slate-400">
                            Entry: <strong className="text-cyan-400">${s.entryPrice.toFixed(asset.precision)}</strong>
                          </span>
                          <span className="text-slate-400">
                            Stop: <strong className="text-rose-400">${s.stopLoss.toFixed(asset.precision)}</strong>
                          </span>
                          <span className="text-slate-400">
                            TP1 (70%): <strong className="text-emerald-400">${s.tp1.toFixed(asset.precision)}</strong>
                          </span>
                          <span className="text-slate-400">
                            TP2: <strong className="text-amber-400">${s.tp2.toFixed(asset.precision)}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Risk : Reward */}
                      <td className="py-3 px-4 font-mono">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-bold">
                          1 : {s.riskReward.toFixed(2)}
                        </span>
                      </td>

                      {/* Column 6: Delta & VWAP Z */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        <div>
                          Delta Z: <span className={asset.deltaZ < -1 ? "text-rose-400 font-bold" : "text-slate-300"}>{asset.deltaZ.toFixed(2)}σ</span>
                        </div>
                        <div>
                          VWAP Z: <span className={asset.vwapZ > 1.5 ? "text-amber-400 font-bold" : "text-slate-300"}>{asset.vwapZ.toFixed(2)}σ</span>
                        </div>
                      </td>

                      {/* Column 7: Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(asset);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400 font-mono text-xs font-bold transition-all inline-flex items-center gap-1 group-hover:translate-x-0.5"
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
