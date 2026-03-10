from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
app = Flask(__name__, static_folder="static", static_url_path="")
app.config.from_object(Config)
CORS(app, supports_credentials=True)
db.init_app(app)
# Register blueprints
from routes.auth import auth_bp
from routes.resources import resources_bp
from routes.dashboard import dashboard_bp
from routes.users import users_bp
from routes.activity import activity_bp
app.register_blueprint(auth_bp)
app.register_blueprint(resources_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(users_bp)
app.register_blueprint(activity_bp)
# Serve the SPA
@app.route("/")
@app.route("/<path:path>")
def serve_spa(path=""):
    return send_from_directory("static", "index.html")
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
