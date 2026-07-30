import { useCallback, useEffect, useState } from "react";
import { getPurchaseOrderSummary } from "../services/purchaseOrderApi";

const EMPTY_SUMMARY = {
  total: 0,
  open: 0,
  approved: 0,
  completed: 0,
};

export default function usePurchaseOrderSummary() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshSummary = useCallback(() => {
    setRefreshKey((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      try {
        setLoading(true);
        setError("");

        const responseData = await getPurchaseOrderSummary({
          signal: controller.signal,
        });

        setSummary(responseData);
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

    loadSummary();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  return {
    summary,
    loading,
    error,
    refreshSummary,
  };
}
