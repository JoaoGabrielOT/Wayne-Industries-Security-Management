from functools import wraps
from flask import session, jsonify
from models import User
def get_current_user():
    """Get the currently authenticated user from session."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)
def login_required(f):
    """Decorator: require authenticated user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(user, *args, **kwargs)
    return decorated
def role_required(*required_roles):
    """Decorator: require one of the specified roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Authentication required"}), 401
            if not any(user.has_role(r) for r in required_roles):
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(user, *args, **kwargs)
        return decorated
    return decorator