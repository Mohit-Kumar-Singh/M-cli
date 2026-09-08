import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../types/db";

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
  milestone?: string;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["owner"] },
  { to: "/herd", label: "Herd", roles: ["owner"] },
  { to: "/production", label: "Production", roles: ["owner", "dairy_hand"] },
  { to: "/retail", label: "Retail customers", roles: ["owner"] },
  { to: "/retail/orders", label: "Orders", roles: ["owner"] },
  { to: "/deliveries", label: "Deliveries", roles: ["owner", "delivery_runner"] },
  { to: "/wholesale", label: "Wholesale", roles: ["owner"] },
  { to: "/balance", label: "Milk balance", roles: ["owner"] },
  { to: "/feed", label: "Feed", roles: ["owner", "dairy_hand"], milestone: "M2" },
  { to: "/expenses", label: "Expenses", roles: ["owner"], milestone: "M2" },
  { to: "/health", label: "Health", roles: ["owner"], milestone: "M2" },
  { to: "/breeding", label: "Breeding", roles: ["owner"], milestone: "M3" },
];

export default function Layout() {
  const { profile, role, signOut } = useAuth();
  const items = NAV.filter((i) => (role ? i.roles.includes(role) : false));

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>M-cli</span>
          <span className="muted text-sm">{profile?.full_name ?? "—"}</span>
        </div>
        <button className="text-sm muted underline" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <nav className="flex gap-1 overflow-x-auto px-2 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === "/" || i.to === "/retail"}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                isActive ? "text-white" : "muted"
              }`
            }
            style={({ isActive }) =>
              isActive ? { background: "var(--accent)", color: "var(--accent-ink)" } : undefined
            }
          >
            {i.label}
            {i.milestone && <span className="ml-1 text-[10px] opacity-60">{i.milestone}</span>}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
