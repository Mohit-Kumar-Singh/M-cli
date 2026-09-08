import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: (id: string) => ReactNode;
}

/** Label + control + hint/error. Pass a render fn so the control gets the id. */
export function Field({ label, hint, error, className = "", children }: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink-soft mb-1">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-1 text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-ink-mute">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`mg-input ${className}`} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select ref={ref} className={`mg-input ${className}`} {...rest}>
        {children}
      </select>
    );
  },
);

/** Standalone labelled input for the common simple case. */
export function TextField({
  label,
  hint,
  error,
  className,
  ...input
}: { label: string; hint?: string; error?: string | null; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => <Input id={id} {...input} />}
    </Field>
  );
}
