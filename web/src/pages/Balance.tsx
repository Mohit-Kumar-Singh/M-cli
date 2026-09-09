import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate } from "../lib/dates";
import type { RetailOrder, WholesaleDelivery, MilkProduction } from "../types/db";
import { PageHeader, Button, Card, Field, Input, DateStepper, Skeleton } from "../ui";

interface Computed {
  produced: number;
  withheld: number;
  wholesale: number;
  retail: number;
  cash: number;
  upi: number;
  unpaid: number;
}
const ZERO: Computed = {
  produced: 0,
  withheld: 0,
  wholesale: 0,
  retail: 0,
  cash: 0,
  upi: 0,
  unpaid: 0,
};

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
    const [prodRes, whRes, rtRes, balRes, wdRes] = await Promise.all([
      supabase.from("milk_production").select("qty_kg").eq("date", date),
      supabase.from("wholesale_deliveries").select("*").eq("date", date),
      supabase
        .from("retail_orders")
        .select("*")
        .eq("delivery_date", date)
        .eq("status", "delivered"),
      supabase.from("daily_balance").select("*").eq("date", date).maybeSingle(),
      supabase.rpc("withdrawn_milk_kg", { on_date: date }),
    ]);

    const produced = ((prodRes.data ?? []) as Pick<MilkProduction, "qty_kg">[]).reduce(
      (s, r) => s + Number(r.qty_kg),
      0,
    );
    const withheld = Number(wdRes.data ?? 0);
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
      withheld,
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
  const sellable = Math.max(0, c.produced - c.withheld);
  const bufferDelta = n(bufEnd) - n(bufStart);
  const accounted = c.wholesale + c.retail + n(ownUse) + n(wastage) + bufferDelta;
  const unaccounted = sellable - accounted;

  async function save() {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("daily_balance").upsert({
      date,
      produced_kg: c.produced,
      sellable_kg: sellable, // produced minus milk under vet withdrawal (Health)
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
    setMsg(error ? error.message : "Saved");
  }

  return (
    <div>
      <PageHeader title="Daily milk balance" subtitle="Where the day's milk and money went." />

      <DateStepper value={date} onChange={setDate} max={isoDate()} className="mb-4" />

      {loading ? (
        <div className="space-y-3">
          <Skeleton h={90} className="rounded-[14px]" />
          <Skeleton h={190} className="rounded-[14px]" />
          <Skeleton h={130} className="rounded-[14px]" />
        </div>
      ) : (
        <div className="space-y-3">
          <Card>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric k="Produced" v={`${c.produced.toFixed(1)}`} unit="kg" />
              <Metric k="To wholesale" v={`${c.wholesale.toFixed(1)}`} unit="kg" />
              <Metric k="To retail" v={`${c.retail.toFixed(1)}`} unit="kg" />
            </div>
            {c.withheld > 0 && (
              <p className="text-[12px] text-ink-mute mt-3 pt-3 border-t border-[var(--border-subtle)]">
                {c.withheld.toFixed(1)} kg under vet withdrawal · sellable{" "}
                <span className="font-semibold text-ink tnum">{sellable.toFixed(1)} kg</span>
              </p>
            )}
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Own use (kg)">
                {(id) => (
                  <Input id={id} inputMode="decimal" value={ownUse} onChange={(e) => setOwnUse(e.target.value)} />
                )}
              </Field>
              <Field label="Wastage (kg)">
                {(id) => (
                  <Input id={id} inputMode="decimal" value={wastage} onChange={(e) => setWastage(e.target.value)} />
                )}
              </Field>
              <Field label="Buffer start (kg)">
                {(id) => (
                  <Input id={id} inputMode="decimal" value={bufStart} onChange={(e) => setBufStart(e.target.value)} />
                )}
              </Field>
              <Field label="Buffer end (kg)">
                {(id) => (
                  <Input id={id} inputMode="decimal" value={bufEnd} onChange={(e) => setBufEnd(e.target.value)} />
                )}
              </Field>
              <Field label="Notes" className="col-span-2">
                {(id) => (
                  <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />
                )}
              </Field>
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
              <Line k="Accounted for" v={`${accounted.toFixed(2)} kg`} />
              <Line
                k="Unaccounted"
                v={`${unaccounted.toFixed(2)} kg`}
                tone={Math.abs(unaccounted) > 0.5 ? "danger" : "success"}
              />
              <Line k="Cash collected" v={`₹${c.cash.toFixed(0)}`} />
              <Line k="UPI collected" v={`₹${c.upi.toFixed(0)}`} />
              <Line k="Unpaid" v={`₹${c.unpaid.toFixed(0)}`} tone={c.unpaid ? "danger" : undefined} />
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {msg && <span className="text-[13px] text-ink-mute">{msg}</span>}
            <Button onClick={save} loading={saving} disabled={!supabaseConfigured}>
              Save balance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ k, v, unit }: { k: string; v: string; unit: string }) {
  return (
    <div>
      <div className="font-display text-[1.4rem] font-bold text-ink tnum leading-none">
        {v}
        <span className="text-[0.8rem] text-ink-mute font-sans font-medium"> {unit}</span>
      </div>
      <div className="text-[12px] text-ink-mute mt-1">{k}</div>
    </div>
  );
}

function Line({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "danger" | "success";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-mute">{k}</span>
      <span
        className={`font-semibold tnum ${
          tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink"
        }`}
      >
        {v}
      </span>
    </div>
  );
}
