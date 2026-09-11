import { useEffect, useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCustomerAuth } from "../../lib/customerAuth";
import { AppVersion } from "../../components/AppVersion";
import { Button, Card, PageHeader, TextField } from "../../ui";

interface Dues {
  pending_amount: number;
  pending_deliveries: number;
}

export default function CustomerAccount() {
  const { token, customer, logout } = useCustomerAuth();
  const [dues, setDues] = useState<Dues | null>(null);

  useEffect(() => {
    if (!token) return;
    supabase
      .rpc("customer_get_dues", { p_token: token })
      .then(({ data }) => setDues((data?.[0] as Dues) ?? null));
  }, [token]);

  return (
    <div>
      <PageHeader title="Account" />

      <Card className="mb-4">
        <dl className="space-y-2 text-[13px]">
          <Row label="Name" value={customer?.name ?? "—"} />
          <Row label="Phone" value={customer?.phone ?? "—"} />
          {customer?.area && <Row label="Area" value={customer.area} />}
          <Row label="Rate" value={`₹${customer?.price_per_kg ?? 60}/kg`} />
          <Row label="Type" value={customer?.type === "regular" ? "Regular" : "Casual"} />
        </dl>
      </Card>

      {dues && dues.pending_deliveries > 0 && (
        <Card className="mb-4 !bg-gold-weak !border-transparent">
          <div className="text-[13px] text-gold">
            <span className="font-bold tnum">₹{dues.pending_amount.toFixed(2)}</span> pending
            across {dues.pending_deliveries} delivery
            {dues.pending_deliveries === 1 ? "" : "ies"}.
          </div>
        </Card>
      )}

      <ChangePin />

      <Button
        variant="ghost"
        className="mt-4 !text-danger"
        icon={<LogOut size={16} />}
        onClick={() => void logout()}
      >
        Sign out
      </Button>

      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center">
        <AppVersion />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function ChangePin() {
  const { token } = useCustomerAuth();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc("customer_change_pin", {
      p_token: token,
      p_old_pin: oldPin,
      p_new_pin: newPin,
    });
    setBusy(false);
    if (error) setMsg(error.message.replace(/^.*:\s*/, ""));
    else {
      setMsg("PIN updated");
      setOldPin("");
      setNewPin("");
    }
  }

  return (
    <Card>
      <div className="text-[13px] font-semibold text-ink-soft mb-3">Change PIN</div>
      <form onSubmit={submit} className="space-y-3">
        <TextField
          label="Current PIN"
          type="password"
          inputMode="numeric"
          value={oldPin}
          onChange={(e) => setOldPin(e.target.value)}
          required
        />
        <TextField
          label="New PIN"
          hint="4 to 6 digits"
          type="password"
          inputMode="numeric"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          required
        />
        {msg && <p className="text-[13px] text-ink-mute">{msg}</p>}
        <Button type="submit" size="sm" variant="secondary" loading={busy}>
          Update PIN
        </Button>
      </form>
    </Card>
  );
}
