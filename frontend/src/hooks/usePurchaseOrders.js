import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ALL_STATUS_FILTER,
  DEFAULT_PURCHASE_ORDER_SORT,
  SORT_DIRECTION,
} from "../constants/purchaseOrderConstants";
import { getPurchaseOrders } from "../services/purchaseOrderApi";
import {
  arePurchaseOrderQueriesEqual,
  buildPurchaseOrderQuery,
  parsePurchaseOrderQuery,
} from "../utils/purchaseOrderQueryUtils";

export default function usePurchaseOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialQuery] = useState(() =>
    parsePurchaseOrderQuery(searchParams)
  );
  const currentQueryRef = useRef(null);
  const isApplyingUrlStateRef = useRef(false);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState(initialQuery.search);
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    initialQuery.search
  );
  const [statusFilter, setStatusFilter] = useState(initialQuery.status);
  const [sortBy, setSortBy] = useState(initialQuery.sortBy);
  const [sortDirection, setSortDirection] = useState(
    initialQuery.sortDirection
  );

  const [currentPage, setCurrentPage] = useState(initialQuery.page);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (searchText === debouncedSearchText) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchText, debouncedSearchText]);

  useEffect(() => {
    currentQueryRef.current = {
      page: currentPage,
      pageSize,
      search: debouncedSearchText,
      status: statusFilter,
      sortBy,
      sortDirection,
    };
  }, [
    currentPage,
    pageSize,
    debouncedSearchText,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  useEffect(() => {
    const parsedQuery = parsePurchaseOrderQuery(searchParams);

    if (
      arePurchaseOrderQueriesEqual(
        parsedQuery,
        currentQueryRef.current
      )
    ) {
      return;
    }

    isApplyingUrlStateRef.current = true;
    setCurrentPage(parsedQuery.page);
    setPageSize(parsedQuery.pageSize);
    setSearchText(parsedQuery.search);
    setDebouncedSearchText(parsedQuery.search);
    setStatusFilter(parsedQuery.status);
    setSortBy(parsedQuery.sortBy);
    setSortDirection(parsedQuery.sortDirection);
  }, [searchParams]);

  useEffect(() => {
    if (isApplyingUrlStateRef.current) {
      isApplyingUrlStateRef.current = false;
      return;
    }

    const nextSearchParams = buildPurchaseOrderQuery({
      page: currentPage,
      pageSize,
      search: debouncedSearchText,
      status: statusFilter,
      sortBy,
      sortDirection,
    });

    if (nextSearchParams.toString() === searchParams.toString()) {
      return;
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [
    currentPage,
    pageSize,
    debouncedSearchText,
    statusFilter,
    sortBy,
    sortDirection,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPurchaseOrders() {
      try {
        setLoading(true);
        setError("");

        const responseData = await getPurchaseOrders({
          page: currentPage,
          pageSize,
          search: debouncedSearchText,
          status: statusFilter,
          sortBy,
          sortDirection,
          signal: controller.signal,
        });

        setPurchaseOrders(responseData.items);
        setTotalItems(responseData.total_items);
        setTotalPages(responseData.total_pages);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPurchaseOrders();

    return () => {
      controller.abort();
    };
  }, [
    currentPage,
    pageSize,
    debouncedSearchText,
    statusFilter,
    sortBy,
    sortDirection,
    refreshKey,
  ]);

  function changeStatusFilter(newStatus) {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  }

  function changePageSize(newPageSize) {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }

  function changeSorting(field) {
    setCurrentPage(1);

    if (field === sortBy) {
      setSortDirection((currentDirection) =>
        currentDirection === SORT_DIRECTION.ASCENDING
          ? SORT_DIRECTION.DESCENDING
          : SORT_DIRECTION.ASCENDING
      );
      return;
    }

    setSortBy(field);
    setSortDirection(SORT_DIRECTION.ASCENDING);
  }

  function clearSearch() {
    setSearchText("");
    setDebouncedSearchText("");
    setCurrentPage(1);
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

  function refreshPurchaseOrders() {
    setRefreshKey((currentValue) => currentValue + 1);
  }

  function resetPurchaseOrderFilters() {
    setSearchText("");
    setDebouncedSearchText("");
    setStatusFilter(ALL_STATUS_FILTER);
    setCurrentPage(1);
    setSortBy(DEFAULT_PURCHASE_ORDER_SORT.field);
    setSortDirection(DEFAULT_PURCHASE_ORDER_SORT.direction);
  }

  const isSearchWaiting = searchText !== debouncedSearchText;

  return {
    purchaseOrders,
    loading,
    error,

    searchText,
    statusFilter,
    isSearchWaiting,

    sortBy,
    sortDirection,

    currentPage,
    pageSize,
    totalItems,
    totalPages,

    setSearchText,
    setCurrentPage,

    changeStatusFilter,
    changePageSize,
    changeSorting,
    clearSearch,

    goToPreviousPage,
    goToNextPage,

    refreshPurchaseOrders,
    resetPurchaseOrderFilters,
  };
}
