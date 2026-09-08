import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, addDays, prettyDate } from "../lib/dates";
import type { RetailOrder, WholesaleDelivery, MilkProduction } from "../types/db";

interface Computed {
  produced: number;
  wholesale: number;
  retail: number;
  cash: number;
  upi: number;
  unpaid: number;
}

const ZERO: Computed = { produced: 0, wholesale: 0, retail: 0, cash: 0, upi: 0, unpaid: 0 };

export default function Balance() {
  const [date, setDate] = useState(isoDate());
  const [c, setC] = useState<Computed>(ZERO);
  const [ownUse, setOwnUse] = useState("");
  const [wastage, setWastage] = useState("");
  const [bufStart, setBufStart] = useState("");
  const [bufEnd, setBufEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    setMsg(null);
    const [prodRes, whRes, rtRes, balRes] = await Promise.all([
      supabase.from("milk_production").select("qty_kg").eq("date", date),
      supabase.from("wholesale_deliveries").select("*").eq("date", date),
      supabase
        .from("retail_orders")
        .select("*")
        .eq("delivery_date", date)
        .eq("status", "delivered"),
      supabase.from("daily_balance").select("*").eq("date", date).maybeSingle(),
    ]);

    const produced = ((prodRes.data ?? []) as Pick<MilkProduction, "qty_kg">[]).reduce(
      (s, r) => s + Number(r.qty_kg),
      0,
    );
    const wh = (whRes.data ?? []) as WholesaleDelivery[];
    const rt = (rtRes.data ?? []) as RetailOrder[];

    let cash = 0,
      upi = 0,
      unpaid = 0;
    for (const d of wh) {
      const recv = Number(d.amount_received ?? 0);
      if (d.payment_method === "cash") cash += recv;
      else if (d.payment_method === "upi") upi += recv;
      unpaid += Number(d.amount) - recv;
    }
    for (const o of rt) {
      const amt = Number(o.amount_collected ?? 0);
      if (o.paid && o.payment_method === "cash") cash += amt;
      else if (o.paid && o.payment_method === "upi") upi += amt;
      else if (!o.paid) unpaid += Number(o.delivered_qty_kg ?? o.ordered_qty_kg) * 60;
    }

    setC({
      produced,
      wholesale: wh.reduce((s, d) => s + Number(d.qty_kg), 0),
      retail: rt.reduce((s, o) => s + Number(o.delivered_qty_kg ?? 0), 0),
      cash,
      upi,
      unpaid,
    });

    const bal = balRes.data as Record<string, number | string | null> | null;
    setOwnUse(bal?.own_use_kg != null ? String(bal.own_use_kg) : "");
    setWastage(bal?.wastage_kg != null ? String(bal.wastage_kg) : "");
    setBufStart(bal?.buffer_start_kg != null ? String(bal.buffer_start_kg) : "");
    setBufEnd(bal?.buffer_end_kg != null ? String(bal.buffer_end_kg) : "");
    setNotes((bal?.notes as string) ?? "");
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const n = (s: string) => parseFloat(s) || 0;
  const bufferDelta = n(bufEnd) - n(bufStart); // +ve = milk added to fridge
  const accounted = c.wholesale + c.retail + n(ownUse) + n(wastage) + bufferDelta;
  const unaccounted = c.produced - accounted;

  async function save() {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("daily_balance").upsert({
      date,
      produced_kg: c.produced,
      sellable_kg: c.produced, // withdrawal handling arrives with the Health module
      wholesale_kg: c.wholesale,
      retail_kg: c.retail,
      own_use_kg: n(ownUse),
      wastage_kg: n(wastage),
      buffer_start_kg: bufStart ? n(bufStart) : null,
      buffer_end_kg: bufEnd ? n(bufEnd) : null,
      cash_total: c.cash,
      upi_total: c.upi,
      unpaid_total: c.unpaid,
      notes: notes.trim() || null,
    });
    setSaving(false);
    setMsg(error ? error.message : "Saved.");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Daily milk balance</h1>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to reconcile the day.
        </p>
      )}

      <div className="card p-3 flex items-center gap-3">
        <button className="text-sm muted" onClick={() => setDate(addDays(date, -1))}>‹</button>
        <input className="input w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="text-sm muted" onClick={() => setDate(addDays(date, 1))} disabled={date >= isoDate()}>›</button>
        <span className="muted text-sm ml-auto">{prettyDate(date)}</span>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : (
        <>
          <div className="card p-3 text-sm grid grid-cols-2 gap-y-1">
            <span className="muted">Produced</span>
            <b className="text-right">{c.produced.toFixed(2)} kg</b>
            <span className="muted">To wholesale</span>
            <b className="text-right">{c.wholesale.toFixed(2)} kg</b>
            <span className="muted">To retail (delivered)</span>
            <b className="text-right">{c.retail.toFixed(2)} kg</b>
          </div>

          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Own use (kg)
                <input className="input mt-1" inputMode="decimal" value={ownUse} onChange={(e) => setOwnUse(e.target.value)} />
              </label>
              <label className="text-sm">
                Wastage (kg)
                <input className="input mt-1" inputMode="decimal" value={wastage} onChange={(e) => setWastage(e.target.value)} />
              </label>
              <label className="text-sm">
                Buffer start (kg)
                <input className="input mt-1" inputMode="decimal" value={bufStart} onChange={(e) => setBufStart(e.target.value)} />
              </label>
              <label className="text-sm">
                Buffer end (kg)
                <input className="input mt-1" inputMode="decimal" value={bufEnd} onChange={(e) => setBufEnd(e.target.value)} />
              </label>
            </div>
            <label className="text-sm block">
              Notes
              <input className="input mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>

          <div className="card p-3 text-sm grid grid-cols-2 gap-y-1">
            <span className="muted">Accounted for</span>
            <b className="text-right">{accounted.toFixed(2)} kg</b>
            <span className="muted">Unaccounted (produced − accounted)</span>
            <b
              className="text-right"
              style={{ color: Math.abs(unaccounted) > 0.5 ? "var(--danger)" : "var(--ok)" }}
            >
              {unaccounted.toFixed(2)} kg
            </b>
            <span className="muted">Cash collected</span>
            <b className="text-right">₹{c.cash.toFixed(0)}</b>
            <span className="muted">UPI collected</span>
            <b className="text-right">₹{c.upi.toFixed(0)}</b>
            <span className="muted">Unpaid</span>
            <b className="text-right" style={{ color: c.unpaid ? "var(--danger)" : undefined }}>
              ₹{c.unpaid.toFixed(0)}
            </b>
          </div>

          <div className="flex items-center justify-between">
            {msg && <span className="text-sm muted">{msg}</span>}
            <button className="btn-primary ml-auto" onClick={save} disabled={saving || !supabaseConfigured}>
              {saving ? "Saving…" : "Save balance"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
