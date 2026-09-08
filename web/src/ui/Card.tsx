import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  children: ReactNode;
}

export function Card({ padded = true, className = "", children, ...rest }: Props) {
  return (
    <div className={`mg-card ${padded ? "p-4 sm:p-5" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** A flat list container: rows separated by hairlines, no per-row card. */
export function ListCard({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mg-card overflow-hidden divide-y divide-[var(--border-subtle)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
