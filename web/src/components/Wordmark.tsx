export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <MarkGlyph />
      <span
        className={`font-display font-extrabold tracking-tight text-ink ${
          compact ? "text-[15px]" : "text-[16px]"
        }`}
      >
        Milk Garage
      </span>
    </span>
  );
}

function MarkGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="118" fill="var(--accent)" />
      <path
        fill="var(--surface-card)"
        d="M222 120 h68 v34 a44 44 0 0 0 12 30 l14 15 a48 48 0 0 1 13 33 v106
           a26 26 0 0 1 -26 26 h-116 a26 26 0 0 1 -26 -26 v-106 a48 48 0 0 1 13 -33
           l14 -15 a44 44 0 0 0 12 -30 z"
      />
      <rect x="210" y="92" width="92" height="32" rx="9" fill="var(--gold)" />
      <rect x="176" y="306" width="160" height="18" rx="6" fill="var(--accent)" opacity="0.92" />
    </svg>
  );
}
