import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

interface Counts {
  animals: number | null;
  milkingAnimals: number | null;
  retailCustomers: number | null;
  regulars: number | null;
}

const REGULAR_TARGET = 15; // docs/decisions/0005

export default function Dashboard() {
  const [c, setC] = useState<Counts>({
    animals: null,
    milkingAnimals: null,
    retailCustomers: null,
    regulars: null,
  });

  useEffect(() => {
    if (!supabaseConfigured) return;
    void (async () => {
      const [animals, milking, retail, regulars] = await Promise.all([
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
      ]);
      setC({
        animals: animals.count,
        milkingAnimals: milking.count,
        retailCustomers: retail.count,
        regulars: regulars.count,
      });
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Dashboard</h1>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to see live numbers (web/.env.local).
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Animals" value={c.animals} />
        <Stat label="Milking" value={c.milkingAnimals} />
        <Stat label="Active retail customers" value={c.retailCustomers} />
        <Stat
          label="Regulars → target 15"
          value={c.regulars}
          suffix={c.regulars != null ? ` / ${REGULAR_TARGET}` : ""}
        />
      </div>

      <p className="muted text-xs">
        Milk-produced / sold-by-channel / collections land here with the
        Production, Sales and Milk-balance modules (Milestone 1).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold">
        {value == null ? "—" : value}
        {suffix}
      </div>
      <div className="muted text-sm">{label}</div>
    </div>
  );
}
