import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import type { Profile, Role } from "../types/db";

interface AuthState {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Dev-only: VITE_PREVIEW_ROLE=owner lets you browse the UI without signing in.
// Never set this in the Vercel project — it is ignored outside `vite dev`.
const previewRole =
  import.meta.env.DEV && import.meta.env.VITE_PREVIEW_ROLE
    ? (import.meta.env.VITE_PREVIEW_ROLE as Role)
    : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(
    previewRole ? { id: "preview", full_name: "Preview", role: previewRole, created_at: "" } : null,
  );

  useEffect(() => {
    if (!supabaseConfigured || previewRole) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (previewRole) return;
    if (!session?.user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [session]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      profile,
      role: profile?.role ?? null,
      configured: supabaseConfigured,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [ready, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
