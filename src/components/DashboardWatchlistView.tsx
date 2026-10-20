import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  Activity,
  Layers,
} from "lucide-react";
import { UnifiedScannedAsset, formatAssetPrice } from "../data/universe84";

interface DashboardWatchlistViewProps {
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

export const DashboardWatchlistView: React.FC<DashboardWatchlistViewProps> = ({
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
  const highConfidenceCount = assets.filter((a) => a.overallConfidence >= 75.0).length;

  return (
    <div className="space-y-4">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Master Institutional Watchlist
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                84 Scanned Instruments
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isSearchActive
                ? `Omnisearch filter active for "${searchQuery}" (Bypassing 75% hurdle)`
                : `Showing ${assets.length} ${showAllAssets ? "total scanned assets" : "high-conviction signals (≥75%)"} out of 84 actively monitored instruments`}
            </p>
          </div>
        </div>

        {/* Filter Pill & Omnisearch Controls */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={showAllAssets}
              onChange={(e) => onToggleShowAll(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span>Show All 84 Assets (Include &lt;75% Neutral)</span>
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
              ? assets.filter((a) => a.overallConfidence >= 75.0).length
              : assets.filter((a) => a.assetClass === tab.id && a.overallConfidence >= 75.0).length;
          const isSelected = assetClassFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onAssetClassFilterChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-slate-950/70 text-emerald-300 border border-emerald-400/40"
                    : count > 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clean 6-Column Institutional Watchlist Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">1. Instrument</th>
                <th className="py-3 px-4 font-bold">2. Live Market Price</th>
                <th className="py-3 px-4 font-bold">3. Primary Signal</th>
                <th className="py-3 px-4 font-bold">4. AI & Quant Confidence</th>
                <th className="py-3 px-4 font-bold">5. Market Regime</th>
                <th className="py-3 px-4 font-bold text-right">6. Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-mono text-xs">
                    {isSearchActive
                      ? `No instrument found matching "${searchQuery}". Check symbol or name.`
                      : "No high-conviction signals currently >=75%. Toggle 'Show All 84 Assets' to inspect neutral setups."}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const isSelected = selectedAsset?.symbol === asset.symbol;
                  const isGreen = asset.change24h >= 0;

                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => onSelectAsset(asset)}
                      className={`transition-colors cursor-pointer group hover:bg-slate-800/50 ${
                        isSelected ? "bg-slate-800/70 border-l-2 border-emerald-500" : ""
                      }`}
                    >
                      {/* Column 1: Instrument & Asset Class Badge */}
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
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                              {asset.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Live Price & 24h Change */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-sm text-white">
                          {formatAssetPrice(asset.price, asset)}
                        </div>
                        <span
                          className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${
                            isGreen ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isGreen ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isGreen ? "+" : ""}
                          {asset.change24h.toFixed(2)}%
                        </span>
                      </td>

                      {/* Column 3: Primary Signal Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-black border shadow-sm ${
                            asset.primarySignalType === "STRONG LONG"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                              : asset.primarySignalType === "STRONG SHORT"
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                              : asset.primarySignalType.includes("CALL")
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              : asset.primarySignalType.includes("PUT")
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          {asset.primarySignalType.includes("LONG") || asset.primarySignalType.includes("CALL") ? (
                            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : asset.primarySignalType.includes("SHORT") || asset.primarySignalType.includes("PUT") ? (
                            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Activity className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{asset.primarySignalType}</span>
                        </span>
                      </td>

                      {/* Column 4: AI & Quant Confidence Score (Single Source of Truth) */}
                      <td className="py-3 px-4">
                        {(() => {
                          const isBinarySignal = asset.primarySignalType.startsWith("BINARY");
                          const isSpotSignal = asset.primarySignalType === "STRONG LONG" || asset.primarySignalType === "STRONG SHORT";
                          const displayedConfidence = isBinarySignal
                            ? asset.binaryConfidence
                            : isSpotSignal
                            ? asset.spotConfidence
                            : asset.overallConfidence;

                          return (
                            <div className="space-y-1 w-36">
                              <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-400 text-[10px]">Confidence:</span>
                                <span
                                  className={`font-bold ${
                                    displayedConfidence >= 80
                                      ? "text-emerald-400"
                                      : displayedConfidence >= 75
                                      ? "text-cyan-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {displayedConfidence.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    displayedConfidence >= 80
                                      ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                                      : displayedConfidence >= 75
                                      ? "bg-gradient-to-r from-cyan-500 to-emerald-400"
                                      : "bg-slate-700"
                                  }`}
                                  style={{ width: `${Math.min(100, displayedConfidence)}%` }}
                                />
                              </div>
                              {/* Sub-label breakdown */}
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {isBinarySignal
                                  ? `(Binary: ${asset.binaryConfidence.toFixed(1)}% | Spot: ${asset.spotConfidence.toFixed(1)}%)`
                                  : `(Spot: ${asset.spotConfidence.toFixed(1)}% | Binary: ${asset.binaryConfidence.toFixed(1)}%)`}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Column 5: Market Regime Pill */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block ${
                            asset.marketRegime === "MEAN-REVERTING"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : asset.marketRegime === "SQUEEZE LOCKOUT"
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {asset.marketRegime}
                        </span>
                      </td>

                      {/* Column 6: Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(asset);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white border border-slate-700 group-hover:border-cyan-500 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <span>View Setup</span>
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
