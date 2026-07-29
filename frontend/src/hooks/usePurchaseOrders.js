import { useEffect, useState } from "react";
import { getPurchaseOrders } from "../services/purchaseOrderApi";

export default function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchText]);

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
    setStatusFilter("All");
    setCurrentPage(1);
  }

  const isSearchWaiting = searchText !== debouncedSearchText;

  return {
    purchaseOrders,
    loading,
    error,

    searchText,
    statusFilter,
    isSearchWaiting,

    currentPage,
    pageSize,
    totalItems,
    totalPages,

    setSearchText,
    setCurrentPage,

    changeStatusFilter,
    changePageSize,
    clearSearch,

    goToPreviousPage,
    goToNextPage,

    refreshPurchaseOrders,
    resetPurchaseOrderFilters,
  };
}
