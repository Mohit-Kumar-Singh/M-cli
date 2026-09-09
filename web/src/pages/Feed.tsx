import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Wheat } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate } from "../lib/dates";
import type {
  FeedItem,
  FeedPurchase,
  FeedConsumption,
  FeedCategory,
} from "../types/db";
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

const CATEGORIES: FeedCategory[] = [
  "green_fodder",
  "dry_fodder",
  "concentrate",
  "mineral",
  "other",
];
const label = (c: string) => c.replace("_", " ");

interface Movement {
  id: string;
  kind: "purchase" | "consumption";
  date: string;
  feed_item_id: string;
  qty: number;
  cost?: number;
}

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [moves, setMoves] = useState<Movement[]>([]);
  const [monthSpend, setMonthSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showItem, setShowItem] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const monthStart = isoDate().slice(0, 8) + "01";
    const [it, pu, co] = await Promise.all([
      supabase.from("feed_items").select("*").order("name"),
      supabase
        .from("feed_purchases")
        .select("*")
        .order("date", { ascending: false })
        .limit(40),
      supabase
        .from("feed_consumption")
        .select("*")
        .order("date", { ascending: false })
        .limit(40),
    ]);
    setItems((it.data ?? []) as FeedItem[]);
    const purchases = (pu.data ?? []) as FeedPurchase[];
    const cons = (co.data ?? []) as FeedConsumption[];
    setMonthSpend(
      purchases
        .filter((p) => p.date >= monthStart)
        .reduce((s, p) => s + Number(p.cost), 0),
    );
    const merged: Movement[] = [
      ...purchases.map((p) => ({
        id: p.id,
        kind: "purchase" as const,
        date: p.date,
        feed_item_id: p.feed_item_id,
        qty: Number(p.qty),
        cost: Number(p.cost),
      })),
      ...cons.map((c) => ({
        id: c.id,
        kind: "consumption" as const,
        date: c.date,
        feed_item_id: c.feed_item_id,
        qty: Number(c.qty),
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 25);
    setMoves(merged);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? "—";
  const itemUnit = (id: string) => items.find((i) => i.id === id)?.unit ?? "";

  return (
    <div>
      <PageHeader
        title="Feed & inputs"
        subtitle="Stock on hand, purchases and daily consumption."
        actions={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowItem((v) => !v)}>
            {showItem ? "Close" : "Add item"}
          </Button>
        }
      />

      {showItem && (
        <div className="mb-4">
          <ItemForm
            onSaved={() => {
              setShowItem(false);
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
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[13px] font-semibold text-ink-mute">Stock</h2>
              <span className="text-[12px] text-ink-mute tnum">
                spent this month ₹{monthSpend.toFixed(0)}
              </span>
            </div>
            {items.length === 0 ? (
              <EmptyState
                icon={<Wheat size={18} />}
                title="No feed items"
                description="Add each feed type (green fodder, concentrate, mineral mix…) then record purchases and consumption against it."
              />
            ) : (
              <ListCard>
                {items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{i.name}</div>
                      <div className="text-[12px] text-ink-mute capitalize">{label(i.category)}</div>
                    </div>
                    <Badge tone={Number(i.current_stock) <= 0 ? "danger" : "neutral"}>
                      {Number(i.current_stock).toFixed(1)} {i.unit}
                    </Badge>
                  </div>
                ))}
              </ListCard>
            )}
          </section>

          {items.length > 0 && (
            <>
              <MovementForm
                kind="purchase"
                items={items}
                onSaved={() => {
                  setMsg("Purchase recorded");
                  void load();
                }}
              />
              <MovementForm
                kind="consumption"
                items={items}
                onSaved={() => {
                  setMsg("Consumption recorded");
                  void load();
                }}
              />
              {msg && <p className="text-[13px] text-ink-mute">{msg}</p>}

              <section>
                <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Recent movements</h2>
                {moves.length === 0 ? (
                  <p className="text-[13px] text-ink-mute">Nothing recorded yet.</p>
                ) : (
                  <ListCard>
                    {moves.map((m) => (
                      <div key={m.kind + m.id} className="flex items-center justify-between gap-3 p-3.5 text-[13px]">
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate">{itemName(m.feed_item_id)}</div>
                          <div className="text-[12px] text-ink-mute">{prettyDate(m.date)}</div>
                        </div>
                        <div className="text-right">
                          <div
                            className="tnum"
                            style={{ color: m.kind === "purchase" ? "var(--success)" : "var(--ink-soft)" }}
                          >
                            {m.kind === "purchase" ? "+" : "−"}
                            {m.qty.toFixed(1)} {itemUnit(m.feed_item_id)}
                          </div>
                          {m.cost != null && (
                            <div className="text-[12px] text-ink-mute tnum">₹{m.cost.toFixed(0)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </ListCard>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ItemForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FeedCategory>("green_fodder");
  const [unit, setUnit] = useState("kg");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("feed_items").insert({
      name: name.trim(),
      category,
      unit: unit.trim() || "kg",
    });
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" className="col-span-2">
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
          </Field>
          <Field label="Category">
            {(id) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value as FeedCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {label(c)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Unit">
            {(id) => <Input id={id} value={unit} onChange={(e) => setUnit(e.target.value)} />}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save item
        </Button>
      </form>
    </Card>
  );
}

function MovementForm({
  kind,
  items,
  onSaved,
}: {
  kind: "purchase" | "consumption";
  items: FeedItem[];
  onSaved: () => void;
}) {
  const [date, setDate] = useState(isoDate());
  const [feedItemId, setFeedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!feedItemId) return setError("Pick a feed item.");
    setBusy(true);
    setError(null);
    const common = { date, feed_item_id: feedItemId, qty: parseFloat(qty) || 0 };
    const { error } =
      kind === "purchase"
        ? await supabase.from("feed_purchases").insert({
            ...common,
            cost: parseFloat(cost) || 0,
            supplier: supplier.trim() || null,
          })
        : await supabase.from("feed_consumption").insert({ ...common, scope: "herd" });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setQty("");
      setCost("");
      onSaved();
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-display font-bold text-ink">
          {kind === "purchase" ? "Record purchase" : "Record consumption"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            {(id) => (
              <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            )}
          </Field>
          <Field label="Feed item">
            {(id) => (
              <Select id={id} value={feedItemId} onChange={(e) => setFeedItemId(e.target.value)} required>
                <option value="">Select…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Quantity">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            )}
          </Field>
          {kind === "purchase" && (
            <Field label="Cost ₹">
              {(id) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                />
              )}
            </Field>
          )}
          {kind === "purchase" && (
            <Field label="Supplier" className="col-span-2">
              {(id) => <Input id={id} value={supplier} onChange={(e) => setSupplier(e.target.value)} />}
            </Field>
          )}
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          {kind === "purchase" ? "Record purchase" : "Record consumption"}
        </Button>
      </form>
    </Card>
  );
}
