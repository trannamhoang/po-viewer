import { useCallback, useRef, useState } from "react";
import { getPurchaseOrderById } from "../services/purchaseOrderApi";

export default function usePurchaseOrderDetail({ onError } = {}) {
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const requestControllerRef = useRef(null);

  const selectPurchaseOrderById = useCallback(
    async (purchaseOrderId) => {
      if (!purchaseOrderId) {
        return;
      }

      requestControllerRef.current?.abort();

      const controller = new AbortController();
      requestControllerRef.current = controller;

      try {
        setDetailLoading(true);
        setDetailError("");
        setSelectedPurchaseOrder(null);

        const responseData = await getPurchaseOrderById(purchaseOrderId, {
          signal: controller.signal,
        });

        setSelectedPurchaseOrder(responseData);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setDetailError(requestError.message);
          onError?.(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      }
    },
    [onError]
  );

  const selectPurchaseOrder = useCallback(
    async (purchaseOrder) => {
      if (!purchaseOrder?.id) {
        return;
      }

      await selectPurchaseOrderById(purchaseOrder.id);
    },
    [selectPurchaseOrderById]
  );

  const clearSelectedPurchaseOrder = useCallback(() => {
    requestControllerRef.current?.abort();

    setSelectedPurchaseOrder(null);
    setDetailError("");
    setDetailLoading(false);
  }, []);

  const updateSelectedPurchaseOrder = useCallback((purchaseOrder) => {
    requestControllerRef.current?.abort();

    setSelectedPurchaseOrder(purchaseOrder);
    setDetailError("");
    setDetailLoading(false);
  }, []);

  return {
    selectedPurchaseOrder,
    detailLoading,
    detailError,

    selectPurchaseOrder,
    selectPurchaseOrderById,
    clearSelectedPurchaseOrder,
    updateSelectedPurchaseOrder,
  };
}
