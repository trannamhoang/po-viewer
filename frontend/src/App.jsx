import { useState } from "react";
import PurchaseOrderDetails from "./components/PurchaseOrderDetails";
import PurchaseOrderFilters from "./components/PurchaseOrderFilters";
import PurchaseOrderForm from "./components/PurchaseOrderForm";
import PurchaseOrderList from "./components/PurchaseOrderList";
import usePurchaseOrderDetail from "./hooks/usePurchaseOrderDetail";
import usePurchaseOrderForm from "./hooks/usePurchaseOrderForm";
import usePurchaseOrders from "./hooks/usePurchaseOrders";
import { deletePurchaseOrder as deletePurchaseOrderApi } from "./services/purchaseOrderApi";
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

  const {
    selectedPurchaseOrder,
    detailLoading,
    detailError,
    selectPurchaseOrder,
    clearSelectedPurchaseOrder,
    updateSelectedPurchaseOrder,
  } = usePurchaseOrderDetail();

  async function handlePurchaseOrderCreated(createdPurchaseOrder) {
    updateSelectedPurchaseOrder(createdPurchaseOrder);
    resetPurchaseOrderFilters();
    refreshPurchaseOrders();
  }

  async function handlePurchaseOrderUpdated(updatedPurchaseOrder) {
    updateSelectedPurchaseOrder(updatedPurchaseOrder);
    refreshPurchaseOrders();
  }

  const {
    showCreateForm,
    showEditForm,

    createLoading,
    updateLoading,

    createError,
    updateError,

    newPO,
    editPO,

    toggleCreateForm,
    closeCreateForm,
    openEditForm,
    closeEditForm,
    closeAllForms,

    handleNewPOChange,
    handleEditPOChange,

    handleNewItemChange,
    handleEditItemChange,

    addNewItem,
    addEditItem,

    removeNewItem,
    removeEditItem,

    createPurchaseOrder,
    updatePurchaseOrder,
  } = usePurchaseOrderForm({
    selectedPurchaseOrder,
    onCreated: handlePurchaseOrderCreated,
    onUpdated: handlePurchaseOrderUpdated,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function handleSelectPurchaseOrder(purchaseOrder) {
    setDeleteError("");
    closeAllForms();
    selectPurchaseOrder(purchaseOrder);
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

      clearSelectedPurchaseOrder();
      closeAllForms();

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
        onClick={toggleCreateForm}
        disabled={createLoading || updateLoading}
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
          onCancel={closeCreateForm}
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
          onCancel={closeEditForm}
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
            onSelectPurchaseOrder={handleSelectPurchaseOrder}
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
