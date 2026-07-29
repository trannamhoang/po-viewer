function PurchaseOrderItemsEditor({
  items,
  disabled = false,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) {
  const estimatedTotal = items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );

  return (
    <div className="items-section">
      <div className="items-header">
        <h3>Items</h3>

        <button type="button" onClick={onAddItem} disabled={disabled}>
          Add Item
        </button>
      </div>

      {items.map((item, index) => (
        <div className="item-row" key={item.id || index}>
          <label>
            Product

            <input
              type="text"
              name="product"
              value={item.product}
              onChange={(event) => onItemChange(index, event)}
              disabled={disabled}
              required
            />
          </label>

          <label>
            Quantity

            <input
              type="number"
              name="quantity"
              min="1"
              value={item.quantity}
              onChange={(event) => onItemChange(index, event)}
              disabled={disabled}
              required
            />
          </label>

          <label>
            Unit Price

            <input
              type="number"
              name="unit_price"
              min="0"
              step="0.01"
              value={item.unit_price}
              onChange={(event) => onItemChange(index, event)}
              disabled={disabled}
              required
            />
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
      ))}

      <p className="form-total">
        Estimated total: ${estimatedTotal.toLocaleString()}
      </p>
    </div>
  );
}

export default PurchaseOrderItemsEditor;
