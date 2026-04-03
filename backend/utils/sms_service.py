"""
Optional Twilio SMS for low-stock alerts.
Set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, LOW_STOCK_SMS_TO (+15551234567,+15559876543)
Install: pip install twilio
"""
import os


def send_low_stock_sms(product_name: str, current_qty, threshold_qty) -> bool:
    nums_raw = (os.getenv("LOW_STOCK_SMS_TO") or "").strip()
    if not nums_raw:
        return False

    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_FROM_NUMBER")
    if not sid or not token or not from_num:
        print("⚠️ Twilio env vars not set. Skipping low stock SMS.")
        return False

    try:
        from twilio.rest import Client
    except ImportError:
        print("⚠️ twilio package not installed. Run: pip install twilio")
        return False

    body = (
        f"Smart Stock: LOW STOCK\n{product_name}\n"
        f"Qty: {current_qty} (below {threshold_qty})\n"
        f"Open: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}/inventory"
    )

    client = Client(sid, token)
    recipients = [n.strip() for n in nums_raw.split(",") if n.strip()]
    sent = 0
    for to in recipients:
        try:
            client.messages.create(to=to, from_=from_num, body=body)
            sent += 1
        except Exception as e:
            print(f"❌ Twilio SMS failed for {to}: {e}")
    if sent:
        print(f"✅ Low stock SMS sent to {sent} number(s).")
    return sent > 0
