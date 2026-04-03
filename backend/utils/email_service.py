import os
import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import users_collection, products_collection

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _mail_creds():
    """Load SMTP creds; strip whitespace (common .env copy/paste issue → 535)."""
    user = (os.getenv("MAIL_USERNAME") or os.getenv("MAIL_USER") or "").strip()
    password = (os.getenv("MAIL_PASSWORD") or "").strip()
    mail_from = (os.getenv("MAIL_FROM") or user or "").strip()
    mail_server = (os.getenv("MAIL_SERVER") or "smtp.gmail.com").strip()
    mail_port = int(os.getenv("MAIL_PORT") or "587")
    return user, password, mail_from, mail_server, mail_port


def _smtp_error_hint(exc: Exception) -> str:
    """Turn common Gmail SMTP failures into actionable text."""
    raw = str(exc)
    if (
        "535" in raw
        or "BadCredentials" in raw
        or "Username and Password not accepted" in raw
        or "authentication failed" in raw.lower()
    ):
        return (
            "Gmail rejected login (535 / bad credentials). Fix: "
            "Enable 2-Step Verification on the Google account → create an App Password at "
            "https://myaccount.google.com/apppasswords (Mail / “Smart Stock”). "
            "Put that 16-character password in MAIL_PASSWORD in backend/.env — not your normal Gmail password. "
            "MAIL_USERNAME and MAIL_FROM must be that same Gmail address. Restart the backend after saving."
        )
    return f"SMTP error: {exc}"


def send_low_stock_email(product_name, current_qty, threshold_qty):
    """
    Sends a low stock alert email to all admins who have email alerts enabled.
    """
    mail_user, mail_pass, mail_from, mail_server, mail_port = _mail_creds()

    if not mail_user or not mail_pass:
        print("⚠️ Email credentials not set. Skipping low stock email alert.")
        return False
    if "your_gmail" in (mail_user or "").lower() or (mail_pass or "").strip().lower() in ("your_app_password", "password"):
        print("⚠️ Email credentials are still placeholders. Update backend/.env with real Gmail + App Password.")
        return False

    # Find all admins with email alerts enabled (assume enabled if not explicitly false)
    admins = users_collection.find({"role": "admin"})
    recipients = [admin["email"] for admin in admins if admin.get("email_alerts_enabled", True)]

    if not recipients:
        print("ℹ️ No eligible admins found to receive low stock alerts.")
        return False

    subject = f"⚠️ Low Stock Alert: {product_name}"
    sent_at = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    body = f"""
    Hello,

    This is an automated low-stock update from your Smart Stock Inventory System.

    A product has just dropped below its reorder / minimum threshold:

    Product: {product_name}
    Current quantity: {current_qty}
    Threshold (reorder / min): {threshold_qty}

    Please restock this item when possible.

    Open Alerts (all low-stock items): {FRONTEND_URL}/alerts
    Open Inventory: {FRONTEND_URL}/inventory

    —
    Sent at {sent_at}
    """
    try:
        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_user, mail_pass)
            for to_email in recipients:
                msg_single = MIMEMultipart()
                msg_single["From"] = mail_from
                msg_single["To"] = to_email
                msg_single["Subject"] = subject
                msg_single.attach(MIMEText(body.strip(), "plain"))
                server.sendmail(mail_from, to_email, msg_single.as_string())
        print(f"✅ Low stock email alert sent successfully to {len(recipients)} admins.")
        return True
    except Exception as e:
        print(f"❌ Failed to send low stock email: {e}")
        print(_smtp_error_hint(e))
        return False


def _fetch_low_stock_snapshot(limit: int = 100):
    """
    Products where quantity < reorder_point (fallback min_stock_threshold, default 5).
    Same logic as GET /api/products/alerts.
    """
    pipeline = [
        {
            "$addFields": {
                "threshold": {"$ifNull": ["$reorder_point", {"$ifNull": ["$min_stock_threshold", 5]}]},
            }
        },
        {"$match": {"$expr": {"$lt": ["$quantity", "$threshold"]}}},
        {"$sort": {"name": 1}},
        {"$limit": limit},
        {"$project": {"name": 1, "quantity": 1, "threshold": 1}},
    ]
    rows = []
    for doc in products_collection.aggregate(pipeline):
        try:
            qty = int(doc.get("quantity", 0))
        except (TypeError, ValueError):
            qty = 0
        try:
            th = int(doc.get("threshold", 5))
        except (TypeError, ValueError):
            th = 5
        rows.append(
            {
                "name": doc.get("name") or "Product",
                "quantity": qty,
                "threshold": th,
            }
        )
    return rows


def notify_low_stock(product_name: str, current_qty, threshold_qty):
    """Email admins + optional SMS to numbers in LOW_STOCK_SMS_TO."""
    send_low_stock_email(product_name, current_qty, threshold_qty)
    try:
        from utils.sms_service import send_low_stock_sms
        send_low_stock_sms(product_name, current_qty, threshold_qty)
    except Exception as e:
        print(f"⚠️ SMS notification skipped: {e}")


def send_test_email(to_address: str):
    """
    Verify SMTP by emailing a live snapshot of products currently below reorder/min threshold
    (same rules as the Alerts page). If none are low, the mail still confirms SMTP works.
    Returns (success, message_for_user).
    """
    mail_user, mail_pass, mail_from, mail_server, mail_port = _mail_creds()

    if not mail_user or not mail_pass:
        return False, "SMTP not configured: set MAIL_USERNAME and MAIL_PASSWORD in backend/.env."
    if "your_gmail" in (mail_user or "").lower() or (mail_pass or "").strip().lower() in ("your_app_password", "password"):
        return False, "SMTP still using placeholders: put your real Gmail in MAIL_USERNAME/MAIL_FROM and a Google App Password in MAIL_PASSWORD (see .env.example)."

    try:
        low = _fetch_low_stock_snapshot(limit=100)
    except Exception as e:
        return False, f"Could not read low-stock list from database: {e}"

    sent_at = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    if low:
        lines = [
            f"{i}. {r['name']} — qty {r['quantity']} (threshold {r['threshold']})"
            for i, r in enumerate(low, start=1)
        ]
        list_block = "\n".join(lines)
        more = ""
        if len(low) >= 100:
            more = "\n(Showing first 100 low-stock items.)\n"
        body = f"""Smart Stock — low stock snapshot (SMTP test)

These products are below reorder / min threshold right now:

{list_block}
{more}
Full list in the app: {FRONTEND_URL}/alerts
Inventory: {FRONTEND_URL}/inventory

When stock crosses below threshold after a sale or edit, admins also get an automatic alert email (if SMTP is configured).

— Sent at {sent_at}"""
        subject = f"Smart Stock — low stock snapshot ({len(low)} item{'s' if len(low) != 1 else ''})"
        success_note = f"Test email sent with {len(low)} low-stock product(s) listed. Check inbox and spam."
    else:
        body = f"""Smart Stock — low stock snapshot (SMTP test)

No products are currently below their reorder / minimum threshold.

SMTP is working. Automatic low-stock emails are sent when quantity drops from at or above the threshold to below it (e.g. after a sale).

Alerts page: {FRONTEND_URL}/alerts
Inventory: {FRONTEND_URL}/inventory

— Sent at {sent_at}"""
        subject = "Smart Stock — low stock snapshot (0 items, SMTP OK)"
        success_note = "Test email sent. No low-stock items right now — message confirms SMTP only. Check inbox and spam."

    try:
        msg = MIMEMultipart()
        msg["From"] = mail_from
        msg["To"] = to_address
        msg["Subject"] = subject
        msg.attach(MIMEText(body.strip(), "plain"))
        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_user, mail_pass)
            server.sendmail(mail_from, to_address, msg.as_string())
        return True, success_note
    except Exception as e:
        return False, _smtp_error_hint(e)
