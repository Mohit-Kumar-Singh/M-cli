import { useCallback, useEffect, useMemo, useState } from "react";
import { Milk } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate } from "../lib/dates";
import type { Animal, MilkProduction } from "../types/db";
import {
  PageHeader,
  Button,
  Card,
  ListCard,
  Input,
  Segmented,
  DateStepper,
  EmptyState,
  SkeletonList,
} from "../ui";

type Session = "morning" | "evening";
const SESSIONS = [
  { value: "morning" as const, label: "Morning" },
  { value: "evening" as const, label: "Evening" },
];

export default function Production() {
  const [date, setDate] = useState(isoDate());
  const [session, setSession] = useState<Session>("morning");
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [savedRows, setSavedRows] = useState<MilkProduction[]>([]);
  const [dayTotal, setDayTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMsg(null);
    const [a, rows, day] = await Promise.all([
      supabase.from("animals").select("*").eq("status", "milking").order("tag_no"),
      supabase
        .from("milk_production")
        .select("*")
        .eq("date", date)
        .eq("session", session),
      supabase.from("milk_production").select("qty_kg").eq("date", date),
    ]);
    const milking = (a.data ?? []) as Animal[];
    const existing = (rows.data ?? []) as MilkProduction[];
    setAnimals(milking);
    setSavedRows(existing);
    const seed: Record<string, string> = {};
    for (const r of existing) if (r.animal_id) seed[r.animal_id] = String(r.qty_kg);
    setQty(seed);
    setDayTotal(
      (day.data ?? []).reduce((s: number, r: { qty_kg: number }) => s + Number(r.qty_kg), 0),
    );
    setLoading(false);
  }, [date, session]);

  useEffect(() => {
    void load();
  }, [load]);

  const sessionTotal = useMemo(
    () => Object.values(qty).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [qty],
  );

  async function save() {
    setSaving(true);
    setMsg(null);
    const rows = animals
      .map((a) => ({ animal_id: a.id, qty_kg: parseFloat(qty[a.id] ?? "") }))
      .filter((r) => !Number.isNaN(r.qty_kg))
      .map((r) => ({ ...r, date, session }));

    const clearedIds = savedRows
      .filter((r) => r.animal_id && !rows.some((n) => n.animal_id === r.animal_id))
      .map((r) => r.id);

    if (clearedIds.length) {
      await supabase.from("milk_production").delete().in("id", clearedIds);
    }
    const { error } = rows.length
      ? await supabase
          .from("milk_production")
          .upsert(rows, { onConflict: "date,session,animal_id" })
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
      <PageHeader title="Production" subtitle="Log the milk from each animal, per session." />

      <div className="space-y-3 mb-4">
        <DateStepper value={date} onChange={setDate} max={isoDate()} />
        <Segmented value={session} onChange={setSession} options={SESSIONS} />
      </div>

      {loading ? (
        <SkeletonList rows={5} />
      ) : animals.length === 0 ? (
        <EmptyState
          icon={<Milk size={18} />}
          title="No milking animals"
          description="Set an animal's status to “milking” in the Herd screen and it will appear here."
        />
      ) : (
        <ListCard>
          {animals.map((a) => (
            <label key={a.id} className="flex items-center gap-3 p-3.5">
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-ink truncate">
                  {a.tag_no}
                  {a.name ? <span className="text-ink-mute"> · {a.name}</span> : null}
                </span>
              </span>
              <Input
                inputMode="decimal"
                placeholder="kg"
                className="w-24 text-right tnum"
                value={qty[a.id] ?? ""}
                onChange={(e) => setQty((q) => ({ ...q, [a.id]: e.target.value }))}
              />
            </label>
          ))}
        </ListCard>
      )}

      {!loading && animals.length > 0 && (
        <Card className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[13px]">
            <div>
              <span className="text-ink-mute">This session </span>
              <span className="font-bold text-ink tnum">{sessionTotal.toFixed(2)} kg</span>
            </div>
            <div className="text-ink-mute">
              Day so far, saved:{" "}
              <span className="font-medium text-ink-soft tnum">
                {dayTotal == null ? "—" : dayTotal.toFixed(2)} kg
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-[13px] text-ink-mute">{msg}</span>}
            <Button onClick={save} loading={saving} disabled={!supabaseConfigured}>
              Save session
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
