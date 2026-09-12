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

const SIGNUP_NAME_KEY = "mg_signup_name";
const SIGNUP_PHONE_KEY = "mg_signup_phone";

function storeSignupHints(name: string, phone: string) {
  try {
    if (name.trim()) sessionStorage.setItem(SIGNUP_NAME_KEY, name.trim());
    if (phone.trim()) sessionStorage.setItem(SIGNUP_PHONE_KEY, phone.trim());
  } catch {
    // private browsing / storage disabled — customer_email_login still
    // works, it just won't have a name/phone to prefill
  }
}

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/book/verify` },
  });
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.96 13.96 0 0 1 10.94 24c0-1.45.25-2.86.7-4.18v-5.7H4.34A21.97 21.97 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
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

    storeSignupHints(name, phone);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/book/verify`,
        shouldCreateUser: true,
      },
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
    <div className="space-y-4">
      {!configured && (
        <p className="rounded-[10px] bg-danger-weak text-danger text-[13px] px-3 py-2">
          Backend not configured yet — check back soon.
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        block
        icon={<GoogleMark />}
        onClick={() => void signInWithGoogle()}
        disabled={!configured}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        <span className="text-[11px] text-ink-mute">or with email</span>
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
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
    </div>
  );
}
