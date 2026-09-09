import { useEffect, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PawPrint,
  Milk,
  Users,
  ClipboardList,
  Truck,
  Store,
  Scale,
  Wheat,
  Receipt,
  Stethoscope,
  Sprout,
  Menu,
  X,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import type { Role } from "../types/db";
import { Wordmark } from "./Wordmark";
import { AppVersion } from "./AppVersion";
import { ThemeToggle } from "../ui";

interface Item {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number | string }>;
  roles: Role[];
  soon?: string;
  primary?: boolean; // shown in the mobile bottom bar
}

const NAV: Item[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["owner"], primary: true },
  { to: "/herd", label: "Herd", icon: PawPrint, roles: ["owner"], primary: true },
  { to: "/production", label: "Production", icon: Milk, roles: ["owner", "dairy_hand"], primary: true },
  { to: "/retail", label: "Retail customers", icon: Users, roles: ["owner"] },
  { to: "/retail/orders", label: "Orders", icon: ClipboardList, roles: ["owner"] },
  { to: "/deliveries", label: "Deliveries", icon: Truck, roles: ["owner", "delivery_runner"], primary: true },
  { to: "/wholesale", label: "Wholesale", icon: Store, roles: ["owner"] },
  { to: "/balance", label: "Milk balance", icon: Scale, roles: ["owner"] },
  { to: "/feed", label: "Feed", icon: Wheat, roles: ["owner", "dairy_hand"] },
  { to: "/expenses", label: "Expenses", icon: Receipt, roles: ["owner"] },
  { to: "/health", label: "Health", icon: Stethoscope, roles: ["owner"] },
  { to: "/breeding", label: "Breeding", icon: Sprout, roles: ["owner"], soon: "Soon" },
  {
    to: "/settings",
    label: "Settings",
    icon: SettingsIcon,
    roles: ["owner", "delivery_runner", "dairy_hand"],
  },
];

export default function Layout() {
  const { profile, role, signOut } = useAuth();
  const items = NAV.filter((i) => (role ? i.roles.includes(role) : false));
  const primary = items.filter((i) => i.primary).slice(0, 4);
  const overflow = items.filter((i) => !primary.includes(i));
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setSheetOpen(false), [location.pathname]);

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[248px_1fr]">
      {/* ---- Desktop sidebar ------------------------------------------- */}
      <aside className="hidden lg:flex flex-col border-r border-[var(--border-subtle)] bg-card sticky top-0 h-[100dvh]">
        <div className="px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <Wordmark />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {items.map((i) => (
            <SideLink key={i.to} item={i} />
          ))}
        </nav>
        <div className="border-t border-[var(--border-subtle)] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium truncate">{profile?.full_name ?? "—"}</div>
              <div className="text-[11px] text-ink-mute capitalize">{role?.replace("_", " ")}</div>
            </div>
            <ThemeToggle />
            <button
              className="mg-btn mg-btn--ghost !min-h-0 !p-2"
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
          <AppVersion className="block px-1" />
        </div>
      </aside>

      {/* ---- Mobile top bar ------------------------------------------- */}
      <header className="lg:hidden sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-card/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-14">
          <Wordmark compact />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `mg-btn mg-btn--ghost !min-h-0 !p-2 ${isActive ? "!text-accent" : ""}`
              }
              aria-label="Settings"
            >
              <SettingsIcon size={18} />
            </NavLink>
          </div>
        </div>
      </header>

      {/* ---- Content ------------------------------------------------- */}
      <main className="px-4 sm:px-6 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-10 max-w-3xl w-full mx-auto">
        <Outlet />
      </main>

      {/* ---- Mobile bottom nav -------------------------------------- */}
      {items.length > 1 && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--border-subtle)] bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {primary.map((i) => (
              <BottomLink key={i.to} item={i} />
            ))}
            {overflow.length > 0 && (
              <button
                onClick={() => setSheetOpen(true)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 text-ink-mute"
              >
                <Menu size={20} />
                <span className="text-[10px] font-medium">More</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* ---- More sheet ------------------------------------------------ */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-30" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="mg-sheet-enter absolute bottom-0 inset-x-0 max-h-[80vh] overflow-y-auto bg-card rounded-t-[20px] border-t border-[var(--border-subtle)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold">Menu</span>
              <button
                className="mg-btn mg-btn--ghost !min-h-0 !p-2"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {overflow.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  end={i.to === "/retail"}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
                      isActive
                        ? "border-transparent bg-accent-weak text-accent"
                        : "border-[var(--border-subtle)] text-ink-soft"
                    }`
                  }
                >
                  <i.icon size={20} />
                  <span className="text-[11px] font-medium leading-tight">{i.label}</span>
                  {i.soon && <span className="mg-badge mg-badge--neutral !py-0 !text-[9px]">{i.soon}</span>}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <AppVersion />
              <span className="text-[11px] text-ink-mute">{profile?.full_name ?? ""}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SideLink({ item }: { item: Item }) {
  const { icon: Icon } = item;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/" || item.to === "/retail"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors ${
          isActive
            ? "bg-accent-weak text-accent"
            : "text-ink-soft hover:bg-sunken hover:text-ink"
        }`
      }
    >
      <Icon size={17} />
      <span className="flex-1">{item.label}</span>
      {item.soon && (
        <span className="mg-badge mg-badge--neutral !py-0 !px-1.5 !text-[9px]">{item.soon}</span>
      )}
    </NavLink>
  );
}

function BottomLink({ item }: { item: Item }) {
  const { icon: Icon } = item;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-0.5 py-2 ${
          isActive ? "text-accent" : "text-ink-mute"
        }`
      }
    >
      <Icon size={20} />
      <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
    </NavLink>
  );
}
