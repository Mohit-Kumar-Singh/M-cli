import { Hammer } from "lucide-react";
import { PageHeader, Card, Badge } from "../ui";

interface Props {
  title: string;
  milestone: string;
  spec: string;
  points: string[];
}

/** Stand-in for a module not built yet. Lists what 0007 says it will do. */
export default function Placeholder({ title, milestone, spec, points }: Props) {
  return (
    <div>
      <PageHeader title={title} subtitle={<>Planned for {milestone.toLowerCase()}</>} />
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="grid place-items-center h-8 w-8 rounded-full bg-gold-weak text-gold">
            <Hammer size={16} />
          </span>
          <div className="text-[13px] text-ink-mute">
            Not built yet · spec <code>{spec}</code>
          </div>
          <span className="ml-auto">
            <Badge tone="gold">{milestone}</Badge>
          </span>
        </div>
        <ul className="space-y-1.5 text-[13px] text-ink-soft">
          {points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-ink-mute">—</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
