export function Skeleton({
  className = "",
  w,
  h = 14,
}: {
  className?: string;
  w?: number | string;
  h?: number | string;
}) {
  return (
    <span
      className={`mg-skeleton block ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  );
}

/** A few placeholder rows inside a card, for list screens. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mg-card overflow-hidden divide-y divide-[var(--border-subtle)]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3.5 flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton w="45%" h={13} />
            <Skeleton w="30%" h={11} />
          </div>
          <Skeleton w={56} h={24} className="rounded-full" />
        </div>
      ))}
    </div>
  );
}
