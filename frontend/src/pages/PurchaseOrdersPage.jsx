import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ConfirmDialog from "../components/ConfirmDialog";
import PurchaseOrderDetails from "../components/PurchaseOrderDetails";
import PurchaseOrderFilters from "../components/PurchaseOrderFilters";
import PurchaseOrderForm from "../components/PurchaseOrderForm";
import PurchaseOrderList from "../components/PurchaseOrderList";
import Toast from "../components/Toast";
import { PURCHASE_ORDER_STATUS } from "../constants/purchaseOrderConstants";
import usePurchaseOrderDetail from "../hooks/usePurchaseOrderDetail";
import usePurchaseOrderForm from "../hooks/usePurchaseOrderForm";
import usePurchaseOrders from "../hooks/usePurchaseOrders";
import useToast from "../hooks/useToast";
import { deletePurchaseOrder as deletePurchaseOrderApi } from "../services/purchaseOrderApi";
import { getAllowedPurchaseOrderStatuses } from "../utils/purchaseOrderUtils";
import "../App.css";

function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { purchaseOrderId } = useParams();

  const { toast, showSuccessToast, showErrorToast, hideToast } = useToast();

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
    selectPurchaseOrderById,
    clearSelectedPurchaseOrder,
    updateSelectedPurchaseOrder,
  } = usePurchaseOrderDetail();

  async function handlePurchaseOrderCreated(createdPurchaseOrder) {
    updateSelectedPurchaseOrder(createdPurchaseOrder);
    resetPurchaseOrderFilters();
    refreshPurchaseOrders();
    navigate(`/purchase-orders/${createdPurchaseOrder.id}`);

    showSuccessToast(
      `Purchase order ${createdPurchaseOrder.po_number} was created successfully.`
    );
  }

  async function handlePurchaseOrderUpdated(updatedPurchaseOrder) {
    updateSelectedPurchaseOrder(updatedPurchaseOrder);
    refreshPurchaseOrders();

    const message =
      updatedPurchaseOrder.status === PURCHASE_ORDER_STATUS.COMPLETED
        ? `Purchase order ${updatedPurchaseOrder.po_number} was completed successfully.`
        : `Purchase order ${updatedPurchaseOrder.po_number} was updated successfully.`;

    showSuccessToast(message);
  }

  const {
    showCreateForm,
    showEditForm,
    createLoading,
    updateLoading,
    createError,
    updateError,
    createValidationErrors,
    updateValidationErrors,
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
    onError: showErrorToast,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  function handleSelectPurchaseOrder(purchaseOrder) {
    setDeleteError("");
    setShowDeleteConfirmation(false);
    closeAllForms();
    navigate(`/purchase-orders/${purchaseOrder.id}`);
  }

  function requestDeletePurchaseOrder() {
    if (!selectedPurchaseOrder) {
      return;
    }

    setDeleteError("");
    setShowDeleteConfirmation(true);
  }

  function cancelDeletePurchaseOrder() {
    if (deleteLoading) {
      return;
    }

    setShowDeleteConfirmation(false);
  }

  async function confirmDeletePurchaseOrder() {
    if (!selectedPurchaseOrder || deleteLoading) {
      return;
    }

    const deletedPurchaseOrderId = selectedPurchaseOrder.id;
    const deletedPONumber = selectedPurchaseOrder.po_number;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await deletePurchaseOrderApi(deletedPurchaseOrderId);

      setShowDeleteConfirmation(false);
      clearSelectedPurchaseOrder();
      closeAllForms();
      navigate("/purchase-orders", { replace: true });

      showSuccessToast(
        `Purchase order ${deletedPONumber} was deleted successfully.`
      );

      const shouldGoToPreviousPage =
        purchaseOrders.length === 1 && currentPage > 1;

      if (shouldGoToPreviousPage) {
        setCurrentPage((page) => Math.max(1, page - 1));
      } else {
        refreshPurchaseOrders();
      }
    } catch (requestError) {
      setDeleteError(requestError.message);
      showErrorToast(requestError.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const canEditPurchaseOrderContent =
    selectedPurchaseOrder?.status === PURCHASE_ORDER_STATUS.OPEN;

  useEffect(() => {
    if (!purchaseOrderId) {
      clearSelectedPurchaseOrder();
      return;
    }

    if (String(selectedPurchaseOrder?.id) === String(purchaseOrderId)) {
      return;
    }

    selectPurchaseOrderById(purchaseOrderId);
  }, [
    purchaseOrderId,
    selectedPurchaseOrder?.id,
    selectPurchaseOrderById,
    clearSelectedPurchaseOrder,
  ]);

  function closePurchaseOrderDetails() {
    setDeleteError("");
    setShowDeleteConfirmation(false);
    closeAllForms();
    clearSelectedPurchaseOrder();
    navigate("/purchase-orders");
  }

  return (
    <section className="purchase-orders-page">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      <ConfirmDialog
        open={showDeleteConfirmation}
        title="Delete purchase order"
        message={
          selectedPurchaseOrder
            ? `Are you sure you want to delete ${selectedPurchaseOrder.po_number}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        onConfirm={confirmDeletePurchaseOrder}
        onCancel={cancelDeletePurchaseOrder}
      />

      <div className="page-header">
        <div>
          <h2>Purchase Orders</h2>
          <p>Create, review and manage purchase orders.</p>
        </div>

        <button
          type="button"
          onClick={toggleCreateForm}
          disabled={createLoading || updateLoading}
        >
          {showCreateForm ? "Cancel" : "Create PO"}
        </button>
      </div>

      {showCreateForm && (
        <PurchaseOrderForm
          title="Create Purchase Order"
          purchaseOrder={newPO}
          loading={createLoading}
          error={createError}
          validationErrors={createValidationErrors}
          submitLabel="Save Purchase Order"
          loadingLabel="Creating..."
          allowedStatuses={[PURCHASE_ORDER_STATUS.OPEN]}
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
            selectedPurchaseOrder?.status === PURCHASE_ORDER_STATUS.APPROVED
              ? "Complete Purchase Order"
              : "Edit Purchase Order"
          }
          purchaseOrder={editPO}
          loading={updateLoading}
          error={updateError}
          validationErrors={updateValidationErrors}
          submitLabel={
            selectedPurchaseOrder?.status === PURCHASE_ORDER_STATUS.APPROVED
              ? "Complete Purchase Order"
              : "Update Purchase Order"
          }
          loadingLabel="Updating..."
          contentDisabled={!canEditPurchaseOrderContent}
          allowedStatuses={getAllowedPurchaseOrderStatuses(
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
            selectedPurchaseOrderId={selectedPurchaseOrder?.id ?? null}
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
          onDelete={requestDeletePurchaseOrder}
          onClose={closePurchaseOrderDetails}
        />
      </div>
    </section>
  );
}

export default PurchaseOrdersPage;
