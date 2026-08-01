import Pagination from "./Pagination";
import {
  PURCHASE_ORDER_SORT_FIELD,
  SORT_DIRECTION,
} from "../constants/purchaseOrderConstants";
import { formatCurrency } from "../utils/purchaseOrderUtils";

function SortableHeader({
  field,
  label,
  sortBy,
  sortDirection,
  onSort,
}) {
  const isActive = sortBy === field;
  const directionLabel =
    sortDirection === SORT_DIRECTION.ASCENDING
      ? "ascending"
      : "descending";

  return (
    <th aria-sort={isActive ? directionLabel : "none"}>
      <button
        type="button"
        className="table-sort-button"
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="sort-indicator">
          {!isActive
            ? "↕"
            : sortDirection === SORT_DIRECTION.ASCENDING
              ? "↑"
              : "↓"}
        </span>
      </button>
    </th>
  );
}

function PurchaseOrderList({
  purchaseOrders,
  loading,
  error,
  totalItems,
  currentPage,
  totalPages,
  sortBy,
  sortDirection,
  selectedPurchaseOrderId,
  onSort,
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
              <SortableHeader
                field={PURCHASE_ORDER_SORT_FIELD.PO_NUMBER}
                label="PO Number"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                field={PURCHASE_ORDER_SORT_FIELD.SUPPLIER}
                label="Supplier"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                field={PURCHASE_ORDER_SORT_FIELD.ORDER_DATE}
                label="Order Date"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                field={PURCHASE_ORDER_SORT_FIELD.STATUS}
                label="Status"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                field={PURCHASE_ORDER_SORT_FIELD.TOTAL_AMOUNT}
                label="Total"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
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
                <td>{purchaseOrder.order_date}</td>

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
