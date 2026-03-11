from flask import Blueprint, request, jsonify, session
from models import db, User, UserRole

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already registered"}), 409

    user = User(email=email, full_name=full_name or email)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    role = UserRole(user_id=user.id, role="employee")
    db.session.add(role)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"user": user.to_dict(), "message": "Welcome to Wayne Industries."}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid login credentials"}), 401

    session["user_id"] = user.id
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Signed out"})


@auth_bp.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None}), 401

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({"user": None}), 401

    return jsonify({"user": user.to_dict()})
