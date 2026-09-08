import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { isoDate, prettyDate } from "../lib/dates";
import type { WholesaleCustomer, WholesaleDelivery } from "../types/db";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Wholesale</h1>
        <button className="btn-primary" onClick={() => setShowCust((v) => !v)}>
          {showCust ? "Close" : "Add customer"}
        </button>
      </div>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to manage wholesale.
        </p>
      )}

      {showCust && (
        <CustomerForm
          onSaved={() => {
            setShowCust(false);
            void load();
          }}
        />
      )}

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-bold muted">Customers &amp; dues</h2>
            {customers.length === 0 && (
              <p className="muted text-sm">No wholesale customers yet.</p>
            )}
            {customers.map((c) => {
              const due = outstanding(c.id);
              return (
                <div key={c.id} className="card p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {c.name}{" "}
                      <span className="muted text-xs">{c.shop ?? ""}</span>
                    </div>
                    <div className="muted text-xs">₹{c.rate_per_kg}/kg</div>
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: due > 0 ? "var(--danger)" : "var(--ok)" }}
                  >
                    {due > 0 ? `₹${due.toFixed(0)} due` : "clear"}
                  </div>
                </div>
              );
            })}
          </section>

          <DispatchForm
            customers={customers}
            onSaved={() => {
              setMsg("Dispatch recorded.");
              void load();
            }}
          />
          {msg && <p className="text-sm muted">{msg}</p>}

          <section className="space-y-2">
            <h2 className="text-sm font-bold muted">Recent dispatches</h2>
            {deliveries.length === 0 && (
              <p className="muted text-sm">Nothing yet.</p>
            )}
            {deliveries.map((d) => {
              const cust = customers.find((c) => c.id === d.customer_id);
              return (
                <div key={d.id} className="card p-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{cust?.name ?? "—"}</div>
                    <div className="muted text-xs">
                      {prettyDate(d.date)} · {d.qty_kg} kg @ ₹{d.rate_per_kg}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>₹{Number(d.amount).toFixed(0)}</div>
                    <div
                      className="text-xs"
                      style={{
                        color:
                          Number(d.amount_received ?? 0) >= Number(d.amount)
                            ? "var(--ok)"
                            : "var(--danger)",
                      }}
                    >
                      {Number(d.amount_received ?? 0) >= Number(d.amount)
                        ? "paid"
                        : `₹${(Number(d.amount) - Number(d.amount_received ?? 0)).toFixed(0)} due`}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </>
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
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Name
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="text-sm">
          Shop
          <input className="input mt-1" value={shop} onChange={(e) => setShop(e.target.value)} />
        </label>
        <label className="text-sm">
          Phone
          <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="text-sm">
          ₹/kg
          <input className="input mt-1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} required />
        </label>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save customer"}
      </button>
    </form>
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
    <form onSubmit={submit} className="card p-4 space-y-3">
      <h2 className="text-sm font-bold muted">Record dispatch</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Date
          <input className="input mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="text-sm">
          Customer
          <select className="input mt-1" value={customerId} onChange={(e) => pickCustomer(e.target.value)} required>
            <option value="">—</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Qty (kg)
          <input className="input mt-1" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </label>
        <label className="text-sm">
          ₹/kg
          <input className="input mt-1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} required />
        </label>
        <label className="text-sm">
          Received ₹
          <input className="input mt-1" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} />
        </label>
        <label className="text-sm">
          Method
          <select className="input mt-1" value={method} onChange={(e) => setMethod(e.target.value as "upi" | "cash" | "none")}>
            <option value="none">—</option>
            <option value="upi">UPI</option>
            <option value="cash">cash</option>
          </select>
        </label>
      </div>
      <p className="muted text-sm">Amount: <b>₹{amount.toFixed(0)}</b></p>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Record dispatch"}
      </button>
    </form>
  );
}
