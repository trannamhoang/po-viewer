import { useRef, useState } from "react";
import { getPurchaseOrderById } from "../services/purchaseOrderApi";

export default function usePurchaseOrderDetail() {
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const requestControllerRef = useRef(null);

  async function selectPurchaseOrder(purchaseOrder) {
    if (!purchaseOrder?.id) {
      return;
    }

    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      setDetailLoading(true);
      setDetailError("");

      const responseData = await getPurchaseOrderById(purchaseOrder.id, {
        signal: controller.signal,
      });

      setSelectedPurchaseOrder(responseData);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setDetailError(requestError.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoading(false);
      }
    }
  }

  function clearSelectedPurchaseOrder() {
    requestControllerRef.current?.abort();

    setSelectedPurchaseOrder(null);
    setDetailError("");
    setDetailLoading(false);
  }

  function updateSelectedPurchaseOrder(purchaseOrder) {
    setSelectedPurchaseOrder(purchaseOrder);
    setDetailError("");
  }

  return {
    selectedPurchaseOrder,
    detailLoading,
    detailError,

    selectPurchaseOrder,
    clearSelectedPurchaseOrder,
    updateSelectedPurchaseOrder,
  };
}
