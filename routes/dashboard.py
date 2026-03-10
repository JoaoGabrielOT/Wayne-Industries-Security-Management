from flask import Blueprint, jsonify
from models import Resource, ActivityLog
from middleware import login_required
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
@dashboard_bp.route("/stats", methods=["GET"])
@login_required
def stats(user):
    resources = Resource.query.all()
    total_equipment = sum(1 for r in resources if r.type == "equipment")
    total_vehicles = sum(1 for r in resources if r.type == "vehicle")
    total_devices = sum(1 for r in resources if r.type == "security_device")
    active_devices = sum(1 for r in resources if r.status == "active")
    maintenance_items = sum(1 for r in resources if r.status == "maintenance")
    available_items = sum(1 for r in resources if r.status == "available")
    result = {
        "totalEquipment": total_equipment,
        "totalVehicles": total_vehicles,
        "totalDevices": total_devices,
        "activeDevices": active_devices,
        "maintenanceItems": maintenance_items,
        "availableItems": available_items,
        "totalResources": len(resources),
    }
    # Include recent logs for managers/admins
    if user.is_manager_or_admin():
        logs = (
            ActivityLog.query
            .order_by(ActivityLog.created_at.desc())
            .limit(10)
            .all()
        )
        result["recentLogs"] = [l.to_dict() for l in logs]
    return jsonify(result)