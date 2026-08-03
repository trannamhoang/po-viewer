def make_purchase_order_payload(
    *,
    po_number="PO-TEST-001",
    supplier="Test Supplier",
    status="Open",
):
    return {
        "po_number": po_number,
        "supplier": supplier,
        "order_date": "2026-08-03",
        "status": status,
        "items": [
            {
                "product": "Test Product",
                "quantity": 2,
                "unit_price": 25,
            }
        ],
    }


def test_new_purchase_order_must_start_open(client):
    payload = make_purchase_order_payload(status="Approved")

    response = client.post("/purchase-orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "A new purchase order must start with Open status"
    )


def test_purchase_order_follows_status_lifecycle(client):
    create_response = client.post(
        "/purchase-orders",
        json=make_purchase_order_payload(),
    )

    assert create_response.status_code == 201

    purchase_order = create_response.json()
    purchase_order_id = purchase_order["id"]
    update_payload = make_purchase_order_payload(status="Approved")

    approve_response = client.put(
        f"/purchase-orders/{purchase_order_id}",
        json=update_payload,
    )

    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "Approved"

    locked_content_payload = {
        **update_payload,
        "supplier": "Changed Supplier",
    }
    locked_content_response = client.put(
        f"/purchase-orders/{purchase_order_id}",
        json=locked_content_payload,
    )

    assert locked_content_response.status_code == 400
    assert locked_content_response.json()["detail"] == (
        "A Approved purchase order cannot be edited"
    )

    complete_payload = {
        **update_payload,
        "status": "Completed",
    }
    complete_response = client.put(
        f"/purchase-orders/{purchase_order_id}",
        json=complete_payload,
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "Completed"

    edit_completed_response = client.put(
        f"/purchase-orders/{purchase_order_id}",
        json={
            **complete_payload,
            "supplier": "Another Supplier",
        },
    )

    assert edit_completed_response.status_code == 400
    assert edit_completed_response.json()["detail"] == (
        "A Completed purchase order cannot be edited"
    )

    delete_response = client.delete(
        f"/purchase-orders/{purchase_order_id}"
    )

    assert delete_response.status_code == 400
    assert delete_response.json()["detail"] == (
        "A completed purchase order cannot be deleted"
    )


def test_open_purchase_order_cannot_skip_approved_status(client):
    create_response = client.post(
        "/purchase-orders",
        json=make_purchase_order_payload(),
    )
    purchase_order_id = create_response.json()["id"]

    response = client.put(
        f"/purchase-orders/{purchase_order_id}",
        json=make_purchase_order_payload(status="Completed"),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Cannot change status from Open to Completed"
    )


def test_po_number_must_be_unique(client):
    payload = make_purchase_order_payload()

    first_response = client.post("/purchase-orders", json=payload)
    duplicate_response = client.post("/purchase-orders", json=payload)

    assert first_response.status_code == 201
    assert duplicate_response.status_code == 400
    assert duplicate_response.json()["detail"] == (
        "PO number already exists"
    )
