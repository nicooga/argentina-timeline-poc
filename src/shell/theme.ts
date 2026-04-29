import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "historic-timelines.theme";
const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"];

function isThemeMode(value: string | null): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

export function readStoredThemeMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
}

export function persistThemeMode(mode: ThemeMode): void {
  try {
    if (mode === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch {
    // Storage can be unavailable in privacy modes; the visual theme still applies.
  }
}

export function initializeTheme(): ThemeMode {
  const mode = readStoredThemeMode();
  applyThemeMode(mode);
  return mode;
}

export function useThemeMode(): readonly [
  ThemeMode,
  (nextMode: ThemeMode) => void,
] {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredThemeMode());

  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (mode === "system") applyThemeMode("system");
    };
    mq.addEventListener("change", syncSystemTheme);
    return () => mq.removeEventListener("change", syncSystemTheme);
  }, [mode]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setMode(isThemeMode(event.newValue) ? event.newValue : "system");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    applyThemeMode(nextMode);
    persistThemeMode(nextMode);
  }, []);

  return [mode, setThemeMode] as const;
}
