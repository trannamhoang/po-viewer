import { useState } from "react";
import {
  createPurchaseOrder as createPurchaseOrderApi,
  updatePurchaseOrder as updatePurchaseOrderApi,
} from "../services/purchaseOrderApi";
import {
  buildPurchaseOrderRequestBody,
  createEmptyPurchaseOrder,
  createEmptyPurchaseOrderErrors,
  createEmptyPurchaseOrderItem,
  validatePurchaseOrder,
} from "../utils/purchaseOrderUtils";

export default function usePurchaseOrderForm({
  selectedPurchaseOrder,
  onCreated,
  onUpdated,
  onError,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const [createValidationErrors, setCreateValidationErrors] = useState(
    createEmptyPurchaseOrderErrors
  );
  const [updateValidationErrors, setUpdateValidationErrors] = useState(
    createEmptyPurchaseOrderErrors
  );

  const [newPO, setNewPO] = useState(createEmptyPurchaseOrder);
  const [editPO, setEditPO] = useState(createEmptyPurchaseOrder);

  function openCreateForm() {
    setCreateError("");
    setCreateValidationErrors(createEmptyPurchaseOrderErrors());
    setShowEditForm(false);
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (createLoading) {
      return;
    }

    setShowCreateForm(false);
    setCreateError("");
    setCreateValidationErrors(createEmptyPurchaseOrderErrors());
    setNewPO(createEmptyPurchaseOrder());
  }

  function toggleCreateForm() {
    if (showCreateForm) {
      closeCreateForm();
      return;
    }

    openCreateForm();
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
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });

    setUpdateError("");
    setUpdateValidationErrors(createEmptyPurchaseOrderErrors());
    setShowCreateForm(false);
    setShowEditForm(true);
  }

  function closeEditForm() {
    if (updateLoading) {
      return;
    }

    setShowEditForm(false);
    setUpdateError("");
    setUpdateValidationErrors(createEmptyPurchaseOrderErrors());
  }

  function clearFieldValidationError(setValidationErrors, fieldName) {
    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: "",
    }));
  }

  function handleNewPOChange(event) {
    const { name, value } = event.target;

    setNewPO((currentPO) => ({
      ...currentPO,
      [name]: value,
    }));

    clearFieldValidationError(setCreateValidationErrors, name);
  }

  function handleEditPOChange(event) {
    const { name, value } = event.target;

    setEditPO((currentPO) => ({
      ...currentPO,
      [name]: value,
    }));

    clearFieldValidationError(setUpdateValidationErrors, name);
  }

  function handleItemChange(
    setPurchaseOrder,
    setValidationErrors,
    index,
    event
  ) {
    const { name, value } = event.target;

    setPurchaseOrder((currentPO) => ({
      ...currentPO,
      items: currentPO.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [name]: value,
            }
          : item
      ),
    }));

    setValidationErrors((currentErrors) => {
      const currentItemErrors = Array.isArray(currentErrors.items)
        ? currentErrors.items
        : [];
      const nextItemErrors = Array.from(
        {
          length: Math.max(currentItemErrors.length, index + 1),
        },
        (_, itemIndex) => currentItemErrors[itemIndex] || {}
      );

      nextItemErrors[index] = {
        ...nextItemErrors[index],
        [name]: "",
      };

      return {
        ...currentErrors,
        items: nextItemErrors,
      };
    });
  }

  function handleNewItemChange(index, event) {
    handleItemChange(setNewPO, setCreateValidationErrors, index, event);
  }

  function handleEditItemChange(index, event) {
    handleItemChange(setEditPO, setUpdateValidationErrors, index, event);
  }

  function addItem(setPurchaseOrder) {
    setPurchaseOrder((currentPO) => ({
      ...currentPO,
      items: [...currentPO.items, createEmptyPurchaseOrderItem()],
    }));
  }

  function addNewItem() {
    addItem(setNewPO);
  }

  function addEditItem() {
    addItem(setEditPO);
  }

  function removeItem(setPurchaseOrder, setValidationErrors, index) {
    setPurchaseOrder((currentPO) => {
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

    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      items: currentErrors.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  }

  function removeNewItem(index) {
    removeItem(setNewPO, setCreateValidationErrors, index);
  }

  function removeEditItem(index) {
    removeItem(setEditPO, setUpdateValidationErrors, index);
  }

  async function createPurchaseOrder(event) {
    event.preventDefault();

    const validationResult = validatePurchaseOrder(newPO);
    setCreateValidationErrors(validationResult.errors);

    if (!validationResult.isValid) {
      setCreateError("Please correct the highlighted fields.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");

      const requestBody = buildPurchaseOrderRequestBody(newPO);
      const createdPurchaseOrder = await createPurchaseOrderApi(requestBody);

      setNewPO(createEmptyPurchaseOrder());
      setCreateValidationErrors(createEmptyPurchaseOrderErrors());
      setShowCreateForm(false);

      await onCreated?.(createdPurchaseOrder);
    } catch (requestError) {
      setCreateError(requestError.message);
      onError?.(requestError.message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function updatePurchaseOrder(event) {
    event.preventDefault();

    if (!editPO.id) {
      return;
    }

    const validationResult = validatePurchaseOrder(editPO);
    setUpdateValidationErrors(validationResult.errors);

    if (!validationResult.isValid) {
      setUpdateError("Please correct the highlighted fields.");
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError("");

      const requestBody = buildPurchaseOrderRequestBody(editPO);
      const updatedPurchaseOrder = await updatePurchaseOrderApi(
        editPO.id,
        requestBody
      );

      setUpdateValidationErrors(createEmptyPurchaseOrderErrors());
      setShowEditForm(false);

      await onUpdated?.(updatedPurchaseOrder);
    } catch (requestError) {
      setUpdateError(requestError.message);
      onError?.(requestError.message);
    } finally {
      setUpdateLoading(false);
    }
  }

  function closeAllForms() {
    setShowCreateForm(false);
    setShowEditForm(false);
    setCreateError("");
    setUpdateError("");
    setCreateValidationErrors(createEmptyPurchaseOrderErrors());
    setUpdateValidationErrors(createEmptyPurchaseOrderErrors());
  }

  return {
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
  };
}
