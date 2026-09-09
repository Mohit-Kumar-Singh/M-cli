import { versionLong, versionShort } from "../lib/version";

/** Tiny build stamp. `title` carries the full version + commit + build date. */
export function AppVersion({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-[11px] text-ink-mute tnum select-text ${className}`}
      title={versionLong}
    >
      {versionShort}
    </span>
  );
}
