import {
  ALL_STATUS_FILTER,
  DEFAULT_PURCHASE_ORDER_SORT,
  PAGE_SIZE_OPTIONS,
  PURCHASE_ORDER_SORT_FIELD,
  PURCHASE_ORDER_STATUS,
  SORT_DIRECTION,
} from "../constants/purchaseOrderConstants";

const VALID_STATUSES = new Set([
  ALL_STATUS_FILTER,
  ...Object.values(PURCHASE_ORDER_STATUS),
]);

const VALID_SORT_FIELDS = new Set(
  Object.values(PURCHASE_ORDER_SORT_FIELD)
);

const VALID_SORT_DIRECTIONS = new Set(Object.values(SORT_DIRECTION));

export function parsePositiveInteger(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return numericValue;
}

export function parsePurchaseOrderQuery(searchParams) {
  const rawStatus = searchParams.get("status");
  const rawSortBy = searchParams.get("sort_by");
  const rawSortDirection = searchParams.get("sort_direction");
  const requestedPageSize = parsePositiveInteger(
    searchParams.get("page_size"),
    5
  );

  return {
    page: parsePositiveInteger(searchParams.get("page"), 1),
    pageSize: PAGE_SIZE_OPTIONS.includes(requestedPageSize)
      ? requestedPageSize
      : 5,
    search: searchParams.get("search") || "",
    status:
      rawStatus && VALID_STATUSES.has(rawStatus)
        ? rawStatus
        : ALL_STATUS_FILTER,
    sortBy:
      rawSortBy && VALID_SORT_FIELDS.has(rawSortBy)
        ? rawSortBy
        : DEFAULT_PURCHASE_ORDER_SORT.field,
    sortDirection:
      rawSortDirection && VALID_SORT_DIRECTIONS.has(rawSortDirection)
        ? rawSortDirection
        : DEFAULT_PURCHASE_ORDER_SORT.direction,
  };
}

export function buildPurchaseOrderQuery({
  page,
  pageSize,
  search,
  status,
  sortBy,
  sortDirection,
}) {
  const searchParams = new URLSearchParams();

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  if (pageSize !== 5) {
    searchParams.set("page_size", String(pageSize));
  }

  if (search?.trim()) {
    searchParams.set("search", search.trim());
  }

  if (status && status !== ALL_STATUS_FILTER) {
    searchParams.set("status", status);
  }

  if (sortBy !== DEFAULT_PURCHASE_ORDER_SORT.field) {
    searchParams.set("sort_by", sortBy);
  }

  if (sortDirection !== DEFAULT_PURCHASE_ORDER_SORT.direction) {
    searchParams.set("sort_direction", sortDirection);
  }

  return searchParams;
}

export function arePurchaseOrderQueriesEqual(first, second) {
  return (
    first.page === second.page &&
    first.pageSize === second.pageSize &&
    first.search === second.search &&
    first.status === second.status &&
    first.sortBy === second.sortBy &&
    first.sortDirection === second.sortDirection
  );
}
