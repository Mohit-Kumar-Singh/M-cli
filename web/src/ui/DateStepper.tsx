import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, prettyDate } from "../lib/dates";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  className?: string;
}

/** ‹ [native date] › with a friendly label — shared by every day-scoped screen. */
export function DateStepper({ value, onChange, min, max, className = "" }: Props) {
  const prevDisabled = min != null && value <= min;
  const nextDisabled = max != null && value >= max;
  return (
    <div
      className={`mg-card flex items-center gap-1 p-1.5 pr-3 ${className}`}
      style={{ boxShadow: "none" }}
    >
      <button
        className="mg-btn mg-btn--ghost !min-h-0 !p-1.5"
        onClick={() => onChange(addDays(value, -1))}
        disabled={prevDisabled}
        aria-label="Previous day"
      >
        <ChevronLeft size={18} />
      </button>
      <input
        type="date"
        className="mg-input !border-0 !bg-transparent !px-1 !py-1 w-[9.5rem] focus:!shadow-none"
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
      <button
        className="mg-btn mg-btn--ghost !min-h-0 !p-1.5"
        onClick={() => onChange(addDays(value, 1))}
        disabled={nextDisabled}
        aria-label="Next day"
      >
        <ChevronRight size={18} />
      </button>
      <span className="ml-auto text-[13px] text-ink-mute whitespace-nowrap">
        {prettyDate(value)}
      </span>
    </div>
  );
}
