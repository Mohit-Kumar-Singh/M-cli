import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "gold" | "danger" | "success";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`mg-badge mg-badge--${tone}`}>{children}</span>;
}
