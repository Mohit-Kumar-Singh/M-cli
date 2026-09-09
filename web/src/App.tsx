import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import Layout from "./components/Layout";
import { Wordmark } from "./components/Wordmark";
import { Spinner } from "./ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Herd from "./pages/Herd";
import AnimalDetail from "./pages/AnimalDetail";
import Production from "./pages/Production";
import RetailCustomers from "./pages/RetailCustomers";
import RetailOrders from "./pages/RetailOrders";
import Deliveries from "./pages/Deliveries";
import Wholesale from "./pages/Wholesale";
import Balance from "./pages/Balance";
import Feed from "./pages/Feed";
import Expenses from "./pages/Expenses";
import Health from "./pages/Health";
import Breeding from "./pages/Breeding";
import Settings from "./pages/Settings";

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
        <Route path="herd/:id" element={<AnimalDetail />} />
        <Route path="production" element={<Production />} />
        <Route path="retail" element={<RetailCustomers />} />
        <Route path="retail/orders" element={<RetailOrders />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="wholesale" element={<Wholesale />} />
        <Route path="balance" element={<Balance />} />
        <Route path="settings" element={<Settings />} />
        <Route path="feed" element={<Feed />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="health" element={<Health />} />
        <Route path="breeding" element={<Breeding />} />
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
