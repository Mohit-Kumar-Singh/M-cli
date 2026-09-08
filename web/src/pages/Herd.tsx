import { useEffect, useState, type FormEvent } from "react";
import { Plus, PawPrint } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import type { Animal, AnimalStatus } from "../types/db";
import {
  PageHeader,
  Button,
  Card,
  ListCard,
  Field,
  Input,
  Select,
  Badge,
  EmptyState,
  SkeletonList,
} from "../ui";

const STATUSES: AnimalStatus[] = [
  "heifer",
  "milking",
  "dry",
  "pregnant",
  "sick",
  "sold",
  "dead",
];

const STATUS_TONE: Record<AnimalStatus, "neutral" | "accent" | "gold" | "danger"> = {
  milking: "accent",
  pregnant: "gold",
  heifer: "neutral",
  dry: "neutral",
  sick: "danger",
  sold: "neutral",
  dead: "neutral",
};

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

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <PageHeader
        title="Herd"
        subtitle={loading ? undefined : `${rows.length} animals`}
        actions={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? "Close" : "Add animal"}
          </Button>
        }
      />

      {showAdd && (
        <div className="mb-4">
          <AddAnimal
            onDone={() => {
              setShowAdd(false);
              void load();
            }}
          />
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-3">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium border transition-colors ${
              filter === s
                ? "bg-accent text-[var(--text-on-accent)] border-transparent"
                : "border-[var(--border-subtle)] text-ink-mute hover:text-ink-soft"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="text-[13px] text-danger mb-3">{error}</p>}

      {loading ? (
        <SkeletonList rows={5} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<PawPrint size={18} />}
          title={rows.length === 0 ? "No animals yet" : `No ${filter} animals`}
          description={
            rows.length === 0
              ? "Add each buffalo with its tag number and current status to start logging production."
              : "Nothing in this status right now."
          }
          action={
            rows.length === 0 ? (
              <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAdd(true)}>
                Add animal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ListCard>
          {shown.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <div className="font-medium text-ink truncate">
                  {a.tag_no}
                  {a.name ? <span className="text-ink-mute"> · {a.name}</span> : null}
                </div>
                <div className="text-[12px] text-ink-mute">
                  {a.breed ?? "—"}
                  {a.lactation_number ? ` · lactation ${a.lactation_number}` : ""}
                </div>
              </div>
              <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
            </div>
          ))}
        </ListCard>
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
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tag number">
            {(id) => (
              <Input id={id} value={tagNo} onChange={(e) => setTagNo(e.target.value)} required />
            )}
          </Field>
          <Field label="Name">
            {(id) => (
              <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />
            )}
          </Field>
          <Field label="Breed">
            {(id) => (
              <Input id={id} value={breed} onChange={(e) => setBreed(e.target.value)} />
            )}
          </Field>
          <Field label="Status">
            {(id) => (
              <Select
                id={id}
                value={status}
                onChange={(e) => setStatus(e.target.value as AnimalStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save animal
        </Button>
      </form>
    </Card>
  );
}
