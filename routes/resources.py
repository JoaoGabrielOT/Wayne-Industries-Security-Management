from flask import Blueprint, request, jsonify
from models import db, Resource, ActivityLog
from middleware import login_required, role_required

resources_bp = Blueprint("resources", __name__, url_prefix="/api/resources")


@resources_bp.route("", methods=["GET"])
@login_required
def list_resources(user):
    resource_type = request.args.get("type", "equipment")
    resources = (
        Resource.query
        .filter_by(type=resource_type)
        .order_by(Resource.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in resources])


@resources_bp.route("", methods=["POST"])
@role_required("manager", "security_admin")
def create_resource(user):
    data = request.get_json()
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Name is required."}), 400

    resource = Resource(
        name=name,
        type=data.get("type", "equipment"),
        status=data.get("status", "available"),
        location=data.get("location", "Wayne Tower"),
        description=data.get("description"),
        created_by=user.id,
    )
    db.session.add(resource)

    log = ActivityLog(
        user_id=user.id,
        action=f"Created {resource.type}: {name}",
        entity_type=resource.type,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify(resource.to_dict()), 201


@resources_bp.route("/<resource_id>", methods=["PUT"])
@role_required("manager", "security_admin")
def update_resource(user, resource_id):
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    data = request.get_json()
    resource.name = data.get("name", resource.name)
    resource.status = data.get("status", resource.status)
    resource.location = data.get("location", resource.location)
    resource.description = data.get("description", resource.description)

    log = ActivityLog(
        user_id=user.id,
        action=f"Updated {resource.type}: {resource.name}",
        entity_type=resource.type,
        entity_id=resource.id,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify(resource.to_dict())


@resources_bp.route("/<resource_id>", methods=["DELETE"])
@role_required("security_admin")
def delete_resource(user, resource_id):
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    log = ActivityLog(
        user_id=user.id,
        action=f"Deleted {resource.type}: {resource.name}",
        entity_type=resource.type,
        entity_id=resource.id,
    )
    db.session.add(log)
    db.session.delete(resource)
    db.session.commit()

    return jsonify({"message": f"{resource.name} has been removed."})
