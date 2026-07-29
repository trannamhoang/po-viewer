import { PURCHASE_ORDER_STATUS } from "../constants/purchaseOrderConstants";
import PurchaseOrderItemsEditor from "./PurchaseOrderItemsEditor";

function PurchaseOrderForm({
  title,
  purchaseOrder,
  loading,
  error,
  validationErrors = {
    po_number: "",
    supplier: "",
    order_date: "",
    status: "",
    items: [],
  },
  submitLabel,
  loadingLabel,
  contentDisabled = false,
  allowedStatuses = [PURCHASE_ORDER_STATUS.OPEN],
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

      <form onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <label>
            PO Number

            <input
              type="text"
              name="po_number"
              value={purchaseOrder.po_number}
              onChange={onFieldChange}
              disabled={contentDisabled}
              aria-invalid={Boolean(validationErrors.po_number)}
              aria-describedby={
                validationErrors.po_number ? "po-number-error" : undefined
              }
            />

            {validationErrors.po_number && (
              <span id="po-number-error" className="field-error">
                {validationErrors.po_number}
              </span>
            )}
          </label>

          <label>
            Supplier

            <input
              type="text"
              name="supplier"
              value={purchaseOrder.supplier}
              onChange={onFieldChange}
              disabled={contentDisabled}
              aria-invalid={Boolean(validationErrors.supplier)}
              aria-describedby={
                validationErrors.supplier ? "supplier-error" : undefined
              }
            />

            {validationErrors.supplier && (
              <span id="supplier-error" className="field-error">
                {validationErrors.supplier}
              </span>
            )}
          </label>

          <label>
            Order Date

            <input
              type="date"
              name="order_date"
              value={purchaseOrder.order_date}
              onChange={onFieldChange}
              disabled={contentDisabled}
              aria-invalid={Boolean(validationErrors.order_date)}
              aria-describedby={
                validationErrors.order_date ? "order-date-error" : undefined
              }
            />

            {validationErrors.order_date && (
              <span id="order-date-error" className="field-error">
                {validationErrors.order_date}
              </span>
            )}
          </label>

          <label>
            Status

            <select
              name="status"
              value={purchaseOrder.status}
              onChange={onFieldChange}
              aria-invalid={Boolean(validationErrors.status)}
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {validationErrors.status && (
              <span className="field-error">
                {validationErrors.status}
              </span>
            )}
          </label>
        </div>

        <PurchaseOrderItemsEditor
          items={purchaseOrder.items}
          errors={validationErrors.items}
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
