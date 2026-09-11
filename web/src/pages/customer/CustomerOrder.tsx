import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { addDays, isoDate, isPastCutoffFor, nextDeliveryDate, prettyDate } from "../../lib/dates";
import { useCustomerAuth } from "../../lib/customerAuth";
import type { RetailOrder } from "../../types/db";
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
} from "../../ui";

const STATUS_TONE: Record<RetailOrder["status"], "neutral" | "accent" | "gold" | "danger"> = {
  pending: "gold",
  delivered: "accent",
  skipped: "neutral",
  cancelled: "danger",
};

export default function CustomerOrder() {
  const { token, customer } = useCustomerAuth();
  const [date, setDate] = useState(nextDeliveryDate());
  const [qty, setQty] = useState("");
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<RetailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const frozen = isPastCutoffFor(date);
  const minDate = nextDeliveryDate();
  const rangeFrom = useMemo(() => addDays(isoDate(), -7), []);
  const rangeTo = useMemo(() => addDays(minDate, 13), [minDate]);

  const load = useCallback(async () => {
    if (!token) return setLoading(false);
    setLoading(true);
    setMsg(null);
    const { data } = await supabase.rpc("customer_get_orders", {
      p_token: token,
      p_from: rangeFrom,
      p_to: rangeTo,
    });
    const orders = (data ?? []) as RetailOrder[];
    setHistory(orders);
    const forDate = orders.find((o) => o.delivery_date === date);
    setOrderId(forDate?.id);
    setQty(forDate ? String(forDate.ordered_qty_kg) : "");
    setLoading(false);
  }, [token, date, rangeFrom, rangeTo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setMsg(null);
    const n = parseFloat(qty);
    const { error } = await supabase.rpc("customer_place_order", {
      p_token: token,
      p_date: date,
      p_qty: Number.isNaN(n) ? 0 : n,
    });
    setSaving(false);
    if (error) setMsg(error.message.replace(/^.*:\s*/, ""));
    else {
      setMsg("Saved");
      void load();
    }
  }

  const upcoming = history.filter((o) => o.delivery_date >= minDate).sort((a, b) => a.delivery_date.localeCompare(b.delivery_date));
  const past = history.filter((o) => o.delivery_date < minDate).sort((a, b) => b.delivery_date.localeCompare(a.delivery_date));

  return (
    <div>
      <PageHeader
        title={`Hi, ${customer?.name?.split(" ")[0] ?? "there"}`}
        subtitle="Pure buffalo milk, delivered daily — order as little or as much as you need."
      />

      <DateStepper value={date} onChange={setDate} min={minDate} max={rangeTo} className="mb-4" />

      {frozen ? (
        <Card className="mb-4 !bg-gold-weak !border-transparent">
          <p className="flex items-start gap-2 text-[13px] text-gold">
            <Lock size={15} className="mt-0.5 shrink-0" />
            Past the 9&nbsp;pm cutoff for this date — pick a later date to
            order.
          </p>
        </Card>
      ) : (
        <Card className="mb-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-ink">Order quantity</div>
            <div className="text-[12px] text-ink-mute">₹{customer?.price_per_kg ?? 60}/kg · 0 to skip</div>
          </div>
          <div className="w-20 shrink-0">
            <Input
              inputMode="decimal"
              placeholder="kg"
              className="text-right tnum"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </Card>
      )}

      {!frozen && (
        <div className="flex items-center gap-3 mb-5">
          {msg && <span className="text-[13px] text-ink-mute">{msg}</span>}
          <Button onClick={save} loading={saving} className="ml-auto">
            {orderId ? "Update order" : "Place order"}
          </Button>
        </div>
      )}

      <div className="text-[12px] font-semibold text-ink-mute uppercase tracking-wide mb-2">
        Upcoming
      </div>
      {loading ? (
        <SkeletonList rows={3} />
      ) : upcoming.length === 0 ? (
        <EmptyState icon={<ClipboardList size={18} />} title="No orders scheduled" />
      ) : (
        <ListCard className="mb-5">
          {upcoming.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </ListCard>
      )}

      <div className="text-[12px] font-semibold text-ink-mute uppercase tracking-wide mb-2">
        Recent
      </div>
      {loading ? (
        <SkeletonList rows={3} />
      ) : past.length === 0 ? (
        <EmptyState icon={<ClipboardList size={18} />} title="No deliveries yet" />
      ) : (
        <ListCard>
          {past.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </ListCard>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: RetailOrder }) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ink">{prettyDate(order.delivery_date)}</div>
        <div className="text-[12px] text-ink-mute flex items-center gap-1.5">
          <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
          {order.status === "delivered" && (
            <span>{order.paid ? "paid" : "unpaid"}</span>
          )}
        </div>
      </div>
      <div className="tnum text-ink font-medium">
        {(order.delivered_qty_kg ?? order.ordered_qty_kg).toFixed(2)} kg
      </div>
    </div>
  );
}
