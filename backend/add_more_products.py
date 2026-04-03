import os
import random
import argparse
import datetime

from pymongo import MongoClient
from dotenv import load_dotenv


def main():
    parser = argparse.ArgumentParser(description="Add more sample products without deleting existing data.")
    parser.add_argument("--count", type=int, default=30, help="How many products to add (default: 30)")
    parser.add_argument("--min-qty", type=int, default=5, help="Minimum quantity for inserted products (default: 5)")
    parser.add_argument("--max-qty", type=int, default=150, help="Maximum quantity for inserted products (default: 150)")
    args = parser.parse_args()

    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME") or "smartstock_db"

    print(f"Connecting to MongoDB at {mongo_uri}, DB: {db_name}")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    products_collection = db["products"]
    transactions_collection = db["transactions"]

    categories = ["Laptops", "Smartphones", "Accessories", "Monitors", "Office Supplies", "Furniture", "Networking", "Storage"]
    suppliers = ["TechCorp", "OfficeMax", "FurniturePlus", "GadgetStore", "GlobalSupplies", "NetWorks Inc", "StorageSolutions"]

    brands = {
        "Laptops": ["Lenovo", "Dell", "HP", "Apple", "Asus", "Acer"],
        "Smartphones": ["Samsung", "Apple", "Google", "OnePlus", "Xiaomi"],
        "Accessories": ["Logitech", "Razer", "Corsair", "Anker", "Belkin"],
        "Monitors": ["Dell", "LG", "Samsung", "BenQ", "ASUS"],
        "Office Supplies": ["3M", "Faber-Castell", "Pilot", "Staedtler", "Post-it"],
        "Furniture": ["Herman Miller", "Steelcase", "IKEA", "Haworth", "Ergotron"],
        "Networking": ["Cisco", "Ubiquiti", "Netgear", "TP-Link", "D-Link"],
        "Storage": ["Western Digital", "Seagate", "Samsung", "Crucial", "SanDisk"],
    }

    types = {
        "Laptops": ["ThinkPad", "MacBook Pro", "MacBook Air", "XPS", "ZenBook", "Inspiron", "Spectre", "Envy", "Predator", "ROG"],
        "Smartphones": ["Galaxy S23", "Galaxy S24", "iPhone 15", "iPhone 14", "Pixel 8", "Pixel 7", "Nord", "Redmi Note"],
        "Accessories": ["Wireless Mouse", "Mechanical Keyboard", "Bluetooth Headset", "Webcam", "USB-C Hub", "Mousepad", "Laptop Stand", "Cooling Pad"],
        "Monitors": ["24-inch 1080p", "27-inch 1440p", "32-inch 4K", "34-inch Ultrawide", "Portable Monitor", "Curved Monitor"],
        "Office Supplies": ["A4 Printer Paper", "Whiteboard Marker Set", "Sticky Notes", "Stapler", "Paper Clips", "Desk Organizer", "Highlighters", "Notebooks"],
        "Furniture": ["Ergonomic Chair", "Standing Desk", "Filing Cabinet", "Conference Table", "Bookshelf", "Whiteboard 4x6", "Monitor Arm"],
        "Networking": ["WiFi 6 Router", "Unmanaged Switch 8-port", "Managed Switch 24-port", "Mesh WiFi System", "Ethernet Cable Cat6 10m", "PoE Injector"],
        "Storage": ["1TB NVMe SSD", "2TB SATA SSD", "4TB External HDD", "500GB Portable SSD", "128GB Flash Drive", "NAS 4-Bay enclosure"],
    }

    pricing_bounds = {
        "Laptops": (35000, 250000),
        "Smartphones": (15000, 150000),
        "Accessories": (300, 15000),
        "Monitors": (8000, 65000),
        "Office Supplies": (50, 2500),
        "Furniture": (4500, 85000),
        "Networking": (1000, 45000),
        "Storage": (900, 30000),
    }

    existing_names = set(p.get("name") for p in products_collection.find({}, {"name": 1}))
    variants = ["Pro", "Max", "Elite", "Ultra", "Lite", "Basic", "Advanced", "V2", "Gen 2", "Plus", ""]

    products_to_insert = []
    now = datetime.datetime.utcnow()
    attempts = 0
    target = max(1, args.count)

    while len(products_to_insert) < target and attempts < target * 50:
        attempts += 1
        cat = random.choice(categories)
        brand = random.choice(brands[cat])
        item_type = random.choice(types[cat])
        variant = random.choice(variants)
        name = f"{brand} {item_type} {variant}".strip()

        if name in existing_names:
            continue

        min_p, max_p = pricing_bounds[cat]
        price = random.randint(min_p // 100, max_p // 100) * 100
        quantity = random.randint(max(args.min_qty, 1), max(args.max_qty, args.min_qty))

        # Stock policy
        if quantity > 50:
            min_stock = random.randint(15, 30)
        elif quantity > 10:
            min_stock = random.randint(5, 10)
        else:
            min_stock = random.randint(2, 5)

        reorder_point = min_stock
        max_stock_level = max(quantity, reorder_point + random.randint(10, 100))

        products_to_insert.append(
            {
                "name": name,
                "category": cat,
                "price": price,
                "quantity": quantity,
                "supplier": random.choice(suppliers),
                "min_stock_threshold": int(min_stock),
                "reorder_point": int(reorder_point),
                "max_stock_level": int(max_stock_level),
            }
        )
        existing_names.add(name)

    if not products_to_insert:
        print("No new products generated (maybe too many duplicates).")
        return

    print(f"Inserting {len(products_to_insert)} products...")
    insert_result = products_collection.insert_many(products_to_insert)

    transactions = []
    for i, product in enumerate(products_to_insert):
        transactions.append(
            {
                "product_id": str(insert_result.inserted_ids[i]),
                "product_name": product["name"],
                "type": "STOCK_IN",
                "quantity": int(product["quantity"]),
                "reason": "Added sample products",
                "created_at": now - datetime.timedelta(days=random.randint(0, 30)),
            }
        )

    if transactions:
        transactions_collection.insert_many(transactions)

    print(f"Done. Added {len(products_to_insert)} products and {len(transactions)} transactions.")


if __name__ == "__main__":
    main()

