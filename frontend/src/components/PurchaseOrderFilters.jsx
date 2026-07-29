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
        <option value="All">All statuses</option>
        <option value="Open">Open</option>
        <option value="Approved">Approved</option>
        <option value="Completed">Completed</option>
      </select>

      <select
        value={pageSize}
        onChange={(event) =>
          onPageSizeChange(Number(event.target.value))
        }
      >
        <option value={5}>5 per page</option>
        <option value={10}>10 per page</option>
        <option value={20}>20 per page</option>
      </select>
    </div>
  );
}

export default PurchaseOrderFilters;
