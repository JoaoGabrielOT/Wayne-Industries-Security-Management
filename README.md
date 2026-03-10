# Wayne Industries — Security Management System
## Flask + MySQL + Vanilla JS Migration
### Project Overview
Wayne Industries internal security and resource management platform for Gotham City operations. This system provides role-based access control, resource inventory management (equipment, vehicles, security devices), activity logging, and a visualization dashboard.
### Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Backend:** Python 3.10+ with Flask
- **Database:** MySQL 8.0+
- **Authentication:** Flask session-based auth with `werkzeug` password hashing
- **Charts:** Chart.js (CDN)
### Project Structure
```
migration-reference/
├── app.py                  # Flask application entry point
├── config.py               # Configuration (DB, secret key)
├── models.py               # SQLAlchemy ORM models
├── routes/
│   ├── __init__.py
│   ├── auth.py             # Login, register, logout, session
│   ├── resources.py        # CRUD for equipment/vehicles/devices
│   ├── users.py            # User management (admin only)
│   ├── activity.py         # Activity logs
│   └── dashboard.py        # Dashboard stats API
├── middleware.py            # Auth decorators (login_required, role_required)
├── seed.py                 # Seed script for test users & resources
├── schema.sql              # MySQL schema
├── requirements.txt        # Python dependencies
└── static/
    ├── index.html           # SPA shell
    ├── styles.css           # Full CSS (dark Gotham theme)
    └── script.js            # All frontend logic (routing, API, DOM)
```
### Setup Instructions
#### 1. Install MySQL
```bash
# macOS
brew install mysql && brew services start mysql
# Ubuntu/Debian
sudo apt install mysql-server && sudo systemctl start mysql
```
#### 2. Create Database
```bash
mysql -u root -p
```
```sql
CREATE DATABASE wayne_industries CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wayne'@'localhost' IDENTIFIED BY 'gotham2026';
GRANT ALL PRIVILEGES ON wayne_industries.* TO 'wayne'@'localhost';
FLUSH PRIVILEGES;
```
#### 3. Run Schema
```bash
mysql -u wayne -pgotham2026 wayne_industries < schema.sql
```
#### 4. Install Python Dependencies
```bash
cd migration-reference
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
#### 5. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```
#### 6. Seed Data
```bash
python seed.py
```
#### 7. Run the Application
```bash
python app.py
```
Open http://localhost:5000
### Test Credentials
| Role             | Email               | Password  |
|------------------|---------------------|-----------|
| Security Admin   | admin@wayne.com     | wayne123  |
| Manager          | manager@wayne.com   | wayne123  |
| Employee         | employee@wayne.com  | wayne123  |
### API Endpoints
| Method | Endpoint                  | Auth     | Description                    |
|--------|---------------------------|----------|--------------------------------|
| POST   | /api/auth/login           | Public   | Login with email/password      |
| POST   | /api/auth/register        | Public   | Register new account           |
| POST   | /api/auth/logout          | Auth     | Logout                         |
| GET    | /api/auth/me              | Auth     | Current user info + role       |
| GET    | /api/dashboard/stats      | Auth     | Dashboard statistics           |
| GET    | /api/resources?type=X     | Auth     | List resources by type         |
| POST   | /api/resources            | Manager+ | Create resource                |
| PUT    | /api/resources/:id        | Manager+ | Update resource                |
| DELETE | /api/resources/:id        | Admin    | Delete resource                |
| GET    | /api/activity             | Manager+ | Activity logs                  |
| GET    | /api/users                | Admin    | List users with roles          |
| PUT    | /api/users/:id/role       | Admin    | Change user role               |
