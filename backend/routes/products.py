from flask import Blueprint, request, jsonify
from database import products_collection, sales_collection, transactions_collection
from bson.objectid import ObjectId
import datetime
from utils.email_service import notify_low_stock

products = Blueprint("products", __name__)

def serialize_product(doc):
    """Convert MongoDB doc to JSON-serializable dict with id."""
    if doc is None:
        return None
    d = dict(doc)
    d["id"] = str(d.pop("_id", ""))
    return d

@products.route("/", methods=["POST"])
def add_product():
    data = request.json

    if not data.get("name") or not data.get("price") or data.get("quantity") is None:
        return jsonify({"msg": "Missing fields"}), 400

    result = products_collection.insert_one({
        "name": data["name"],
        "price": float(data["price"]),
        "quantity": int(data["quantity"]),
        "category": data.get("category", ""),
        "supplier": data.get("supplier", ""),
        # Stock policy fields
        "reorder_point": int(data.get("reorder_point", data.get("min_stock_threshold", 5))),
        "min_stock_threshold": int(data.get("min_stock_threshold", 5)),
        "max_stock_level": int(data.get("max_stock_level", 0)),
    })
    
    # Log transaction
    transactions_collection.insert_one({
        "product_id": str(result.inserted_id),
        "product_name": data["name"],
        "type": "STOCK_IN",
        "quantity": int(data["quantity"]),
        "reason": "New Product Added",
        "created_at": datetime.datetime.utcnow()
    })
    
    return jsonify({"msg": "Product added successfully", "id": str(result.inserted_id)}), 201


@products.route("/", methods=["GET"])
def get_products():
    # Implement pagination to avoid loading all products into memory
    page = max(1, int(request.args.get("page", 1)))
    per_page = max(1, min(100, int(request.args.get("per_page", 20))))  # Max 100 per page
    
    skip = (page - 1) * per_page
    total_count = products_collection.count_documents({})
    
    docs = products_collection.find({}).skip(skip).limit(per_page)
    products_list = [serialize_product(doc) for doc in docs]
    
    return jsonify({
        "data": products_list,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "pages": (total_count + per_page - 1) // per_page
        }
    }), 200


@products.route("/alerts", methods=["GET"])
def get_alerts():
    """Return products below reorder_point (fallback to min_stock_threshold)."""
    # Use MongoDB aggregation to filter low stock items efficiently
    pipeline = [
        {
            "$addFields": {
                "threshold": {"$ifNull": ["$reorder_point", {"$ifNull": ["$min_stock_threshold", 5]}]}
            }
        },
        {
            "$match": {
                "$expr": {"$lt": ["$quantity", "$threshold"]}
            }
        },
        {
            "$limit": 1000  # Limit results to prevent memory issues
        }
    ]
    
    docs = products_collection.aggregate(pipeline)
    alerts = []
    for doc in docs:
        qty = doc.get("quantity", 0)
        threshold = doc.get("threshold", 5)
        alerts.append({
            "id": str(doc["_id"]),
            "product_id": str(doc["_id"]),
            "name": doc.get("name", "Product"),
            "quantity": qty,
            "threshold": threshold,
            "message": f"{doc.get('name', 'Product')} is low on stock ({qty} left)",
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    return jsonify(alerts), 200


@products.route("/sales", methods=["POST"])
def record_sale():
    """Record a sale and reduce product quantity."""
    data = request.json
    product_id = data.get("product_id")
    quantity_sold = data.get("quantity_sold", 0)

    if not product_id or quantity_sold <= 0:
        return jsonify({"msg": "Invalid product_id or quantity_sold"}), 400

    try:
        oid = ObjectId(product_id)
    except Exception:
        return jsonify({"msg": "Invalid product ID"}), 400

    product = products_collection.find_one({"_id": oid})
    if not product:
        return jsonify({"msg": "Product not found"}), 404

    current_qty = product.get("quantity", 0)
    if quantity_sold > current_qty:
        return jsonify({"msg": f"Insufficient stock. Only {current_qty} available"}), 400

    new_qty = current_qty - quantity_sold
    products_collection.update_one({"_id": oid}, {"$set": {"quantity": new_qty}})

    # Check for low stock trigger
    threshold = product.get("reorder_point", product.get("min_stock_threshold", 5))
    if new_qty < threshold and current_qty >= threshold:
        notify_low_stock(product.get("name", "Unknown Product"), new_qty, threshold)

    total = float(product.get("price", 0)) * quantity_sold
    sales_collection.insert_one({
        "product_id": product_id,
        "product_name": product.get("name", ""),
        "quantity_sold": quantity_sold,
        "total_amount": total,
        "sold_at": datetime.datetime.utcnow()
    })
    
    # Log transaction
    transactions_collection.insert_one({
        "product_id": product_id,
        "product_name": product.get("name", ""),
        "type": "STOCK_OUT",
        "quantity": quantity_sold,
        "reason": "Sale recorded",
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"msg": "Sale recorded successfully", "total": total}), 201


@products.route("/<product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.json
    try:
        oid = ObjectId(product_id)
    except Exception:
        return jsonify({"msg": "Invalid product ID"}), 400

    # Fetch old product before update to find stock diff
    old_product = products_collection.find_one({"_id": oid})

    update_fields = {}
    if "quantity" in data:
        update_fields["quantity"] = int(data["quantity"])
    if "name" in data:
        update_fields["name"] = data["name"]
    if "price" in data:
        update_fields["price"] = float(data["price"])
    if "category" in data:
        update_fields["category"] = data["category"]
    if "supplier" in data:
        update_fields["supplier"] = data["supplier"]
    if "min_stock_threshold" in data:
        update_fields["min_stock_threshold"] = int(data["min_stock_threshold"])
    if "reorder_point" in data:
        update_fields["reorder_point"] = int(data["reorder_point"])
    if "max_stock_level" in data:
        update_fields["max_stock_level"] = int(data["max_stock_level"])

    if not update_fields:
        return jsonify({"msg": "No fields to update"}), 400

    result = products_collection.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"msg": "Product not found"}), 404
        
    # Log transaction if quantity changed
    if old_product and "quantity" in data:
        old_qty = old_product.get("quantity", 0)
        new_qty = int(data["quantity"])
        diff = new_qty - old_qty
        
        if diff != 0:
            transactions_collection.insert_one({
                "product_id": product_id,
                "product_name": old_product.get("name", "Unknown Product"),
                "type": "STOCK_IN" if diff > 0 else "STOCK_OUT",
                "quantity": abs(diff),
                "reason": "Manual Stock Adjustment",
                "created_at": datetime.datetime.utcnow()
            })
            
        # Check for low stock trigger
        threshold = old_product.get("reorder_point", old_product.get("min_stock_threshold", 5))
        if new_qty < threshold and old_qty >= threshold:
            notify_low_stock(old_product.get("name", "Unknown Product"), new_qty, threshold)

    return jsonify({"msg": "Product updated successfully"}), 200


@products.route("/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        oid = ObjectId(product_id)
    except Exception:
        return jsonify({"msg": "Invalid product ID"}), 400
        
    # Find product before deletion to log correct name and diff
    product = products_collection.find_one({"_id": oid})
        
    result = products_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"msg": "Product not found"}), 404
        
    # Log transaction
    if product:
        qty = product.get("quantity", 0)
        if qty > 0:
            transactions_collection.insert_one({
                "product_id": product_id,
                "product_name": product.get("name", "Unknown Product"),
                "type": "STOCK_OUT",
                "quantity": qty,
                "reason": "Product Deleted Registration",
                "created_at": datetime.datetime.utcnow()
            })
            
    return jsonify({"msg": "Product deleted successfully"}), 200