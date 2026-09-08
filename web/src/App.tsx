import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Herd from "./pages/Herd";
import Placeholder from "./pages/Placeholder";

function Gate() {
  const { ready, session, configured } = useAuth();

  if (!ready) return <Centered>Loading…</Centered>;

  // Let the app render without a backend so screens can be built (0008).
  if (configured && !session) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="herd" element={<Herd />} />
        <Route
          path="production"
          element={
            <Placeholder
              title="Production"
              milestone="M1"
              spec="0007 · Module 2"
              points={[
                "Session-entry grid: every milking animal, tab down the column",
                "Rollups: per animal/day, per session, herd/day, herd/month",
                "Flag sharp drop vs the animal's trailing average",
              ]}
            />
          }
        />
        <Route
          path="retail"
          element={
            <Placeholder
              title="Retail sales"
              milestone="M1"
              spec="0007 · Module 8"
              points={[
                "Customer list (casual / regular), price-lock date, payment mode",
                "Tomorrow's orders — pre-fill regulars, add casual, freeze at ~9pm",
                "Conversion candidates: casual customers with a good history",
              ]}
            />
          }
        />
        <Route
          path="deliveries"
          element={
            <Placeholder
              title="Today's delivery list"
              milestone="M1"
              spec="0007 · Module 8"
              points={[
                "Sorted by round_sequence, regulars first",
                "Mark delivered / skipped, partial qty allowed",
                "Collect payment: UPI / cash + amount",
              ]}
            />
          }
        />
        <Route
          path="wholesale"
          element={
            <Placeholder
              title="Wholesale sales"
              milestone="M1"
              spec="0007 · Module 7"
              points={[
                "Halwai customers with per-customer rate and balance",
                "Daily dispatch entry (qty, rate snapshot, amount)",
                "Outstanding dues + payment recording",
              ]}
            />
          }
        />
        <Route
          path="balance"
          element={
            <Placeholder
              title="Daily milk balance"
              milestone="M1"
              spec="0007 · Module 9"
              points={[
                "produced = wholesale + retail + own use + wastage ± buffer Δ",
                "sellable = produced − milk under vet withdrawal",
                "cash / UPI / unpaid totals across both channels",
              ]}
            />
          }
        />
        <Route
          path="feed"
          element={
            <Placeholder
              title="Feed & inputs"
              milestone="M2"
              spec="0007 · Module 5"
              points={["Feed items + stock", "Purchases", "Daily consumption → feed cost / kg milk"]}
            />
          }
        />
        <Route
          path="expenses"
          element={
            <Placeholder
              title="Expenses"
              milestone="M2"
              spec="0007 · Module 6"
              points={["Categorized non-feed expenses", "Recurring templates (wages, electricity)"]}
            />
          }
        />
        <Route
          path="health"
          element={
            <Placeholder
              title="Health & veterinary"
              milestone="M2"
              spec="0007 · Module 4"
              points={[
                "Vaccination / deworming schedule",
                "Treatments + cost → Expenses",
                "Milk-withdrawal periods feed the daily balance",
              ]}
            />
          }
        />
        <Route
          path="breeding"
          element={
            <Placeholder
              title="Breeding & reproduction"
              milestone="M3"
              spec="0007 · Module 3"
              points={[
                "Heat / service / PD / calving / dry-off events",
                "Calving → new Herd record; lactation number increment",
                "Calendar: upcoming calvings, due dry-offs",
              ]}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center muted text-sm">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
