import { useEffect, useState } from "react";
import {
  ALL_STATUS_FILTER,
  PURCHASE_ORDER_STATUS,
} from "../constants/purchaseOrderConstants";
import { getPurchaseOrders } from "../services/purchaseOrderApi";

function DashboardPage() {
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    approved: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [allResponse, openResponse, approvedResponse, completedResponse] =
          await Promise.all([
            getPurchaseOrders({
              page: 1,
              pageSize: 1,
              search: "",
              status: ALL_STATUS_FILTER,
              signal: controller.signal,
            }),
            getPurchaseOrders({
              page: 1,
              pageSize: 1,
              search: "",
              status: PURCHASE_ORDER_STATUS.OPEN,
              signal: controller.signal,
            }),
            getPurchaseOrders({
              page: 1,
              pageSize: 1,
              search: "",
              status: PURCHASE_ORDER_STATUS.APPROVED,
              signal: controller.signal,
            }),
            getPurchaseOrders({
              page: 1,
              pageSize: 1,
              search: "",
              status: PURCHASE_ORDER_STATUS.COMPLETED,
              signal: controller.signal,
            }),
          ]);

        setSummary({
          total: allResponse.total_items,
          open: openResponse.total_items,
          approved: approvedResponse.total_items,
          completed: completedResponse.total_items,
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of purchase order activity.</p>
        </div>
      </div>

      {loading && (
        <p className="loading-message" role="status">
          Loading dashboard...
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="dashboard-grid">
          <article className="summary-card">
            <span className="summary-label">Total purchase orders</span>
            <strong className="summary-value">{summary.total}</strong>
          </article>

          <article className="summary-card">
            <span className="summary-label">Open</span>
            <strong className="summary-value">{summary.open}</strong>
          </article>

          <article className="summary-card">
            <span className="summary-label">Approved</span>
            <strong className="summary-value">{summary.approved}</strong>
          </article>

          <article className="summary-card">
            <span className="summary-label">Completed</span>
            <strong className="summary-value">{summary.completed}</strong>
          </article>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
