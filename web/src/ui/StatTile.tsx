import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton";

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  loading?: boolean;
  tone?: "default" | "accent";
}

export function StatTile({ label, value, sub, loading, tone = "default" }: Props) {
  return (
    <div className="mg-card p-4">
      <div className="text-[12px] font-medium text-ink-mute">{label}</div>
      {loading ? (
        <Skeleton w="60%" h={26} className="mt-2" />
      ) : (
        <div
          className={`font-display text-[1.7rem] leading-none font-bold mt-1.5 tnum ${
            tone === "accent" ? "text-accent" : "text-ink"
          }`}
        >
          {value}
        </div>
      )}
      {sub && !loading && <div className="text-[12px] text-ink-mute mt-1">{sub}</div>}
    </div>
  );
}
