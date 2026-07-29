import { Navigate, Route, Routes } from "react-router";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";

function NotFoundPage() {
  return (
    <section className="not-found-page">
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
    </section>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />

        <Route
          path="/purchase-orders/:purchaseOrderId"
          element={<PurchaseOrdersPage />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
