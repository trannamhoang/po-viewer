import { useState } from "react";
import {
  createPurchaseOrder as createPurchaseOrderApi,
  updatePurchaseOrder as updatePurchaseOrderApi,
} from "../services/purchaseOrderApi";

const EMPTY_ITEM = {
  product: "",
  quantity: 1,
  unit_price: 0,
};

const EMPTY_PURCHASE_ORDER = {
  po_number: "",
  supplier: "",
  order_date: "",
  status: "Open",
  items: [{ ...EMPTY_ITEM }],
};

function createEmptyPurchaseOrder() {
  return {
    ...EMPTY_PURCHASE_ORDER,
    items: [{ ...EMPTY_ITEM }],
  };
}

export default function usePurchaseOrderForm({
  selectedPurchaseOrder,
  onCreated,
  onUpdated,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [createError, setCreateError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const [newPO, setNewPO] = useState(createEmptyPurchaseOrder);
  const [editPO, setEditPO] = useState(createEmptyPurchaseOrder);

  function openCreateForm() {
    setCreateError("");
    setShowEditForm(false);
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (createLoading) {
      return;
    }

    setShowCreateForm(false);
    setCreateError("");
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
    setShowCreateForm(false);
    setShowEditForm(true);
  }

  function closeEditForm() {
    if (updateLoading) {
      return;
    }

    setShowEditForm(false);
    setUpdateError("");
  }

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

  function handleItemChange(setPurchaseOrder, index, event) {
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
  }

  function handleNewItemChange(index, event) {
    handleItemChange(setNewPO, index, event);
  }

  function handleEditItemChange(index, event) {
    handleItemChange(setEditPO, index, event);
  }

  function addItem(setPurchaseOrder) {
    setPurchaseOrder((currentPO) => ({
      ...currentPO,
      items: [...currentPO.items, { ...EMPTY_ITEM }],
    }));
  }

  function addNewItem() {
    addItem(setNewPO);
  }

  function addEditItem() {
    addItem(setEditPO);
  }

  function removeItem(setPurchaseOrder, index) {
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
  }

  function removeNewItem(index) {
    removeItem(setNewPO, index);
  }

  function removeEditItem(index) {
    removeItem(setEditPO, index);
  }

  function buildRequestBody(purchaseOrder) {
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

  async function createPurchaseOrder(event) {
    event.preventDefault();

    try {
      setCreateLoading(true);
      setCreateError("");

      const requestBody = buildRequestBody(newPO);
      const createdPurchaseOrder = await createPurchaseOrderApi(requestBody);

      setNewPO(createEmptyPurchaseOrder());
      setShowCreateForm(false);

      await onCreated?.(createdPurchaseOrder);
    } catch (requestError) {
      setCreateError(requestError.message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function updatePurchaseOrder(event) {
    event.preventDefault();

    if (!editPO.id) {
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError("");

      const requestBody = buildRequestBody(editPO);
      const updatedPurchaseOrder = await updatePurchaseOrderApi(
        editPO.id,
        requestBody
      );

      setShowEditForm(false);

      await onUpdated?.(updatedPurchaseOrder);
    } catch (requestError) {
      setUpdateError(requestError.message);
    } finally {
      setUpdateLoading(false);
    }
  }

  function closeAllForms() {
    setShowCreateForm(false);
    setShowEditForm(false);
    setCreateError("");
    setUpdateError("");
  }

  return {
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
  };
}
