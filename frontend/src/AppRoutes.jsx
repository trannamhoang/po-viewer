import { Link, Navigate, Route, Routes } from "react-router";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <h1>Page not found</h1>

      <p>The page you requested does not exist.</p>

      <Link to="/purchase-orders">Return to purchase orders</Link>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/purchase-orders" replace />} />

      <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />

      <Route
        path="/purchase-orders/:purchaseOrderId"
        element={<PurchaseOrdersPage />}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
