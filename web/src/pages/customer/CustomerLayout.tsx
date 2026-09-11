import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, CalendarOff, UserCircle } from "lucide-react";
import { Wordmark } from "../../components/Wordmark";
import { ThemeToggle } from "../../ui";

const TABS = [
  { to: "/book/order", label: "Order", icon: ClipboardList },
  { to: "/book/pauses", label: "Pauses", icon: CalendarOff },
  { to: "/book/account", label: "Account", icon: UserCircle },
];

export default function CustomerLayout() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-card/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto">
          <Wordmark compact />
          <ThemeToggle />
        </div>
      </header>

      <main className="px-4 sm:px-6 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] max-w-3xl w-full mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-[var(--border-subtle)] bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="flex max-w-3xl mx-auto">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 ${
                  isActive ? "text-accent" : "text-ink-mute"
                }`
              }
            >
              <t.icon size={20} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
