import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  block = false,
  className = "",
  disabled,
  children,
  ...rest
}: Props) {
  const sizeCls =
    size === "sm" ? "text-[13px] px-3 min-h-[34px]" : "text-sm px-[0.95rem] min-h-[40px]";
  return (
    <button
      className={`mg-btn mg-btn--${variant} ${sizeCls} ${block ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 14 : 16} /> : icon}
      {children}
    </button>
  );
}
