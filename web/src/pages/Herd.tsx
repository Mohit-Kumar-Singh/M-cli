import { useEffect, useState, type FormEvent } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import type { Animal, AnimalStatus } from "../types/db";

const STATUSES: AnimalStatus[] = [
  "heifer",
  "milking",
  "dry",
  "pregnant",
  "sick",
  "sold",
  "dead",
];

export default function Herd() {
  const [rows, setRows] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<AnimalStatus | "all">("all");

  async function load() {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("tag_no", { ascending: true });
    if (error) setError(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const shown =
    filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Herd</h1>
        <button className="btn-primary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close" : "Add animal"}
        </button>
      </div>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to load the herd (web/.env.local).
        </p>
      )}

      {showAdd && <AddAnimal onDone={() => { setShowAdd(false); void load(); }} />}

      <div className="flex gap-1 overflow-x-auto text-sm">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="rounded-lg px-2.5 py-1 whitespace-nowrap"
            style={
              filter === s
                ? { background: "var(--accent)", color: "var(--accent-ink)" }
                : { color: "var(--ink-muted)" }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted text-sm">No animals.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((a) => (
            <li key={a.id} className="card p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {a.tag_no}
                  {a.name ? ` · ${a.name}` : ""}
                </div>
                <div className="muted text-xs">
                  {a.breed ?? "—"} · lactation {a.lactation_number ?? "—"}
                </div>
              </div>
              <span className="text-xs rounded-full px-2 py-0.5 border" style={{ borderColor: "var(--border)" }}>
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddAnimal({ onDone }: { onDone: () => void }) {
  const [tagNo, setTagNo] = useState("");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("Murrah");
  const [status, setStatus] = useState<AnimalStatus>("milking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("animals").insert({
      tag_no: tagNo.trim(),
      name: name.trim() || null,
      breed: breed.trim() || null,
      sex: "female",
      status,
    });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Tag no
          <input className="input mt-1" value={tagNo} onChange={(e) => setTagNo(e.target.value)} required />
        </label>
        <label className="text-sm">
          Name
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm">
          Breed
          <input className="input mt-1" value={breed} onChange={(e) => setBreed(e.target.value)} />
        </label>
        <label className="text-sm">
          Status
          <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value as AnimalStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save animal"}
      </button>
    </form>
  );
}
