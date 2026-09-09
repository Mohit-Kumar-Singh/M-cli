import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import Layout from "./components/Layout";
import { Wordmark } from "./components/Wordmark";
import { Spinner } from "./ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Herd from "./pages/Herd";
import Production from "./pages/Production";
import RetailCustomers from "./pages/RetailCustomers";
import RetailOrders from "./pages/RetailOrders";
import Deliveries from "./pages/Deliveries";
import Wholesale from "./pages/Wholesale";
import Balance from "./pages/Balance";
import Placeholder from "./pages/Placeholder";

function Splash() {
  return (
    <div className="min-h-full grid place-items-center p-4">
      <div className="flex flex-col items-center gap-3 text-ink-mute">
        <Wordmark />
        <Spinner size={18} />
      </div>
    </div>
  );
}

function Gate() {
  const { ready, session, profile, configured } = useAuth();

  if (!ready) return <Splash />;

  // Render without a backend so screens can be built (0008). `profile` is also
  // set in dev preview mode (VITE_PREVIEW_ROLE), which bypasses sign-in.
  if (configured && !session && !profile) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="herd" element={<Herd />} />
        <Route path="production" element={<Production />} />
        <Route path="retail" element={<RetailCustomers />} />
        <Route path="retail/orders" element={<RetailOrders />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="wholesale" element={<Wholesale />} />
        <Route path="balance" element={<Balance />} />
        <Route
          path="feed"
          element={
            <Placeholder
              title="Feed & inputs"
              milestone="Milestone 2"
              spec="0007 · Module 5"
              points={[
                "Feed items and stock on hand",
                "Purchases — quantity, cost, supplier",
                "Daily consumption, rolled up to feed cost per kg of milk",
              ]}
            />
          }
        />
        <Route
          path="expenses"
          element={
            <Placeholder
              title="Expenses"
              milestone="Milestone 2"
              spec="0007 · Module 6"
              points={[
                "Categorised non-feed expenses",
                "Recurring templates for wages and electricity",
              ]}
            />
          }
        />
        <Route
          path="health"
          element={
            <Placeholder
              title="Health & veterinary"
              milestone="Milestone 2"
              spec="0007 · Module 4"
              points={[
                "Vaccination and deworming schedule",
                "Treatments and cost, flowing into Expenses",
                "Milk-withdrawal periods that feed the daily balance",
              ]}
            />
          }
        />
        <Route
          path="breeding"
          element={
            <Placeholder
              title="Breeding & reproduction"
              milestone="Milestone 3"
              spec="0007 · Module 3"
              points={[
                "Heat, service, pregnancy check, calving and dry-off events",
                "Calving creates the calf's herd record and bumps lactation number",
                "Calendar of upcoming calvings and due dry-offs",
              ]}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
