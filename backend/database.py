from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI, maxPoolSize=50, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

users_collection = db["users"]
products_collection = db["products"]
reset_tokens_collection = db["reset_tokens"]
sales_collection = db["sales"]
transactions_collection = db["transactions"]

# Create indexes for better query performance
def create_indexes():
    """Create database indexes to prevent performance issues."""
    try:
        # Users collection indexes
        users_collection.create_index("email", unique=True)
        users_collection.create_index("created_at")
        
        # Products collection indexes
        products_collection.create_index("category")
        products_collection.create_index("quantity")
        products_collection.create_index("min_stock_threshold")
        
        # Reset tokens collection indexes
        reset_tokens_collection.create_index("email")
        reset_tokens_collection.create_index("expires_at", expireAfterSeconds=0)
        
        # Sales collection indexes
        sales_collection.create_index("product_id")
        sales_collection.create_index("sold_at")
        sales_collection.create_index([("sold_at", -1)])
        
        # Transactions collection indexes
        transactions_collection.create_index("product_id")
        transactions_collection.create_index([("created_at", -1)])
        
        print(" Database indexes created successfully")
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")

# Create indexes on startup
create_indexes()

print(" Connected to MongoDB:", DB_NAME)