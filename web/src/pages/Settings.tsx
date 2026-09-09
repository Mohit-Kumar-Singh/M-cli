import { LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme, type ThemePref } from "../lib/theme";
import { APP_VERSION, GIT_SHA, BUILD_TIME } from "../lib/version";
import { PageHeader, Card, Button, Segmented } from "../ui";

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Settings() {
  const { profile, session, role, signOut } = useAuth();
  const { pref, setPref } = useTheme();

  const email = session?.user?.email ?? "—";
  const builtOn = new Date(BUILD_TIME).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Your account, appearance and app info." />

      <Section title="Account">
        <Row label="Name" value={profile?.full_name ?? "—"} />
        <Row label="Email" value={email} />
        <Row
          label="Role"
          value={<span className="capitalize">{role?.replace("_", " ") ?? "—"}</span>}
        />
        <div className="pt-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<LogOut size={15} />}
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-[13px] text-ink-soft">Theme</span>
          <Segmented
            value={pref}
            onChange={setPref}
            options={THEME_OPTIONS}
            size="sm"
          />
        </div>
        <p className="text-[12px] text-ink-mute pt-1">
          “System” follows your device’s light/dark setting.
        </p>
      </Section>

      <Section title="About">
        <Row label="App" value="Milk Garage" />
        <Row label="Version" value={<span className="tnum">v{APP_VERSION}</span>} />
        <Row label="Build" value={<span className="tnum">{GIT_SHA}</span>} />
        <Row label="Built" value={<span className="tnum">{builtOn}</span>} />
        <div className="pt-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={15} />}
            onClick={() => window.location.reload()}
          >
            Reload app
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[13px] font-semibold text-ink-mute mb-2">{title}</h2>
      <Card>{children}</Card>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-[13px] text-ink-mute shrink-0">{label}</span>
      <span className="text-[13px] text-ink text-right min-w-0 truncate">{value}</span>
    </div>
  );
}
