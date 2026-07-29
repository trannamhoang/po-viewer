import { PURCHASE_ORDER_STATUS } from "../constants/purchaseOrderConstants";

function PurchaseOrderDetails({
  purchaseOrder,
  detailLoading,
  detailError,
  deleteLoading,
  deleteError,
  onEdit,
  onDelete,
  onClose,
}) {
  if (detailLoading) {
    return (
      <section className="details">
        <h2>PO Details</h2>

        <p className="loading-message" role="status">
          Loading purchase order details...
        </p>
      </section>
    );
  }

  if (detailError) {
    return (
      <section className="details">
        <h2>PO Details</h2>

        <p className="error-message" role="alert">
          {detailError}
        </p>

        {onClose && (
          <button type="button" onClick={onClose}>
            Back to purchase orders
          </button>
        )}
      </section>
    );
  }

  if (!purchaseOrder) {
    return (
      <section className="details">
        <h2>PO Details</h2>

        <p>Select a purchase order to view its details.</p>
      </section>
    );
  }

  const isOpen = purchaseOrder.status === PURCHASE_ORDER_STATUS.OPEN;
  const isApproved = purchaseOrder.status === PURCHASE_ORDER_STATUS.APPROVED;
  const isCompleted =
    purchaseOrder.status === PURCHASE_ORDER_STATUS.COMPLETED;

  return (
    <section className="details">
      <div className="details-header">
        <h2>PO Details</h2>

        <button
          type="button"
          className="details-close-button"
          onClick={onClose}
          aria-label="Close purchase order details"
        >
          ×
        </button>
      </div>

      {deleteError && (
        <p className="error-message" role="alert">
          {deleteError}
        </p>
      )}

      <div className="detail-actions">
        {!isCompleted && (
          <button
            type="button"
            onClick={onEdit}
            disabled={deleteLoading}
          >
            {isOpen ? "Edit PO" : "Complete PO"}
          </button>
        )}

        <button
          type="button"
          className="delete-button"
          onClick={onDelete}
          disabled={deleteLoading || isCompleted}
        >
          {deleteLoading ? "Deleting..." : "Delete PO"}
        </button>
      </div>

      {isCompleted && (
        <p className="status-message">
          Completed purchase orders cannot be edited or deleted.
        </p>
      )}

      <div className="detail-field">
        <strong>PO Number:</strong> {purchaseOrder.po_number}
      </div>

      <div className="detail-field">
        <strong>Supplier:</strong> {purchaseOrder.supplier}
      </div>

      <div className="detail-field">
        <strong>Order Date:</strong> {purchaseOrder.order_date}
      </div>

      <div className="detail-field">
        <strong>Status:</strong>{" "}
        <span
          className={`status-badge status-${purchaseOrder.status.toLowerCase()}`}
        >
          {purchaseOrder.status}
        </span>
      </div>

      <h3>Items</h3>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {purchaseOrder.items.map((item, index) => (
            <tr key={item.id || index}>
              <td>{item.product}</td>
              <td>{item.quantity}</td>
              <td>${item.unit_price.toLocaleString()}</td>
              <td>
                $
                {(item.quantity * item.unit_price).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="total">
        Total: ${purchaseOrder.total_amount.toLocaleString()}
      </p>

      {isApproved && (
        <p className="status-message">
          This purchase order is approved. Its content is locked, but it can
          be completed.
        </p>
      )}
    </section>
  );
}

export default PurchaseOrderDetails;
