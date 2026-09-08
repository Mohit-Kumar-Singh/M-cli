import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Layout from "./components/Layout";
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
