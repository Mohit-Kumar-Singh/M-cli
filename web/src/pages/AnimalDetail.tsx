import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate } from "../lib/dates";
import type { Animal, AnimalStatus, HealthEvent, MilkProduction } from "../types/db";
import {
  PageHeader,
  Button,
  Card,
  ListCard,
  Field,
  Input,
  Select,
  Badge,
  Skeleton,
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
const label = (s: string) => s.replace("_", " ");

export default function AnimalDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [herd, setHerd] = useState<Animal[]>([]);
  const [prod, setProd] = useState<{ date: string; qty: number }[]>([]);
  const [health, setHealth] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [disposing, setDisposing] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const [a, all, mp, he] = await Promise.all([
      supabase.from("animals").select("*").eq("id", id).maybeSingle(),
      supabase.from("animals").select("id, tag_no, name").order("tag_no"),
      supabase
        .from("milk_production")
        .select("date, qty_kg")
        .eq("animal_id", id)
        .gte("date", isoDate(from))
        .order("date", { ascending: false }),
      supabase
        .from("health_events")
        .select("*")
        .eq("animal_id", id)
        .order("event_date", { ascending: false })
        .limit(20),
    ]);
    setAnimal((a.data as Animal) ?? null);
    setHerd((all.data ?? []) as Animal[]);
    const byDay = new Map<string, number>();
    for (const r of (mp.data ?? []) as Pick<MilkProduction, "date" | "qty_kg">[])
      byDay.set(r.date, (byDay.get(r.date) ?? 0) + Number(r.qty_kg));
    setProd([...byDay.entries()].map(([date, qty]) => ({ date, qty })));
    setHealth((he.data ?? []) as HealthEvent[]);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton h={40} w="50%" />
        <Skeleton h={140} className="rounded-[14px]" />
        <Skeleton h={120} className="rounded-[14px]" />
      </div>
    );
  }
  if (!animal) {
    return (
      <div>
        <Link to="/herd" className="text-[13px] text-accent inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Herd
        </Link>
        <p className="mt-4 text-[13px] text-ink-mute">Animal not found.</p>
      </div>
    );
  }

  const days30 = prod.reduce((s, d) => s + d.qty, 0);

  return (
    <div>
      <Link to="/herd" className="text-[13px] text-accent inline-flex items-center gap-1 mb-2">
        <ArrowLeft size={14} /> Herd
      </Link>
      <PageHeader
        title={`${animal.tag_no}${animal.name ? " · " + animal.name : ""}`}
        subtitle={<span className="capitalize">{label(animal.status)}</span>}
        actions={
          <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit"}
          </Button>
        }
      />

      {editing && (
        <div className="mb-4">
          <EditForm
            animal={animal}
            herd={herd}
            onSaved={() => {
              setEditing(false);
              void load();
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
            <Row k="Breed" v={animal.breed ?? "—"} />
            <Row k="Sex" v={animal.sex} />
            <Row k="Born" v={animal.dob ? prettyDate(animal.dob) : "—"} />
            <Row k="Lactation" v={animal.lactation_number ?? "—"} />
            <Row k="Source" v={animal.source ? label(animal.source) : "—"} />
            <Row
              k="Purchase"
              v={animal.purchase_cost != null ? `₹${animal.purchase_cost}` : "—"}
            />
          </div>
          {animal.notes && <p className="text-[12px] text-ink-mute mt-3">{animal.notes}</p>}
        </Card>

        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[13px] font-semibold text-ink-mute">Production · 30 days</h2>
            <span className="text-[13px] tnum text-ink-soft">{days30.toFixed(1)} kg</span>
          </div>
          {prod.length === 0 ? (
            <p className="text-[13px] text-ink-mute">No milk logged for this animal recently.</p>
          ) : (
            <ListCard>
              {prod.slice(0, 12).map((d) => (
                <div key={d.date} className="flex items-center justify-between p-3 text-[13px]">
                  <span className="text-ink-soft">{prettyDate(d.date)}</span>
                  <span className="tnum text-ink">{d.qty.toFixed(2)} kg</span>
                </div>
              ))}
            </ListCard>
          )}
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Health log</h2>
          {health.length === 0 ? (
            <p className="text-[13px] text-ink-mute">No health events for this animal.</p>
          ) : (
            <ListCard>
              {health.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 p-3.5 text-[13px]">
                  <div className="min-w-0">
                    <div className="font-medium text-ink capitalize truncate">
                      {label(e.event_type)}
                      {e.product_used ? <span className="text-ink-mute"> · {e.product_used}</span> : null}
                    </div>
                    <div className="text-[12px] text-ink-mute">{prettyDate(e.event_date)}</div>
                  </div>
                  {e.milk_withdrawal_until && e.milk_withdrawal_until >= isoDate() && (
                    <Badge tone="danger">withheld</Badge>
                  )}
                </div>
              ))}
            </ListCard>
          )}
        </section>

        {animal.status !== "sold" && animal.status !== "dead" && (
          <section>
            {disposing ? (
              <DisposeForm animal={animal} onDone={() => { setDisposing(false); void load(); }} onCancel={() => setDisposing(false)} />
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setDisposing(true)}>
                Mark sold or dead…
              </Button>
            )}
          </section>
        )}

        {(animal.status === "sold" || animal.status === "dead") && (
          <Card>
            <div className="text-[13px]">
              <span className="capitalize font-medium">{animal.status}</span>
              {animal.disposal_date ? ` on ${prettyDate(animal.disposal_date)}` : ""}
              {animal.disposal_reason ? ` — ${animal.disposal_reason}` : ""}
              {animal.sale_amount != null ? ` · ₹${animal.sale_amount}` : ""}
            </div>
          </Card>
        )}
      </div>

      <button
        className="mt-6 text-[12px] text-ink-mute hover:text-ink"
        onClick={() => navigate("/herd")}
      >
        ← Back to herd
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-mute">{k}</span>
      <span className="text-ink capitalize">{v}</span>
    </div>
  );
}

function EditForm({
  animal,
  herd,
  onSaved,
}: {
  animal: Animal;
  herd: Animal[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(animal.name ?? "");
  const [breed, setBreed] = useState(animal.breed ?? "");
  const [status, setStatus] = useState<AnimalStatus>(animal.status);
  const [dob, setDob] = useState(animal.dob ?? "");
  const [lact, setLact] = useState(
    animal.lactation_number != null ? String(animal.lactation_number) : "",
  );
  const [damId, setDamId] = useState(animal.dam_id ?? "");
  const [notes, setNotes] = useState(animal.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("animals")
      .update({
        name: name.trim() || null,
        breed: breed.trim() || null,
        status,
        dob: dob || null,
        lactation_number: lact ? parseInt(lact, 10) : null,
        dam_id: damId || null,
        notes: notes.trim() || null,
      })
      .eq("id", animal.id);
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label="Breed">
            {(id) => <Input id={id} value={breed} onChange={(e) => setBreed(e.target.value)} />}
          </Field>
          <Field label="Status">
            {(id) => (
              <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as AnimalStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Lactation #">
            {(id) => (
              <Input id={id} inputMode="numeric" value={lact} onChange={(e) => setLact(e.target.value)} />
            )}
          </Field>
          <Field label="Born">
            {(id) => <Input id={id} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />}
          </Field>
          <Field label="Dam">
            {(id) => (
              <Select id={id} value={damId} onChange={(e) => setDamId(e.target.value)}>
                <option value="">—</option>
                {herd
                  .filter((h) => h.id !== animal.id)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.tag_no}
                      {h.name ? ` · ${h.name}` : ""}
                    </option>
                  ))}
              </Select>
            )}
          </Field>
          <Field label="Notes" className="col-span-2">
            {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

function DisposeForm({
  animal,
  onDone,
  onCancel,
}: {
  animal: Animal;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<"sold" | "dead">("sold");
  const [date, setDate] = useState(isoDate());
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("animals")
      .update({
        status,
        disposal_date: date,
        disposal_reason: reason.trim() || null,
        sale_amount: status === "sold" && amount ? parseFloat(amount) : null,
      })
      .eq("id", animal.id);
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-display font-bold text-ink">Mark sold or dead</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Outcome">
            {(id) => (
              <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as "sold" | "dead")}>
                <option value="sold">Sold</option>
                <option value="dead">Died</option>
              </Select>
            )}
          </Field>
          <Field label="Date">
            {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          {status === "sold" && (
            <Field label="Sale amount ₹">
              {(id) => (
                <Input id={id} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              )}
            </Field>
          )}
          <Field label="Reason / note" className="col-span-2">
            {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="danger" loading={busy}>
            Confirm
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
