import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePref } from "../lib/theme";

const NEXT: Record<ThemePref, ThemePref> = {
  system: "light",
  light: "dark",
  dark: "system",
};
const LABEL: Record<ThemePref, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

export function ThemeToggle() {
  const { pref, cycle } = useTheme();
  const Icon = pref === "system" ? Monitor : pref === "light" ? Sun : Moon;
  return (
    <button
      onClick={cycle}
      className="mg-btn mg-btn--ghost !min-h-0 !p-2"
      title={`${LABEL[pref]} — switch to ${LABEL[NEXT[pref]].toLowerCase()}`}
      aria-label={LABEL[pref]}
    >
      <Icon size={18} />
    </button>
  );
}
