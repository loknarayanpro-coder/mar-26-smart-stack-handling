from flask import Blueprint, jsonify
from database import sales_collection, transactions_collection
import datetime
from bson.son import SON

sales_analytics = Blueprint("sales_analytics", __name__)

@sales_analytics.route("/summary", methods=["GET"])
def get_summary():
    """Returns Total Revenue, Total Items Sold, and Total Orders."""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$total_amount"},
                    "total_items_sold": {"$sum": "$quantity_sold"},
                    "total_orders": {"$sum": 1}
                }
            }
        ]
        result = list(sales_collection.aggregate(pipeline))
        if result:
            summary = result[0]
            summary.pop("_id", None)
            return jsonify(summary), 200
        else:
            return jsonify({"total_revenue": 0, "total_items_sold": 0, "total_orders": 0}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sales_analytics.route("/trends", methods=["GET"])
def get_trends():
    """Returns daily sales trends for the last 30 days."""
    try:
        thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        
        pipeline = [
            {"$match": {"sold_at": {"$gte": thirty_days_ago}}},
            {
                "$project": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$sold_at"}},
                    "revenue": "$total_amount",
                    "quantity": "$quantity_sold"
                }
            },
            {
                "$group": {
                    "_id": "$date",
                    "revenue": {"$sum": "$revenue"},
                    "items_sold": {"$sum": "$quantity"}
                }
            },
            {"$sort": SON([("_id", 1)])}
        ]
        
        results = list(sales_collection.aggregate(pipeline))
        formatted_results = [
            {"date": item["_id"], "revenue": item["revenue"], "items_sold": item["items_sold"]}
            for item in results
        ]
        
        return jsonify(formatted_results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sales_analytics.route("/top-products", methods=["GET"])
def get_top_products():
    """Returns top 5 selling products by revenue."""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$product_name",
                    "total_revenue": {"$sum": "$total_amount"},
                    "total_quantity": {"$sum": "$quantity_sold"}
                }
            },
            {"$sort": SON([("total_revenue", -1)])},
            {"$limit": 5}
        ]
        
        results = list(sales_collection.aggregate(pipeline))
        formatted_results = [
            {"name": item["_id"], "revenue": item["total_revenue"], "quantity": item["total_quantity"]}
            for item in results
        ]
        
        return jsonify(formatted_results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
