import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Sparkles,
  DollarSign,
  Percent,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Cpu,
  KeyRound,
  Activity,
  Crown,
  UserCheck,
  Users,
} from "lucide-react";
import { SupervisorConfig } from "./SettingsModal";
import {
  NotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  triggerTestNotification,
} from "../utils/browserNotifications";
import { useAuth } from "../context/AuthContext";
import { BOOTSTRAP_ADMIN_EMAIL } from "../lib/firebase";

interface SettingsDeskViewProps {
  config: SupervisorConfig;
  onSaveConfig: (cfg: SupervisorConfig) => void;
  onOpenAdminModal?: () => void;
}

export const SettingsDeskView: React.FC<SettingsDeskViewProps> = ({
  config,
  onSaveConfig,
  onOpenAdminModal,
}) => {
  const { isAdmin, isSuperAdmin, pendingUsersCount } = useAuth();
  const [localConfig, setLocalConfig] = useState<SupervisorConfig>(config);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getNotificationPreferences);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">(getNotificationPermissionStatus);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingTelegram, setTestingTelegram] = useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    saveNotificationPreferences(notifPrefs);
    onSaveConfig(localConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setPermissionStatus(getNotificationPermissionStatus());
    if (granted) {
      setNotifPrefs((prev) => ({ ...prev, enabled: true }));
    }
  };

  const handleTestTelegram = async () => {
    if (!localConfig.telegramBotToken || !localConfig.telegramChatId) {
      setTelegramStatus({ success: false, message: "Please enter Bot Token & Chat ID first" });
      return;
    }
    setTestingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await fetch("/api/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: localConfig.telegramBotToken,
          chat_id: localConfig.telegramChatId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramStatus({ success: true, message: "Test alert dispatched to Telegram successfully!" });
      } else {
        setTelegramStatus({ success: false, message: data.error || "Failed to reach Telegram API" });
      }
    } catch (err: any) {
      setTelegramStatus({ success: false, message: err.message || "Network error" });
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold border border-slate-700 shadow-md">
            <Settings className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Settings & Risk Configuration Desk
            </h2>
            <p className="text-xs text-slate-400">
              Manage portfolio sizing parameters, Brownian Bridge hurdles, and live telemetry integrations.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{saveSuccess ? "Saved Successfully!" : "Save All Settings"}</span>
        </button>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Capital & Position Sizing */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Portfolio Capital & Sizing</h3>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Account Equity / Balance (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  value={localConfig.account_balance || 10000}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, account_balance: parseFloat(e.target.value) || 10000 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Risk Per Trade (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={localConfig.risk_per_trade_pct || 1.0}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, risk_per_trade_pct: parseFloat(e.target.value) || 1.0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono text-sm">%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Max risk dollar allocation: ${((localConfig.account_balance || 10000) * ((localConfig.risk_per_trade_pct || 1.0) / 100)).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Max Open Institutional Exposures
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={localConfig.max_concurrent_trades || 4}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, max_concurrent_trades: parseInt(e.target.value) || 4 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Module 2: Quantitative Hurdles & Mathematical Model */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Mathematical Engine Parameters</h3>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                High-Confidence Score Hurdle (Default ≥75%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="95"
                  value={localConfig.min_confidence_score || 75.0}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, min_confidence_score: parseFloat(e.target.value) || 75.0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono text-sm">%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Brownian Bridge terminal probability & delta convergence cut-off.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Minimum Risk:Reward Ratio Hurdle
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={localConfig.min_risk_reward || 1.8}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, min_risk_reward: parseFloat(e.target.value) || 1.8 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Discards spot/perp setups yielding less than 1 : {localConfig.min_risk_reward || 1.8}.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Execution Model
              </label>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-1">
                <p className="text-emerald-400 font-bold">✓ Brownian Bridge + Ornstein-Uhlenbeck</p>
                <p className="text-[11px] text-slate-500">Garman-Klass Volatility + Order-Flow Delta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Real-Time Browser Notifications */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <BellRing className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Browser Push & Audio Alerts</h3>
          </div>

          <div className="space-y-3 font-sans">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Browser Notification Permission</p>
                <p className="text-[11px] font-mono text-slate-400">
                  Status: <strong className={permissionStatus === "granted" ? "text-emerald-400" : "text-amber-400"}>{permissionStatus.toUpperCase()}</strong>
                </p>
              </div>
              {permissionStatus !== "granted" ? (
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Enable
                </button>
              ) : (
                <button
                  onClick={() => triggerTestNotification()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
                >
                  Test Sound
                </button>
              )}
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300">Master Notifications Enabled</span>
              <input
                type="checkbox"
                checked={notifPrefs.enabled}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, enabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300">Synthesized Web Audio Chimes</span>
              <input
                type="checkbox"
                checked={notifPrefs.soundEnabled}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300">Strong Buy / Long Triggers (≥88%)</span>
              <input
                type="checkbox"
                checked={notifPrefs.notifyStrongBuy}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, notifyStrongBuy: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300">Strong Sell / Short Triggers (≥88%)</span>
              <input
                type="checkbox"
                checked={notifPrefs.notifyStrongSell}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, notifyStrongSell: e.target.checked })}
                className="w-4 h-4 accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300">TP1 Hit & Breakeven Lock (70% Exits)</span>
              <input
                type="checkbox"
                checked={notifPrefs.notifyTp1Hit}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, notifyTp1Hit: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>
          </div>
        </div>

        {/* Module 4: Gemini 2.5 Risk Supervisor & Telegram Bot */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">Gemini 2.5 Supervisor & Telegram Bot</h3>
          </div>

          <div className="space-y-3 font-sans">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Autonomous Risk Supervisor</p>
                <p className="text-[11px] text-slate-400">Generate real-time AI thesis & invalidation audits</p>
              </div>
              <input
                type="checkbox"
                checked={localConfig.auto_supervise_enabled}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, auto_supervise_enabled: e.target.checked })
                }
                className="w-4 h-4 accent-purple-500"
              />
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Telegram Bot Token
              </label>
              <input
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={localConfig.telegramBotToken || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, telegramBotToken: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Telegram Chat ID
              </label>
              <input
                type="text"
                placeholder="-1001234567890 or @your_channel"
                value={localConfig.telegramChatId || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, telegramChatId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {testingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testingTelegram ? "Dispatching..." : "Test Telegram Alert Dispatch"}</span>
              </button>
              {telegramStatus && (
                <p className={`text-xs mt-2 font-mono ${telegramStatus.success ? "text-emerald-400" : "text-rose-400"}`}>
                  {telegramStatus.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Module 5: Twelve Data WebSocket & External Feed API Keys */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Twelve Data & External Data WebSocket Credentials</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Synchronized to Firestore Cloud
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Twelve Data API Key (Forex, Commodities & Indices Live WS)
              </label>
              <input
                type="password"
                placeholder="e.g. 8a349b2f1c0d4567890abcdef1234567"
                value={localConfig.twelveDataApiKey || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, twelveDataApiKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enables sub-second WebSocket price streaming for 53 non-crypto assets (EUR/USD, XAG/USD, WTI/USD, NAS100) via <code className="text-amber-300">wss://ws.twelvedata.com/v1/quotes/price</code>.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Finnhub API Key (Optional Equities & Global CFDs)
              </label>
              <input
                type="password"
                placeholder="e.g. c123456789abcdefghij"
                value={localConfig.finnhubApiKey || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, finnhubApiKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Supplementary institutional feed for equity tickers and economic calendar data.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Testing Lab Normalized Dollar Risk ($ per 1.0R)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="10"
                  min="10"
                  max="10000"
                  value={localConfig.riskPerTradeDollars || 100}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, riskPerTradeDollars: parseFloat(e.target.value) || 100 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Normalized base dollar risk allocation for calculating Floating & Realized PnL from R-multiples.
              </p>
            </div>

            <div className="flex flex-col justify-center bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Dual-Engine Pricing Status:
              </span>
              <p className="text-slate-300 font-mono text-[11px]">
                • Crypto & Gold (31 Assets): <span className="text-emerald-400 font-bold">Binance Live WS + PAXG Spot (24/7)</span>
              </p>
              <p className="text-slate-300 font-mono text-[11px]">
                • Forex, Commodities & Indices (53 Assets):{" "}
                <span className={localConfig.twelveDataApiKey ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {localConfig.twelveDataApiKey ? "Twelve Data Dedicated WS" : "Batch REST Continuous Fallback"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Module 6: Super Admin & User Approval Portal */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-3 shadow-lg md:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {isSuperAdmin ? "Super Admin User Approvals & Access Gatekeeper" : "User Access Administration"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Designated Root Approver: <strong className="text-amber-300 font-mono">{BOOTSTRAP_ADMIN_EMAIL}</strong>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                {pendingUsersCount > 0 ? `${pendingUsersCount} Pending Approval` : "All Accounts Processed"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Review pending registration queues, authorize verified traders, reject unauthorized applicants, and assign administrator roles across the firm.
              </p>
              {onOpenAdminModal && (
                <button
                  onClick={onOpenAdminModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Launch Admin Approval Portal</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
