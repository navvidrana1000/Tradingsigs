import React, { useMemo } from "react";
import { LeaderboardStats, AssetClass } from "../types/signals";
import { Award, TrendingUp, Activity, Zap, ShieldCheck, ChevronRight, HelpCircle } from "lucide-react";

interface LeaderboardBannerProps {
  stats: LeaderboardStats;
  selectedAssetClass: string;
  onSelectAssetClass: (cat: string) => void;
  isGeminiKeyConfigured?: boolean;
  supervisorModel?: string;
}

export const LeaderboardBanner: React.FC<LeaderboardBannerProps> = ({
  stats,
  selectedAssetClass,
  onSelectAssetClass,
  isGeminiKeyConfigured = true,
  supervisorModel = "Gemini 2.5",
}) => {
  // Aggregate breakdown by unique asset class to avoid duplicate keys and redundant pills
  const aggregatedBreakdown = useMemo(() => {
    const map = new Map<AssetClass, { asset_class: AssetClass; win_rate: number; total_r: number; profit_factor: number; count: number }>();

    stats.breakdown.forEach((b) => {
      const existing = map.get(b.asset_class);
      if (existing) {
        existing.total_r = Number((existing.total_r + b.total_r).toFixed(1));
        existing.win_rate = (existing.win_rate + b.win_rate) / 2;
        existing.profit_factor = Number(((existing.profit_factor + b.profit_factor) / 2).toFixed(2));
        existing.count += 1;
      } else {
        map.set(b.asset_class, {
          asset_class: b.asset_class,
          win_rate: b.win_rate,
          total_r: b.total_r,
          profit_factor: b.profit_factor,
          count: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [stats.breakdown]);

  return (
    <div className="space-y-4">
      {/* 4 High-impact KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              30D Rolling Win Rate
            </p>
            <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-1 font-mono">
              {(stats.rolling_30d_win_rate * 100).toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">TP1 Execution Barrier (482 Trades)</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Net R Harvested
            </p>
            <p className="text-2xl md:text-3xl font-black text-cyan-400 mt-1 font-mono">
              +{stats.total_r_captured.toFixed(1)} R
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Expectancy: <span className="text-slate-300 font-mono">+{stats.expectancy_r.toFixed(3)}R</span>/trade
            </p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Profit Factor
            </p>
            <p className="text-2xl md:text-3xl font-black text-amber-400 mt-1 font-mono">
              {stats.profit_factor.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sharpe: {stats.sharpe_ratio.toFixed(2)} | Max DD: -{stats.max_drawdown_r}R</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              AI Risk Supervisor
            </p>
            <p className="text-xl md:text-2xl font-bold text-slate-100 mt-1 flex items-center gap-1.5">
              <span>{supervisorModel}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold font-mono">
                ARMED & ACTIVE
              </span>
            </p>
            <div className="relative group/tooltip inline-block">
              <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 cursor-help">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Capital Protection Guardrail Active</span>
                <HelpCircle className="w-3 h-3 text-emerald-500/70" />
              </p>
              <div className="absolute bottom-full right-0 sm:right-auto sm:left-0 mb-2 hidden group-hover/tooltip:block w-72 p-3 bg-slate-950 text-slate-300 text-[11px] rounded-xl border border-slate-800 shadow-2xl z-50 pointer-events-none leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Autonomous Capital-Preservation Protocol:</strong>
                Gemini 2.5 evaluates every candidate signal in real-time. If order-flow delta absorption is absent or market chop is detected, the supervisor acts as a protective shield and vetoes the setup to protect trading capital.
              </div>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Asset breakdown sub-ribbon */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <span>Asset Class Performance:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {aggregatedBreakdown.map((b) => (
            <button
              key={`leaderboard-asset-pill-${b.asset_class}`}
              onClick={() => onSelectAssetClass(b.asset_class)}
              className={`px-3 py-1 rounded-lg border transition-all flex items-center space-x-2 ${
                selectedAssetClass === b.asset_class
                  ? "bg-slate-800 border-emerald-500 text-white shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span className="font-bold">{b.asset_class}</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {(b.win_rate * 100).toFixed(0)}% WR
              </span>
              <span className="text-cyan-400 font-mono font-semibold">+{b.total_r}R</span>
              <span className="text-slate-500 text-[10px]">PF {b.profit_factor}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
