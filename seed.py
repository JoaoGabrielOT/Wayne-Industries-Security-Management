"""Seed script: creates test users and sample resources."""
from app import app
from models import db, User, UserRole, Resource
SEED_USERS = [
    {"email": "admin@wayne.com", "password": "wayne123", "full_name": "Bruce Wayne", "role": "security_admin"},
    {"email": "manager@wayne.com", "password": "wayne123", "full_name": "Lucius Fox", "role": "manager"},
    {"email": "employee@wayne.com", "password": "wayne123", "full_name": "Tim Drake", "role": "employee"},
]
SEED_RESOURCES = [
    # Equipment
    {"name": "Batarangs (Set A)", "type": "equipment", "status": "active", "location": "Batcave", "description": "Standard throwing batarangs, set of 12"},
    {"name": "Grapple Gun MK-V", "type": "equipment", "status": "active", "location": "Batcave", "description": "Pneumatic grapple launcher with 200m line"},
    {"name": "Smoke Pellets", "type": "equipment", "status": "available", "location": "Batcave", "description": "Tactical smoke screen pellets"},
    {"name": "EMP Device", "type": "equipment", "status": "maintenance", "location": "R&D Lab", "description": "Localized EMP generator"},
    {"name": "Forensics Kit", "type": "equipment", "status": "active", "location": "Wayne Tower", "description": "Portable crime scene analysis kit"},
    {"name": "Cryptographic Sequencer", "type": "equipment", "status": "active", "location": "Batcave", "description": "Electronic lock bypass device"},
    # Vehicles
    {"name": "Batmobile MK-IV", "type": "vehicle", "status": "active", "location": "Batcave", "description": "Primary tactical vehicle with stealth capabilities"},
    {"name": "Batcycle", "type": "vehicle", "status": "available", "location": "Batcave", "description": "High-speed pursuit motorcycle"},
    {"name": "Batwing", "type": "vehicle", "status": "maintenance", "location": "Hangar", "description": "VTOL stealth aircraft"},
    {"name": "Batboat", "type": "vehicle", "status": "inactive", "location": "Harbor Bay", "description": "Submersible watercraft"},
    {"name": "Executive Sedan", "type": "vehicle", "status": "in_use", "location": "Wayne Tower", "description": "Armored executive transport"},
    {"name": "Supply Van WI-03", "type": "vehicle", "status": "available", "location": "Warehouse District", "description": "Unmarked supply vehicle"},
    # Security Devices
    {"name": "CCTV Hub Alpha", "type": "security_device", "status": "active", "location": "Wayne Tower", "description": "Central camera monitoring hub — 48 feeds"},
    {"name": "Perimeter Sensor Net", "type": "security_device", "status": "active", "location": "Wayne Manor", "description": "Motion & thermal sensors across grounds"},
    {"name": "Biometric Scanner Lobby", "type": "security_device", "status": "active", "location": "Wayne Tower", "description": "Multi-factor biometric access point"},
    {"name": "Silent Alarm Grid", "type": "security_device", "status": "active", "location": "Batcave", "description": "Intrusion detection with silent alerting"},
    {"name": "Drone Patrol Unit 1", "type": "security_device", "status": "maintenance", "location": "R&D Lab", "description": "Autonomous perimeter surveillance drone"},
    {"name": "Comm Jammer Portable", "type": "security_device", "status": "available", "location": "Armory", "description": "Portable RF communications jammer"},
]
with app.app_context():
    db.create_all()
    for u_data in SEED_USERS:
        existing = User.query.filter_by(email=u_data["email"]).first()
        if existing:
            print(f"  User {u_data['email']} already exists, skipping.")
            continue
        user = User(email=u_data["email"], full_name=u_data["full_name"])
        user.set_password(u_data["password"])
        db.session.add(user)
        db.session.flush()
        role = UserRole(user_id=user.id, role=u_data["role"])
        db.session.add(role)
        print(f"  Created user: {u_data['email']} ({u_data['role']})")
    for r_data in SEED_RESOURCES:
        existing = Resource.query.filter_by(name=r_data["name"]).first()
        if existing:
            continue
        resource = Resource(**r_data)
        db.session.add(resource)
    db.session.commit()
    print("Seed complete!")
