from flask import Blueprint, request, jsonify
from database import users_collection, reset_tokens_collection
import bcrypt
import jwt
import datetime
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps

auth = Blueprint("auth", __name__)

# ================= CONFIG =================
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
JWT_EXPIRE_MINUTES = 60
RESET_TOKEN_EXPIRE_MINUTES = 30
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# ==========================================


# ---------- EMAIL HELPER ----------
def send_reset_email(to_email: str, reset_token: str) -> bool:
    """Send password reset email. Returns True if sent, False otherwise."""
    mail_user = os.getenv("MAIL_USERNAME") or os.getenv("MAIL_USER")
    mail_pass = os.getenv("MAIL_PASSWORD")
    mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_port = int(os.getenv("MAIL_PORT", "587"))
    mail_from = os.getenv("MAIL_FROM") or mail_user

    if not mail_user or not mail_pass or "your_gmail" in (mail_user or "").lower():
        return False

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    msg = MIMEMultipart()
    msg["From"] = mail_from
    msg["To"] = to_email
    msg["Subject"] = "Reset Your Password - Smart Stock"

    body = f"""
    Hello,

    You requested a password reset. Click the link below to set a new password:

    {reset_link}

    This link expires in {RESET_TOKEN_EXPIRE_MINUTES} minutes.

    If you didn't request this, please ignore this email.
    """
    msg.attach(MIMEText(body.strip(), "plain"))

    try:
        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_user, mail_pass)
            server.sendmail(mail_from, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False


# ---------- PASSWORD HELPERS ----------
def hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())


def verify_password(password: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed)


# ---------- JWT HELPERS ----------
def create_token(email: str, role: str):
    payload = {
        "sub": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]

        if not token:
            return jsonify({"msg": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = users_collection.find_one({"email": data["sub"]})
            if not current_user:
                return jsonify({"msg": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"msg": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"msg": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# ================= ROUTES =================

@auth.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        print(f"[REGISTER] Request received: {data}")

        email = (data.get("email") or "").strip().lower()
        password = data.get("password")
        name = (data.get("name") or "").strip()

        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400

        if len(password) < 6:
            return jsonify({"msg": "Password must be at least 6 characters"}), 400

        print(f"[REGISTER] Checking if user exists: {email}")
        if users_collection.find_one({"email": email}):
            print(f"[REGISTER] User already exists: {email}")
            return jsonify({"msg": "User already exists"}), 400

        print(f"[REGISTER] Hashing password")
        hashed_pw = hash_password(password)

        print(f"[REGISTER] Inserting user into database")
        users_collection.insert_one({
            "email": email,
            "name": name,
            "password": hashed_pw,
            "role": data.get("role", "employee"),
            "email_alerts_enabled": True,  # Default to ON
            "created_at": datetime.datetime.utcnow()
        })

        print(f"[REGISTER] User registered successfully: {email}")
        return jsonify({"msg": "User registered successfully"}), 201
    except Exception as e:
        print(f"[REGISTER] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"msg": f"Registration error: {str(e)}"}), 500


@auth.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = (data.get("email") or "").strip().lower()
        password = data.get("password")

        print(f"[LOGIN] Attempting login for: {email}")

        if not email or not password:
            return jsonify({"msg": "Email and password required"}), 400

        user = users_collection.find_one({"email": email})

        if not user:
            print(f"[LOGIN] User not found: {email}")
            return jsonify({"msg": "Invalid email or password"}), 401

        if not verify_password(password, user["password"]):
            print(f"[LOGIN] Password mismatch for: {email}")
            return jsonify({"msg": "Invalid email or password"}), 401

        print(f"[LOGIN] Login successful for: {email}")
        token = create_token(user["email"], user["role"])

        return jsonify({
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"]
        }), 200
    except Exception as e:
        print(f"[LOGIN] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"msg": f"Login error: {str(e)}"}), 500


@auth.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify({
        "email": current_user["email"],
        "name": current_user.get("name", ""),
        "role": current_user["role"],
        "email_alerts_enabled": current_user.get("email_alerts_enabled", True),
        "created_at": current_user["created_at"]
    }), 200


@auth.route("/settings", methods=["PUT"])
@token_required
def update_settings(current_user):
    """Update user preferences like email alerts."""
    data = request.json
    update_fields = {}
    
    if "email_alerts_enabled" in data:
        update_fields["email_alerts_enabled"] = bool(data["email_alerts_enabled"])
        
    if not update_fields:
        return jsonify({"msg": "No settings to update"}), 400
        
    users_collection.update_one(
        {"email": current_user["email"]}, 
        {"$set": update_fields}
    )
    
    return jsonify({"msg": "Settings updated successfully", "settings": update_fields}), 200


@auth.route("/test-email", methods=["POST"])
@token_required
def test_email(current_user):
    """Admin only: verify SMTP by emailing a current low-stock snapshot to the logged-in user."""
    if current_user.get("role") != "admin":
        return jsonify({"msg": "Only admins can send a test email"}), 403
    from utils.email_service import send_test_email
    ok, detail = send_test_email(current_user["email"])
    if ok:
        return jsonify({"msg": detail}), 200
    return jsonify({"msg": detail}), 400


@auth.route("/users", methods=["GET"])
@token_required
def get_all_users(current_user):
    if current_user["role"] != "admin":
        return jsonify({"msg": "Not authorized"}), 403

    users = list(users_collection.find({}, {"_id": 0, "password": 0}))
    return jsonify(users), 200


@auth.route("/users/<email>", methods=["DELETE"])
@token_required
def delete_user(current_user, email):
    if current_user["role"] != "admin":
        return jsonify({"msg": "Not authorized"}), 403

    if current_user["email"] == email:
        return jsonify({"msg": "Cannot delete yourself"}), 400

    result = users_collection.delete_one({"email": email})

    if result.deleted_count == 0:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"msg": "User deleted successfully"}), 200


# ================= PASSWORD RESET =================

@auth.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Request password reset. Sends email if user exists (don't reveal existence)."""
    data = request.json
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"msg": "Email is required"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        # Always return success to avoid email enumeration
        return jsonify({"msg": "If that email exists, a reset link has been sent"}), 200

    # Invalidate any existing reset tokens for this email
    reset_tokens_collection.delete_many({"email": email})

    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

    reset_tokens_collection.insert_one({
        "email": email,
        "token": token,
        "expires_at": expires_at,
        "created_at": datetime.datetime.utcnow()
    })

    email_sent = send_reset_email(email, token)

    # For development: if email not configured and ALLOW_DEV_RESET_LINK is set
    if not email_sent and os.getenv("ALLOW_DEV_RESET_LINK", "").lower() == "true":
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        return jsonify({"msg": "Check your email or use the link below (dev mode)", "reset_link": reset_link}), 200

    return jsonify({"msg": "If that email exists, a reset link has been sent"}), 200


@auth.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using token from email link."""
    data = request.json
    token = (data.get("token") or "").strip()
    new_password = data.get("password")

    if not token:
        return jsonify({"msg": "Reset token is required"}), 400
    if not new_password or len(new_password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters"}), 400

    record = reset_tokens_collection.find_one({"token": token})
    if not record:
        return jsonify({"msg": "Invalid or expired reset link"}), 400

    if datetime.datetime.utcnow() > record["expires_at"]:
        reset_tokens_collection.delete_one({"token": token})
        return jsonify({"msg": "Reset link has expired. Please request a new one"}), 400

    hashed_pw = hash_password(new_password)
    users_collection.update_one({"email": record["email"]}, {"$set": {"password": hashed_pw}})
    reset_tokens_collection.delete_one({"token": token})

    return jsonify({"msg": "Password reset successfully"}), 200