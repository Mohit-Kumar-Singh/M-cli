import { useState, type FormEvent } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { Button, TextField } from "../ui";
import { Wordmark } from "../components/Wordmark";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="min-h-full grid place-items-center p-4 relative overflow-hidden">
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
            The console for your milk round — herd, deliveries and the daily books.
          </p>
        </div>

        {!supabaseConfigured && (
          <p className="mb-4 rounded-[10px] bg-danger-weak text-danger text-[13px] px-3 py-2">
            Backend not configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your Supabase keys.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@milkgarage.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-[13px] text-danger">{error}</p>
          )}
          <Button type="submit" block loading={busy} disabled={!supabaseConfigured}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
