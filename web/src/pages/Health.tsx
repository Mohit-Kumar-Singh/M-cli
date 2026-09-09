import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Stethoscope, TriangleAlert } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate } from "../lib/dates";
import type { Animal, HealthEvent, HealthEventType } from "../types/db";
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

const TYPES: HealthEventType[] = [
  "vaccination",
  "deworming",
  "illness",
  "treatment",
  "vet_visit",
  "injury",
];
const label = (s: string) => s.replace("_", " ");

export default function Health() {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const today = isoDate();

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const [ev, an] = await Promise.all([
      supabase
        .from("health_events")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(80),
      supabase.from("animals").select("*").order("tag_no"),
    ]);
    setEvents((ev.data ?? []) as HealthEvent[]);
    setAnimals((an.data ?? []) as Animal[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const animalLabel = (id: string | null) => {
    if (!id) return "Whole herd";
    const a = animals.find((x) => x.id === id);
    return a ? a.tag_no + (a.name ? ` · ${a.name}` : "") : "—";
  };

  const withdrawals = useMemo(
    () =>
      events.filter(
        (e) => e.milk_withdrawal_until != null && e.milk_withdrawal_until >= today,
      ),
    [events, today],
  );
  const schedule = useMemo(
    () =>
      events
        .filter((e) => e.next_due_date != null)
        .sort((a, b) => (a.next_due_date ?? "").localeCompare(b.next_due_date ?? "")),
    [events],
  );

  return (
    <div>
      <PageHeader
        title="Health & veterinary"
        subtitle="Treatments, the vaccination schedule and milk-withdrawal periods."
        actions={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? "Close" : "Log event"}
          </Button>
        }
      />

      {showAdd && (
        <div className="mb-4">
          <EventForm
            animals={animals}
            onSaved={() => {
              setShowAdd(false);
              void load();
            }}
          />
        </div>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : (
        <div className="space-y-5">
          {withdrawals.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Milk withheld now</h2>
              <ListCard>
                {withdrawals.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{animalLabel(e.animal_id)}</div>
                      <div className="text-[12px] text-ink-mute capitalize">{label(e.event_type)}</div>
                    </div>
                    <Badge tone="danger">until {e.milk_withdrawal_until}</Badge>
                  </div>
                ))}
              </ListCard>
              <p className="text-[12px] text-ink-mute mt-1">
                This milk is excluded from the sellable total in Daily milk balance.
              </p>
            </section>
          )}

          <section>
            <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Schedule</h2>
            {schedule.length === 0 ? (
              <p className="text-[13px] text-ink-mute">
                No upcoming vaccinations or deworming. Set a “next due” date when you log one.
              </p>
            ) : (
              <ListCard>
                {schedule.map((e) => {
                  const overdue = (e.next_due_date ?? "") < today;
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">{animalLabel(e.animal_id)}</div>
                        <div className="text-[12px] text-ink-mute capitalize">
                          {label(e.event_type)}
                          {e.product_used ? ` · ${e.product_used}` : ""}
                        </div>
                      </div>
                      <Badge tone={overdue ? "danger" : "gold"}>
                        {overdue && <TriangleAlert size={12} />}
                        {e.next_due_date}
                      </Badge>
                    </div>
                  );
                })}
              </ListCard>
            )}
          </section>

          <section>
            <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Log</h2>
            {events.length === 0 ? (
              <EmptyState
                icon={<Stethoscope size={18} />}
                title="Nothing logged yet"
                description="Record vaccinations, deworming, illnesses and treatments. Any cost you enter is added to Expenses under “vet”."
              />
            ) : (
              <ListCard>
                {events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-3.5 text-[13px]">
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">
                        <span className="capitalize">{label(e.event_type)}</span>
                        <span className="text-ink-mute"> · {animalLabel(e.animal_id)}</span>
                      </div>
                      <div className="text-[12px] text-ink-mute">
                        {prettyDate(e.event_date)}
                        {e.product_used ? ` · ${e.product_used}` : ""}
                      </div>
                    </div>
                    {Number(e.cost) > 0 && (
                      <span className="tnum text-ink-soft">₹{Number(e.cost).toFixed(0)}</span>
                    )}
                  </div>
                ))}
              </ListCard>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function EventForm({
  animals,
  onSaved,
}: {
  animals: Animal[];
  onSaved: () => void;
}) {
  const [scope, setScope] = useState<"animal" | "herd">("animal");
  const [animalId, setAnimalId] = useState("");
  const [type, setType] = useState<HealthEventType>("vaccination");
  const [date, setDate] = useState(isoDate());
  const [product, setProduct] = useState("");
  const [dose, setDose] = useState("");
  const [withdrawalUntil, setWithdrawalUntil] = useState("");
  const [cost, setCost] = useState("");
  const [vet, setVet] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (scope === "animal" && !animalId) return setError("Pick an animal.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("health_events").insert({
      scope,
      animal_id: scope === "animal" ? animalId : null,
      event_type: type,
      event_date: date,
      product_used: product.trim() || null,
      dose: dose.trim() || null,
      milk_withdrawal_until: withdrawalUntil || null,
      cost: parseFloat(cost) || 0,
      vet_name: vet.trim() || null,
      next_due_date: nextDue || null,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scope">
            {(id) => (
              <Select id={id} value={scope} onChange={(e) => setScope(e.target.value as "animal" | "herd")}>
                <option value="animal">One animal</option>
                <option value="herd">Whole herd</option>
              </Select>
            )}
          </Field>
          {scope === "animal" && (
            <Field label="Animal">
              {(id) => (
                <Select id={id} value={animalId} onChange={(e) => setAnimalId(e.target.value)} required>
                  <option value="">Select…</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tag_no}
                      {a.name ? ` · ${a.name}` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <Field label="Type">
            {(id) => (
              <Select id={id} value={type} onChange={(e) => setType(e.target.value as HealthEventType)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {label(t)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Date">
            {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Product / vaccine">
            {(id) => <Input id={id} value={product} onChange={(e) => setProduct(e.target.value)} />}
          </Field>
          <Field label="Dose">
            {(id) => <Input id={id} value={dose} onChange={(e) => setDose(e.target.value)} />}
          </Field>
          <Field label="Milk withheld until" hint="Leave blank if none">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={withdrawalUntil}
                onChange={(e) => setWithdrawalUntil(e.target.value)}
              />
            )}
          </Field>
          <Field label="Cost ₹" hint="Adds to Expenses (vet)">
            {(id) => (
              <Input id={id} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
            )}
          </Field>
          <Field label="Vet name">
            {(id) => <Input id={id} value={vet} onChange={(e) => setVet(e.target.value)} />}
          </Field>
          <Field label="Next due" hint="For vaccination / deworming">
            {(id) => (
              <Input id={id} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            )}
          </Field>
          <Field label="Notes" className="col-span-2">
            {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save event
        </Button>
      </form>
    </Card>
  );
}
