from __future__ import annotations

import logging
import uuid
from decimal import Decimal
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.payment import Payment, PaymentRecordStatus, PaymentType
from app.models.review import Review
from app.utils.auth import get_password_hash

logger = logging.getLogger("campusbite.seed")


def seed_database_if_empty(db: Session) -> None:
    """
    Seeds initial realistic campus restaurants, dishes, demo users, and sample orders
    so the system is immediately ready for demonstrations and evaluations.
    """
    try:
        restaurant_count = db.query(Restaurant).count()

        if restaurant_count > 0:
            # Guarantee demo accounts are present and passwords valid for evaluators
            for email, name, role in [
                ("owner@campusbite.com", "Chef Marco Rossi", UserRole.restaurant_owner),
                ("student@campusbite.com", "Alex Johnson", UserRole.customer),
                ("delivery@campusbite.com", "Ravi Kumar", UserRole.delivery_partner),
            ]:
                u = db.query(User).filter(User.email == email).first()
                if not u:
                    db.add(User(email=email, password_hash=get_password_hash("password123"), full_name=name, role=role))
                else:
                    u.password_hash = get_password_hash("password123")
            db.commit()
            logger.info("Database already contains restaurants; ensured demo accounts are ready.")
            return

        logger.info("Seeding initial demo data for CampusBite platform...")

        # 1. Demo Users
        owner = db.query(User).filter(User.email == "owner@campusbite.com").first()
        if not owner:
            owner = User(
                email="owner@campusbite.com",
                password_hash=get_password_hash("password123"),
                full_name="Chef Marco Rossi",
                phone="+91 98765 00001",
                role=UserRole.restaurant_owner,
            )
            db.add(owner)
            db.flush()
        else:
            owner.password_hash = get_password_hash("password123")

        student = db.query(User).filter(User.email == "student@campusbite.com").first()
        if not student:
            student = User(
                email="student@campusbite.com",
                password_hash=get_password_hash("password123"),
                full_name="Alex Johnson",
                phone="+91 98765 00002",
                role=UserRole.customer,
            )
            db.add(student)
            db.flush()
        else:
            student.password_hash = get_password_hash("password123")

        delivery_partner = db.query(User).filter(User.email == "delivery@campusbite.com").first()
        if not delivery_partner:
            delivery_partner = User(
                email="delivery@campusbite.com",
                password_hash=get_password_hash("password123"),
                full_name="Ravi Kumar",
                phone="+91 98765 00003",
                role=UserRole.delivery_partner,
            )
            db.add(delivery_partner)
            db.flush()
        else:
            delivery_partner.password_hash = get_password_hash("password123")

        # 2. Demo Restaurants & Menu Items
        demo_restaurants_data = [
            {
                "name": "The Rustic Oven Pizza Co.",
                "description": "Authentic stone-baked artisan pizzas, garlic knots, and Italian desserts made fresh on campus daily.",
                "cuisine_type": "Italian",
                "address": "Campus Student Center, Food Court A",
                "phone": "+91 98765 11001",
                "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
                "menu_items": [
                    {
                        "name": "Margherita Artisanal Pizza",
                        "description": "San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, extra virgin olive oil.",
                        "price": Decimal("249.00"),
                        "category": "Pizza",
                        "image_url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Spicy Fiery Pepperoni",
                        "description": "Zesty cured pepperoni, spicy hot honey drizzle, mozzarella on 48h slow-fermented crust.",
                        "price": Decimal("329.00"),
                        "category": "Pizza",
                        "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Truffle Parmesan Garlic Knots",
                        "description": "Oven-baked dough knots tossed in garlic herb butter, aged parmesan, and truffle oil.",
                        "price": Decimal("149.00"),
                        "category": "Sides",
                        "image_url": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Classic Espresso Tiramisu",
                        "description": "Savoiardi ladyfingers soaked in rich dark roast espresso, layered with mascarpone cream.",
                        "price": Decimal("179.00"),
                        "category": "Desserts",
                        "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop&q=80",
                    },
                ],
            },
            {
                "name": "Golden Dragon Wok",
                "description": "Sizzling Asian street food, wok-tossed noodles, crunchy appetizers, and fragrant fried rice bowls.",
                "cuisine_type": "Chinese",
                "address": "North Wing Quad, Booth 4B",
                "phone": "+91 98765 11002",
                "image_url": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80",
                "menu_items": [
                    {
                        "name": "Schezwan Chili Garlic Noodles",
                        "description": "Wok-tossed noodles with colorful bell peppers, scallions, and home-crafted spicy Schezwan sauce.",
                        "price": Decimal("199.00"),
                        "category": "Noodles",
                        "image_url": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Crispy Veg Spring Rolls (4 pcs)",
                        "description": "Golden fried delicate pastry rolls packed with glass noodles, cabbage, and sweet chili dip.",
                        "price": Decimal("139.00"),
                        "category": "Appetizers",
                        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Kung Pao Tofu & Jasmine Rice Bowl",
                        "description": "Crispy pressed tofu chunks tossed with roasted crunchy peanuts, dry red chilies, and scallions.",
                        "price": Decimal("229.00"),
                        "category": "Bowls",
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Honey Chili Crispy Lotus Stem",
                        "description": "Crunchy lotus stem slivers glazed in hot honey chili sauce with toasted white sesame.",
                        "price": Decimal("169.00"),
                        "category": "Appetizers",
                        "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80",
                    },
                ],
            },
            {
                "name": "Spice Symphony Curry House",
                "description": "Rich aromatic Indian curries, slow-cooked dum biryanis, fresh tandoor flatbreads, and refreshing lassis.",
                "cuisine_type": "Indian",
                "address": "East Campus Hub, Dine Hall 2",
                "phone": "+91 98765 11003",
                "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80",
                "menu_items": [
                    {
                        "name": "Royal Paneer Butter Masala",
                        "description": "Fresh malai paneer cubes simmered in a velvety tomato-cashew satin gravy with kasuri methi.",
                        "price": Decimal("259.00"),
                        "category": "Curries",
                        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Hyderabadi Dum Veg Biryani",
                        "description": "Fragrant aged basmati rice layered with garden vegetables, saffron milk, caramelized onions, and mint.",
                        "price": Decimal("289.00"),
                        "category": "Biryani",
                        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Garlic Butter Naan (2 pcs)",
                        "description": "Clay oven tandoor-baked leavened flatbread brushed with crushed roasted garlic butter and cilantro.",
                        "price": Decimal("79.00"),
                        "category": "Breads",
                        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Sweet Saffron Mango Lassi",
                        "description": "Thick traditional churned yogurt blended with ripe Alphonso mango puree and Kashmir saffron.",
                        "price": Decimal("99.00"),
                        "category": "Beverages",
                        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80",
                    },
                ],
            },
            {
                "name": "Green Oasis Health Bistro",
                "description": "Nutritious balanced macro bowls, superfood wraps, fresh cold-pressed detox juices, and antioxidant smoothies.",
                "cuisine_type": "Beverages",
                "address": "Sports Complex Annex, 1st Floor",
                "phone": "+91 98765 11004",
                "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
                "menu_items": [
                    {
                        "name": "Mediterranean Quinoa Power Bowl",
                        "description": "Fluffy organic quinoa, English cucumber, Kalamata olives, cherry tomatoes, feta, lemon oregano vinaigrette.",
                        "price": Decimal("219.00"),
                        "category": "Bowls",
                        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Avocado Chickpea Super Wrap",
                        "description": "Toasted multi-grain tortilla rolled with creamy hass avocado, paprika spiced chickpeas, and tahini drizzle.",
                        "price": Decimal("189.00"),
                        "category": "Wraps",
                        "image_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Cold-Pressed Green Glow Detox",
                        "description": "Pure unpasteurized juice of baby spinach, celery, green apple, cucumber, ginger, and Meyer lemon.",
                        "price": Decimal("119.00"),
                        "category": "Beverages",
                        "image_url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80",
                    },
                    {
                        "name": "Wild Berry Acai Energy Parfait",
                        "description": "Brazilian frozen acai blend topped with toasted almond granola, chia seeds, and wild blueberries.",
                        "price": Decimal("169.00"),
                        "category": "Desserts",
                        "image_url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80",
                    },
                ],
            },
        ]

        created_restaurants = []
        all_created_items = []

        for r_data in demo_restaurants_data:
            existing_r = db.query(Restaurant).filter(Restaurant.name == r_data["name"]).first()
            if not existing_r:
                restaurant = Restaurant(
                    name=r_data["name"],
                    description=r_data["description"],
                    cuisine_type=r_data["cuisine_type"],
                    address=r_data["address"],
                    phone=r_data["phone"],
                    image_url=r_data["image_url"],
                    is_active=True,
                    owner_id=owner.id,
                )
                db.add(restaurant)
                db.flush()
                created_restaurants.append(restaurant)

                for item_data in r_data["menu_items"]:
                    menu_item = MenuItem(
                        restaurant_id=restaurant.id,
                        name=item_data["name"],
                        description=item_data["description"],
                        price=item_data["price"],
                        category=item_data["category"],
                        image_url=item_data["image_url"],
                        is_available=True,
                    )
                    db.add(menu_item)
                    db.flush()
                    all_created_items.append(menu_item)
            else:
                created_restaurants.append(existing_r)

        # Link owner's restaurant_id to the primary restaurant
        if created_restaurants and not owner.restaurant_id:
            owner.restaurant_id = created_restaurants[0].id

        # 3. Demo Orders & History for Student
        if created_restaurants and all_created_items and student:
            existing_orders = db.query(Order).filter(Order.customer_id == student.id).count()
            if existing_orders == 0:
                # Create a completed / delivered order
                r1 = created_restaurants[0]
                pizza_item = [i for i in all_created_items if i.restaurant_id == r1.id][0]
                dessert_item = [i for i in all_created_items if i.restaurant_id == r1.id][-1]
                order_total = (pizza_item.price * 1) + (dessert_item.price * 1)

                past_order = Order(
                    customer_id=student.id,
                    restaurant_id=r1.id,
                    delivery_partner_id=delivery_partner.id,
                    status=OrderStatus.DELIVERED,
                    total_amount=order_total,
                    delivery_address="Room 402, Oak Residence Hall, Campus North",
                    payment_status=PaymentStatus.mock_paid,
                    created_at=datetime.utcnow() - timedelta(days=2),
                )
                db.add(past_order)
                db.flush()

                db.add(
                    OrderItem(
                        order_id=past_order.id,
                        menu_item_id=pizza_item.id,
                        quantity=1,
                        unit_price=pizza_item.price,
                        subtotal=pizza_item.price,
                    )
                )
                db.add(
                    OrderItem(
                        order_id=past_order.id,
                        menu_item_id=dessert_item.id,
                        quantity=1,
                        unit_price=dessert_item.price,
                        subtotal=dessert_item.price,
                    )
                )
                db.add(
                    Payment(
                        order_id=past_order.id,
                        amount=order_total,
                        payment_type=PaymentType.payment,
                        status=PaymentRecordStatus.success,
                        transaction_id=str(uuid.uuid4()),
                        created_at=datetime.utcnow() - timedelta(days=2),
                    )
                )
                db.add(
                    Review(
                        order_id=past_order.id,
                        restaurant_id=r1.id,
                        customer_id=student.id,
                        rating=5,
                        comment="Crispy crust and piping hot artisanal pizza! Delivered in under 20 minutes to my dorm.",
                        created_at=datetime.utcnow() - timedelta(days=2),
                    )
                )

                # Create an active in-progress order
                r2 = created_restaurants[1] if len(created_restaurants) > 1 else r1
                noodles_item = [i for i in all_created_items if i.restaurant_id == r2.id][0]
                order2_total = noodles_item.price * 2

                active_order = Order(
                    customer_id=student.id,
                    restaurant_id=r2.id,
                    delivery_partner_id=delivery_partner.id,
                    status=OrderStatus.OUT_FOR_DELIVERY,
                    total_amount=order2_total,
                    delivery_address="Library Study Lounge 3B, Campus Center",
                    payment_status=PaymentStatus.mock_paid,
                    created_at=datetime.utcnow() - timedelta(minutes=25),
                )
                db.add(active_order)
                db.flush()

                db.add(
                    OrderItem(
                        order_id=active_order.id,
                        menu_item_id=noodles_item.id,
                        quantity=2,
                        unit_price=noodles_item.price,
                        subtotal=order2_total,
                    )
                )
                db.add(
                    Payment(
                        order_id=active_order.id,
                        amount=order2_total,
                        payment_type=PaymentType.payment,
                        status=PaymentRecordStatus.success,
                        transaction_id=str(uuid.uuid4()),
                        created_at=datetime.utcnow() - timedelta(minutes=25),
                    )
                )

        db.commit()
        logger.info("Demo data seeded successfully! 4 restaurants, menu items, users, and sample orders created.")

    except Exception as exc:
        db.rollback()
        logger.error(f"Error seeding database: {exc}", exc_info=True)
