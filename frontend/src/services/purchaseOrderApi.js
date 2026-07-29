const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function handleResponse(response, defaultErrorMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  let errorMessage = defaultErrorMessage;

  try {
    const responseData = await response.json();

    if (responseData.detail) {
      errorMessage = responseData.detail;
    }
  } catch {
    // Backend did not return a JSON response.
  }

  throw new Error(errorMessage);
}

export async function getPurchaseOrders({
  page,
  pageSize,
  search,
  status,
  signal,
}) {
  const queryParameters = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (search?.trim()) {
    queryParameters.set("search", search.trim());
  }

  if (status && status !== "All") {
    queryParameters.set("status", status);
  }

  const response = await fetch(
    `${API_URL}/purchase-orders?${queryParameters.toString()}`,
    { signal }
  );

  return handleResponse(response, "Could not load purchase orders");
}

export async function getPurchaseOrderById(
  purchaseOrderId,
  { signal } = {}
) {
  const response = await fetch(
    `${API_URL}/purchase-orders/${purchaseOrderId}`,
    { signal }
  );

  return handleResponse(
    response,
    "Could not load purchase order details"
  );
}

export async function createPurchaseOrder(purchaseOrder) {
  const response = await fetch(`${API_URL}/purchase-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(purchaseOrder),
  });

  return handleResponse(response, "Could not create purchase order");
}

export async function updatePurchaseOrder(
  purchaseOrderId,
  purchaseOrder
) {
  const response = await fetch(
    `${API_URL}/purchase-orders/${purchaseOrderId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseOrder),
    }
  );

  return handleResponse(response, "Could not update purchase order");
}

export async function deletePurchaseOrder(purchaseOrderId) {
  const response = await fetch(
    `${API_URL}/purchase-orders/${purchaseOrderId}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response, "Could not delete purchase order");
}
