import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Plus, Users } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { addDays, isoDate } from "../lib/dates";
import type { RetailCustomer } from "../types/db";
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

type Filter = "all" | "regular" | "casual" | "inactive";
const FILTERS: Filter[] = ["all", "regular", "casual", "inactive"];

export default function RetailCustomers() {
  const [rows, setRows] = useState<RetailCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RetailCustomer | "new" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

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
    <div>
      <PageHeader
        title="Retail customers"
        subtitle={loading ? undefined : `${rows.length} on the round`}
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<ExternalLink size={15} />}
              onClick={() => window.open("/book", "_blank", "noopener")}
            >
              Customer portal
            </Button>
            <Button size="sm" icon={<Plus size={16} />} onClick={() => setEditing("new")}>
              Add
            </Button>
          </>
        }
      />

      {editing && (
        <div className="mb-4">
          <CustomerForm
            initial={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              void load();
            }}
          />
        </div>
      )}

      <div className="flex gap-1.5 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium border transition-colors ${
              filter === f
                ? "bg-accent text-[var(--text-on-accent)] border-transparent"
                : "border-[var(--border-subtle)] text-ink-mute hover:text-ink-soft"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="text-[13px] text-danger mb-3">{error}</p>}

      {loading ? (
        <SkeletonList rows={5} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Users size={18} />}
          title={rows.length === 0 ? "No customers yet" : "Nothing matches this filter"}
          description={
            rows.length === 0
              ? "Add the households on your round. Mark someone “regular” to give them a standing daily quantity and a price lock."
              : undefined
          }
          action={
            rows.length === 0 ? (
              <Button size="sm" icon={<Plus size={16} />} onClick={() => setEditing("new")}>
                Add customer
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ListCard>
          {shown.map((c) => {
            const locked = c.price_lock_until != null && c.price_lock_until >= isoDate();
            return (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className="w-full text-left flex items-center justify-between gap-3 p-3.5 hover:bg-sunken transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">
                    {c.name}
                    {c.area ? <span className="text-ink-mute"> · {c.area}</span> : null}
                  </div>
                  <div className="text-[12px] text-ink-mute tnum">
                    ₹{c.price_per_kg}/kg
                    {c.type === "regular" && c.fixed_daily_qty_kg
                      ? ` · ${c.fixed_daily_qty_kg} kg/day`
                      : ""}
                    {locked ? " · price locked" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.status === "inactive" && <Badge tone="neutral">inactive</Badge>}
                  <Badge tone={c.type === "regular" ? "accent" : "neutral"}>{c.type}</Badge>
                </div>
              </button>
            );
          })}
        </ListCard>
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
    const regularSince = type === "regular" ? initial?.regular_since ?? isoDate() : null;
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
      price_lock_until:
        becomingRegular || !initial
          ? priceLockUntil
          : initial?.price_lock_until ?? priceLockUntil,
    };

    const { error } = initial
      ? await supabase.from("retail_customers").update(payload).eq("id", initial.id)
      : await supabase.from("retail_customers").insert(payload);

    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-ink">
            {initial ? "Edit customer" : "New customer"}
          </h2>
          <button type="button" className="text-[13px] text-ink-mute hover:text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" className="col-span-2">
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
          </Field>
          <Field label="Phone">
            {(id) => <Input id={id} value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
          <Field label="Area / lane">
            {(id) => <Input id={id} value={area} onChange={(e) => setArea(e.target.value)} />}
          </Field>
          <Field label="Address" className="col-span-2">
            {(id) => <Input id={id} value={address} onChange={(e) => setAddress(e.target.value)} />}
          </Field>
          <Field label="Type">
            {(id) => (
              <Select
                id={id}
                value={type}
                onChange={(e) => setType(e.target.value as "casual" | "regular")}
              >
                <option value="casual">casual</option>
                <option value="regular">regular</option>
              </Select>
            )}
          </Field>
          <Field label="Status">
            {(id) => (
              <Select
                id={id}
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </Select>
            )}
          </Field>
          {type === "regular" && (
            <Field label="Fixed kg/day">
              {(id) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  value={qtyKg}
                  onChange={(e) => setQtyKg(e.target.value)}
                />
              )}
            </Field>
          )}
          <Field label="₹ / kg">
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            )}
          </Field>
          <Field label="Round #">
            {(id) => (
              <Input
                id={id}
                inputMode="numeric"
                value={roundSeq}
                onChange={(e) => setRoundSeq(e.target.value)}
              />
            )}
          </Field>
          <Field label="Referred by">
            {(id) => (
              <Input id={id} value={referral} onChange={(e) => setReferral(e.target.value)} />
            )}
          </Field>
        </div>
        {type === "regular" && (
          <p className="text-[12px] text-ink-mute">
            Regulars get a 6-month ₹{price}/kg price lock from their start date (decision 0005).
          </p>
        )}
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={busy}>
          Save customer
        </Button>
      </form>

      {initial && type === "regular" && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <Pauses customerId={initial.id} />
        </div>
      )}

      {initial && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <PortalAccess customerId={initial.id} />
        </div>
      )}
    </Card>
  );
}

function PortalAccess({ customerId }: { customerId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc("admin_reset_customer_pin", {
      p_customer_id: customerId,
    });
    setBusy(false);
    setMsg(error ? error.message : "PIN reset — they'll sign in with the last 4 digits of their phone.");
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">Customer portal</div>
          <div className="text-[12px] text-ink-mute">/book — order, pause, and check balance.</div>
        </div>
        <Button type="button" size="sm" variant="ghost" loading={busy} onClick={() => void reset()}>
          Reset PIN
        </Button>
      </div>
      {msg && <p className="text-[12px] text-ink-mute mt-2">{msg}</p>}
    </div>
  );
}

interface Pause {
  id: string;
  date_from: string;
  date_to: string;
  reason: string | null;
}

function Pauses({ customerId }: { customerId: string }) {
  const [rows, setRows] = useState<Pause[]>([]);
  const [from, setFrom] = useState(isoDate());
  const [to, setTo] = useState(isoDate());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("retail_pauses")
      .select("id, date_from, date_to, reason")
      .eq("customer_id", customerId)
      .gte("date_to", isoDate())
      .order("date_from");
    setRows((data ?? []) as Pause[]);
  }
  useEffect(() => {
    void load();
  }, [customerId]);

  async function add() {
    if (to < from) return setError("End date is before the start date.");
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("retail_pauses").insert({
      customer_id: customerId,
      date_from: from,
      date_to: to,
      created_via: "manual",
      reason: reason.trim() || null,
    });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setReason("");
      void load();
    }
  }

  async function remove(id: string) {
    await supabase.from("retail_pauses").delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-2">
      <div className="text-[13px] font-semibold text-ink-soft">Upcoming pauses</div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-ink-mute">None scheduled.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="tnum">
                {p.date_from}
                {p.date_to !== p.date_from ? ` → ${p.date_to}` : ""}
                {p.reason ? <span className="text-ink-mute"> · {p.reason}</span> : null}
              </span>
              <button
                type="button"
                className="text-[12px] text-danger"
                onClick={() => void remove(p.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Field label="From">
          {(id) => <Input id={id} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}
        </Field>
        <Field label="To">
          {(id) => <Input id={id} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}
        </Field>
        <Field label="Reason" className="col-span-2">
          {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => void add()}>
        Add pause
      </Button>
    </div>
  );
}
