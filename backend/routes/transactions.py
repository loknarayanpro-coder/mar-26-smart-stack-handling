from flask import Blueprint, request, jsonify
from database import transactions_collection, products_collection, sales_collection
import datetime
from bson.objectid import ObjectId

from routes.auth import token_required
from utils.email_service import notify_low_stock

transactions = Blueprint("transactions", __name__)

def serialize_transaction(doc):
    """Convert MongoDB doc to JSON-serializable dict."""
    if doc is None:
        return None
    d = dict(doc)
    d["id"] = str(d.pop("_id", ""))
    if "created_at" in d and isinstance(d["created_at"], datetime.datetime):
        d["created_at"] = d["created_at"].isoformat()
    return d

@transactions.route("/", methods=["GET"])
def get_transactions():
    """Fetch paginated transaction history sorted by newest first."""
    page = max(1, int(request.args.get("page", 1)))
    per_page = max(1, min(100, int(request.args.get("per_page", 20))))
    
    skip = (page - 1) * per_page
    total_count = transactions_collection.count_documents({})
    
    docs = transactions_collection.find({}).sort("created_at", -1).skip(skip).limit(per_page)
    transactions_list = [serialize_transaction(doc) for doc in docs]
    
    return jsonify({
        "data": transactions_list,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "pages": (total_count + per_page - 1) // per_page
        }
    }), 200


@transactions.route("/", methods=["POST"])
@token_required
def add_transaction(current_user):
    """
    Add an inventory transaction and update stock.

    Expected JSON:
      - product_id (string, required)
      - type: "PURCHASE" | "SALE"  (preferred) OR "STOCK_IN" | "STOCK_OUT"
      - quantity (int, required, >0)
      - price (number, optional)  # unit price
      - notes (string, optional)
      - reason (string, optional) # fallback label shown in history
      - created_at (iso string, optional) # if omitted, server time used
    """
    data = request.json or {}
    product_id = (data.get("product_id") or "").strip()
    tx_type = (data.get("type") or "").strip().upper()
    notes = (data.get("notes") or "").strip()
    reason = (data.get("reason") or "").strip()

    try:
        quantity = int(data.get("quantity", 0))
    except Exception:
        quantity = 0

    if not product_id or quantity <= 0:
        return jsonify({"msg": "product_id and positive quantity are required"}), 400

    # normalize type
    if tx_type in ("PURCHASE", "STOCK_IN", "IN"):
        normalized_type = "STOCK_IN"
        direction = 1
        default_reason = "Purchase"
    elif tx_type in ("SALE", "STOCK_OUT", "OUT"):
        normalized_type = "STOCK_OUT"
        direction = -1
        default_reason = "Sale"
    else:
        return jsonify({"msg": "Invalid type. Use PURCHASE or SALE"}), 400

    try:
        oid = ObjectId(product_id)
    except Exception:
        return jsonify({"msg": "Invalid product ID"}), 400

    product = products_collection.find_one({"_id": oid})
    if not product:
        return jsonify({"msg": "Product not found"}), 404

    current_qty = int(product.get("quantity", 0))
    new_qty = current_qty + (direction * quantity)
    if new_qty < 0:
        return jsonify({"msg": f"Insufficient stock. Only {current_qty} available"}), 400

    # update stock
    products_collection.update_one({"_id": oid}, {"$set": {"quantity": new_qty}})

    # low stock trigger (only when crossing threshold)
    threshold = product.get("reorder_point", product.get("min_stock_threshold", 5))
    try:
        threshold_int = int(threshold)
    except Exception:
        threshold_int = 5

    if new_qty < threshold_int and current_qty >= threshold_int:
        notify_low_stock(product.get("name", "Unknown Product"), new_qty, threshold_int)

    # unit price
    unit_price = None
    if data.get("price") is not None and data.get("price") != "":
        try:
            unit_price = float(data.get("price"))
        except Exception:
            return jsonify({"msg": "Invalid price"}), 400

    total_amount = None
    if unit_price is not None:
        total_amount = round(unit_price * quantity, 2)

    created_at = datetime.datetime.utcnow()
    if data.get("created_at"):
        try:
            created_at = datetime.datetime.fromisoformat(str(data.get("created_at")))
        except Exception:
            pass

    tx_doc = {
        "product_id": product_id,
        "product_name": product.get("name", ""),
        "type": normalized_type,
        "quantity": int(quantity),
        "reason": reason or default_reason,
        "notes": notes,
        "unit_price": unit_price,
        "total_amount": total_amount,
        "created_at": created_at,
        "user_email": current_user.get("email"),
        "user_name": current_user.get("name", ""),
    }

    tx_result = transactions_collection.insert_one(tx_doc)

    # Keep sales analytics compatible: insert into sales_collection on STOCK_OUT (sale)
    if normalized_type == "STOCK_OUT":
        sale_total = total_amount
        if sale_total is None:
            # fallback to product price
            try:
                sale_total = round(float(product.get("price", 0)) * quantity, 2)
            except Exception:
                sale_total = None
        sales_collection.insert_one({
            "product_id": product_id,
            "product_name": product.get("name", ""),
            "quantity_sold": int(quantity),
            "total_amount": sale_total if sale_total is not None else 0,
            "sold_at": created_at,
        })

    return jsonify({
        "msg": "Transaction added successfully",
        "id": str(tx_result.inserted_id),
        "new_quantity": new_qty,
    }), 201
