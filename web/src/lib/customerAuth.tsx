import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, supabaseConfigured } from "./supabase";
import type { CustomerProfile } from "../types/db";

interface CustomerAuthState {
  ready: boolean;
  token: string | null;
  customer: CustomerProfile | null;
  configured: boolean;
  login: (phone: string, pin: string) => Promise<string | null>;
  /** Adopts a session token obtained outside the phone+PIN flow (email
   *  magic-link callback). Returns whether the profile actually loaded. */
  completeSession: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = "mg_customer_token";
const CustomerAuthContext = createContext<CustomerAuthState | undefined>(undefined);

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // private browsing / storage disabled — session just won't persist
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

  async function loadProfile(t: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("customer_get_profile", { p_token: t });
    if (error || !data || data.length === 0) {
      setCustomer(null);
      setToken(null);
      storeToken(null);
      return false;
    }
    setCustomer(data[0] as CustomerProfile);
    return true;
  }

  useEffect(() => {
    (async () => {
      if (!supabaseConfigured || !token) {
        setReady(true);
        return;
      }
      await loadProfile(token);
      setReady(true);
    })();
    // Only run once on mount — token changes are driven by login()/logout().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<CustomerAuthState>(
    () => ({
      ready,
      token,
      customer,
      configured: supabaseConfigured,
      async login(phone, pin) {
        const { data, error } = await supabase.rpc("customer_login", {
          p_phone: phone.trim(),
          p_pin: pin.trim(),
        });
        if (error || !data || data.length === 0) {
          return "Wrong phone number or PIN.";
        }
        const row = data[0] as { session_token: string };
        setToken(row.session_token);
        storeToken(row.session_token);
        const ok = await loadProfile(row.session_token);
        return ok ? null : "Couldn't load your account. Try again.";
      },
      async completeSession(t: string) {
        setToken(t);
        storeToken(t);
        return await loadProfile(t);
      },
      async logout() {
        if (token) await supabase.rpc("customer_logout", { p_token: token });
        setToken(null);
        setCustomer(null);
        storeToken(null);
      },
      async refresh() {
        if (token) await loadProfile(token);
      },
    }),
    [ready, token, customer],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthState {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
