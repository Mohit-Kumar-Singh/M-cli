import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="mg-card mg-enter flex flex-col items-center text-center px-6 py-10">
      {icon && (
        <div className="mb-3 grid place-items-center h-11 w-11 rounded-full bg-accent-weak text-accent">
          {icon}
        </div>
      )}
      <p className="font-medium text-ink">{title}</p>
      {description && (
        <p className="text-[13px] text-ink-mute mt-1 max-w-[38ch]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
