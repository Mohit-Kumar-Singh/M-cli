import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import {
  addDays,
  isPastCutoffFor,
  nextDeliveryDate,
  prettyDate,
} from "../lib/dates";
import type { RetailCustomer, RetailOrder } from "../types/db";

interface Line {
  customer: RetailCustomer;
  qty: string;
  source: "standing" | "manual" | "bot";
  paused: boolean;
  orderId?: string;
}

export default function RetailOrders() {
  const [date, setDate] = useState(nextDeliveryDate());
  const [lines, setLines] = useState<Line[]>([]);
  const [casuals, setCasuals] = useState<RetailCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const frozen = isPastCutoffFor(date);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    setMsg(null);
    const [custRes, orderRes, pauseRes] = await Promise.all([
      supabase.from("retail_customers").select("*").eq("status", "active"),
      supabase.from("retail_orders").select("*").eq("delivery_date", date),
      supabase
        .from("retail_pauses")
        .select("*")
        .lte("date_from", date)
        .gte("date_to", date),
    ]);
    const customers = (custRes.data ?? []) as RetailCustomer[];
    const orders = (orderRes.data ?? []) as RetailOrder[];
    const pausedIds = new Set((pauseRes.data ?? []).map((p: { customer_id: string }) => p.customer_id));
    const orderByCust = new Map(orders.map((o) => [o.customer_id, o]));

    const regulars = customers
      .filter((c) => c.type === "regular")
      .sort((a, b) => (a.round_sequence ?? 999) - (b.round_sequence ?? 999));

    const regularLines: Line[] = regulars.map((c) => {
      const existing = orderByCust.get(c.id);
      const paused = pausedIds.has(c.id);
      return {
        customer: c,
        paused,
        orderId: existing?.id,
        source: (existing?.source as Line["source"]) ?? "standing",
        qty: existing
          ? String(existing.ordered_qty_kg)
          : paused
            ? ""
            : c.fixed_daily_qty_kg != null
              ? String(c.fixed_daily_qty_kg)
              : "",
      };
    });

    // Casual customers who already have an order for this date.
    const casualLines: Line[] = customers
      .filter((c) => c.type === "casual" && orderByCust.has(c.id))
      .map((c) => {
        const existing = orderByCust.get(c.id)!;
        return {
          customer: c,
          paused: false,
          orderId: existing.id,
          source: (existing.source as Line["source"]) ?? "manual",
          qty: String(existing.ordered_qty_kg),
        };
      });

    setLines([...regularLines, ...casualLines]);
    setCasuals(
      customers.filter(
        (c) => c.type === "casual" && !orderByCust.has(c.id),
      ),
    );
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0), 0),
    [lines],
  );

  function setQty(customerId: string, qty: string) {
    setLines((ls) =>
      ls.map((l) => (l.customer.id === customerId ? { ...l, qty } : l)),
    );
  }

  function addCasual(c: RetailCustomer) {
    setLines((ls) => [
      ...ls,
      { customer: c, qty: "", source: "manual", paused: false },
    ]);
    setCasuals((cs) => cs.filter((x) => x.id !== c.id));
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    const toUpsert = lines
      .map((l) => ({
        customer_id: l.customer.id,
        delivery_date: date,
        product: "buffalo milk",
        ordered_qty_kg: parseFloat(l.qty),
        source: l.source,
      }))
      .filter((r) => !Number.isNaN(r.ordered_qty_kg) && r.ordered_qty_kg > 0);

    const toDelete = lines
      .filter((l) => l.orderId && !(parseFloat(l.qty) > 0))
      .map((l) => l.orderId!) as string[];

    if (toDelete.length) {
      await supabase
        .from("retail_orders")
        .delete()
        .in("id", toDelete)
        .eq("status", "pending");
    }
    const { error } = toUpsert.length
      ? await supabase
          .from("retail_orders")
          .upsert(toUpsert, { onConflict: "customer_id,delivery_date,product" })
      : { error: null };

    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Saved.");
      void load();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Orders for a day</h1>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to build the order list.
        </p>
      )}

      <div className="card p-3 flex items-center gap-3">
        <button className="text-sm muted" onClick={() => setDate(addDays(date, -1))}>
          ‹
        </button>
        <input
          className="input w-auto"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="text-sm muted" onClick={() => setDate(addDays(date, 1))}>
          ›
        </button>
        <span className="muted text-sm ml-auto">{prettyDate(date)}</span>
      </div>

      {frozen && (
        <p className="card p-3 text-sm" style={{ color: "var(--danger)" }}>
          Past the 9 pm cutoff for this date — the list is frozen. New orders go
          to a later date (0003).
        </p>
      )}

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : (
        <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
          {lines.length === 0 && (
            <p className="p-3 muted text-sm">No orders yet for this date.</p>
          )}
          {lines.map((l) => (
            <div key={l.customer.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <div className="font-medium">
                  {l.customer.name}{" "}
                  <span className="muted text-xs">
                    {l.customer.type === "regular" ? "regular" : "casual"}
                    {l.paused ? " · paused" : ""}
                  </span>
                </div>
                <div className="muted text-xs">{l.customer.area ?? ""}</div>
              </div>
              <input
                className="input w-24 text-right"
                inputMode="decimal"
                placeholder="kg"
                value={l.qty}
                disabled={frozen}
                onChange={(e) => setQty(l.customer.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {!frozen && casuals.length > 0 && (
        <div className="card p-3">
          <div className="muted text-xs mb-2">Add a casual order</div>
          <div className="flex flex-wrap gap-2">
            {casuals.map((c) => (
              <button
                key={c.id}
                className="rounded-lg border px-2.5 py-1 text-sm"
                style={{ borderColor: "var(--border)" }}
                onClick={() => addCasual(c)}
              >
                + {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="muted">Total: </span>
          <span className="font-bold">{total.toFixed(2)} kg</span>
          <span className="muted"> · {lines.filter((l) => parseFloat(l.qty) > 0).length} stops</span>
        </div>
        <button
          className="btn-primary"
          onClick={save}
          disabled={saving || frozen || !supabaseConfigured}
        >
          {saving ? "Saving…" : "Save orders"}
        </button>
      </div>
      {msg && <p className="text-sm muted">{msg}</p>}
    </div>
  );
}
