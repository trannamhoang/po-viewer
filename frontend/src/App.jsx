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

      setPurchaseOrders((currentPurchaseOrders) =>
        currentPurchaseOrders.map((purchaseOrder) =>
          purchaseOrder.id === responseData.id
            ? responseData
            : purchaseOrder
        )
      );

      setSelectedPurchaseOrder(responseData);
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

      setPurchaseOrders((currentPurchaseOrders) => [
        ...currentPurchaseOrders,
        responseData,
      ]);

      setSelectedPurchaseOrder(responseData);

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
    fetch(`${API_URL}/purchase-orders`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load purchase orders");
        }

        return response.json();
      })
      .then((data) => {
        setPurchaseOrders(data);
        setLoading(false);
      })
      .catch((fetchError) => {
        setError(fetchError.message);
        setLoading(false);
      });
  }, []);

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

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const keyword = searchText.toLowerCase();

    const matchesSearch =
      po.po_number.toLowerCase().includes(keyword) ||
      po.supplier.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "All" || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

      setPurchaseOrders((currentPurchaseOrders) =>
        currentPurchaseOrders.filter(
          (purchaseOrder) =>
            purchaseOrder.id !== selectedPurchaseOrder.id
        )
      );

      setSelectedPurchaseOrder(null);
      setShowEditForm(false);
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
                <select
                  name="status"
                  value={newPO.status}
                  onChange={handleNewPOChange}
                >
                  <option value="Open">Open</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                </select>
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
                <div className="item-row" key={index}>
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
                  <option value="Open">Open</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
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
                <div className="item-row" key={index}>
                  <label>
                    Product
                    <input
                      type="text"
                      name="product"
                      value={item.product}
                      onChange={(event) =>
                        handleEditItemChange(index, event)
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
                        handleEditItemChange(index, event)
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
                        handleEditItemChange(index, event)
                      }
                      required
                    />
                  </label>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() => removeEditItem(index)}
                    disabled={editPO.items.length === 1}
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
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
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
              {filteredPurchaseOrders.map((purchaseOrder) => (
                <tr
                  key={purchaseOrder.id}
                  onClick={() => selectPurchaseOrder(purchaseOrder)}
                >
                  <td>{purchaseOrder.po_number}</td>
                  <td>{purchaseOrder.supplier}</td>
                  <td>{purchaseOrder.status}</td>
                  <td>${purchaseOrder.total_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPurchaseOrders.length === 0 && (
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
              <button
                type="button"
                onClick={openEditForm}
                disabled={deleteLoading}
              >
                Edit PO
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={deletePurchaseOrder}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete PO"}
              </button>
            </div>
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
                {selectedPurchaseOrder.status}
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
