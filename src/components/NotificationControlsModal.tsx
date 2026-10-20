import React, { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ExternalLink,
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

interface NotificationControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToastNotification?: (message: string) => void;
}

export const NotificationControlsModal: React.FC<NotificationControlsModalProps> = ({
  isOpen,
  onClose,
  onShowToastNotification,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    getNotificationPermissionStatus
  );
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getNotificationPreferences());
      setPermission(getNotificationPermissionStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const res = await requestBrowserNotificationPermission();
      setPermission(res);
      if (res === "granted") {
        const updated = { ...prefs, enabled: true };
        setPrefs(updated);
        saveNotificationPreferences(updated);
        triggerTestNotification();
        if (onShowToastNotification) {
          onShowToastNotification("🔔 Browser Notification permission granted! Live alerts active.");
        }
      } else if (res === "denied") {
        if (onShowToastNotification) {
          onShowToastNotification("⚠️ Browser notifications were blocked. Please enable them in browser site settings.");
        }
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleUpdatePref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveNotificationPreferences(updated);
  };

  const handleSendTest = () => {
    setTestSent(true);
    triggerTestNotification();
    if (onShowToastNotification) {
      onShowToastNotification("⚡ Test Browser Notification & Audio Chime dispatched!");
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  const isSupported = isBrowserNotificationSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                Real-Time Browser Notifications
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                  Notification API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Trigger desktop alerts when STRONG_BUY, STRONG_SELL, or TP1 targets hit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Permission Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              permission === "granted"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : permission === "denied"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-start space-x-3">
              {permission === "granted" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-bold font-mono uppercase tracking-wide">
                  Browser Permission: {permission.toUpperCase()}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                  {permission === "granted"
                    ? "Operating system & browser desktop alerts are active and ready."
                    : permission === "denied"
                    ? "Notifications are currently blocked. Click the lock icon in your browser address bar to allow alerts."
                    : "Browser permission is needed to display desktop popups even when tab is backgrounded."}
                </p>
              </div>
            </div>

            {permission !== "granted" && isSupported && (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isRequesting ? "Prompting..." : "Enable Alerts"}
              </button>
            )}
          </div>

          {/* Test Alert Button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Test Live Alert & Sound</span>
              <span className="text-[11px] text-slate-400 block">
                Dispatches a sample STRONG_BUY notification and synthesizes an audio chime.
              </span>
            </div>
            <button
              onClick={handleSendTest}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{testSent ? "Alert Sent!" : "Test Notification"}</span>
            </button>
          </div>

          {/* Event Trigger Toggles */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trigger Conditions
            </h4>

            {/* Master Enabled */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Master Notification Switch</span>
                  <span className="text-[11px] text-slate-400 block">
                    Allow the institutional terminal to send real-time alerts.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => handleUpdatePref("enabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            {/* STRONG BUY */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">
                    🚀 STRONG_BUY Setups (Score ≥ 88%)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Instant alert when high-conviction long breakouts or absorptions occur.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notifyStrongBuy}
                disabled={!prefs.enabled}
                onChange={(e) => handleUpdatePref("notifyStrongBuy", e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer disabled:opacity-40"
              />
            </label>

            {/* STRONG SELL */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-300 block">
                    🔻 STRONG_SELL Setups (Score ≥ 88%)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Instant alert on high-conviction short breakdowns or liquidity purges.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notifyStrongSell}
                disabled={!prefs.enabled}
                onChange={(e) => handleUpdatePref("notifyStrongSell", e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer disabled:opacity-40"
              />
            </label>

            {/* TP1 TARGET HIT */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    🎯 TP1 Execution Hit & Break-Even Lock
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Fires when live mark-to-market reaches Take Profit 1 (+0.95R).
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notifyTp1Hit}
                disabled={!prefs.enabled}
                onChange={(e) => handleUpdatePref("notifyTp1Hit", e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer disabled:opacity-40"
              />
            </label>

            {/* Sound Synthesizer */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                  {prefs.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-cyan-300 block">
                    Web Audio Institutional Chime
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Synthesizes distinct acoustic signatures for buy, sell, and TP1 events.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.soundEnabled}
                onChange={(e) => handleUpdatePref("soundEnabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by Browser Notification API & Web Audio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
