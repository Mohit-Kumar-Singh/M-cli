import { useEffect, useState, type FormEvent } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { addDays, isoDate } from "../lib/dates";
import type { RetailCustomer } from "../types/db";

export default function RetailCustomers() {
  const [rows, setRows] = useState<RetailCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RetailCustomer | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | "regular" | "casual" | "inactive">("all");

  async function load() {
    if (!supabaseConfigured) return setLoading(false);
    setLoading(true);
    const { data, error } = await supabase
      .from("retail_customers")
      .select("*")
      .order("round_sequence", { ascending: true, nullsFirst: false })
      .order("name");
    if (error) setError(error.message);
    else setRows((data ?? []) as RetailCustomer[]);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const shown = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "inactive") return r.status === "inactive";
    return r.status === "active" && r.type === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Retail customers</h1>
        <button className="btn-primary" onClick={() => setEditing("new")}>
          Add customer
        </button>
      </div>

      {!supabaseConfigured && (
        <p className="card p-4 text-sm" style={{ color: "var(--danger)" }}>
          Connect Supabase to manage customers.
        </p>
      )}

      {editing && (
        <CustomerForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}

      <div className="flex gap-1 text-sm">
        {(["all", "regular", "casual", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-lg px-2.5 py-1"
            style={
              filter === f
                ? { background: "var(--accent)", color: "var(--accent-ink)" }
                : { color: "var(--ink-muted)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted text-sm">No customers.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((c) => (
            <li key={c.id}>
              <button
                className="card p-3 w-full text-left flex items-center justify-between"
                onClick={() => setEditing(c)}
              >
                <div>
                  <div className="font-medium">
                    {c.name}{" "}
                    <span className="muted text-xs">{c.area ?? ""}</span>
                  </div>
                  <div className="muted text-xs">
                    {c.type}
                    {c.type === "regular" && c.fixed_daily_qty_kg
                      ? ` · ${c.fixed_daily_qty_kg} kg/day`
                      : ""}
                    {" · ₹"}
                    {c.price_per_kg}/kg
                    {c.price_lock_until && c.price_lock_until >= isoDate()
                      ? ` · locked to ${c.price_lock_until}`
                      : ""}
                  </div>
                </div>
                {c.status === "inactive" && (
                  <span className="text-xs muted">inactive</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CustomerForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: RetailCustomer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address_text ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [type, setType] = useState(initial?.type ?? "casual");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [qtyKg, setQtyKg] = useState(
    initial?.fixed_daily_qty_kg != null ? String(initial.fixed_daily_qty_kg) : "",
  );
  const [price, setPrice] = useState(String(initial?.price_per_kg ?? 60));
  const [roundSeq, setRoundSeq] = useState(
    initial?.round_sequence != null ? String(initial.round_sequence) : "",
  );
  const [referral, setReferral] = useState(initial?.referral_source ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const becomingRegular = type === "regular" && initial?.type !== "regular";
    const regularSince =
      type === "regular"
        ? initial?.regular_since ?? isoDate()
        : null;
    const priceLockUntil =
      type === "regular"
        ? initial?.price_lock_until ?? addDays(isoDate(), 182) // ~6 months (0005)
        : null;

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      address_text: address.trim() || null,
      area: area.trim() || null,
      type,
      status,
      fixed_daily_qty_kg: type === "regular" && qtyKg ? parseFloat(qtyKg) : null,
      price_per_kg: parseFloat(price) || 60,
      round_sequence: roundSeq ? parseInt(roundSeq, 10) : null,
      referral_source: referral.trim() || null,
      regular_since: regularSince,
      price_lock_until: becomingRegular || !initial ? priceLockUntil : initial?.price_lock_until ?? priceLockUntil,
    };

    const { error } = initial
      ? await supabase.from("retail_customers").update(payload).eq("id", initial.id)
      : await supabase.from("retail_customers").insert(payload);

    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{initial ? "Edit" : "New"} customer</h2>
        <button type="button" className="text-sm muted" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm col-span-2">
          Name
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="text-sm">
          Phone
          <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="text-sm">
          Area / lane
          <input className="input mt-1" value={area} onChange={(e) => setArea(e.target.value)} />
        </label>
        <label className="text-sm col-span-2">
          Address
          <input className="input mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label className="text-sm">
          Type
          <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as "casual" | "regular")}>
            <option value="casual">casual</option>
            <option value="regular">regular</option>
          </select>
        </label>
        <label className="text-sm">
          Status
          <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        {type === "regular" && (
          <label className="text-sm">
            Fixed kg/day
            <input className="input mt-1" inputMode="decimal" value={qtyKg} onChange={(e) => setQtyKg(e.target.value)} />
          </label>
        )}
        <label className="text-sm">
          ₹/kg
          <input className="input mt-1" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="text-sm">
          Round #
          <input className="input mt-1" inputMode="numeric" value={roundSeq} onChange={(e) => setRoundSeq(e.target.value)} />
        </label>
        <label className="text-sm">
          Referred by
          <input className="input mt-1" value={referral} onChange={(e) => setReferral(e.target.value)} />
        </label>
      </div>
      {type === "regular" && (
        <p className="muted text-xs">
          Regulars get a 6-month ₹{price}/kg price lock from their start date (0005).
        </p>
      )}
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save customer"}
      </button>
    </form>
  );
}
