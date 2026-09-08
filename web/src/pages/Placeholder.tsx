interface Props {
  title: string;
  milestone: string;
  spec: string;
  points: string[];
}

/** Stand-in for a module not yet built. Lists what 0007 says it will do. */
export default function Placeholder({ title, milestone, spec, points }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">{title}</h1>
        <span className="badge text-xs muted">{milestone}</span>
      </div>
      <p className="muted text-sm">
        Not built yet. Spec: <code>{spec}</code>
      </p>
      <ul className="card p-4 space-y-1 text-sm list-disc list-inside">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
