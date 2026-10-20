/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  Timer,
  TrendingDown,
  TrendingUp,
  Settings,
  Compass,
  Search,
  X,
  Bell,
  BellRing,
  RefreshCw,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Crown,
  Menu,
  FlaskConical,
} from "lucide-react";
import { useMarketUniverse } from "./data/scannerFeed";
import { UnifiedScannedAsset } from "./data/universe84";
import { DashboardWatchlistView } from "./components/DashboardWatchlistView";
import { BinarySniperDeskView } from "./components/BinarySniperDeskView";
import { ShortSignalsDeskView } from "./components/ShortSignalsDeskView";
import { LongSignalsDeskView } from "./components/LongSignalsDeskView";
import { SettingsDeskView } from "./components/SettingsDeskView";
import { SlideOverDetailDrawer } from "./components/SlideOverDetailDrawer";
import { NotificationControlsModal } from "./components/NotificationControlsModal";
import { AdminApprovalModal } from "./components/AdminApprovalModal";
import { PendingApprovalScreen } from "./components/PendingApprovalScreen";
import { RejectedScreen } from "./components/RejectedScreen";
import { LoginScreen } from "./components/LoginScreen";
import { AuthStatusMenu } from "./components/AuthStatusMenu";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  DEFAULT_SUPERVISOR_CONFIG,
  SupervisorConfig,
} from "./components/SettingsModal";
import {
  triggerStrongSignalNotification,
  triggerTp1HitNotification,
  getNotificationPermissionStatus,
} from "./utils/browserNotifications";
import { ActiveStrategyTestsTray } from "./components/ActiveStrategyTestsTray";
import { useStrategyTestingLab } from "./utils/useStrategyTestingLab";
import {
  saveUserSettingsToFirestore,
  subscribeUserSettings,
} from "./lib/firebaseService";

export type TerminalTab =
  | "DASHBOARD"
  | "BINARY_SNIPER"
  | "SHORT_DESK"
  | "LONG_DESK"
  | "TESTING_LAB"
  | "SETTINGS";

function TerminalContent() {
  const {
    user,
    isPending,
    isRejected,
    isAdmin,
    isSuperAdmin,
    pendingUsersCount,
    loading,
  } = useAuth();

  // 1. Navigation Tab State (Strict 5-Tab Separation)
  const [currentTab, setCurrentTab] = useState<TerminalTab>("DASHBOARD");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Supervisor & Sizing Config (Initialized from localStorage & synced to Firestore)
  const [supervisorConfig, setSupervisorConfig] = useState<SupervisorConfig>(() => {
    try {
      const saved = localStorage.getItem("quant_supervisor_config");
      return saved ? JSON.parse(saved) : DEFAULT_SUPERVISOR_CONFIG;
    } catch {
      return DEFAULT_SUPERVISOR_CONFIG;
    }
  });

  // Sync user settings from Firestore when authenticated
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserSettings(user.uid, (cloudConfig) => {
      if (cloudConfig) {
        setSupervisorConfig((prev) => ({ ...prev, ...cloudConfig }));
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // 2. Multi-Asset Live Scanner (84 Instruments with Binance WS + Twelve Data WS + Live REST)
  const {
    assets,
    highConvictionAssets,
    binarySniperSignals,
    shortDeskSignals,
    longDeskSignals,
    isLiveConnected,
    lastSyncTime,
    isRefreshing,
    refreshTickers,
    filterAssets,
  } = useMarketUniverse(supervisorConfig.twelveDataApiKey);

  // 3. Search Bar & High-Confidence Default Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllAssets, setShowAllAssets] = useState<boolean>(false);
  const [assetClassFilter, setAssetClassFilter] = useState<string>("ALL");

  // 4. Slide-Over Inspector Drawer State
  const [selectedAsset, setSelectedAsset] = useState<UnifiedScannedAsset | null>(null);

  const liveSelectedAsset = useMemo(() => {
    if (!selectedAsset) return null;
    return assets.find((a) => a.symbol === selectedAsset.symbol) || selectedAsset;
  }, [selectedAsset, assets]);

  // 5. Modals & Notifications
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [browserNotifPermission, setBrowserNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >(getNotificationPermissionStatus);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4500);
  }, []);

  const handleSaveConfig = (newCfg: SupervisorConfig) => {
    setSupervisorConfig(newCfg);
    try {
      localStorage.setItem("quant_supervisor_config", JSON.stringify(newCfg));
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
    if (user?.uid) {
      saveUserSettingsToFirestore(user.uid, newCfg).catch((e) => {
        console.warn("Firestore settings save error:", e);
      });
    }
    showToast("Settings and risk parameters synchronized to Cloud Firestore.");
  };

  // 6. Strategy Testing Lab Hook with Mark-to-Market Engine & Firestore History Persistence
  const {
    tests,
    deployDirectionalTest,
    deployBinaryTest,
    closeTest,
    lockBreakEven,
    clearHistory,
  } = useStrategyTestingLab(assets, showToast, user?.uid);

  const handleDeployDirectional = (asset: UnifiedScannedAsset) => {
    const isShortPreferred = asset.shortSignal.confidenceScore > asset.longSignal.confidenceScore;
    const sig = isShortPreferred ? asset.shortSignal : asset.longSignal;

    if (sig.isBlockedByTrend) {
      showToast(`⚠️ Trade Blocked: ${sig.reasoning}`);
      return;
    }

    const riskDollars = (supervisorConfig.account_balance || 10000) * ((supervisorConfig.risk_per_trade_pct || 1.0) / 100);

    deployDirectionalTest({
      symbol: asset.symbol,
      name: asset.name,
      assetClass: asset.assetClass,
      direction: sig.direction,
      entryPrice: sig.entryPrice,
      stopLoss: sig.stopLoss,
      tp1: sig.tp1,
      tp2: sig.tp2,
      riskDollars,
    });
  };

  const handleDeployBinary = (asset: UnifiedScannedAsset) => {
    const bin = asset.binarySignal;
    if (bin.isBlockedByTrend) {
      showToast(`⚠️ Binary Trade Blocked: Counter-trend option blocked by dual-regime trend filter.`);
      return;
    }

    const riskDollars = (supervisorConfig.account_balance || 10000) * ((supervisorConfig.risk_per_trade_pct || 1.0) / 100);

    deployBinaryTest({
      symbol: asset.symbol,
      action: bin.action,
      strikePrice: bin.strikePrice,
      currentPrice: bin.currentPrice,
      expiryHorizon: bin.expiryHorizon,
      riskDollars,
    });
  };

  // Track notified signals to avoid repeat spamming
  const notifiedSignaledMap = useRef<Set<string>>(new Set());

  // Real-Time Notification Monitoring on fresh >=88% setups
  useEffect(() => {
    if (!assets || assets.length === 0) return;

    for (const a of assets) {
      if (a.overallConfidence >= 88.0) {
        const isLong = a.primarySignalType === "STRONG LONG";
        const isShort = a.primarySignalType === "STRONG SHORT";
        if (isLong || isShort) {
          const key = `${a.symbol}-${a.primarySignalType}`;
          if (!notifiedSignaledMap.current.has(key)) {
            notifiedSignaledMap.current.add(key);

            // Trigger browser native push notification
            triggerStrongSignalNotification({
              id: key,
              created_at: new Date().toISOString(),
              symbol: a.symbol,
              asset_class: a.assetClass as any,
              horizon_mode: "SCALP_5M_15M",
              timeframe: "bars_5m",
              direction: isLong ? "LONG" : "SHORT",
              win_probability: a.overallConfidence / 100,
              confidence_score: a.overallConfidence,
              entry_price: a.price,
              stop_loss: isLong ? a.longSignal.stopLoss : a.shortSignal.stopLoss,
              tp1_price: isLong ? a.longSignal.tp1 : a.shortSignal.tp1,
              tp2_price: isLong ? a.longSignal.tp2 : a.shortSignal.tp2,
              current_price: a.price,
              status: "ACTIVE",
              ai_headline: `Real-time Quantitative Signal: ${a.primarySignalType} with ${(a.overallConfidence).toFixed(1)}% confidence`,
              action_recommendation: isLong ? "STRONG_BUY" : "STRONG_SELL",
              ai_thesis: {
                thesis: [
                  `Algorithmic confidence at ${(a.overallConfidence).toFixed(1)}% with VWAP Z-score of ${a.vwapZ.toFixed(2)}σ.`,
                  `Order-flow delta velocity at ${a.deltaZ.toFixed(2)}σ confirming directional liquidity sweep.`,
                  `Hurst exponent of ${a.hurst.toFixed(2)} validating current market regime.`,
                ],
                risk_warning: "Monitor risk boundaries anchored to rolling ATR.",
                macro_sentiment: isLong ? 0.8 : -0.8,
              },
              telemetry: {
                vwap_z: a.vwapZ,
                delta_z: a.deltaZ,
                hurst: a.hurst,
                rvol: 1.5,
                vol_pct: 0.6,
                session_liquid: true,
              },
            });
          }
        }
      }
    }
  }, [assets]);

  // Keep permission status updated
  useEffect(() => {
    setBrowserNotifPermission(getNotificationPermissionStatus());
  }, [isNotificationModalOpen]);

  // Filtered Assets for Dashboard Desk
  const dashboardAssets = useMemo(() => {
    return filterAssets(searchQuery, "DASHBOARD", showAllAssets, assetClassFilter);
  }, [filterAssets, searchQuery, showAllAssets, assetClassFilter]);

  // Filtered Assets for Binary Sniper Desk
  const binaryAssets = useMemo(() => {
    return filterAssets(searchQuery, "BINARY", showAllAssets, assetClassFilter);
  }, [filterAssets, searchQuery, showAllAssets, assetClassFilter]);

  // Filtered Assets for Short Desk
  const shortAssets = useMemo(() => {
    return filterAssets(searchQuery, "SHORT", showAllAssets, assetClassFilter);
  }, [filterAssets, searchQuery, showAllAssets, assetClassFilter]);

  // Filtered Assets for Long Desk
  const longAssets = useMemo(() => {
    return filterAssets(searchQuery, "LONG", showAllAssets, assetClassFilter);
  }, [filterAssets, searchQuery, showAllAssets, assetClassFilter]);

  // 1. Loading splash while Firebase Auth initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Compass className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="font-extrabold text-sm tracking-wider uppercase text-white">
            Institutional Alpha Terminal
          </p>
          <p className="text-xs font-mono text-slate-400 flex items-center gap-2 justify-center">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Verifying Institutional Credentials & Security Clearances...</span>
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate -> Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  // 3. Approval Gates
  if (isPending) return <PendingApprovalScreen />;
  if (isRejected) return <RejectedScreen />;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* =========================================================================
          LEFT SIDEBAR: STRICT 5-TAB WORKFLOW SEPARATION
          ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab("DASHBOARD")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <h1 className="font-black text-sm text-white tracking-wider uppercase leading-none">
                  ALPHA TERMINAL
                </h1>
                <p className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
                  INSTITUTIONAL QUANT
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (Strict 5 Tabs) */}
          <nav className="space-y-1.5 font-medium text-xs">
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => {
                setCurrentTab("DASHBOARD");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === "DASHBOARD"
                  ? "bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "DASHBOARD"
                    ? "bg-slate-950/60 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {highConvictionAssets.length}
              </span>
            </button>

            {/* Tab 2: Binary Options Sniper */}
            <button
              onClick={() => {
                setCurrentTab("BINARY_SNIPER");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === "BINARY_SNIPER"
                  ? "bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Timer className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Binary Sniper</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "BINARY_SNIPER"
                    ? "bg-slate-950/60 text-white"
                    : "bg-slate-800 text-cyan-300"
                }`}
              >
                1m / 3m / 5m
              </span>
            </button>

            {/* Tab 3: Short Signals Desk */}
            <button
              onClick={() => {
                setCurrentTab("SHORT_DESK");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === "SHORT_DESK"
                  ? "bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Short Signals Desk</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "SHORT_DESK"
                    ? "bg-slate-950/60 text-white"
                    : "bg-slate-800 text-rose-300"
                }`}
              >
                {shortDeskSignals.length}
              </span>
            </button>

            {/* Tab 4: Long Signals Desk */}
            <button
              onClick={() => {
                setCurrentTab("LONG_DESK");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === "LONG_DESK"
                  ? "bg-teal-600 text-white font-bold shadow-lg shadow-teal-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 shrink-0 text-teal-400" />
                <span>Long Signals Desk</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "LONG_DESK"
                    ? "bg-slate-950/60 text-white"
                    : "bg-slate-800 text-teal-300"
                }`}
              >
                {longDeskSignals.length}
              </span>
            </button>

            {/* Tab 5: Dedicated Live Testing Lab */}
            <button
              onClick={() => {
                setCurrentTab("TESTING_LAB");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === "TESTING_LAB"
                  ? "bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FlaskConical className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Live Testing Lab</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "TESTING_LAB"
                    ? "bg-slate-950/60 text-white"
                    : "bg-slate-800 text-amber-300"
                }`}
              >
                {tests.filter((t) => t.status === "OPEN" || t.status === "TP1_LOCKED").length} active
              </span>
            </button>

            {/* Tab 6: Settings & Risk Configuration */}
            <button
              onClick={() => {
                setCurrentTab("SETTINGS");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === "SETTINGS"
                  ? "bg-slate-800 text-white font-bold border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Settings & API</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Risk</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Engine Diagnostics */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Market Universe:</span>
            <span className="text-emerald-400 font-bold">84 Instruments</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Live Math Engine:</span>
            <span className="text-cyan-400 font-semibold">O-U + Brownian</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Hurdle Cut-off:</span>
            <span className="text-slate-200">≥ 75.0% Conf.</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* =========================================================================
          MAIN APPLICATION VIEW
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30">
          {/* Left: Mobile Toggle & Omnisearch Input Bar */}
          <div className="flex items-center space-x-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Omnisearch Bar with 75% Filter Bypass */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all 84 assets (e.g. BTC, ADA, EUR/USD, GOLD, NVDA, NATGAS)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Market Feed Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                }`}
              />
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                ● 84 Assets Live
              </span>
              <span className="text-[10px] text-slate-400 hidden lg:inline">
                {lastSyncTime}
              </span>
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={() => {
                refreshTickers();
                showToast("Tickers synchronized from live market endpoints.");
              }}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Force instant sync with Binance WebSocket and market endpoints"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync Prices</span>
            </button>

            {/* Real-Time Browser Notification Bell */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                browserNotifPermission === "granted"
                  ? "bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-900"
                  : "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
              }`}
              title="Real-Time Browser Push & Sound Alerts (Notification API)"
            >
              <BellRing className="w-4 h-4" />
              {browserNotifPermission !== "granted" && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* User Profile & Admin Role Menu */}
            <AuthStatusMenu onOpenAdminModal={() => setIsAdminModalOpen(true)} />
          </div>
        </header>

        {/* Omnisearch Active Banner if user is searching */}
        {searchQuery.trim().length > 0 && (
          <div className="bg-cyan-950/40 border-b border-cyan-800/40 px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                Omnisearch active for &quot;<strong>{searchQuery}</strong>&quot; — 75% confidence filter bypassed to inspect all matches across 84 instruments.
              </span>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[11px] underline hover:text-cyan-200 cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Tab Body View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Super Admin & Admin: Pending Approvals Banner */}
          {isAdmin && pendingUsersCount > 0 && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg backdrop-blur-sm animate-pulse">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{isSuperAdmin ? "Super Admin Approver Desk" : "Administrator Portal"}:</span>
                    <span className="text-amber-400 font-mono">
                      {pendingUsersCount} trader account{pendingUsersCount > 1 ? "s" : ""} awaiting authorization
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Review and authorize pending user seats in Firestore to enable algorithmic terminal and execution suites.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Review Pending Users ({pendingUsersCount})</span>
              </button>
            </div>
          )}

          {/* TAB 1: MASTER WATCHLIST DASHBOARD */}
          {currentTab === "DASHBOARD" && (
            <DashboardWatchlistView
              assets={dashboardAssets}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showAllAssets={showAllAssets}
              onToggleShowAll={setShowAllAssets}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              selectedAsset={selectedAsset}
              assetClassFilter={assetClassFilter}
              onAssetClassFilterChange={setAssetClassFilter}
            />
          )}

          {/* TAB 2: BINARY OPTIONS SNIPER DESK */}
          {currentTab === "BINARY_SNIPER" && (
            <BinarySniperDeskView
              assets={binaryAssets}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showAllAssets={showAllAssets}
              onToggleShowAll={setShowAllAssets}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              selectedAsset={selectedAsset}
              assetClassFilter={assetClassFilter}
              onAssetClassFilterChange={setAssetClassFilter}
            />
          )}

          {/* TAB 3: SHORT SIGNALS DESK */}
          {currentTab === "SHORT_DESK" && (
            <ShortSignalsDeskView
              assets={shortAssets}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showAllAssets={showAllAssets}
              onToggleShowAll={setShowAllAssets}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              selectedAsset={selectedAsset}
              assetClassFilter={assetClassFilter}
              onAssetClassFilterChange={setAssetClassFilter}
            />
          )}

          {/* TAB 4: LONG SIGNALS DESK */}
          {currentTab === "LONG_DESK" && (
            <LongSignalsDeskView
              assets={longAssets}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showAllAssets={showAllAssets}
              onToggleShowAll={setShowAllAssets}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              selectedAsset={selectedAsset}
              assetClassFilter={assetClassFilter}
              onAssetClassFilterChange={setAssetClassFilter}
            />
          )}

          {/* TAB 5: DEDICATED LIVE STRATEGY TESTING LAB (ACTIVE & HISTORY) */}
          {currentTab === "TESTING_LAB" && (
            <div className="space-y-6">
              <ActiveStrategyTestsTray
                tests={tests}
                onCloseTest={closeTest}
                onClearHistory={clearHistory}
                onLockBreakEven={lockBreakEven}
              />
            </div>
          )}

          {/* TAB 6: SETTINGS & RISK DESK */}
          {currentTab === "SETTINGS" && (
            <SettingsDeskView
              config={supervisorConfig}
              onSaveConfig={handleSaveConfig}
            />
          )}
        </main>
      </div>

      {/* =========================================================================
          SLIDE-OVER DETAIL DRAWER (PROGRESSIVE DISCLOSURE)
          ========================================================================= */}
      {liveSelectedAsset && (
        <SlideOverDetailDrawer
          asset={liveSelectedAsset}
          onClose={() => setSelectedAsset(null)}
          accountBalance={supervisorConfig.account_balance || 10000}
          riskPerTradePct={supervisorConfig.risk_per_trade_pct || 1.0}
          onTestExecution={(msg) => showToast(msg)}
          onDeployDirectionalTest={handleDeployDirectional}
          onDeployBinaryTest={handleDeployBinary}
        />
      )}

      {/* =========================================================================
          NOTIFICATION CONTROLS MODAL
          ========================================================================= */}
      <NotificationControlsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* =========================================================================
          ADMIN APPROVAL MODAL
          ========================================================================= */}
      <AdminApprovalModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onShowNotification={showToast}
      />

      {/* Toast Notification Banner */}
      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-center space-x-3 text-xs text-white animate-slideUp">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
          <button
            onClick={() => setNotificationToast(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TerminalContent />
    </AuthProvider>
  );
}
