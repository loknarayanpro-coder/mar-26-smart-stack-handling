from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth import auth
from routes.products import products
from routes.reports import reports
from routes.transactions import transactions
from routes.assistant import assistant
from database import products_collection, users_collection, transactions_collection

app = Flask(__name__)

# ================= CORS SETUP =================
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        }
    },
    supports_credentials=True
)
# ==============================================


from routes.sales_analytics import sales_analytics

# ================= ROUTES =================
app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(products, url_prefix="/api/products")
app.register_blueprint(reports, url_prefix="/api/reports")
app.register_blueprint(transactions, url_prefix="/api/transactions")
app.register_blueprint(assistant, url_prefix="/api/assistant")
app.register_blueprint(sales_analytics, url_prefix="/api/sales-analytics")
# =========================================


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "Welcome to Smart Stock Inventory System API"
    })

@app.route("/api/stats", methods=["GET"])
def get_landing_stats():
    try:
        total_products = products_collection.count_documents({})
        total_users = users_collection.count_documents({})
        total_transactions = transactions_collection.count_documents({})
        
        return jsonify({
            "products": total_products,
            "users": total_users,
            "transactions": total_transactions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)