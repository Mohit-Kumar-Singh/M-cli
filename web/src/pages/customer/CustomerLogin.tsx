import { useState, type FormEvent } from "react";
import { useCustomerAuth } from "../../lib/customerAuth";
import { Button, TextField } from "../../ui";
import { Wordmark } from "../../components/Wordmark";
import { AppVersion } from "../../components/AppVersion";

export default function CustomerLogin() {
  const { login, configured } = useCustomerAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(await login(phone, pin));
    setBusy(false);
  }

  return (
    <div className="min-h-full grid place-items-center px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, var(--accent-weak), transparent 70%)",
        }}
      />
      <div className="mg-card mg-enter relative w-full max-w-sm p-6 sm:p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <Wordmark />
          <p className="text-[13px] text-ink-mute mt-2">
            Book your daily milk, pause deliveries, and check your balance.
          </p>
        </div>

        {!configured && (
          <p className="mb-4 rounded-[10px] bg-danger-weak text-danger text-[13px] px-3 py-2">
            Backend not configured yet — check back soon.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <TextField
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <TextField
            label="PIN"
            hint="First time? Use the last 4 digits of your phone number."
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <Button type="submit" block loading={busy} disabled={!configured}>
            Sign in
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center">
          <p className="text-[12px] text-ink-mute mb-2">
            Not a Milk Garage customer yet? Ask us to add you.
          </p>
          <AppVersion />
        </div>
      </div>
    </div>
  );
}
