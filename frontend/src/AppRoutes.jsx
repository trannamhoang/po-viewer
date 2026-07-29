import { Navigate, Route, Routes } from "react-router";
import App from "./App";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/purchase-orders" replace />} />

      <Route path="/purchase-orders" element={<App />} />

      <Route path="/purchase-orders/:purchaseOrderId" element={<App />} />

      <Route
        path="*"
        element={
          <main className="not-found-page">
            <h1>Page not found</h1>

            <a href="/purchase-orders">Return to purchase orders</a>
          </main>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
