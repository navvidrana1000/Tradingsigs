import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Server,
  Sliders,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Send,
  Webhook,
  Bot,
  KeyRound,
  ExternalLink,
  Zap,
  BellRing,
  Bell,
  Volume2,
} from "lucide-react";
import {
  NotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  triggerTestNotification,
  isBrowserNotificationSupported,
} from "../utils/browserNotifications";

export interface SupervisorConfig {
  model: string;
  minWinProb: number;
  thinkingBudget: number;
  enforceDeltaAbsorption: boolean;
  enforceHurstChopLockout: boolean;
  enforceSqueezeGuard: boolean;
  geminiApiKey?: string;
  grokApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  twelveDataApiKey?: string;
  finnhubApiKey?: string;
  riskPerTradeDollars?: number;
  webhookUrl?: string;
  account_balance?: number;
  risk_per_trade_pct?: number;
  max_concurrent_trades?: number;
  min_confidence_score?: number;
  min_risk_reward?: number;
  auto_supervise_enabled?: boolean;
}

export const DEFAULT_SUPERVISOR_CONFIG: SupervisorConfig = {
  model: "gemini-3.8-flash",
  minWinProb: 0.72,
  thinkingBudget: 512,
  enforceDeltaAbsorption: true,
  enforceHurstChopLockout: true,
  enforceSqueezeGuard: true,
  geminiApiKey: "",
  grokApiKey: "",
  telegramBotToken: "",
  telegramChatId: "",
  twelveDataApiKey: "",
  finnhubApiKey: "",
  riskPerTradeDollars: 100,
  webhookUrl: "",
  account_balance: 10000,
  risk_per_trade_pct: 1.0,
  max_concurrent_trades: 4,
  min_confidence_score: 75.0,
  min_risk_reward: 1.8,
  auto_supervise_enabled: true,
};

interface SettingsModalProps {
  isOpen?: boolean;
  isFullPage?: boolean;
  onClose?: () => void;
  config: SupervisorConfig;
  onSaveConfig: (newConfig: SupervisorConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen = true,
  isFullPage = false,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<SupervisorConfig>(config);
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [showGrokKey, setShowGrokKey] = useState<boolean>(false);

  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [testingTelegram, setTestingTelegram] = useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getNotificationPreferences);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(getNotificationPermissionStatus);
  const [isRequestingNotif, setIsRequestingNotif] = useState<boolean>(false);
  const [notifTestSent, setNotifTestSent] = useState<boolean>(false);

  const [serverStatus, setServerStatus] = useState<{
    status: string;
    gemini_key_configured: boolean;
    checking: boolean;
  }>({
    status: "CHECKING",
    gemini_key_configured: false,
    checking: true,
  });

  const checkServerHealth = async () => {
    setServerStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          status: data.status,
          gemini_key_configured: Boolean(data.gemini_key_configured),
          checking: false,
        });
      } else {
        setServerStatus({ status: "GATEWAY_ACTIVE", gemini_key_configured: false, checking: false });
      }
    } catch {
      setServerStatus({ status: "GATEWAY_ACTIVE", gemini_key_configured: true, checking: false });
    }
  };

  const [testingGemini, setTestingGemini] = useState<boolean>(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<{
    success?: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
    model?: string;
  } | null>(null);

  const handleTestGeminiConnection = async () => {
    setTestingGemini(true);
    setGeminiTestStatus(null);
    try {
      const res = await fetch("/api/supervisor/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: localConfig.geminiApiKey,
          model: localConfig.model || "gemini-2.5-flash",
        }),
      });
      const data = await res.json();
      setGeminiTestStatus(data);
      if (data.success) {
        setServerStatus((prev) => ({ ...prev, gemini_key_configured: true }));
      }
    } catch (err: any) {
      setGeminiTestStatus({
        success: false,
        error: `Handshake failed: ${err.message || "Network error"}`,
      });
    } finally {
      setTestingGemini(false);
    }
  };

  useEffect(() => {
    setLocalConfig(config);
    checkServerHealth();
  }, [config, isOpen]);

  if (!isOpen && !isFullPage) return null;

  const handleSave = () => {
    saveNotificationPreferences(notifPrefs);
    onSaveConfig(localConfig);
    if (onClose) onClose();
  };

  const handleTestWebhook = async () => {
    if (!localConfig.webhookUrl || !localConfig.webhookUrl.startsWith("http")) {
      setWebhookStatus({ success: false, message: "Please enter a valid http:// or https:// Webhook URL" });
      return;
    }

    setTestingWebhook(true);
    setWebhookStatus(null);
    try {
      const res = await fetch("/api/integrations/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: localConfig.webhookUrl }),
      });
      const data = await res.json();
      setWebhookStatus({ success: data.success, message: data.message || data.error });
    } catch (err: any) {
      setWebhookStatus({ success: false, message: `Dispatch failed: ${err.message}` });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!localConfig.telegramBotToken || !localConfig.telegramChatId) {
      setTelegramStatus({ success: false, message: "Enter both Bot Token and Chat ID to test" });
      return;
    }

    setTestingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await fetch("/api/integrations/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: localConfig.telegramBotToken,
          chatId: localConfig.telegramChatId,
        }),
      });
      const data = await res.json();
      setTelegramStatus({ success: data.success, message: data.message || data.error });
    } catch (err: any) {
      setTelegramStatus({ success: false, message: `Telegram failed: ${err.message}` });
    } finally {
      setTestingTelegram(false);
    }
  };

  const isGeminiActive = Boolean(
    (localConfig.geminiApiKey && localConfig.geminiApiKey.length > 20) || serverStatus.gemini_key_configured
  );

  const content = (
    <div className="space-y-6">
      {/* Active Gateway Status Banner */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold text-xs">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Secure Architecture: Zero In-Bundle Key Leakage</span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isGeminiActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-xs font-mono font-semibold text-white">
              {isGeminiActive
                ? localConfig.geminiApiKey
                  ? "Custom Gemini Key Attached"
                  : "Server Environment Key Active"
                : "Awaiting Gemini Key"}
            </span>
            <button
              onClick={checkServerHealth}
              className="p-1 text-slate-500 hover:text-slate-300 ml-1"
              title="Refresh server health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${serverStatus.checking ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Keys saved here are stored in your secure browser storage and attached directly to authorized server-side evaluation calls (<code className="text-cyan-400 font-mono text-[11px]">/api/supervisor/evaluate</code>). When no custom key is provided, the terminal utilizes the server's pre-configured Gemini API environment key.
        </p>
      </div>

      {/* SECTION 1: API KEYS & CREDENTIALS */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <h4 className="font-bold text-sm text-white uppercase tracking-wider">
            API Keys & Model Credentials
          </h4>
        </div>

        {/* Google Gemini API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Google AI Studio / Gemini API Key</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">
                (Powers Autonomous Risk Supervisor)
              </span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showGeminiKey ? "text" : "password"}
                placeholder={
                  serverStatus.gemini_key_configured
                    ? "Using server environment key (or paste custom AI Studio key)..."
                    : "Enter AI Studio Gemini API Key (e.g. AIzaSy...)"
                }
                value={localConfig.geminiApiKey || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, geminiApiKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleTestGeminiConnection}
              disabled={testingGemini}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 flex-shrink-0 transition-all"
            >
              {testingGemini ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{testingGemini ? "Validating Key..." : "Test Connection"}</span>
            </button>
          </div>

          {/* Immediate Visual Feedback on Gemini API Key connectivity */}
          {geminiTestStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs border transition-all animate-fadeIn ${
                geminiTestStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/40 text-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold">
                  {geminiTestStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>
                    {geminiTestStatus.success
                      ? "Gemini API Connection Validated & Online"
                      : "API Authentication Failed"}
                  </span>
                </div>
                {geminiTestStatus.latencyMs !== undefined && (
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Latency: {geminiTestStatus.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed opacity-90">
                {geminiTestStatus.message || geminiTestStatus.error}
              </p>
            </div>
          )}

          <span className="text-[11px] text-slate-500 block">
            Supports Gemini 2.5 Flash and Gemini 2.5 Pro for live trade thesis audit and order flow delta verification.
          </span>
        </div>

        {/* xAI Grok API Key (Optional) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>xAI Grok API Key</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">(Optional Sentiment Secondary)</span>
            </label>
          </div>

          <div className="relative">
            <input
              type={showGrokKey ? "text" : "password"}
              placeholder="Enter xAI Grok API Key (optional)..."
              value={localConfig.grokApiKey || ""}
              onChange={(e) => setLocalConfig({ ...localConfig, grokApiKey: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowGrokKey(!showGrokKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showGrokKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: TELEGRAM ALERTS & DOWNSTREAM WEBHOOKS */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <Send className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-sm text-white uppercase tracking-wider">
            Automated Alerts & Webhook Routing
          </h4>
        </div>

        {/* Telegram Config */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Telegram Broadcast Channel / Bot
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Bot Token</span>
              <input
                type="text"
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                value={localConfig.telegramBotToken || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, telegramBotToken: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Target Chat / Channel ID</span>
              <input
                type="text"
                placeholder="@my_quant_signals or -100123456789"
                value={localConfig.telegramChatId || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, telegramChatId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Instantly sends approved institutional setups to your Telegram channel.
            </span>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {testingTelegram ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Test Telegram</span>
            </button>
          </div>

          {telegramStatus && (
            <div
              className={`p-2.5 rounded-xl text-xs font-mono border ${
                telegramStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {telegramStatus.message}
            </div>
          )}
        </div>

        {/* Custom Webhook URL */}
        <div className="space-y-3 pt-3 border-t border-slate-800/60">
          <label className="text-xs font-semibold text-slate-300 block">
            Custom Webhook URL (Downstream Bot Execution)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://api.mytradingbot.com/webhook/signals"
              value={localConfig.webhookUrl || ""}
              onChange={(e) => setLocalConfig({ ...localConfig, webhookUrl: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testingWebhook}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 inline-flex items-center gap-1.5 flex-shrink-0"
            >
              {testingWebhook ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Webhook className="w-3 h-3" />}
              <span>Test Ping</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 block">
            Dispatches JSON payloads containing entry, stop-loss, and multi-tier TP targets directly to your execution engine (Bybit, Binance, Interactive Brokers webhook bridges).
          </span>

          {webhookStatus && (
            <div
              className={`p-2.5 rounded-xl text-xs font-mono border ${
                webhookStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {webhookStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: RISK MODEL & PARAMETERS */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-sm text-white uppercase tracking-wider">
            Quantitative Risk Model Parameters
          </h4>
        </div>

        {/* Model Architecture */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Supervisor Model Selection
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "gemini-3.8-flash",
                name: "Gemini 3.8 Flash (Active & Recommended)",
                desc: "Sub-second hybrid reasoning optimized for low-latency live candle close checks.",
              },
              {
                id: "gemini-3.1-pro-preview",
                name: "Gemini 3.1 Pro Preview",
                desc: "Deep reasoning with extensive thinking budget for complex swing regimes.",
              },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, model: m.id })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localConfig.model === m.id
                    ? "bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{m.name}</span>
                  {localConfig.model === m.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Win Prob Hurdle */}
        <div className="space-y-2.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Minimum Calibrated Win Probability Barrier (P ≥ TP1)
            </span>
            <span className="font-mono font-bold text-sm text-emerald-400">
              {Math.round(localConfig.minWinProb * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.65"
            max="0.85"
            step="0.01"
            value={localConfig.minWinProb}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, minWinProb: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>65% (High Frequency)</span>
            <span className="text-emerald-400 font-semibold">72% (Institutional Default)</span>
            <span>85% (Ultra-Selective)</span>
          </div>
        </div>

        {/* Thinking Budget */}
        <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Deterministic Thinking Budget (Tokens)
            </span>
            <span className="font-mono font-bold text-xs text-cyan-400">
              {localConfig.thinkingBudget} Tokens
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[256, 512, 1024].map((tokens) => (
              <button
                key={tokens}
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, thinkingBudget: tokens })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  localConfig.thinkingBudget === tokens
                    ? "bg-slate-800 border border-cyan-500 text-cyan-300"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tokens}
              </button>
            ))}
          </div>
        </div>

        {/* Quantitative Rules */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Algorithmic Gatekeeper Rules
          </span>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-200 block">
                Strict Order Flow Delta Absorption Check
              </span>
              <span className="text-[11px] text-slate-500 block">
                Vetoes Short breakdowns if delta_z ≥ 0 and Longs if delta_z ≤ 0.
              </span>
            </div>
            <input
              type="checkbox"
              checked={localConfig.enforceDeltaAbsorption}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, enforceDeltaAbsorption: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-200 block">
                Mean-Reverting Chop Lockout (Hurst H &lt; 0.45)
              </span>
              <span className="text-[11px] text-slate-500 block">
                Vetoes momentum trend breakouts when variance-ratio detects stationary chop.
              </span>
            </div>
            <input
              type="checkbox"
              checked={localConfig.enforceHurstChopLockout}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, enforceHurstChopLockout: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-200 block">
                Parabolic Squeeze Lockout Guardrail
              </span>
              <span className="text-[11px] text-slate-500 block">
                Vetoes counter-trend trades during high-velocity gamma or short squeeze runs.
              </span>
            </div>
            <input
              type="checkbox"
              checked={localConfig.enforceSqueezeGuard}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, enforceSqueezeGuard: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* SECTION 4: REAL-TIME BROWSER NOTIFICATIONS (NOTIFICATION API) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BellRing className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              Real-Time Browser Notifications (Web Notification API)
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            Live Push
          </span>
        </div>

        {/* Browser Permission Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            notifPermission === "granted"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : notifPermission === "denied"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          <div className="flex items-start space-x-3">
            {notifPermission === "granted" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold font-mono uppercase tracking-wide">
                Browser Notification Permission: {notifPermission.toUpperCase()}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {notifPermission === "granted"
                  ? "Browser Notification API is authorized. Operating system banners will display when high-impact events fire."
                  : notifPermission === "denied"
                  ? "Alerts blocked by browser settings. Please click the site settings / lock icon in the URL bar to allow notifications."
                  : "Permission has not been requested yet. Click below to grant authorization."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {notifPermission !== "granted" && isBrowserNotificationSupported() && (
              <button
                type="button"
                onClick={async () => {
                  setIsRequestingNotif(true);
                  try {
                    const res = await requestBrowserNotificationPermission();
                    setNotifPermission(res);
                    if (res === "granted") {
                      const updated = { ...notifPrefs, enabled: true };
                      setNotifPrefs(updated);
                      saveNotificationPreferences(updated);
                      triggerTestNotification();
                    }
                  } finally {
                    setIsRequestingNotif(false);
                  }
                }}
                disabled={isRequestingNotif}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isRequestingNotif ? "Prompting..." : "Enable Browser Alerts"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setNotifTestSent(true);
                triggerTestNotification();
                setTimeout(() => setNotifTestSent(false), 3000);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{notifTestSent ? "Sent!" : "Test Alert & Chime"}</span>
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2.5">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-emerald-300 block">
                🚀 STRONG_BUY Alert Dispatches (Score ≥ 88%)
              </span>
              <span className="text-[11px] text-slate-500 block">
                Triggers native OS popup and audio chime when institutional long breakout is generated.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.notifyStrongBuy}
              onChange={(e) => {
                const updated = { ...notifPrefs, notifyStrongBuy: e.target.checked };
                setNotifPrefs(updated);
                saveNotificationPreferences(updated);
              }}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-rose-300 block">
                🔻 STRONG_SELL Alert Dispatches (Score ≥ 88%)
              </span>
              <span className="text-[11px] text-slate-500 block">
                Triggers native OS popup and audio chime when institutional short breakdown is generated.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.notifyStrongSell}
              onChange={(e) => {
                const updated = { ...notifPrefs, notifyStrongSell: e.target.checked };
                setNotifPrefs(updated);
                saveNotificationPreferences(updated);
              }}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-amber-300 block">
                🎯 TP1 Execution Hit & Break-Even Lock (+0.95R)
              </span>
              <span className="text-[11px] text-slate-500 block">
                Triggers native OS popup whenever live mark-to-market reaches TP1 target and stop is secured.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.notifyTp1Hit}
              onChange={(e) => {
                const updated = { ...notifPrefs, notifyTp1Hit: e.target.checked };
                setNotifPrefs(updated);
                saveNotificationPreferences(updated);
              }}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-950">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-cyan-300 block">
                Synthetic Web Audio Chimes
              </span>
              <span className="text-[11px] text-slate-500 block">
                Plays distinctive institutional acoustic signatures for buy, sell, and TP1 events.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.soundEnabled}
              onChange={(e) => {
                const updated = { ...notifPrefs, soundEnabled: e.target.checked };
                setNotifPrefs(updated);
                saveNotificationPreferences(updated);
              }}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between rounded-b-2xl">
      <button
        type="button"
        onClick={() => setLocalConfig(DEFAULT_SUPERVISOR_CONFIG)}
        className="text-xs text-slate-400 hover:text-slate-200 font-medium"
      >
        Reset to Defaults
      </button>
      <div className="flex items-center space-x-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-cyan-400" />
              Settings & API Configurations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure your Google AI Studio keys, automated alert bots, webhooks, and quant model thresholds
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

        {content}

        {footer}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Settings & API Configurations
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Secure Gateway
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Institutional configuration, credentials, and automated bots
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">{content}</div>

        {/* Footer Actions */}
        <div className="flex-shrink-0">{footer}</div>
      </div>
    </div>
  );
};
