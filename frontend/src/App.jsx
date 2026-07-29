import { useEffect, useState } from "react";
import PurchaseOrderDetails from "./components/PurchaseOrderDetails";
import PurchaseOrderFilters from "./components/PurchaseOrderFilters";
import PurchaseOrderList from "./components/PurchaseOrderList";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] =
    useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newPO, setNewPO] = useState({
    po_number: "",
    supplier: "",
    order_date: "",
    status: "Open",
    items: [
      {
        product: "",
        quantity: 1,
        unit_price: 0,
      },
    ],
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [editPO, setEditPO] = useState({
    id: null,
    po_number: "",
    supplier: "",
    order_date: "",
    status: "Open",
    items: [
      {
        product: "",
        quantity: 1,
        unit_price: 0,
      },
    ],
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

  function handleNewPOChange(event) {
    const { name, value } = event.target;

    setNewPO((currentPO) => ({
      ...currentPO,
      [name]: value,
    }));
  }

  function handleEditPOChange(event) {
    const { name, value } = event.target;

    setEditPO((currentPO) => ({
      ...currentPO,
      [name]: value,
    }));
  }

  async function updatePurchaseOrder(event) {
    event.preventDefault();

    try {
      setUpdateLoading(true);
      setUpdateError("");

      const requestBody = {
        po_number: editPO.po_number,
        supplier: editPO.supplier,
        order_date: editPO.order_date,
        status: editPO.status,
        items: editPO.items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      const response = await fetch(
        `${API_URL}/purchase-orders/${editPO.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
          "Could not update purchase order"
        );
      }

      setSelectedPurchaseOrder(responseData);
      setRefreshKey((currentValue) => currentValue + 1);
      setShowEditForm(false);
    } catch (error) {
      setUpdateError(error.message);
    } finally {
      setUpdateLoading(false);
    }
  }

  async function createPurchaseOrder(event) {
    event.preventDefault();

    try {
      setCreateLoading(true);
      setCreateError("");

      const requestBody = {
        po_number: newPO.po_number,
        supplier: newPO.supplier,
        order_date: newPO.order_date,
        status: newPO.status,
        items: newPO.items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      const response = await fetch(`${API_URL}/purchase-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail || "Could not create purchase order"
        );
      }

      setSelectedPurchaseOrder(responseData);
      setRefreshKey((currentValue) => currentValue + 1);

      setCurrentPage(1);
      setSearchText("");
      setStatusFilter("All");
      setDebouncedSearchText("");

      setNewPO({
        po_number: "",
        supplier: "",
        order_date: "",
        status: "Open",
        items: [
          {
            product: "",
            quantity: 1,
            unit_price: 0,
          },
        ],
      });

      setShowCreateForm(false);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setCreateLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadPurchaseOrders() {
      try {
        setLoading(true);
        setError("");

        const queryParameters = new URLSearchParams({
          page: String(currentPage),
          page_size: String(pageSize),
        });

        if (debouncedSearchText.trim()) {
          queryParameters.set(
            "search",
            debouncedSearchText.trim()
          );
        }

        if (statusFilter !== "All") {
          queryParameters.set("status", statusFilter);
        }

        const response = await fetch(
          `${API_URL}/purchase-orders?${queryParameters.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Could not load purchase orders"
          );
        }

        const responseData = await response.json();

        setPurchaseOrders(responseData.items);
        setTotalItems(responseData.total_items);
        setTotalPages(responseData.total_pages);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message);
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
    refreshKey,
    statusFilter,
  ]);

  async function selectPurchaseOrder(purchaseOrder) {
    try {
      setDetailLoading(true);
      setDetailError("");

      const response = await fetch(
        `${API_URL}/purchase-orders/${purchaseOrder.id}`
      );
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail || "Could not load purchase order details"
        );
      }

      setSelectedPurchaseOrder(responseData);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function openEditForm() {
    if (!selectedPurchaseOrder) {
      return;
    }

    setEditPO({
      id: selectedPurchaseOrder.id,
      po_number: selectedPurchaseOrder.po_number,
      supplier: selectedPurchaseOrder.supplier,
      order_date: selectedPurchaseOrder.order_date,
      status: selectedPurchaseOrder.status,
      items: selectedPurchaseOrder.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });

    setUpdateError("");
    setShowCreateForm(false);
    setShowEditForm(true);
  }

  function handleEditItemChange(index, event) {
    const { name, value } = event.target;

    setEditPO((currentPO) => {
      const updatedItems = [...currentPO.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
      };

      return {
        ...currentPO,
        items: updatedItems,
      };
    });
  }

  function addEditItem() {
    setEditPO((currentPO) => ({
      ...currentPO,
      items: [
        ...currentPO.items,
        {
          product: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    }));
  }

  function removeEditItem(index) {
    setEditPO((currentPO) => {
      if (currentPO.items.length === 1) {
        return currentPO;
      }

      return {
        ...currentPO,
        items: currentPO.items.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      };
    });
  }

  async function deletePurchaseOrder() {
    if (!selectedPurchaseOrder) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPurchaseOrder.po_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");

      const response = await fetch(
        `${API_URL}/purchase-orders/${selectedPurchaseOrder.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let errorMessage = "Could not delete purchase order";

        try {
          const responseData = await response.json();
          errorMessage = responseData.detail || errorMessage;
        } catch {
          // Response không có JSON body.
        }

        throw new Error(errorMessage);
      }

      setSelectedPurchaseOrder(null);
      setShowEditForm(false);

      const shouldGoToPreviousPage =
        purchaseOrders.length === 1 &&
        currentPage > 1;

      if (shouldGoToPreviousPage) {
        setCurrentPage((page) => page - 1);
      } else {
        setRefreshKey((currentValue) => currentValue + 1);
      }
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleNewItemChange(index, event) {
    const { name, value } = event.target;

    setNewPO((currentPO) => {
      const updatedItems = [...currentPO.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
      };

      return {
        ...currentPO,
        items: updatedItems,
      };
    });
  }

  function addNewItem() {
    setNewPO((currentPO) => ({
      ...currentPO,
      items: [
        ...currentPO.items,
        {
          product: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    }));
  }

  function removeNewItem(index) {
    setNewPO((currentPO) => {
      if (currentPO.items.length === 1) {
        return currentPO;
      }

      return {
        ...currentPO,
        items: currentPO.items.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      };
    });
  }

  const newPOTotal = newPO.items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) *
      Number(item.unit_price || 0),
    0
  );

  const editPOTotal = editPO.items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) *
      Number(item.unit_price || 0),
    0
  );

  function getAllowedStatuses(currentStatus) {
    if (currentStatus === "Open") {
      return ["Open", "Approved"];
    }

    if (currentStatus === "Approved") {
      return ["Approved", "Completed"];
    }

    return ["Completed"];
  }

  const canEditPurchaseOrderContent =
    selectedPurchaseOrder?.status === "Open";

  const isSearchWaiting =
    searchText !== debouncedSearchText;

  return (
    <main className="container">
      <h1>Purchase Order App</h1>
      <button
        type="button"
        onClick={() => {
          setShowCreateForm((currentValue) => !currentValue);
          setShowEditForm(false);
        }}
      >
        {showCreateForm ? "Cancel" : "Create PO"}
      </button>
      {showCreateForm && (
        <section className="create-form-section">
          <h2>Create Purchase Order</h2>

          {createError && (
            <p className="error-message">{createError}</p>
          )}

          <form onSubmit={createPurchaseOrder}>
            <div className="form-grid">
              <label>
                PO Number
                <input
                  type="text"
                  name="po_number"
                  value={newPO.po_number}
                  onChange={handleNewPOChange}
                  required
                />
              </label>

              <label>
                Supplier
                <input
                  type="text"
                  name="supplier"
                  value={newPO.supplier}
                  onChange={handleNewPOChange}
                  required
                />
              </label>

              <label>
                Order Date
                <input
                  type="date"
                  name="order_date"
                  value={newPO.order_date}
                  onChange={handleNewPOChange}
                  required
                />
              </label>

              <label>
                Status
                <input
                  type="text"
                  value="Open"
                  disabled
                />
              </label>

            </div>
            <div className="items-section">
              <div className="items-header">
                <h3>Items</h3>

                <button
                  type="button"
                  onClick={addNewItem}
                >
                  Add Item
                </button>
              </div>

              {newPO.items.map((item, index) => (
                <div className="item-row" key={item.id || index}>
                  <label>
                    Product
                    <input
                      type="text"
                      name="product"
                      value={item.product}
                      onChange={(event) =>
                        handleNewItemChange(index, event)
                      }
                      required
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleNewItemChange(index, event)
                      }
                      required
                    />
                  </label>

                  <label>
                    Unit Price
                    <input
                      type="number"
                      name="unit_price"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) =>
                        handleNewItemChange(index, event)
                      }
                      required
                    />
                  </label>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() => removeNewItem(index)}
                    disabled={newPO.items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <p className="form-total">
              Estimated total: ${newPOTotal.toLocaleString()}
            </p>
            <button type="submit" disabled={createLoading}>
              {createLoading ? "Creating..." : "Save Purchase Order"}
            </button>
          </form>
        </section>
      )}
      {showEditForm && (
        <section className="create-form-section">
          <h2>Edit Purchase Order</h2>

          {updateError && (
            <p className="error-message">{updateError}</p>
          )}

          <form onSubmit={updatePurchaseOrder}>
            <div className="form-grid">
              <label>
                PO Number
                <input
                  type="text"
                  name="po_number"
                  value={editPO.po_number}
                  onChange={handleEditPOChange}
                  disabled={!canEditPurchaseOrderContent}
                  required
                />
              </label>

              <label>
                Supplier
                <input
                  type="text"
                  name="supplier"
                  value={editPO.supplier}
                  onChange={handleEditPOChange}
                  disabled={!canEditPurchaseOrderContent}
                  required
                />
              </label>

              <label>
                Order Date
                <input
                  type="date"
                  name="order_date"
                  value={editPO.order_date}
                  onChange={handleEditPOChange}
                  disabled={!canEditPurchaseOrderContent}
                  required
                />
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={editPO.status}
                  onChange={handleEditPOChange}
                >
                  {getAllowedStatuses(
                    selectedPurchaseOrder.status
                  ).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>


            </div>

            <div className="items-section">
              <div className="items-header">
                <h3>Items</h3>

                <button
                  type="button"
                  onClick={addEditItem}
                  disabled={!canEditPurchaseOrderContent}
                >
                  Add Item
                </button>
              </div>

              {editPO.items.map((item, index) => (
                <div className="item-row" key={item.id || index}>
                  <label>
                    Product
                    <input
                      type="text"
                      name="product"
                      value={item.product}
                      onChange={(event) =>
                        handleEditItemChange(index, event)
                      }
                      disabled={!canEditPurchaseOrderContent}
                      required
                    />
                  </label>

                  <label>
                    Quantity
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleEditItemChange(index, event)
                      }
                      disabled={!canEditPurchaseOrderContent}
                      required
                    />
                  </label>

                  <label>
                    Unit Price
                    <input
                      type="number"
                      name="unit_price"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) =>
                        handleEditItemChange(index, event)
                      }
                      disabled={!canEditPurchaseOrderContent}
                      required
                    />
                  </label>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() => removeEditItem(index)}
                    disabled={
                      !canEditPurchaseOrderContent ||
                      editPO.items.length === 1
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <p className="form-total">
              Estimated total: ${editPOTotal.toLocaleString()}
            </p>
            <div className="form-actions">
              <button
                type="submit"
                disabled={updateLoading}
              >
                {updateLoading
                  ? "Updating..."
                  : "Update Purchase Order"}
              </button>

              <button
                type="button"
                onClick={() => setShowEditForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="layout">
        <section aria-busy={loading}>
          <h2>Purchase Orders</h2>

          <PurchaseOrderFilters
            searchText={searchText}
            isSearchWaiting={isSearchWaiting}
            statusFilter={statusFilter}
            pageSize={pageSize}
            onSearchChange={setSearchText}
            onClearSearch={() => setSearchText("")}
            onStatusChange={(newStatus) => {
              setStatusFilter(newStatus);
              setCurrentPage(1);
            }}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setCurrentPage(1);
            }}
          />

          <PurchaseOrderList
            purchaseOrders={purchaseOrders}
            loading={loading}
            error={error}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            selectedPurchaseOrderId={
              selectedPurchaseOrder?.id ?? null
            }
            onSelectPurchaseOrder={selectPurchaseOrder}
            onPreviousPage={() =>
              setCurrentPage((page) => page - 1)
            }
            onNextPage={() =>
              setCurrentPage((page) => page + 1)
            }
          />
        </section>

        <PurchaseOrderDetails
          purchaseOrder={selectedPurchaseOrder}
          detailLoading={detailLoading}
          detailError={detailError}
          deleteLoading={deleteLoading}
          deleteError={deleteError}
          onEdit={openEditForm}
          onDelete={deletePurchaseOrder}
        />
      </div>
    </main>
  );
}

export default App;
