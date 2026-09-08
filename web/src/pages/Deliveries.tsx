import { useCallback, useEffect, useMemo, useState } from "react";
import { Truck, Check } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate } from "../lib/dates";
import type { RetailCustomer, RetailOrder } from "../types/db";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Select,
  Badge,
  DateStepper,
  EmptyState,
  SkeletonList,
} from "../ui";

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

  async function mark(r: Row, patch: Partial<RetailOrder>) {
    setBusyId(r.id);
    setMsg(null);
    const { error } = await supabase.from("retail_orders").update(patch).eq("id", r.id);
    setBusyId(null);
    if (error) setMsg(error.message);
    else void load();
  }

  return (
    <div>
      <PageHeader title="Delivery list" subtitle="Regulars first. Mark each stop as you go." />

      <DateStepper value={date} onChange={setDate} className="mb-4" />

      {loading ? (
        <SkeletonList rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Truck size={18} />}
          title="No stops for this date"
          description="Build the list on the Orders screen, then come back here to run the round."
        />
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <DeliveryRow
              key={r.id}
              row={r}
              busy={busyId === r.id}
              onMark={(patch) => void mark(r, patch)}
            />
          ))}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <Card className="mt-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
            <Row k="Stops done" v={`${totals.done} / ${rows.length}`} />
            <Row k="Delivered" v={`${totals.deliveredKg.toFixed(2)} kg`} />
            <Row k="Cash" v={`₹${totals.cash.toFixed(0)}`} />
            <Row k="UPI" v={`₹${totals.upi.toFixed(0)}`} />
            <Row
              k="Unpaid"
              v={`₹${totals.unpaid.toFixed(0)}`}
              danger={totals.unpaid > 0}
            />
          </div>
        </Card>
      )}
      {msg && <p className="text-[13px] text-danger mt-3">{msg}</p>}
    </div>
  );
}

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-mute">{k}</span>
      <span className={`font-semibold tnum ${danger ? "text-danger" : "text-ink"}`}>{v}</span>
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
    <div
      className={`mg-card p-3.5 transition-opacity ${done || skipped ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-ink truncate">
            {row.customer?.name ?? "—"}
            {row.customer?.area ? (
              <span className="text-ink-mute"> · {row.customer.area}</span>
            ) : null}
          </div>
          {row.customer?.address_text && (
            <div className="text-[12px] text-ink-mute truncate">{row.customer.address_text}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[13px] tnum text-ink-soft">{row.ordered_qty_kg} kg</div>
          {done ? (
            <Badge tone={row.paid ? "success" : "danger"}>
              {row.paid ? row.payment_method.toUpperCase() : "unpaid"}
            </Badge>
          ) : skipped ? (
            <Badge tone="neutral">skipped</Badge>
          ) : (
            <Badge tone="neutral">pending</Badge>
          )}
        </div>
      </div>

      {!done && !skipped && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            inputMode="decimal"
            className="w-20 text-right tnum"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <span className="text-[12px] text-ink-mute tnum">kg · ₹{due.toFixed(0)}</span>
          <Select
            className="w-auto"
            value={method}
            onChange={(e) => setMethod(e.target.value as "upi" | "cash")}
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
          </Select>
          <Button
            size="sm"
            icon={<Check size={15} />}
            loading={busy}
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
            Delivered
          </Button>
          <Button
            size="sm"
            variant="ghost"
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
            Unpaid
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onMark({ status: "skipped" })}
          >
            Skip
          </Button>
        </div>
      )}

      {(done || skipped) && (
        <button
          className="mt-2 text-[12px] text-ink-mute hover:text-ink"
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
          Undo
        </button>
      )}
    </div>
  );
}
