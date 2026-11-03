from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import UserRole
from app.seed import seed_database_if_empty
from app.utils.auth import get_password_hash, verify_password

# Use an in-memory SQLite database with StaticPool for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    with TestingSessionLocal() as db:
        seed_database_if_empty(db)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_password_hashing():
    pw = "supersecret123"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_demo_accounts_seeded():
    # Test logging into seeded accounts
    for email in ["student@campusbite.com", "owner@campusbite.com", "delivery@campusbite.com"]:
        res = client.post("/auth/login", json={"email": email, "password": "password123"})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


def test_register_and_login_new_user():
    user_data = {
        "email": "freshstudent@campusbite.com",
        "password": "password123",
        "full_name": "Fresh Student",
        "phone": "+91 99999 11111",
        "role": "customer",
    }
    reg_res = client.post("/auth/register", json=user_data)
    assert reg_res.status_code == 201, reg_res.text
    assert reg_res.json()["email"] == "freshstudent@campusbite.com"

    login_res = client.post("/auth/login", json={"email": "freshstudent@campusbite.com", "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Fresh Student"


def test_role_normalization_on_register():
    owner_data = {
        "email": "newowner@campusbite.com",
        "password": "password123",
        "full_name": "New Owner",
        "role": "owner",
    }
    reg_res = client.post("/auth/register", json=owner_data)
    assert reg_res.status_code == 201
    assert reg_res.json()["role"] == UserRole.restaurant_owner.value


def test_restaurants_and_menu_listing():
    res = client.get("/restaurants")
    assert res.status_code == 200
    restaurants = res.json()
    assert len(restaurants) >= 4

    first_r = restaurants[0]
    menu_res = client.get(f"/restaurants/{first_r['id']}/menu")
    assert menu_res.status_code == 200
    menu = menu_res.json()
    assert len(menu) >= 3


def test_restaurant_search_queries():
    # 1. Search by name using 'search' parameter
    res = client.get("/restaurants?search=Rustic")
    assert res.status_code == 200
    results = res.json()
    assert len(results) >= 1
    assert any("Rustic" in r["name"] for r in results)

    # 2. Search using 'q' alias
    res_q = client.get("/restaurants?q=Dragon")
    assert res_q.status_code == 200
    results_q = res_q.json()
    assert len(results_q) >= 1
    assert any("Dragon" in r["name"] for r in results_q)

    # 3. Filter using 'name' parameter
    res_name = client.get("/restaurants?name=Spice")
    assert res_name.status_code == 200
    assert any("Spice" in r["name"] for r in res_name.json())

    # 4. Filter by cuisine using 'cuisine' and 'cuisine_type'
    res_cuisine = client.get("/restaurants?cuisine=Italian")
    assert res_cuisine.status_code == 200
    assert all(r["cuisine_type"].lower() == "italian" for r in res_cuisine.json())

    res_ct = client.get("/restaurants?cuisine_type=Chinese")
    assert res_ct.status_code == 200
    assert all(r["cuisine_type"].lower() == "chinese" for r in res_ct.json())

    # 5. 'All' cuisine returns all active restaurants
    res_all = client.get("/restaurants?cuisine=All")
    assert res_all.status_code == 200
    assert len(res_all.json()) >= 4

    # 6. Search matching a menu item dish name
    res_dish = client.get("/restaurants?search=noodles")
    assert res_dish.status_code == 200
    dish_results = res_dish.json()
    assert len(dish_results) >= 1
    assert any("Dragon" in r["name"] for r in dish_results)

    # 7. Non-existent search returns empty list
    res_empty = client.get("/restaurants?search=nonexistentfooddish12345")
    assert res_empty.status_code == 200
    assert res_empty.json() == []

    # 8. Mismatched search and cuisine returns empty
    res_mismatch = client.get("/restaurants?search=pizza&cuisine=Chinese")
    assert res_mismatch.status_code == 200
    assert res_mismatch.json() == []

    # 9. Verify menu_items are included in restaurant list response
    res_with_menu = client.get("/restaurants")
    assert res_with_menu.status_code == 200
    data = res_with_menu.json()
    assert len(data) >= 1
    assert "menu_items" in data[0]
    assert len(data[0]["menu_items"]) >= 1

    # 10. Combined name and search filtering
    res_combo = client.get("/restaurants?name=Rustic&search=Pizza")
    assert res_combo.status_code == 200
    assert len(res_combo.json()) >= 1
    assert all("Rustic" in r["name"] for r in res_combo.json())


def test_order_placement_and_lifecycle():
    # Login as student
    student_login = client.post("/auth/login", json={"email": "student@campusbite.com", "password": "password123"})
    student_token = student_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Get restaurant and menu item
    restaurants = client.get("/restaurants").json()
    r_id = restaurants[0]["id"]
    menu = client.get(f"/restaurants/{r_id}/menu").json()
    item_id = menu[0]["id"]

    # Place order
    order_payload = {
        "restaurant_id": r_id,
        "delivery_address": "Room 101, Oak Hall",
        "items": [{"menu_item_id": item_id, "quantity": 2}],
    }
    order_res = client.post("/orders", json=order_payload, headers=student_headers)
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["status"] == "PLACED"
    order_id = order["id"]

    # Login as owner
    owner_login = client.post("/auth/login", json={"email": "owner@campusbite.com", "password": "password123"})
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # Owner transitions: PLACED -> ACCEPTED -> PREPARING -> READY -> ASSIGNED
    for next_status in ["ACCEPTED", "PREPARING", "READY"]:
        s_res = client.patch(f"/orders/{order_id}/status", json={"status": next_status}, headers=owner_headers)
        assert s_res.status_code == 200, f"Transition to {next_status} failed: {s_res.text}"

    # Owner assigns delivery partner (auto-assigned from fleet if no id provided)
    assign_res = client.patch(f"/orders/{order_id}/status", json={"status": "ASSIGNED"}, headers=owner_headers)
    assert assign_res.status_code == 200, assign_res.text
    assert assign_res.json()["delivery_partner_id"] is not None

    # Login as delivery partner
    dp_login = client.post("/auth/login", json={"email": "delivery@campusbite.com", "password": "password123"})
    dp_token = dp_login.json()["access_token"]
    dp_headers = {"Authorization": f"Bearer {dp_token}"}

    # Delivery partner transitions: ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED
    pick_res = client.patch(f"/delivery/orders/{order_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=dp_headers)
    assert pick_res.status_code == 200

    deliv_res = client.patch(f"/delivery/orders/{order_id}/status", json={"status": "DELIVERED"}, headers=dp_headers)
    assert deliv_res.status_code == 200
    assert deliv_res.json()["status"] == "DELIVERED"


def test_menu_toggle_endpoint():
    owner_login = client.post("/auth/login", json={"email": "owner@campusbite.com", "password": "password123"})
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    restaurants = client.get("/restaurants").json()
    r_id = restaurants[0]["id"]
    menu = client.get(f"/restaurants/{r_id}/menu").json()
    item = menu[0]
    initial_avail = item["is_available"]

    toggle_res = client.patch(f"/menu/{item['id']}/toggle", headers=owner_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_available"] is not initial_avail


def test_owner_stats_endpoint():
    owner_login = client.post("/auth/login", json={"email": "owner@campusbite.com", "password": "password123"})
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # Test /stats/restaurant and alias /owner/stats
    res1 = client.get("/stats/restaurant", headers=owner_headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "total_orders" in data1
    assert "total_revenue" in data1

    res2 = client.get("/owner/stats", headers=owner_headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_orders"] == data1["total_orders"]
