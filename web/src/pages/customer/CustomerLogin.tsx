import { useState, type FormEvent } from "react";
import { useCustomerAuth } from "../../lib/customerAuth";
import { supabase } from "../../lib/supabase";
import { Button, TextField, Segmented } from "../../ui";
import { Wordmark } from "../../components/Wordmark";
import { AppVersion } from "../../components/AppVersion";

type Mode = "phone" | "email";

export default function CustomerLogin() {
  const [mode, setMode] = useState<Mode>("phone");

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
        <div className="flex flex-col items-center text-center mb-5">
          <Wordmark />
          <p className="text-[13px] text-ink-mute mt-2">
            Book your daily milk, pause deliveries, and check your balance.
          </p>
        </div>

        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "phone", label: "Existing customer" },
            { value: "email", label: "New — sign up" },
          ]}
          className="w-full mb-5 [&>button]:flex-1"
        />

        {mode === "phone" ? <PhoneLogin /> : <EmailSignup />}

        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center">
          <AppVersion />
        </div>
      </div>
    </div>
  );
}

function PhoneLogin() {
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
    <form onSubmit={onSubmit} className="space-y-3">
      {!configured && (
        <p className="rounded-[10px] bg-danger-weak text-danger text-[13px] px-3 py-2">
          Backend not configured yet — check back soon.
        </p>
      )}
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
      <p className="text-[12px] text-ink-mute text-center">
        For customers we've already added with a phone number.
      </p>
    </form>
  );
}

function EmailSignup() {
  const { configured } = useCustomerAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    if (phone.trim()) params.set("phone", phone.trim());
    const redirectTo = `${window.location.origin}/book/verify${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-2 py-2">
        <p className="text-[13px] text-ink">
          We've emailed a sign-in link to <span className="font-medium">{email}</span>.
        </p>
        <p className="text-[12px] text-ink-mute">
          Open it on this phone to finish signing in. Didn't get it? Check
          spam, or{" "}
          <button
            type="button"
            className="text-accent underline"
            onClick={() => setSent(false)}
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {!configured && (
        <p className="rounded-[10px] bg-danger-weak text-danger text-[13px] px-3 py-2">
          Backend not configured yet — check back soon.
        </p>
      )}
      <TextField
        label="Your name"
        autoComplete="name"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label="Phone (optional)"
        type="tel"
        inputMode="tel"
        placeholder="98765 43210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <Button type="submit" block loading={busy} disabled={!configured}>
        Email me a sign-in link
      </Button>
      <p className="text-[12px] text-ink-mute text-center">
        No account needed up front — the link signs you in and sets up your
        order account.
      </p>
    </form>
  );
}
