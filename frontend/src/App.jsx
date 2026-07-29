import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
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
    product: "",
    quantity: 1,
    unit_price: 0,
  });

  function handleNewPOChange(event) {
    const { name, value } = event.target;

    setNewPO((currentPO) => ({
      ...currentPO,
      [name]: value,
    }));
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
        items: [
          {
            product: newPO.product,
            quantity: Number(newPO.quantity),
            unit_price: Number(newPO.unit_price),
          },
        ],
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

      setSelectedPO(responseData);

      setNewPO({
        po_number: "",
        supplier: "",
        order_date: "",
        status: "Open",
        product: "",
        quantity: 1,
        unit_price: 0,
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

  function selectPurchaseOrder(purchaseOrder) {
    setSelectedPurchaseOrder(purchaseOrder);
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
        onClick={() => setShowCreateForm(!showCreateForm)}
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

              <label>
                Product
                <input
                  type="text"
                  name="product"
                  value={newPO.product}
                  onChange={handleNewPOChange}
                  required
                />
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={newPO.quantity}
                  onChange={handleNewPOChange}
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
                  value={newPO.unit_price}
                  onChange={handleNewPOChange}
                  required
                />
              </label>
            </div>

            <button type="submit" disabled={createLoading}>
              {createLoading ? "Creating..." : "Save Purchase Order"}
            </button>
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

          {!selectedPurchaseOrder && (
            <p>Select a purchase order to view its details.</p>
          )}

          {selectedPurchaseOrder && (
            <>
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