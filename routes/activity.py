from flask import Blueprint, jsonify
from models import ActivityLog
from middleware import role_required

activity_bp = Blueprint("activity", __name__, url_prefix="/api/activity")


@activity_bp.route("", methods=["GET"])
@role_required("manager", "security_admin")
def list_activity(user):
    logs = (
        ActivityLog.query
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([l.to_dict() for l in logs])
