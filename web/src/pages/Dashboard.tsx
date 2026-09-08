import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate } from "../lib/dates";
import { PageHeader, StatTile, Card } from "../ui";

interface Counts {
  animals: number | null;
  milking: number | null;
  retail: number | null;
  regulars: number | null;
  producedToday: number | null;
}

const REGULAR_TARGET = 15; // docs/decisions/0005

export default function Dashboard() {
  const [c, setC] = useState<Counts>({
    animals: null,
    milking: null,
    retail: null,
    regulars: null,
    producedToday: null,
  });
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    void (async () => {
      const today = isoDate();
      const [animals, milking, retail, regulars, prod] = await Promise.all([
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
      ]);
      setC({
        animals: animals.count,
        milking: milking.count,
        retail: retail.count,
        regulars: regulars.count,
        producedToday: (prod.data ?? []).reduce(
          (s: number, r: { qty_kg: number }) => s + Number(r.qty_kg),
          0,
        ),
      });
      setLoading(false);
    })();
  }, []);

  const regulars = c.regulars ?? 0;
  const pct = Math.min(100, Math.round((regulars / REGULAR_TARGET) * 100));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick read on the herd and today's round."
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
        <StatTile label="Milk produced today" loading={loading} tone="accent"
          value={`${(c.producedToday ?? 0).toFixed(1)} kg`}
          sub="across both sessions" />
        <StatTile label="Milking animals" loading={loading}
          value={c.milking ?? 0} sub={`of ${c.animals ?? 0} in the herd`} />
        <StatTile label="Active retail customers" loading={loading}
          value={c.retail ?? 0} />
        <StatTile label="Regular customers" loading={loading}
          value={regulars} sub={`target ${REGULAR_TARGET}`} />
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
        Revenue and cost-per-kg summaries arrive with the Feed and Expenses
        modules.
      </p>
    </div>
  );
}
