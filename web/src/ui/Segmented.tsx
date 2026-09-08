interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  size?: "sm" | "md";
  className?: string;
}

/** Compact segmented control — session pickers, small filter sets. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className = "",
}: Props<T>) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]";
  return (
    <div
      className={`inline-flex rounded-[10px] bg-sunken p-0.5 border border-[var(--border-subtle)] ${className}`}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`${pad} rounded-lg font-medium transition-colors ${
              active
                ? "bg-card text-ink shadow-[var(--shadow-card)]"
                : "text-ink-mute hover:text-ink-soft"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
