import { useState } from "react";
import PurchaseOrderDetails from "./components/PurchaseOrderDetails";
import PurchaseOrderFilters from "./components/PurchaseOrderFilters";
import PurchaseOrderForm from "./components/PurchaseOrderForm";
import PurchaseOrderList from "./components/PurchaseOrderList";
import usePurchaseOrders from "./hooks/usePurchaseOrders";
import {
  createPurchaseOrder as createPurchaseOrderApi,
  deletePurchaseOrder as deletePurchaseOrderApi,
  getPurchaseOrderById,
  updatePurchaseOrder as updatePurchaseOrderApi,
} from "./services/purchaseOrderApi";
import "./App.css";

function App() {
  const {
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
  } = usePurchaseOrders();

  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
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

      const responseData = await updatePurchaseOrderApi(
        editPO.id,
        requestBody
      );

      setSelectedPurchaseOrder(responseData);
      refreshPurchaseOrders();
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

      const responseData = await createPurchaseOrderApi(requestBody);

      setSelectedPurchaseOrder(responseData);
      resetPurchaseOrderFilters();
      refreshPurchaseOrders();

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

  async function selectPurchaseOrder(purchaseOrder) {
    try {
      setDetailLoading(true);
      setDetailError("");
      setDeleteError("");

      const responseData = await getPurchaseOrderById(purchaseOrder.id);

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

      await deletePurchaseOrderApi(selectedPurchaseOrder.id);

      setSelectedPurchaseOrder(null);
      setShowEditForm(false);

      const shouldGoToPreviousPage =
        purchaseOrders.length === 1 &&
        currentPage > 1;

      if (shouldGoToPreviousPage) {
        setCurrentPage((page) => page - 1);
      } else {
        refreshPurchaseOrders();
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

  function getAllowedStatuses(currentStatus) {
    if (currentStatus === "Open") {
      return ["Open", "Approved"];
    }

    if (currentStatus === "Approved") {
      return ["Approved", "Completed"];
    }

    if (currentStatus === "Completed") {
      return ["Completed"];
    }

    return ["Open"];
  }

  const canEditPurchaseOrderContent =
    selectedPurchaseOrder?.status === "Open";

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
        <PurchaseOrderForm
          title="Create Purchase Order"
          purchaseOrder={newPO}
          loading={createLoading}
          error={createError}
          submitLabel="Save Purchase Order"
          loadingLabel="Creating..."
          allowedStatuses={["Open"]}
          onFieldChange={handleNewPOChange}
          onItemChange={handleNewItemChange}
          onAddItem={addNewItem}
          onRemoveItem={removeNewItem}
          onSubmit={createPurchaseOrder}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
      {showEditForm && (
        <PurchaseOrderForm
          title={
            selectedPurchaseOrder?.status === "Approved"
              ? "Complete Purchase Order"
              : "Edit Purchase Order"
          }
          purchaseOrder={editPO}
          loading={updateLoading}
          error={updateError}
          submitLabel={
            selectedPurchaseOrder?.status === "Approved"
              ? "Complete Purchase Order"
              : "Update Purchase Order"
          }
          loadingLabel="Updating..."
          contentDisabled={!canEditPurchaseOrderContent}
          allowedStatuses={getAllowedStatuses(
            selectedPurchaseOrder?.status
          )}
          onFieldChange={handleEditPOChange}
          onItemChange={handleEditItemChange}
          onAddItem={addEditItem}
          onRemoveItem={removeEditItem}
          onSubmit={updatePurchaseOrder}
          onCancel={() => setShowEditForm(false)}
        />
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
            onClearSearch={clearSearch}
            onStatusChange={changeStatusFilter}
            onPageSizeChange={changePageSize}
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
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
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
