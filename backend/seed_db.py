import os
import random
from pymongo import MongoClient
from dotenv import load_dotenv
import datetime

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME") or "smartstock_db"

print(f"Connecting to MongoDB at {MONGO_URI}, DB: {DB_NAME}")
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
products_collection = db["products"]
transactions_collection = db["transactions"]

# Data generation sources
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
    "Storage": ["Western Digital", "Seagate", "Samsung", "Crucial", "SanDisk"]
}

types = {
    "Laptops": ["ThinkPad", "MacBook Pro", "MacBook Air", "XPS", "ZenBook", "Inspiron", "Spectre", "Envy", "Predator", "ROG"],
    "Smartphones": ["Galaxy S23", "Galaxy S24", "iPhone 15", "iPhone 14", "Pixel 8", "Pixel 7", "Nord", "Redmi Note"],
    "Accessories": ["Wireless Mouse", "Mechanical Keyboard", "Bluetooth Headset", "Webcam", "USB-C Hub", "Mousepad", "Laptop Stand", "Cooling Pad"],
    "Monitors": ["24-inch 1080p", "27-inch 1440p", "32-inch 4K", "34-inch Ultrawide", "Portable Monitor", "Curved Monitor"],
    "Office Supplies": ["A4 Printer Paper", "Whiteboard Marker Set", "Sticky Notes", "Stapler", "Paper Clips", "Desk Organizer", "Highlighters", "Notebooks"],
    "Furniture": ["Ergonomic Chair", "Standing Desk", "Filing Cabinet", "Conference Table", "Bookshelf", "Whiteboard 4x6", "Monitor Arm"],
    "Networking": ["WiFi 6 Router", "Unmanaged Switch 8-port", "Managed Switch 24-port", "Mesh WiFi System", "Ethernet Cable Cat6 10m", "PoE Injector"],
    "Storage": ["1TB NVMe SSD", "2TB SATA SSD", "4TB External HDD", "500GB Portable SSD", "128GB Flash Drive", "NAS 4-Bay enclosure"]
}

pricing_bounds = {
    "Laptops": (35000, 250000),
    "Smartphones": (15000, 150000),
    "Accessories": (300, 15000),
    "Monitors": (8000, 65000),
    "Office Supplies": (50, 2500),
    "Furniture": (4500, 85000),
    "Networking": (1000, 45000),
    "Storage": (900, 30000)
}

products = []
generated_names = set()

print("Generating 120 products...")
while len(products) < 120:
    cat = random.choice(categories)
    brand = random.choice(brands[cat])
    item_type = random.choice(types[cat])
    
    # Adding some randomized flavor to make names unique
    variants = ["Pro", "Max", "Elite", "Ultra", "Lite", "Basic", "Advanced", "V2", "Gen 2", "Plus", ""]
    variant = random.choice(variants)
    
    name = f"{brand} {item_type} {variant}".strip()
    
    if name not in generated_names:
        generated_names.add(name)
        min_p, max_p = pricing_bounds[cat]
        price = random.randint(min_p // 100, max_p // 100) * 100  # Round to nearest 100
        quantity = random.randint(0, 150)
        
        # Determine appropriate minimum stock based on usual volume
        if quantity > 50:
            min_stock = random.randint(15, 30)
        elif quantity > 10:
            min_stock = random.randint(5, 10)
        else:
            min_stock = random.randint(2, 5)
            
        products.append({
            "name": name,
            "category": cat,
            "price": price,
            "quantity": quantity,
            "min_stock_threshold": min_stock,
            "supplier": random.choice(suppliers)
        })

print("Clearing existing products and transactions...")
products_collection.delete_many({})
transactions_collection.delete_many({})

print("Inserting products...")
insert_result = products_collection.insert_many(products)

print("Inserting transaction history...")
transactions = []
# Give each product a STOCK_IN transaction to seed the history properly
now = datetime.datetime.utcnow()
for i, product in enumerate(products):
    if product["quantity"] > 0:
        transactions.append({
            "product_id": str(insert_result.inserted_ids[i]),
            "product_name": product["name"],
            "type": "STOCK_IN",
            "quantity": product["quantity"],
            "reason": "Initial Seeding",
            "created_at": now - datetime.timedelta(days=random.randint(0, 60)) # Randomize the initial stock taking date up to 2 months ago
        })

if transactions:
    transactions_collection.insert_many(transactions)

print(f"Successfully inserted {len(products)} products and {len(transactions)} initial transactions into the database!")
