import PurchaseOrderItemsEditor from "./PurchaseOrderItemsEditor";

function PurchaseOrderForm({
  title,
  purchaseOrder,
  loading,
  error,
  submitLabel,
  loadingLabel,
  contentDisabled = false,
  allowedStatuses,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onCancel,
}) {
  return (
    <section className="create-form-section">
      <h2>{title}</h2>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            PO Number

            <input
              type="text"
              name="po_number"
              value={purchaseOrder.po_number}
              onChange={onFieldChange}
              disabled={contentDisabled}
              required
            />
          </label>

          <label>
            Supplier

            <input
              type="text"
              name="supplier"
              value={purchaseOrder.supplier}
              onChange={onFieldChange}
              disabled={contentDisabled}
              required
            />
          </label>

          <label>
            Order Date

            <input
              type="date"
              name="order_date"
              value={purchaseOrder.order_date}
              onChange={onFieldChange}
              disabled={contentDisabled}
              required
            />
          </label>

          <label>
            Status

            <select
              name="status"
              value={purchaseOrder.status}
              onChange={onFieldChange}
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <PurchaseOrderItemsEditor
          items={purchaseOrder.items}
          disabled={contentDisabled}
          onItemChange={onItemChange}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? loadingLabel : submitLabel}
          </button>

          {onCancel && (
            <button type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default PurchaseOrderForm;
