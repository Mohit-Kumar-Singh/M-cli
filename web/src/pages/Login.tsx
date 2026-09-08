import { useState, type FormEvent } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

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
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-sm">
        <h1 className="text-xl font-extrabold mb-1" style={{ color: "var(--accent)" }}>
          M-cli
        </h1>
        <p className="muted text-sm mb-4">Milk operation console</p>

        {!supabaseConfigured && (
          <p className="text-sm mb-4" style={{ color: "var(--danger)" }}>
            Supabase is not configured yet. Copy <code>web/.env.example</code> to{" "}
            <code>.env.local</code> and fill it in.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={busy || !supabaseConfigured}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
