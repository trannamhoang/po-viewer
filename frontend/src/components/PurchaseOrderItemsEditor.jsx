import { calculatePurchaseOrderTotal } from "../utils/purchaseOrderUtils";

function PurchaseOrderItemsEditor({
  items,
  errors = [],
  disabled = false,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) {
  const estimatedTotal = calculatePurchaseOrderTotal(items);
  const itemValidationErrors = Array.isArray(errors) ? errors : [];
  const generalError = itemValidationErrors.find(
    (itemErrors) => itemErrors?.general
  )?.general;

  return (
    <div className="items-section">
      <div className="items-header">
        <h3>Items</h3>

        <button type="button" onClick={onAddItem} disabled={disabled}>
          Add Item
        </button>
      </div>

      {generalError && <p className="field-error">{generalError}</p>}

      {items.map((item, index) => {
        const itemErrors = itemValidationErrors[index] || {};

        return (
          <div className="item-row" key={item.id || index}>
            <label>
              Product

              <input
                type="text"
                name="product"
                value={item.product}
                onChange={(event) => onItemChange(index, event)}
                disabled={disabled}
                aria-invalid={Boolean(itemErrors.product)}
              />

              {itemErrors.product && (
                <span className="field-error">{itemErrors.product}</span>
              )}
            </label>

            <label>
              Quantity

              <input
                type="number"
                name="quantity"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(event) => onItemChange(index, event)}
                disabled={disabled}
                aria-invalid={Boolean(itemErrors.quantity)}
              />

              {itemErrors.quantity && (
                <span className="field-error">{itemErrors.quantity}</span>
              )}
            </label>

            <label>
              Unit Price

              <input
                type="number"
                name="unit_price"
                min="0.01"
                step="0.01"
                value={item.unit_price}
                onChange={(event) => onItemChange(index, event)}
                disabled={disabled}
                aria-invalid={Boolean(itemErrors.unit_price)}
              />

              {itemErrors.unit_price && (
                <span className="field-error">{itemErrors.unit_price}</span>
              )}
            </label>

            <button
              type="button"
              className="remove-item-button"
              onClick={() => onRemoveItem(index)}
              disabled={disabled || items.length === 1}
            >
              Remove
            </button>
          </div>
        );
      })}

      <p className="form-total">
        Estimated total: ${estimatedTotal.toLocaleString()}
      </p>
    </div>
  );
}

export default PurchaseOrderItemsEditor;
