import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, addDays, prettyDate } from "../lib/dates";
import type { RetailCustomer, RetailOrder } from "../types/db";

interface Row extends RetailOrder {
  customer?: RetailCustomer;
}

export default function Deliveries() {
  const [date, setDate] = useState(isoDate());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    setMsg(null);
    const [orderRes, custRes] = await Promise.all([
      supabase.from("retail_orders").select("*").eq("delivery_date", date),
      supabase.from("retail_customers").select("*"),
    ]);
    const custById = new Map(
      ((custRes.data ?? []) as RetailCustomer[]).map((c) => [c.id, c]),
    );
    const list = ((orderRes.data ?? []) as RetailOrder[])
      .map((o) => ({ ...o, customer: custById.get(o.customer_id) }))
      .sort((a, b) => {
        const sa = a.customer?.round_sequence ?? 999;
        const sb = b.customer?.round_sequence ?? 999;
        if (sa !== sb) return sa - sb;
        return (a.customer?.name ?? "").localeCompare(b.customer?.name ?? "");
      });
    setRows(list);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let deliveredKg = 0,
      cash = 0,
      upi = 0,
      unpaid = 0,
      done = 0;
    for (const r of rows) {
      if (r.status === "delivered") {
        done++;
        deliveredKg += Number(r.delivered_qty_kg ?? 0);
        const amt = Number(r.amount_collected ?? 0);
        if (r.paid && r.payment_method === "cash") cash += amt;
        else if (r.paid && r.payment_method === "upi") upi += amt;
        else if (!r.paid) unpaid += price(r);
      }
    }
    return { deliveredKg, cash, upi, unpaid, done };
  }, [rows]);

  async function mark(
    r: Row,
    patch: Partial<RetailOrder>,
  ) {
    setBusyId(r.id);
    setMsg(null);
    const { error } = await supabase
      .from("retail_orders")
      .update(patch)
      .eq("id", r.id);
    setBusyId(null);
    if (error) setMsg(error.message);
    else void load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Delivery list</h1>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to load the round.
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

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted text-sm">No orders for this date.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <DeliveryRow
              key={r.id}
              row={r}
              busy={busyId === r.id}
              onMark={(patch) => void mark(r, patch)}
            />
          ))}
        </ul>
      )}

      <div className="card p-3 text-sm grid grid-cols-2 gap-1">
        <div><span className="muted">Stops done: </span><b>{totals.done}/{rows.length}</b></div>
        <div><span className="muted">Delivered: </span><b>{totals.deliveredKg.toFixed(2)} kg</b></div>
        <div><span className="muted">Cash: </span><b>₹{totals.cash.toFixed(0)}</b></div>
        <div><span className="muted">UPI: </span><b>₹{totals.upi.toFixed(0)}</b></div>
        <div><span className="muted">Unpaid: </span><b style={{ color: totals.unpaid ? "var(--danger)" : undefined }}>₹{totals.unpaid.toFixed(0)}</b></div>
      </div>
      {msg && <p className="text-sm" style={{ color: "var(--danger)" }}>{msg}</p>}
    </div>
  );
}

function price(r: Row): number {
  const kg = Number(r.delivered_qty_kg ?? r.ordered_qty_kg);
  return kg * Number(r.customer?.price_per_kg ?? 60);
}

function DeliveryRow({
  row,
  busy,
  onMark,
}: {
  row: Row;
  busy: boolean;
  onMark: (patch: Partial<RetailOrder>) => void;
}) {
  const [qty, setQty] = useState(String(row.delivered_qty_kg ?? row.ordered_qty_kg));
  const [method, setMethod] = useState<"upi" | "cash">(
    row.payment_method === "cash" ? "cash" : "upi",
  );
  const due = (parseFloat(qty) || 0) * Number(row.customer?.price_per_kg ?? 60);
  const done = row.status === "delivered";
  const skipped = row.status === "skipped";

  return (
    <li className="card p-3 space-y-2" style={done ? { opacity: 0.7 } : undefined}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">
            {row.customer?.name ?? "—"}{" "}
            <span className="muted text-xs">{row.customer?.area ?? ""}</span>
          </div>
          <div className="muted text-xs">{row.customer?.address_text ?? ""}</div>
        </div>
        <div className="text-right text-sm">
          <div>{row.ordered_qty_kg} kg ordered</div>
          <div className="muted text-xs">
            {done ? "delivered" : skipped ? "skipped" : "pending"}
          </div>
        </div>
      </div>

      {!done && !skipped && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-20 text-right"
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <span className="muted text-xs">kg · ₹{due.toFixed(0)}</span>
          <select
            className="input w-auto"
            value={method}
            onChange={(e) => setMethod(e.target.value as "upi" | "cash")}
          >
            <option value="upi">UPI</option>
            <option value="cash">cash</option>
          </select>
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() =>
              onMark({
                status: "delivered",
                delivered_qty_kg: parseFloat(qty) || 0,
                delivered_at: new Date().toISOString(),
                paid: true,
                payment_method: method,
                amount_collected: due,
              })
            }
          >
            Delivered + paid
          </button>
          <button
            className="text-sm muted underline"
            disabled={busy}
            onClick={() =>
              onMark({
                status: "delivered",
                delivered_qty_kg: parseFloat(qty) || 0,
                delivered_at: new Date().toISOString(),
                paid: false,
                payment_method: "none",
                amount_collected: null,
              })
            }
          >
            unpaid
          </button>
          <button
            className="text-sm muted underline"
            disabled={busy}
            onClick={() => onMark({ status: "skipped" })}
          >
            skip
          </button>
        </div>
      )}

      {(done || skipped) && (
        <button
          className="text-xs muted underline"
          disabled={busy}
          onClick={() =>
            onMark({
              status: "pending",
              delivered_qty_kg: null,
              delivered_at: null,
              paid: false,
              payment_method: "none",
              amount_collected: null,
            })
          }
        >
          undo
        </button>
      )}
    </li>
  );
}
