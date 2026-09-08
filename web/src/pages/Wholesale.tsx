import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Store } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate } from "../lib/dates";
import type { WholesaleCustomer, WholesaleDelivery } from "../types/db";
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

export default function Wholesale() {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [deliveries, setDeliveries] = useState<WholesaleDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCust, setShowCust] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const [c, d] = await Promise.all([
      supabase.from("wholesale_customers").select("*").order("name"),
      supabase
        .from("wholesale_deliveries")
        .select("*")
        .order("date", { ascending: false })
        .limit(30),
    ]);
    setCustomers((c.data ?? []) as WholesaleCustomer[]);
    setDeliveries((d.data ?? []) as WholesaleDelivery[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  function outstanding(customerId: string): number {
    return deliveries
      .filter((x) => x.customer_id === customerId)
      .reduce((s, x) => s + (Number(x.amount) - Number(x.amount_received ?? 0)), 0);
  }

  return (
    <div>
      <PageHeader
        title="Wholesale"
        subtitle="Bulk supply to sweet shops, and what they owe."
        actions={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowCust((v) => !v)}>
            {showCust ? "Close" : "Add customer"}
          </Button>
        }
      />

      {showCust && (
        <div className="mb-4">
          <CustomerForm
            onSaved={() => {
              setShowCust(false);
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
            <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Customers &amp; dues</h2>
            {customers.length === 0 ? (
              <EmptyState
                icon={<Store size={18} />}
                title="No wholesale customers"
                description="Add each halwai with their agreed rate, then record daily dispatches below."
              />
            ) : (
              <ListCard>
                {customers.map((c) => {
                  const due = outstanding(c.id);
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">
                          {c.name}
                          {c.shop ? <span className="text-ink-mute"> · {c.shop}</span> : null}
                        </div>
                        <div className="text-[12px] text-ink-mute tnum">₹{c.rate_per_kg}/kg</div>
                      </div>
                      <Badge tone={due > 0 ? "danger" : "success"}>
                        {due > 0 ? `₹${due.toFixed(0)} due` : "clear"}
                      </Badge>
                    </div>
                  );
                })}
              </ListCard>
            )}
          </section>

          <DispatchForm
            customers={customers}
            onSaved={() => {
              setMsg("Dispatch recorded");
              void load();
            }}
          />
          {msg && <p className="text-[13px] text-ink-mute">{msg}</p>}

          <section>
            <h2 className="text-[13px] font-semibold text-ink-mute mb-2">Recent dispatches</h2>
            {deliveries.length === 0 ? (
              <p className="text-[13px] text-ink-mute">Nothing recorded yet.</p>
            ) : (
              <ListCard>
                {deliveries.map((d) => {
                  const cust = customers.find((c) => c.id === d.customer_id);
                  const paid = Number(d.amount_received ?? 0) >= Number(d.amount);
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 p-3.5 text-[13px]"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate">{cust?.name ?? "—"}</div>
                        <div className="text-[12px] text-ink-mute tnum">
                          {prettyDate(d.date)} · {d.qty_kg} kg @ ₹{d.rate_per_kg}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="tnum text-ink">₹{Number(d.amount).toFixed(0)}</div>
                        <div
                          className={`text-[12px] ${paid ? "text-success" : "text-danger"}`}
                        >
                          {paid
                            ? "paid"
                            : `₹${(Number(d.amount) - Number(d.amount_received ?? 0)).toFixed(0)} due`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ListCard>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CustomerForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("wholesale_customers").insert({
      name: name.trim(),
      shop: shop.trim() || null,
      phone: phone.trim() || null,
      rate_per_kg: parseFloat(rate) || 0,
    });
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
          </Field>
          <Field label="Shop">
            {(id) => <Input id={id} value={shop} onChange={(e) => setShop(e.target.value)} />}
          </Field>
          <Field label="Phone">
            {(id) => <Input id={id} value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
          <Field label="₹ / kg">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
              />
            )}
          </Field>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save customer
        </Button>
      </form>
    </Card>
  );
}

function DispatchForm({
  customers,
  onSaved,
}: {
  customers: WholesaleCustomer[];
  onSaved: () => void;
}) {
  const [date, setDate] = useState(isoDate());
  const [customerId, setCustomerId] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [received, setReceived] = useState("");
  const [method, setMethod] = useState<"upi" | "cash" | "none">("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = (parseFloat(qty) || 0) * (parseFloat(rate) || 0);

  function pickCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c && !rate) setRate(String(c.rate_per_kg));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) return setError("Pick a customer.");
    setBusy(true);
    setError(null);
    const recv = parseFloat(received) || 0;
    const { error } = await supabase.from("wholesale_deliveries").insert({
      date,
      customer_id: customerId,
      qty_kg: parseFloat(qty) || 0,
      rate_per_kg: parseFloat(rate) || 0,
      amount,
      amount_received: recv || null,
      paid: recv >= amount && amount > 0,
      payment_method: recv > 0 ? method : "none",
    });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setQty("");
      setReceived("");
      onSaved();
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-display font-bold text-ink">Record dispatch</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            {(id) => (
              <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            )}
          </Field>
          <Field label="Customer">
            {(id) => (
              <Select id={id} value={customerId} onChange={(e) => pickCustomer(e.target.value)} required>
                <option value="">Select…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Quantity (kg)">
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
          <Field label="₹ / kg">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Received ₹">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
              />
            )}
          </Field>
          <Field label="Method">
            {(id) => (
              <Select
                id={id}
                value={method}
                onChange={(e) => setMethod(e.target.value as "upi" | "cash" | "none")}
              >
                <option value="none">—</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </Select>
            )}
          </Field>
        </div>
        <p className="text-[13px] text-ink-mute">
          Amount <span className="font-semibold text-ink tnum">₹{amount.toFixed(0)}</span>
        </p>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Record dispatch
        </Button>
      </form>
    </Card>
  );
}
