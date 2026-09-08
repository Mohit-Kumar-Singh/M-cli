import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate, addDays } from "../lib/dates";
import type { Animal, MilkProduction } from "../types/db";

type Session = "morning" | "evening";

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
      supabase
        .from("animals")
        .select("*")
        .eq("status", "milking")
        .order("tag_no"),
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
    () =>
      Object.values(qty).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [qty],
  );

  async function save() {
    setSaving(true);
    setMsg(null);
    const rows = animals
      .map((a) => ({ animal_id: a.id, qty_kg: parseFloat(qty[a.id] ?? "") }))
      .filter((r) => !Number.isNaN(r.qty_kg))
      .map((r) => ({ ...r, date, session }));

    // Delete rows the user cleared, upsert the rest.
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
      setMsg("Saved.");
      void load();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Production</h1>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to record production.
        </p>
      )}

      <div className="card p-3 flex flex-wrap items-center gap-3">
        <button className="text-sm muted" onClick={() => setDate(addDays(date, -1))}>
          ‹ prev
        </button>
        <input
          className="input w-auto"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="text-sm muted"
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= isoDate()}
        >
          next ›
        </button>
        <div className="flex gap-1 ml-auto">
          {(["morning", "evening"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className="rounded-lg px-3 py-1 text-sm"
              style={
                session === s
                  ? { background: "var(--accent)", color: "var(--accent-ink)" }
                  : { color: "var(--ink-muted)" }
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="muted text-sm">
        {prettyDate(date)} · {session} · {animals.length} milking animals
      </p>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : animals.length === 0 ? (
        <p className="muted text-sm">
          No animals with status “milking”. Set an animal to milking in Herd.
        </p>
      ) : (
        <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
          {animals.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <div className="font-medium">
                  {a.tag_no}
                  {a.name ? ` · ${a.name}` : ""}
                </div>
              </div>
              <input
                className="input w-24 text-right"
                inputMode="decimal"
                placeholder="kg"
                value={qty[a.id] ?? ""}
                onChange={(e) =>
                  setQty((q) => ({ ...q, [a.id]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div>
            <span className="muted">This session: </span>
            <span className="font-bold">{sessionTotal.toFixed(2)} kg</span>
          </div>
          <div>
            <span className="muted">Day so far (saved): </span>
            <span className="font-bold">
              {dayTotal == null ? "—" : dayTotal.toFixed(2)} kg
            </span>
          </div>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving || !supabaseConfigured}>
          {saving ? "Saving…" : "Save session"}
        </button>
      </div>
      {msg && <p className="text-sm muted">{msg}</p>}
    </div>
  );
}
