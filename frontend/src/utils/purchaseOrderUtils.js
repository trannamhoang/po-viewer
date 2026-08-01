import {
  PURCHASE_ORDER_STATUS,
  STATUS_TRANSITIONS,
} from "../constants/purchaseOrderConstants";

export function createEmptyPurchaseOrderItem() {
  return {
    product: "",
    quantity: 1,
    unit_price: 0,
  };
}

export function createEmptyPurchaseOrder() {
  return {
    po_number: "",
    supplier: "",
    order_date: "",
    status: PURCHASE_ORDER_STATUS.OPEN,
    items: [createEmptyPurchaseOrderItem()],
  };
}

export function createEmptyPurchaseOrderErrors() {
  return {
    po_number: "",
    supplier: "",
    order_date: "",
    status: "",
    items: [],
  };
}

export function getAllowedPurchaseOrderStatuses(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || [PURCHASE_ORDER_STATUS.OPEN];
}

export function buildPurchaseOrderRequestBody(purchaseOrder) {
  return {
    po_number: purchaseOrder.po_number.trim(),
    supplier: purchaseOrder.supplier.trim(),
    order_date: purchaseOrder.order_date,
    status: purchaseOrder.status,
    items: purchaseOrder.items.map((item) => ({
      product: item.product.trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  };
}

export function calculatePurchaseOrderTotal(items) {
  return items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );
}

export function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericValue);
}

export function validatePurchaseOrder(purchaseOrder) {
  const errors = createEmptyPurchaseOrderErrors();

  if (!purchaseOrder.po_number?.trim()) {
    errors.po_number = "PO number is required.";
  }

  if (!purchaseOrder.supplier?.trim()) {
    errors.supplier = "Supplier is required.";
  }

  if (!purchaseOrder.order_date) {
    errors.order_date = "Order date is required.";
  }

  if (!purchaseOrder.status) {
    errors.status = "Status is required.";
  }

  const items = Array.isArray(purchaseOrder.items)
    ? purchaseOrder.items
    : [];

  if (items.length === 0) {
    errors.items.push({
      general: "At least one purchase order item is required.",
    });
  } else {
    errors.items = items.map((item) => {
      const itemErrors = {
        product: "",
        quantity: "",
        unit_price: "",
      };

      if (!item.product?.trim()) {
        itemErrors.product = "Product is required.";
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        itemErrors.quantity =
          "Quantity must be a whole number greater than 0.";
      }

      const unitPrice = Number(item.unit_price);

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        itemErrors.unit_price = "Unit price must be greater than 0.";
      }

      return itemErrors;
    });
  }

  const hasFieldErrors = Boolean(
    errors.po_number ||
      errors.supplier ||
      errors.order_date ||
      errors.status
  );

  const hasItemErrors = errors.items.some(
    (itemError) =>
      itemError.general ||
      itemError.product ||
      itemError.quantity ||
      itemError.unit_price
  );

  return {
    errors,
    isValid: !hasFieldErrors && !hasItemErrors,
  };
}
