import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Sprout, CalendarClock } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { addDays, isoDate, prettyDate } from "../lib/dates";
import type { Animal, BreedingEvent, BreedingEventType } from "../types/db";
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

const TYPES: BreedingEventType[] = [
  "heat",
  "service",
  "pregnancy_check",
  "calving",
  "dry_off",
  "abortion",
];
const label = (s: string) => s.replace("_", " ");

export default function Breeding() {
  const [events, setEvents] = useState<BreedingEvent[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const today = isoDate();

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const [ev, an] = await Promise.all([
      supabase
        .from("breeding_events")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(100),
      supabase.from("animals").select("*").order("tag_no"),
    ]);
    setEvents((ev.data ?? []) as BreedingEvent[]);
    setAnimals((an.data ?? []) as Animal[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const animalLabel = (id: string) => {
    const a = animals.find((x) => x.id === id);
    return a ? a.tag_no + (a.name ? ` · ${a.name}` : "") : "—";
  };

  // Upcoming calvings: latest `service` per animal that has no later `calving`.
  const upcoming = useMemo(() => {
    const byAnimal = new Map<string, BreedingEvent[]>();
    for (const e of events) {
      if (!byAnimal.has(e.animal_id)) byAnimal.set(e.animal_id, []);
      byAnimal.get(e.animal_id)!.push(e);
    }
    const out: { animal_id: string; expected: string; dryOff: string }[] = [];
    for (const [aid, list] of byAnimal) {
      const sorted = [...list].sort((a, b) => b.event_date.localeCompare(a.event_date));
      const lastService = sorted.find((e) => e.event_type === "service");
      if (!lastService?.expected_calving_date) continue;
      const calvedAfter = sorted.some(
        (e) => e.event_type === "calving" && e.event_date >= lastService.event_date,
      );
      if (calvedAfter) continue;
      if (lastService.expected_calving_date < today) continue;
      out.push({
        animal_id: aid,
        expected: lastService.expected_calving_date,
        dryOff: addDays(lastService.expected_calving_date, -60),
      });
    }
    return out.sort((a, b) => a.expected.localeCompare(b.expected));
  }, [events, today]);

  return (
    <div>
      <PageHeader
        title="Breeding & reproduction"
        subtitle="Services, pregnancy checks, calvings and dry-offs."
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
          <section>
            <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-[13px] text-ink-mute">
                No pregnancies in progress. Log a service to start the clock (≈310-day gestation).
              </p>
            ) : (
              <ListCard>
                {upcoming.map((u) => {
                  const soon = u.expected <= addDays(today, 21);
                  return (
                    <div key={u.animal_id} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">{animalLabel(u.animal_id)}</div>
                        <div className="text-[12px] text-ink-mute">dry off by {u.dryOff}</div>
                      </div>
                      <Badge tone={soon ? "gold" : "neutral"}>
                        <CalendarClock size={12} /> {u.expected}
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
                icon={<Sprout size={18} />}
                title="No breeding events yet"
                description="Record heat, service, pregnancy checks, calving and dry-off. A calving bumps the dam's lactation number and sets her back to milking."
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
                        {e.event_type === "service" && e.method ? ` · ${e.method.toUpperCase()}` : ""}
                        {e.event_type === "service" && e.sire_ref ? ` · ${e.sire_ref}` : ""}
                        {e.event_type === "pregnancy_check" && e.pd_result ? ` · ${e.pd_result}` : ""}
                      </div>
                    </div>
                    {e.event_type === "service" && e.expected_calving_date && (
                      <Badge tone="neutral">due {e.expected_calving_date}</Badge>
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
  const [animalId, setAnimalId] = useState("");
  const [type, setType] = useState<BreedingEventType>("service");
  const [date, setDate] = useState(isoDate());
  const [method, setMethod] = useState<"ai" | "natural">("ai");
  const [sire, setSire] = useState("");
  const [pd, setPd] = useState<"positive" | "negative" | "unknown">("positive");
  const [calfTag, setCalfTag] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dams = animals.filter((a) => a.sex === "female");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!animalId) return setError("Pick an animal.");
    setBusy(true);
    setError(null);

    let calfId: string | null = null;
    if (type === "calving" && calfTag.trim()) {
      const { data, error: calfErr } = await supabase
        .from("animals")
        .insert({
          tag_no: calfTag.trim(),
          sex: "female",
          status: "heifer",
          dam_id: animalId,
          source: "born_on_farm",
          dob: date,
        })
        .select("id")
        .single();
      if (calfErr) {
        setBusy(false);
        setError(`Calf: ${calfErr.message}`);
        return;
      }
      calfId = (data as { id: string }).id;
    }

    const { error } = await supabase.from("breeding_events").insert({
      animal_id: animalId,
      event_type: type,
      event_date: date,
      method: type === "service" ? method : null,
      sire_ref: type === "service" && sire.trim() ? sire.trim() : null,
      pd_result: type === "pregnancy_check" ? pd : null,
      calf_animal_id: calfId,
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
          <Field label="Animal">
            {(id) => (
              <Select id={id} value={animalId} onChange={(e) => setAnimalId(e.target.value)} required>
                <option value="">Select…</option>
                {dams.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag_no}
                    {a.name ? ` · ${a.name}` : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Event">
            {(id) => (
              <Select id={id} value={type} onChange={(e) => setType(e.target.value as BreedingEventType)}>
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
          {type === "service" && (
            <>
              <Field label="Method">
                {(id) => (
                  <Select id={id} value={method} onChange={(e) => setMethod(e.target.value as "ai" | "natural")}>
                    <option value="ai">AI</option>
                    <option value="natural">Natural</option>
                  </Select>
                )}
              </Field>
              <Field label="Sire / bull" className="col-span-2">
                {(id) => <Input id={id} value={sire} onChange={(e) => setSire(e.target.value)} />}
              </Field>
            </>
          )}
          {type === "pregnancy_check" && (
            <Field label="Result">
              {(id) => (
                <Select id={id} value={pd} onChange={(e) => setPd(e.target.value as "positive" | "negative" | "unknown")}>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="unknown">Unknown</option>
                </Select>
              )}
            </Field>
          )}
          {type === "calving" && (
            <Field label="Calf tag no" hint="Registers the calf as a heifer" className="col-span-2">
              {(id) => <Input id={id} value={calfTag} onChange={(e) => setCalfTag(e.target.value)} />}
            </Field>
          )}
          <Field label="Notes" className="col-span-2">
            {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </div>
        {type === "service" && (
          <p className="text-[12px] text-ink-mute">
            Expected calving is set automatically to +310 days.
          </p>
        )}
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save event
        </Button>
      </form>
    </Card>
  );
}
