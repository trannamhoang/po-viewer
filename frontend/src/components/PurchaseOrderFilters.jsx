import {
  ALL_STATUS_FILTER,
  PAGE_SIZE_OPTIONS,
  PURCHASE_ORDER_STATUS,
} from "../constants/purchaseOrderConstants";

function PurchaseOrderFilters({
  searchText,
  isSearchWaiting,
  statusFilter,
  pageSize,
  onSearchChange,
  onClearSearch,
  onStatusChange,
  onPageSizeChange,
}) {
  return (
    <div className="filters">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by PO number or supplier..."
          value={searchText}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />

        {isSearchWaiting && (
          <span className="search-status">
            Waiting to search...
          </span>
        )}

        {searchText && (
          <button type="button" onClick={onClearSearch}>
            Clear
          </button>
        )}
      </div>

      <select
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(event.target.value)
        }
      >
        <option value={ALL_STATUS_FILTER}>All statuses</option>
        {Object.values(PURCHASE_ORDER_STATUS).map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        value={pageSize}
        onChange={(event) =>
          onPageSizeChange(Number(event.target.value))
        }
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size} per page
          </option>
        ))}
      </select>
    </div>
  );
}

export default PurchaseOrderFilters;
