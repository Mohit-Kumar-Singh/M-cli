import { useCallback, useEffect, useState } from "react";
import { CalendarOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { addDays, isoDate, prettyDate } from "../../lib/dates";
import { useCustomerAuth } from "../../lib/customerAuth";
import { Button, Card, Field, Input, PageHeader, EmptyState, SkeletonList } from "../../ui";

interface Pause {
  id: string;
  date_from: string;
  date_to: string;
  reason: string | null;
}

export default function CustomerPauses() {
  const { token } = useCustomerAuth();
  const tomorrow = addDays(isoDate(), 1);
  const [rows, setRows] = useState<Pause[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(tomorrow);
  const [to, setTo] = useState(tomorrow);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return setLoading(false);
    setLoading(true);
    const { data } = await supabase.rpc("customer_get_pauses", { p_token: token });
    setRows(((data ?? []) as Pause[]).filter((p) => p.date_to >= isoDate()));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!token) return;
    if (to < from) return setError("End date is before the start date.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("customer_add_pause", {
      p_token: token,
      p_from: from,
      p_to: to,
      p_reason: reason.trim() || null,
    });
    setBusy(false);
    if (error) setError(error.message.replace(/^.*:\s*/, ""));
    else {
      setReason("");
      void load();
    }
  }

  async function remove(id: string) {
    if (!token) return;
    await supabase.rpc("customer_remove_pause", { p_token: token, p_pause_id: id });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Pauses"
        subtitle="Going away? Pause upcoming deliveries — no need to cancel one by one."
      />

      {loading ? (
        <SkeletonList rows={2} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<CalendarOff size={18} />} title="No pauses scheduled" />
      ) : (
        <Card padded={false} className="mb-4 divide-y divide-[var(--border-subtle)]">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 p-3.5 text-[13px]">
              <span className="tnum">
                {prettyDate(p.date_from)}
                {p.date_to !== p.date_from ? ` → ${prettyDate(p.date_to)}` : ""}
                {p.reason ? <span className="text-ink-mute"> · {p.reason}</span> : null}
              </span>
              {p.date_from > isoDate() && (
                <button
                  type="button"
                  className="text-[12px] text-danger shrink-0"
                  onClick={() => void remove(p.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="text-[13px] font-semibold text-ink-soft mb-3">Add a pause</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            {(id) => (
              <Input id={id} type="date" min={tomorrow} value={from} onChange={(e) => setFrom(e.target.value)} />
            )}
          </Field>
          <Field label="To">
            {(id) => (
              <Input id={id} type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
            )}
          </Field>
          <Field label="Reason (optional)" className="col-span-2">
            {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
        </div>
        {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
        <Button type="button" size="sm" variant="secondary" loading={busy} className="mt-3" onClick={() => void add()}>
          Add pause
        </Button>
      </Card>
    </div>
  );
}
