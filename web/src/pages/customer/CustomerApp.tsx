import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerAuthProvider, useCustomerAuth } from "../../lib/customerAuth";
import { useAppShellMeta } from "../../lib/appShell";
import { Wordmark } from "../../components/Wordmark";
import { Spinner } from "../../ui";
import CustomerLogin from "./CustomerLogin";
import CustomerEmailCallback from "./CustomerEmailCallback";
import CustomerLayout from "./CustomerLayout";
import CustomerOrder from "./CustomerOrder";
import CustomerPauses from "./CustomerPauses";
import CustomerAccount from "./CustomerAccount";

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

function CustomerGate() {
  const { ready, customer } = useCustomerAuth();

  return (
    <Routes>
      {/* Reachable regardless of ready/customer state — it's how customer
          becomes non-null in the first place after an email magic link. */}
      <Route path="verify" element={<CustomerEmailCallback />} />
      <Route
        path="*"
        element={
          !ready ? (
            <Splash />
          ) : !customer ? (
            <CustomerLogin />
          ) : (
            <Routes>
              <Route element={<CustomerLayout />}>
                <Route index element={<Navigate to="order" replace />} />
                <Route path="order" element={<CustomerOrder />} />
                <Route path="pauses" element={<CustomerPauses />} />
                <Route path="account" element={<CustomerAccount />} />
                <Route path="*" element={<Navigate to="order" replace />} />
              </Route>
            </Routes>
          )
        }
      />
    </Routes>
  );
}

export default function CustomerApp() {
  useAppShellMeta(true);
  return (
    <CustomerAuthProvider>
      <CustomerGate />
    </CustomerAuthProvider>
  );
}
