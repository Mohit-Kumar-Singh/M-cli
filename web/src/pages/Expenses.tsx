import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Receipt } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate } from "../lib/dates";
import type { Expense, ExpenseTemplate, ExpenseCategory } from "../types/db";
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

const CATEGORIES: ExpenseCategory[] = [
  "labour",
  "electricity",
  "water",
  "equipment",
  "maintenance",
  "transport",
  "vet",
  "feed",
  "rent",
  "misc",
];

export default function Expenses() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTmpl, setShowTmpl] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const monthStart = isoDate().slice(0, 8) + "01";

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const [ex, tm] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false })
        .limit(60),
      supabase.from("expense_templates").select("*").order("label"),
    ]);
    setRows((ex.data ?? []) as Expense[]);
    setTemplates((tm.data ?? []) as ExpenseTemplate[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const month = useMemo(() => {
    const inMonth = rows.filter((r) => r.date >= monthStart);
    const total = inMonth.reduce((s, r) => s + Number(r.amount), 0);
    const byCat = new Map<string, number>();
    for (const r of inMonth)
      byCat.set(r.category, (byCat.get(r.category) ?? 0) + Number(r.amount));
    return {
      total,
      byCat: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [rows, monthStart]);

  async function postTemplate(t: ExpenseTemplate) {
    const already = rows.some(
      (r) => r.linked_ref === `tmpl:${t.id}` && r.date >= monthStart,
    );
    if (already) {
      setMsg(`"${t.label}" is already posted this month`);
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      date: isoDate(),
      category: t.category,
      amount: t.amount,
      paid_to: t.label,
      notes: "From recurring template",
      linked_ref: `tmpl:${t.id}`,
    });
    setMsg(error ? error.message : `Posted "${t.label}"`);
    if (!error) void load();
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Everything spent that isn't feed purchases."
        actions={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? "Close" : "Add"}
          </Button>
        }
      />

      {showAdd && (
        <div className="mb-4">
          <ExpenseForm
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
          <Card>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-ink-mute">This month</span>
              <span className="font-display text-[1.4rem] font-bold text-ink tnum">
                ₹{month.total.toFixed(0)}
              </span>
            </div>
            {month.byCat.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {month.byCat.map(([cat, amt]) => (
                  <span key={cat} className="mg-badge mg-badge--neutral">
                    <span className="capitalize">{cat}</span> ₹{amt.toFixed(0)}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[13px] font-semibold text-ink-mute">Recurring</h2>
              <button
                className="text-[12px] text-accent"
                onClick={() => setShowTmpl((v) => !v)}
              >
                {showTmpl ? "Close" : "New template"}
              </button>
            </div>
            {showTmpl && (
              <div className="mb-2">
                <TemplateForm
                  onSaved={() => {
                    setShowTmpl(false);
                    void load();
                  }}
                />
              </div>
            )}
            {templates.filter((t) => t.active).length === 0 ? (
              <p className="text-[13px] text-ink-mute">
                No templates. Add wages, electricity, rent so they can be posted each month in one tap.
              </p>
            ) : (
              <ListCard>
                {templates
                  .filter((t) => t.active)
                  .map((t) => {
                    const posted = rows.some(
                      (r) => r.linked_ref === `tmpl:${t.id}` && r.date >= monthStart,
                    );
                    return (
                      <div key={t.id} className="flex items-center justify-between gap-3 p-3.5">
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate">{t.label}</div>
                          <div className="text-[12px] text-ink-mute capitalize tnum">
                            {t.category} · ₹{Number(t.amount).toFixed(0)} / {t.cadence}
                          </div>
                        </div>
                        {posted ? (
                          <Badge tone="success">posted</Badge>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => void postTemplate(t)}>
                            Post
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </ListCard>
            )}
          </section>
          {msg && <p className="text-[13px] text-ink-mute">{msg}</p>}

          <section>
            <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Recent</h2>
            {rows.length === 0 ? (
              <EmptyState
                icon={<Receipt size={18} />}
                title="No expenses logged"
                description="Record labour, electricity, transport, maintenance and the rest here. Vet costs added in Health show up automatically."
              />
            ) : (
              <ListCard>
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-3.5 text-[13px]">
                    <div className="min-w-0">
                      <div className="font-medium text-ink capitalize truncate">
                        {r.category}
                        {r.paid_to ? <span className="text-ink-mute"> · {r.paid_to}</span> : null}
                      </div>
                      <div className="text-[12px] text-ink-mute">{prettyDate(r.date)}</div>
                    </div>
                    <span className="tnum text-ink font-semibold">₹{Number(r.amount).toFixed(0)}</span>
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

function ExpenseForm({ onSaved }: { onSaved: () => void }) {
  const [date, setDate] = useState(isoDate());
  const [category, setCategory] = useState<ExpenseCategory>("labour");
  const [amount, setAmount] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState<"upi" | "cash" | "none">("cash");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("expenses").insert({
      date,
      category,
      amount: parseFloat(amount) || 0,
      paid_to: paidTo.trim() || null,
      payment_method: method,
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
          <Field label="Date">
            {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Category">
            {(id) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Amount ₹">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Method">
            {(id) => (
              <Select id={id} value={method} onChange={(e) => setMethod(e.target.value as "upi" | "cash" | "none")}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="none">—</option>
              </Select>
            )}
          </Field>
          <Field label="Paid to" className="col-span-2">
            {(id) => <Input id={id} value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />}
          </Field>
          <Field label="Notes" className="col-span-2">
            {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save expense
        </Button>
      </form>
    </Card>
  );
}

function TemplateForm({ onSaved }: { onSaved: () => void }) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("labour");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<"monthly" | "weekly">("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("expense_templates").insert({
      label: label.trim(),
      category,
      amount: parseFloat(amount) || 0,
      cadence,
    });
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Label" className="col-span-2">
            {(id) => <Input id={id} value={label} onChange={(e) => setLabel(e.target.value)} required />}
          </Field>
          <Field label="Category">
            {(id) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Amount ₹">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Cadence">
            {(id) => (
              <Select id={id} value={cadence} onChange={(e) => setCadence(e.target.value as "monthly" | "weekly")}>
                <option value="monthly">monthly</option>
                <option value="weekly">weekly</option>
              </Select>
            )}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save template
        </Button>
      </form>
    </Card>
  );
}
