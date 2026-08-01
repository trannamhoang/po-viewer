import usePurchaseOrderSummary from "../hooks/usePurchaseOrderSummary";
import { formatCurrency } from "../utils/purchaseOrderUtils";

function DashboardPage() {
  const { summary, loading, error, refreshSummary } =
    usePurchaseOrderSummary();

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of purchase order activity.</p>
        </div>

        <button
          type="button"
          onClick={refreshSummary}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && (
        <p className="loading-message" role="status">
          Loading dashboard...
        </p>
      )}

      {error && (
        <div role="alert">
          <p className="error-message">{error}</p>

          <button type="button" onClick={refreshSummary}>
            Try again
          </button>
        </div>
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

          <article className="summary-card">
            <span className="summary-label">Total order value</span>
            <strong className="summary-value">
              {formatCurrency(summary.total_value)}
            </strong>
          </article>

          <article className="summary-card">
            <span className="summary-label">Average order value</span>
            <strong className="summary-value">
              {formatCurrency(summary.average_value)}
            </strong>
          </article>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
