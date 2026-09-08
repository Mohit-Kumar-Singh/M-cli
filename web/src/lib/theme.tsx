import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "mg-theme";

interface ThemeState {
  pref: ThemePref;
  /** what's actually showing right now */
  resolved: "light" | "dark";
  setPref: (p: ThemePref) => void;
  /** cycle system → light → dark → system */
  cycle: () => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const resolved: "light" | "dark" =
    pref === "system" ? (sysDark ? "dark" : "light") : pref;

  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", pref);
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* ignore */
    }
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) meta.content = resolved === "dark" ? "#10141c" : "#f5f5f1";
  }, [pref, resolved]);

  const setPref = useCallback((p: ThemePref) => setPrefState(p), []);
  const cycle = useCallback(
    () =>
      setPrefState((p) =>
        p === "system" ? "light" : p === "light" ? "dark" : "system",
      ),
    [],
  );

  const value = useMemo<ThemeState>(
    () => ({ pref, resolved, setPref, cycle }),
    [pref, resolved, setPref, cycle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
