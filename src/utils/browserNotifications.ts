import { SignalRecord } from "../types/signals";

export interface NotificationPreferences {
  enabled: boolean;
  notifyStrongBuy: boolean;
  notifyStrongSell: boolean;
  notifyTp1Hit: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  notifyStrongBuy: true,
  notifyStrongSell: true,
  notifyTp1Hit: true,
  soundEnabled: true,
};

const PREFS_STORAGE_KEY = "alpha_notification_preferences";

/**
 * Retrieves stored notification preferences with fallback to defaults.
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Failed to load notification preferences from localStorage:", e);
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Persists notification preferences to localStorage.
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save notification preferences to localStorage:", e);
  }
}

/**
 * Checks if the browser's Notification API is supported in the current runtime environment.
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Returns current permission status ('granted' | 'denied' | 'default' | 'unsupported').
 */
export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Requests notification permission from the user via the browser Notification API.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (error) {
    console.warn("Error requesting browser notification permission:", error);
    return Notification.permission || "default";
  }
}

/**
 * High-tech synthetic audio chimes via Web Audio API.
 * Eliminates external MP3/WAV dependencies and guarantees zero 404 or CORS failures.
 */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playAlertChime(type: "STRONG_BUY" | "STRONG_SELL" | "TP1_HIT" | "TEST"): void {
  const prefs = getNotificationPreferences();
  if (!prefs.soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === "STRONG_BUY") {
      // Upbeat rising dual-tone institutional bell (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);
    } else if (type === "STRONG_SELL") {
      // Crisp descending alert chime (G5 -> Eb5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc1.frequency.exponentialRampToValueAtTime(622.25, now + 0.18); // Eb5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);
    } else if (type === "TP1_HIT") {
      // Triumphant institutional harmonic triad (C5 -> E5 -> G5 -> C6)
      const chordNotes = [523.25, 659.25, 783.99, 1046.5];
      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.07;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    } else {
      // General test chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn("Audio chime playback failed (browser policy/suspended):", e);
  }
}

/**
 * Core dispatch function invoking native Notification API with fallback handling.
 */
export function dispatchBrowserNotification(options: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  badge?: string;
  soundType?: "STRONG_BUY" | "STRONG_SELL" | "TP1_HIT" | "TEST";
  onClick?: () => void;
}): boolean {
  if (options.soundType) {
    playAlertChime(options.soundType);
  }

  if (!isBrowserNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      tag: options.tag,
      badge: options.badge,
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      try {
        notification.close();
      } catch {}
    };

    return true;
  } catch (error) {
    console.warn("Native Notification dispatch prevented or failed:", error);
    return false;
  }
}

/**
 * Triggers a real-time browser notification whenever a 'STRONG_BUY' or 'STRONG_SELL' signal is generated.
 */
export function triggerStrongSignalNotification(
  signal: SignalRecord,
  prefs = getNotificationPreferences()
): boolean {
  if (!prefs.enabled) return false;

  const score = signal.confidence_score ?? Math.round(
    signal.win_probability <= 1.0 ? signal.win_probability * 100 : signal.win_probability
  );

  const actionRec = signal.action_recommendation ?? (
    score >= 88 ? (signal.direction === "LONG" ? "STRONG_BUY" : "STRONG_SELL") : null
  );

  if (actionRec === "STRONG_BUY" && !prefs.notifyStrongBuy) return false;
  if (actionRec === "STRONG_SELL" && !prefs.notifyStrongSell) return false;
  if (actionRec !== "STRONG_BUY" && actionRec !== "STRONG_SELL") return false;

  const horizonLabel = signal.horizon_mode === "SCALP_5M_15M" ? "5-15M Scalp" : "1-4H Swing";
  const precision = signal.entry_price < 5 ? 4 : 2;
  const isBuy = actionRec === "STRONG_BUY";

  const title = isBuy
    ? `🚀 STRONG BUY: ${signal.symbol} (${horizonLabel})`
    : `🔻 STRONG SELL: ${signal.symbol} (${horizonLabel})`;

  const headline = signal.ai_headline ? `\n"${signal.ai_headline}"` : "";
  const body = `AI Confidence: ${score}% • Win Prob: ${Math.round(signal.win_probability <= 1.0 ? signal.win_probability * 100 : signal.win_probability)}%\nEntry: $${signal.entry_price.toFixed(precision)} | TP1: $${signal.tp1_price.toFixed(precision)} | SL: $${signal.stop_loss.toFixed(precision)}${headline}`;

  return dispatchBrowserNotification({
    title,
    body,
    tag: `signal-${signal.id || `${signal.symbol}-${signal.horizon_mode}`}-${actionRec}`,
    soundType: isBuy ? "STRONG_BUY" : "STRONG_SELL",
  });
}

/**
 * Triggers a real-time browser notification when a trade hits TP1 (Take Profit 1).
 */
export function triggerTp1HitNotification(
  params: {
    symbol: string;
    currentPrice: number;
    entryPrice: number;
    rLocked?: number;
    contract?: string;
  },
  prefs = getNotificationPreferences()
): boolean {
  if (!prefs.enabled || !prefs.notifyTp1Hit) return false;

  const precision = params.currentPrice < 5 ? 4 : 2;
  const rLocked = params.rLocked || 0.95;
  const targetDesc = params.contract ? `[${params.contract}]` : `[${params.symbol}]`;

  const title = `🎯 TP1 HIT: ${targetDesc} (+${rLocked.toFixed(2)}R LOCKED)`;
  const body = `Target price $${params.currentPrice.toFixed(precision)} achieved! Position stop-loss secured at Break-Even ($${params.entryPrice.toFixed(precision)}).`;

  return dispatchBrowserNotification({
    title,
    body,
    tag: `tp1-hit-${params.symbol}-${Date.now().toString(36)}`,
    soundType: "TP1_HIT",
  });
}

/**
 * Dispatches an instant test notification to demonstrate the browser Notification API and sound chime.
 */
export function triggerTestNotification(): boolean {
  return dispatchBrowserNotification({
    title: "⚡ Institutional Alpha Terminal: Live Alerts Armed",
    body: "Real-time Notification API is active! You will now receive instant alerts on STRONG_BUY / STRONG_SELL setups and TP1 target hits.",
    tag: `test-notification-${Date.now()}`,
    soundType: "STRONG_BUY",
  });
}
