import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
db = SQLAlchemy()
def gen_uuid():
    return str(uuid.uuid4())
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False, default="")
    avatar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    roles = db.relationship("UserRole", backref="user", cascade="all, delete-orphan")
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    def get_role(self):
        if self.roles:
            return self.roles[0].role
        return "employee"
    def has_role(self, role):
        return any(r.role == role for r in self.roles)
    def is_admin(self):
        return self.has_role("security_admin")
    def is_manager_or_admin(self):
        return self.has_role("manager") or self.has_role("security_admin")
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "role": self.get_role(),
            "created_at": self.created_at.isoformat(),
        }
class UserRole(db.Model):
    __tablename__ = "user_roles"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.Enum("employee", "manager", "security_admin"), nullable=False, default="employee")
    __table_args__ = (db.UniqueConstraint("user_id", "role", name="unique_user_role"),)
class Resource(db.Model):
    __tablename__ = "resources"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.Enum("equipment", "vehicle", "security_device"), nullable=False)
    status = db.Column(db.Enum("active", "inactive", "available", "in_use", "maintenance"),
                       nullable=False, default="available")
    location = db.Column(db.String(255), nullable=False, default="Wayne Tower")
    description = db.Column(db.Text, nullable=True)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)
    created_by = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "status": self.status,
            "location": self.location,
            "description": self.description,
            "metadata": self.metadata_json,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
class ActivityLog(db.Model):
    __tablename__ = "activity_logs"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = db.Column(db.String(500), nullable=False)
    entity_type = db.Column(db.String(100), nullable=True)
    entity_id = db.Column(db.String(36), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "details": self.details,
            "created_at": self.created_at.isoformat(),
        }