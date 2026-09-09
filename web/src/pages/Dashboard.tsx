import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate } from "../lib/dates";
import { PageHeader, StatTile, Card } from "../ui";

interface Stats {
  animals: number | null;
  milking: number | null;
  retail: number | null;
  regulars: number | null;
  producedToday: number;
  producedMonth: number;
  revenueMonth: number;
  spendMonth: number;
}

const REGULAR_TARGET = 15; // docs/decisions/0005
const EMPTY: Stats = {
  animals: null,
  milking: null,
  retail: null,
  regulars: null,
  producedToday: 0,
  producedMonth: 0,
  revenueMonth: 0,
  spendMonth: 0,
};

export default function Dashboard() {
  const [s, setS] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    void (async () => {
      const today = isoDate();
      const monthStart = today.slice(0, 8) + "01";
      const sum = <T,>(rows: T[] | null, pick: (r: T) => number) =>
        (rows ?? []).reduce((acc, r) => acc + Number(pick(r)), 0);

      const [
        animals,
        milking,
        retail,
        regulars,
        prodToday,
        prodMonth,
        rtMonth,
        whMonth,
        exMonth,
        feedMonth,
      ] = await Promise.all([
        supabase.from("animals").select("id", { count: "exact", head: true }),
        supabase
          .from("animals")
          .select("id", { count: "exact", head: true })
          .eq("status", "milking"),
        supabase
          .from("retail_customers")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("retail_customers")
          .select("id", { count: "exact", head: true })
          .eq("type", "regular")
          .eq("status", "active"),
        supabase.from("milk_production").select("qty_kg").eq("date", today),
        supabase.from("milk_production").select("qty_kg").gte("date", monthStart),
        supabase
          .from("retail_orders")
          .select("amount_collected")
          .gte("delivery_date", monthStart)
          .eq("status", "delivered")
          .eq("paid", true),
        supabase
          .from("wholesale_deliveries")
          .select("amount")
          .gte("date", monthStart),
        supabase.from("expenses").select("amount").gte("date", monthStart),
        supabase.from("feed_purchases").select("cost").gte("date", monthStart),
      ]);

      setS({
        animals: animals.count,
        milking: milking.count,
        retail: retail.count,
        regulars: regulars.count,
        producedToday: sum(prodToday.data, (r: { qty_kg: number }) => r.qty_kg),
        producedMonth: sum(prodMonth.data, (r: { qty_kg: number }) => r.qty_kg),
        revenueMonth:
          sum(rtMonth.data, (r: { amount_collected: number | null }) => r.amount_collected ?? 0) +
          sum(whMonth.data, (r: { amount: number }) => r.amount),
        spendMonth:
          sum(exMonth.data, (r: { amount: number }) => r.amount) +
          sum(feedMonth.data, (r: { cost: number }) => r.cost),
      });
      setLoading(false);
    })();
  }, []);

  const regulars = s.regulars ?? 0;
  const pct = Math.min(100, Math.round((regulars / REGULAR_TARGET) * 100));
  const costPerKg = s.producedMonth > 0 ? s.spendMonth / s.producedMonth : null;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick read on the herd and this month."
      />

      {!supabaseConfigured && (
        <Card className="mb-4 !bg-danger-weak !border-transparent">
          <p className="text-[13px] text-danger">
            Backend not connected — numbers below are placeholders. Set{" "}
            <code>web/.env.local</code>.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Milk produced today"
          loading={loading}
          tone="accent"
          value={`${s.producedToday.toFixed(1)} kg`}
          sub="across both sessions"
        />
        <StatTile
          label="Milking animals"
          loading={loading}
          value={s.milking ?? 0}
          sub={`of ${s.animals ?? 0} in the herd`}
        />
        <StatTile
          label="Revenue this month"
          loading={loading}
          value={`₹${Math.round(s.revenueMonth).toLocaleString("en-IN")}`}
          sub="retail + wholesale"
        />
        <StatTile
          label="Spend this month"
          loading={loading}
          value={`₹${Math.round(s.spendMonth).toLocaleString("en-IN")}`}
          sub="feed + expenses"
        />
        <StatTile
          label="Cost per kg (month)"
          loading={loading}
          value={costPerKg == null ? "—" : `₹${costPerKg.toFixed(1)}`}
          sub={`${s.producedMonth.toFixed(0)} kg produced`}
        />
        <StatTile
          label="Regular customers"
          loading={loading}
          value={regulars}
          sub={`target ${REGULAR_TARGET}`}
        />
      </div>

      <Card className="mt-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] font-medium text-ink-soft">
            Progress to {REGULAR_TARGET} regulars
          </span>
          <span className="text-[13px] text-ink-mute tnum">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-sunken overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[12px] text-ink-mute mt-2">
          No route or price changes until this hits {REGULAR_TARGET} (decision 0005).
        </p>
      </Card>

      <p className="text-[12px] text-ink-mute mt-4">
        “Cost per kg” is this month’s feed + expenses over kg produced — it firms
        up as those are logged consistently.
      </p>
    </div>
  );
}
