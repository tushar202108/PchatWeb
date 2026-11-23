export type ThemeName =
  | "teal"
  | "midnight"
  | "purple"
  | "light";

export interface AppTheme {
  name: string;
  label: string;
  colors: Record<string, string>;
}

export const themes: Record<ThemeName, AppTheme> = {
  teal: {
    name: "teal",
    label: "Teal Glass",
    colors: {
      "--bg-main": "#060b0d",
      "--bg-gradient": "radial-gradient(circle at 60% 50%, #0d3b40 0%, #060b0d 75%)",

      "--surface": "rgba(255,255,255,0.048)",
      "--surface-hover": "rgba(255,255,255,0.08)",
      "--surface-soft": "rgba(255,255,255,0.025)",
      "--surface-strong": "rgba(10,15,28,0.94)",

      "--text-primary": "#ffffff",
      "--text-secondary": "#a1a1aa",
      "--text-muted": "#64748b",

      "--primary": "#0d9489",
      "--primary-hover": "#10b981",
      "--primary-text": "#ffffff",
      "--primary-soft": "rgba(13,148,137,0.16)",
      "--primary-border": "rgba(45,212,191,0.5)",

      "--input-bg": "rgba(15,23,42,0.55)",
      "--input-border": "rgba(255,255,255,0.15)",

      "--border": "rgba(255,255,255,0.08)",
      "--border-strong": "rgba(255,255,255,0.15)",

      "--bubble-mine": "rgba(15,120,111,0.4)",
      "--bubble-other": "rgba(15,23,42,0.65)",
      "--bubble-shadow": "rgba(99,102,241,0.2)",

      "--modal-bg": "#07111e",
      "--modal-gradient": "linear-gradient(135deg,#1e1e2f 0%,#2a2a40 100%)",

      "--date-separator-bg": "rgba(100,116,139,0.2)",
      "--date-separator-text": "#cbd5e1",

      "--success": "#22c55e",
      "--warning": "#fbbf24",
      "--danger": "#f87171",
      "--online": "#22c55e",
      "--offline": "#9ca3af",

      "--tick-sent": "#8696a0",
      "--tick-delivered": "#8696a0",
      "--tick-read": "#38b146",

      "--scrollbar": "rgba(255,255,255,0.2)",
      "--glass-shadow": "0 30px 60px -12px rgba(0,0,0,0.7)",
      "--orb-color": "rgba(14,165,233,0.2)",
      "--Action-Button-Color":"rgba(15,120,111,0.4)"
    },
  },

  midnight: {
    name: "midnight",
    label: "Midnight Blue",
    colors: {
      "--bg-main": "#070d1a",
      "--bg-gradient": "radial-gradient(circle at 60% 50%, #172554 0%, #070d1a 75%)",
      "--surface": "rgba(255,255,255,0.05)",
      "--surface-hover": "rgba(255,255,255,0.09)",
      "--surface-soft": "rgba(255,255,255,0.025)",
      "--surface-strong": "rgba(9,16,36,0.96)",
      "--text-primary": "#f8fafc",
      "--text-secondary": "#a5b4fc",
      "--text-muted": "#64748b",
      "--primary": "#3b82f6",
      "--primary-hover": "#60a5fa",
      "--primary-text": "#ffffff",
      "--primary-soft": "rgba(59,130,246,0.16)",
      "--primary-border": "rgba(96,165,250,0.5)",
      "--input-bg": "rgba(15,23,42,0.7)",
      "--input-border": "rgba(148,163,184,0.2)",
      "--border": "rgba(148,163,184,0.12)",
      "--border-strong": "rgba(148,163,184,0.22)",
      "--bubble-mine": "rgba(37,99,235,0.35)",
      "--bubble-other": "rgba(30,41,59,0.8)",
      "--bubble-shadow": "rgba(37,99,235,0.2)",
      "--modal-bg": "#0b1530",
      "--modal-gradient": "linear-gradient(135deg,#172554 0%,#0f172a 100%)",
      "--date-separator-bg": "rgba(96,165,250,0.16)",
      "--date-separator-text": "#bfdbfe",
      "--success": "#22c55e",
      "--warning": "#fbbf24",
      "--danger": "#f87171",
      "--online": "#22c55e",
      "--offline": "#94a3b8",
      "--tick-sent": "#94a3b8",
      "--tick-delivered": "#94a3b8",
      "--tick-read": "#1d6ed1",
      "--scrollbar": "rgba(148,163,184,0.25)",
      "--glass-shadow": "0 30px 60px -12px rgba(0,0,0,0.7)",
      "--orb-color": "rgba(59,130,246,0.2)",
      "--Action-Button-Color":"rgba(37,99,235,0.35)"
    },
  },

  purple: {
    name: "purple",
    label: "Purple Glass",
    colors: {
      "--bg-main": "#10091c",
      "--bg-gradient": "radial-gradient(circle at 60% 50%, #3b0764 0%, #10091c 75%)",
      "--surface": "rgba(255,255,255,0.05)",
      "--surface-hover": "rgba(255,255,255,0.09)",
      "--surface-soft": "rgba(255,255,255,0.025)",
      "--surface-strong": "rgba(24,12,42,0.96)",
      "--text-primary": "#ffffff",
      "--text-secondary": "#c4b5fd",
      "--text-muted": "#8b7ca8",
      "--primary": "#8b5cf6",
      "--primary-hover": "#a78bfa",
      "--primary-text": "#ffffff",
      "--primary-soft": "rgba(139,92,246,0.16)",
      "--primary-border": "rgba(167,139,250,0.5)",
      "--input-bg": "rgba(30,20,50,0.7)",
      "--input-border": "rgba(196,181,253,0.18)",
      "--border": "rgba(196,181,253,0.1)",
      "--border-strong": "rgba(196,181,253,0.2)",
      "--bubble-mine": "rgba(109,40,217,0.4)",
      "--bubble-other": "rgba(46,28,68,0.8)",
      "--bubble-shadow": "rgba(139,92,246,0.2)",
      "--modal-bg": "#1a1030",
      "--modal-gradient": "linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)",
      "--date-separator-bg": "rgba(167,139,250,0.16)",
      "--date-separator-text": "#ddd6fe",
      "--success": "#4ade80",
      "--warning": "#fbbf24",
      "--danger": "#fb7185",
      "--online": "#4ade80",
      "--offline": "#a1a1aa",
      "--tick-sent": "#a1a1aa",
      "--tick-delivered": "#a1a1aa",
      "--tick-read": "#522fe0",
      "--scrollbar": "rgba(196,181,253,0.25)",
      "--glass-shadow": "0 30px 60px -12px rgba(0,0,0,0.7)",
      "--orb-color": "rgba(139,92,246,0.2)",
      "--Action-Button-Color":"rgba(109,40,217,0.4)"
    },
  },

  light: {
    name: "light",
    label: "Light",
    colors: {
      "--bg-main": "#f1f5f9",
      "--bg-gradient": "radial-gradient(circle at 60% 50%, #dbeafe 0%, #f1f5f9 75%)",
      "--surface": "rgba(255,255,255,0.8)",
      "--surface-hover": "rgba(15,23,42,0.06)",
      "--surface-soft": "rgba(255,255,255,0.55)",
      "--surface-strong": "rgba(255,255,255,0.97)",
      "--text-primary": "#0f172a",
      "--text-secondary": "#475569",
      "--text-muted": "#64748b",
      "--primary": "#0d9489",
      "--primary-hover": "#0f766e",
      "--primary-text": "#ffffff",
      "--primary-soft": "rgba(13,148,137,0.1)",
      "--primary-border": "rgba(13,148,137,0.35)",
      "--input-bg": "rgba(255,255,255,0.9)",
      "--input-border": "rgba(15,23,42,0.16)",
      "--border": "rgba(15,23,42,0.1)",
      "--border-strong": "rgba(15,23,42,0.18)",
      "--bubble-mine": "rgba(13, 148, 137, 0.45)",
      "--bubble-other": "#ffffff",
      "--bubble-shadow": "rgba(15,23,42,0.08)",
      "--modal-bg": "#ffffff",
      "--modal-gradient": "linear-gradient(135deg,#ffffff 0%,#e2e8f0 100%)",
      "--date-separator-bg": "rgba(15,23,42,0.08)",
      "--date-separator-text": "#334155",
      "--success": "#16a34a",
      "--warning": "#d97706",
      "--danger": "#dc2626",
      "--online": "#16a34a",
      "--offline": "#94a3b8",
      "--tick-sent": "#64748b",
      "--tick-delivered": "#64748b",
      "--tick-read": "#0284c7",
      "--scrollbar": "rgba(15,23,42,0.2)",
      "--glass-shadow": "0 20px 40px rgba(15,23,42,0.1)",
      "--orb-color": "rgba(14,165,233,0.12)",
      "--Action-Button-Color":"rgb(92, 89, 89)"
    },
  },
};