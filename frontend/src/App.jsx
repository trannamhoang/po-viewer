import { useEffect, useState } from "react";
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
      setShowEditForm(false);
      await loadPurchaseOrders();
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

      setCurrentPage(1);
      setSearchText("");
      setStatusFilter("All");

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

  async function loadPurchaseOrders() {
    try {
      setLoading(true);
      setError("");

      const queryParameters = new URLSearchParams({
        page: String(currentPage),
        page_size: String(pageSize),
      });

      if (searchText.trim()) {
        queryParameters.set("search", searchText.trim());
      }

      if (statusFilter !== "All") {
        queryParameters.set("status", statusFilter);
      }

      const response = await fetch(
        `${API_URL}/purchase-orders?${queryParameters.toString()}`
      );

      if (!response.ok) {
        throw new Error("Could not load purchase orders");
      }

      const responseData = await response.json();

      setPurchaseOrders(responseData.items);
      setTotalItems(responseData.total_items);
      setTotalPages(responseData.total_pages);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchaseOrders();
  }, [currentPage, pageSize, searchText, statusFilter]);

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
        await loadPurchaseOrders();
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

  if (loading) {
    return <main className="container">Loading purchase orders...</main>;
  }

  if (error) {
    return <main className="container">Error: {error}</main>;
  }

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
        <section>
          <h2>Purchase Orders</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Search by PO number or supplier..."
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setCurrentPage(1);
              }}
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {purchaseOrders.map((purchaseOrder) => (
                <tr
                  key={purchaseOrder.id}
                  onClick={() => selectPurchaseOrder(purchaseOrder)}
                >
                  <td>{purchaseOrder.po_number}</td>
                  <td>{purchaseOrder.supplier}</td>
                  <td>
                    <span
                      className={`status-badge status-${purchaseOrder.status.toLowerCase()}`}
                    >
                      {purchaseOrder.status}
                    </span>
                  </td>
                  <td>${purchaseOrder.total_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
              disabled={currentPage <= 1}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
              disabled={
                totalPages === 0 ||
                currentPage >= totalPages
              }
            >
              Next
            </button>
          </div>

          <p className="pagination-summary">
            {totalItems} purchase order
            {totalItems === 1 ? "" : "s"} found
          </p>
          {purchaseOrders.length === 0 && (
            <p className="empty-message">
              No purchase orders found.
            </p>
          )}
        </section>

        <section className="details">
          <h2>PO Details</h2>
          {deleteError && (
            <p className="error-message">{deleteError}</p>
          )}
          {detailLoading && <p>Loading purchase order details...</p>}

          {detailError && (
            <p className="error-message">{detailError}</p>
          )}

          {!detailLoading && !detailError && !selectedPurchaseOrder && (
            <p>Select a purchase order to view its details.</p>

          )}

          {!detailLoading && !detailError && selectedPurchaseOrder && (
            <>
              <div className="detail-actions">
                {selectedPurchaseOrder.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={openEditForm}
                  >
                    {selectedPurchaseOrder.status === "Open"
                      ? "Edit PO"
                      : "Complete PO"}
                  </button>
                )}

                <button
                  type="button"
                  className="delete-button"
                  onClick={deletePurchaseOrder}
                  disabled={
                    deleteLoading ||
                    selectedPurchaseOrder.status === "Completed"
                  }
                >
                  {deleteLoading ? "Deleting..." : "Delete PO"}
                </button>
              </div>
              {selectedPurchaseOrder.status === "Completed" && (
                <p className="status-message">
                  Completed purchase orders cannot be edited or deleted.
                </p>
              )}
              <p>
                <strong>PO Number:</strong>{" "}
                {selectedPurchaseOrder.po_number}
              </p>

              <p>
                <strong>Supplier:</strong>{" "}
                {selectedPurchaseOrder.supplier}
              </p>

              <p>
                <strong>Order date:</strong>{" "}
                {selectedPurchaseOrder.order_date}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`status-badge status-${selectedPurchaseOrder.status.toLowerCase()}`}
                >
                  {selectedPurchaseOrder.status}
                </span>
              </p>

              <h3>Items</h3>

              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedPurchaseOrder.items.map((item, index) => (
                    <tr key={`${item.product}-${index}`}>
                      <td>{item.product}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unit_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="total">
                Total: $
                {selectedPurchaseOrder.total_amount.toLocaleString()}
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
