import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Lock, Plus } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isPastCutoffFor, nextDeliveryDate } from "../lib/dates";
import type { RetailCustomer, RetailOrder } from "../types/db";
import {
  PageHeader,
  Button,
  Card,
  ListCard,
  Input,
  Badge,
  DateStepper,
  EmptyState,
  SkeletonList,
} from "../ui";

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
    const pausedIds = new Set(
      (pauseRes.data ?? []).map((p: { customer_id: string }) => p.customer_id),
    );
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
    setCasuals(customers.filter((c) => c.type === "casual" && !orderByCust.has(c.id)));
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0), 0),
    [lines],
  );
  const stops = lines.filter((l) => parseFloat(l.qty) > 0).length;

  function setQty(customerId: string, qty: string) {
    setLines((ls) => ls.map((l) => (l.customer.id === customerId ? { ...l, qty } : l)));
  }

  function addCasual(c: RetailCustomer) {
    setLines((ls) => [...ls, { customer: c, qty: "", source: "manual", paused: false }]);
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
      await supabase.from("retail_orders").delete().in("id", toDelete).eq("status", "pending");
    }
    const { error } = toUpsert.length
      ? await supabase
          .from("retail_orders")
          .upsert(toUpsert, { onConflict: "customer_id,delivery_date,product" })
      : { error: null };

    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Saved");
      void load();
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders for a day"
        subtitle="Regulars are filled in from their standing quantity. Add casual orders on top."
      />

      <DateStepper value={date} onChange={setDate} className="mb-4" />

      {frozen && (
        <Card className="mb-4 !bg-gold-weak !border-transparent">
          <p className="flex items-start gap-2 text-[13px] text-gold">
            <Lock size={15} className="mt-0.5 shrink-0" />
            Past the 9&nbsp;pm cutoff for this date — the list is frozen. New
            orders roll to a later date (decision 0003).
          </p>
        </Card>
      )}

      {loading ? (
        <SkeletonList rows={5} />
      ) : lines.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={18} />}
          title="Nothing scheduled"
          description="No regulars with a standing quantity, and no casual orders for this date yet."
        />
      ) : (
        <ListCard>
          {lines.map((l) => (
            <div key={l.customer.id} className="flex items-center gap-3 p-3.5">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink truncate">{l.customer.name}</div>
                <div className="text-[12px] text-ink-mute flex items-center gap-1.5">
                  <Badge tone={l.customer.type === "regular" ? "accent" : "neutral"}>
                    {l.customer.type}
                  </Badge>
                  {l.paused && <Badge tone="gold">paused</Badge>}
                  {l.customer.area && <span>{l.customer.area}</span>}
                </div>
              </div>
              <div className="w-24 shrink-0">
                <Input
                  inputMode="decimal"
                  placeholder="kg"
                  className="text-right tnum"
                  value={l.qty}
                  disabled={frozen}
                  onChange={(e) => setQty(l.customer.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </ListCard>
      )}

      {!frozen && casuals.length > 0 && (
        <Card className="mt-3">
          <div className="text-[12px] font-medium text-ink-mute mb-2">Add a casual order</div>
          <div className="flex flex-wrap gap-2">
            {casuals.map((c) => (
              <button
                key={c.id}
                onClick={() => addCasual(c)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[13px] text-ink-soft hover:bg-sunken transition-colors"
              >
                <Plus size={13} />
                {c.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {!loading && (
        <Card className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[13px]">
            <span className="font-bold text-ink tnum">{total.toFixed(2)} kg</span>
            <span className="text-ink-mute"> · {stops} stops</span>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-[13px] text-ink-mute">{msg}</span>}
            <Button onClick={save} loading={saving} disabled={frozen || !supabaseConfigured}>
              Save orders
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
