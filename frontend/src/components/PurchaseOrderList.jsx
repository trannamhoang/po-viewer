import Pagination from "./Pagination";
import { formatCurrency } from "../utils/purchaseOrderUtils";

function PurchaseOrderList({
  purchaseOrders,
  loading,
  error,
  totalItems,
  currentPage,
  totalPages,
  selectedPurchaseOrderId,
  onSelectPurchaseOrder,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <>
      {loading && (
        <p className="loading-message" role="status">
          Loading purchase orders...
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}

      {!error && (
        <table>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {purchaseOrders.map((purchaseOrder) => (
              <tr
                key={purchaseOrder.id}
                className={
                  purchaseOrder.id === selectedPurchaseOrderId
                    ? "selected-row"
                    : ""
                }
                onClick={() =>
                  onSelectPurchaseOrder(purchaseOrder)
                }
              >
                <td>{purchaseOrder.po_number}</td>
                <td>{purchaseOrder.supplier}</td>

                <td>
                  <span
                    className={`status-badge status-${purchaseOrder.status.toLowerCase()}`}
                  >
                    {purchaseOrder.status}
                  </span>
                </td>

                <td>{formatCurrency(purchaseOrder.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          loading={loading}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      )}

      {!loading && !error && totalItems === 0 && (
        <p className="empty-message">
          No purchase orders found.
        </p>
      )}
    </>
  );
}

export default PurchaseOrderList;
