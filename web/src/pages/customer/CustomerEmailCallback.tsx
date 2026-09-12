import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { useCustomerAuth } from "../../lib/customerAuth";
import { Wordmark } from "../../components/Wordmark";
import { Spinner } from "../../ui";

/** Landing point for the email magic link (see CustomerLogin's EmailSignup).
 *  supabase-js auto-parses the URL hash and sets a short-lived Auth session
 *  on load; we use that session once to mint a normal customer_sessions
 *  token via customer_email_login, then drop the Auth session — everything
 *  else in the portal keeps using the token, same as phone+PIN login. */
export default function CustomerEmailCallback() {
  const navigate = useNavigate();
  const { completeSession } = useCustomerAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      let session: Session | null = (await supabase.auth.getSession()).data.session;

      if (!session) {
        session = await new Promise<Session | null>((resolve) => {
          const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
            if (event === "SIGNED_IN" && s) {
              sub.subscription.unsubscribe();
              resolve(s);
            }
          });
          setTimeout(() => {
            sub.subscription.unsubscribe();
            resolve(null);
          }, 6000);
        });
      }

      if (!session) {
        setError("This link has expired or was already used. Go back and request a new one.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const { data, error: rpcError } = await supabase.rpc("customer_email_login", {
        p_name: params.get("name") ?? undefined,
        p_phone: params.get("phone") ?? undefined,
      });
      await supabase.auth.signOut();

      if (rpcError || !data || data.length === 0) {
        setError("Couldn't finish signing you in. Please try again.");
        return;
      }

      const row = data[0] as { session_token: string };
      await completeSession(row.session_token);
      navigate("/book/order", { replace: true });
    })();
  }, [completeSession, navigate]);

  return (
    <div className="min-h-full grid place-items-center p-4 text-center">
      <div className="flex flex-col items-center gap-3 text-ink-mute max-w-[26ch]">
        <Wordmark />
        {error ? (
          <p className="text-[13px] text-danger">{error}</p>
        ) : (
          <>
            <Spinner size={18} />
            <p className="text-[13px]">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}
