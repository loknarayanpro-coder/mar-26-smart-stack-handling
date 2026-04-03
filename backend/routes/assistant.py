from flask import Blueprint, request, jsonify
import os


assistant = Blueprint("assistant", __name__)

SYSTEM_PROMPT = """You are Smart Assistant for a Smart Stock Inventory System website.
Be concise and practical. When helpful, give the exact page the user should open.

App features:
- Inventory: add/edit products, set reorder point, min stock, max stock.
- Reports: export CSV/PDF; PDF requires backend dependency 'reportlab'.
- Transactions: record Purchase (stock in) and Sale (stock out); stock updates automatically.

If you don't know, ask a short clarifying question.
"""


def _local_answer(message: str, context: dict | None = None):
    text = (message or "").lower()
    path = (context or {}).get("path") or ""

    if "export" in text and ("pdf" in text or "csv" in text):
        return {
            "answer": "Go to Reports → choose Report Type and Date Range → click Export CSV or Export PDF. If PDF fails, restart backend and ensure reportlab is installed.",
            "suggestions": [{"label": "Open Reports", "to": "/reports"}],
        }

    if "purchase" in text or "sale" in text or "transaction" in text:
        return {
            "answer": "Go to Transactions → Add Transaction → choose Purchase or Sale, select product, quantity, optional price/notes → Add Transaction. Stock updates automatically and the transaction is saved.",
            "suggestions": [{"label": "Open Transactions", "to": "/transactions"}],
        }

    if "reorder" in text or "min" in text and "stock" in text or "max" in text and "stock" in text:
        return {
            "answer": "Reorder Point = when the system marks an item as Low Stock. Min Stock is your minimum safe buffer. Max Stock is your preferred upper limit. Low-stock alerts use Reorder Point (fallback: Min Stock).",
            "suggestions": [{"label": "Open Inventory", "to": "/inventory"}],
        }

    if "low stock" in text or "alert" in text:
        return {
            "answer": "Low Stock is shown when Quantity < Reorder Point (fallback: Min Stock). You can set these values in Inventory when adding/editing a product.",
            "suggestions": [{"label": "Low stock list", "to": "/inventory?filter=low-stock"}],
        }

    return {
        "answer": f"I can help with Inventory, Reports, and Transactions. Ask what you want to do (you’re on {path}).",
        "suggestions": [
            {"label": "Inventory", "to": "/inventory"},
            {"label": "Reports", "to": "/reports"},
            {"label": "Transactions", "to": "/transactions"},
        ],
    }

def _openai_answer(message: str, context: dict | None = None):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except Exception:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    path = (context or {}).get("path") or ""
    role = (context or {}).get("role") or ""

    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context: path={path}, role={role}\n\nUser: {message}"},
        ],
        temperature=0.3,
        max_tokens=250,
    )
    content = (resp.choices[0].message.content or "").strip()
    if not content:
        return None
    return {"answer": content, "suggestions": []}


@assistant.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    message = data.get("message", "")
    context = data.get("context") or {}
    ai = _openai_answer(message, context)
    if ai:
        return jsonify(ai), 200
    return jsonify(_local_answer(message, context)), 200

