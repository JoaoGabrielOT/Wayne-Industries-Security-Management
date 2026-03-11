from flask import Blueprint, request, jsonify
from models import db, User, UserRole, ActivityLog
from middleware import role_required

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("", methods=["GET"])
@role_required("security_admin")
def list_users(user):
    all_users = User.query.all()
    result = []
    for u in all_users:
        role_obj = UserRole.query.filter_by(user_id=u.id).first()
        result.append({
            "user_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": role_obj.role if role_obj else "employee",
            "role_id": role_obj.id if role_obj else None,
        })
    return jsonify(result)


@users_bp.route("/<target_user_id>/role", methods=["PUT"])
@role_required("security_admin")
def update_role(user, target_user_id):
    data = request.get_json()
    new_role = data.get("role")

    if new_role not in ("employee", "manager", "security_admin"):
        return jsonify({"error": "Invalid role"}), 400

    target = User.query.get(target_user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    role_obj = UserRole.query.filter_by(user_id=target_user_id).first()
    if role_obj:
        role_obj.role = new_role
    else:
        role_obj = UserRole(user_id=target_user_id, role=new_role)
        db.session.add(role_obj)

    log = ActivityLog(
        user_id=user.id,
        action=f"Changed role for {target.full_name} to {new_role}",
        entity_type="user",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": f"{target.full_name} is now {new_role.replace('_', ' ')}."})
