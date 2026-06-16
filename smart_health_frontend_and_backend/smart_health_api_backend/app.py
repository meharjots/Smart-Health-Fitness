from flask import Flask
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from pymongo import MongoClient
from datetime import timedelta
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})

# ── Configuration ──────────────────────────────────────────────────────────────
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "smart-health-secret-key-2026")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/smart_health_db")

# ── Extensions ─────────────────────────────────────────────────────────────────
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

client = MongoClient(app.config["MONGO_URI"])
db = client.get_default_database()

# Expose db and bcrypt to routes via app context
app.db = db
app.bcrypt = bcrypt

# ── Register Blueprints ─────────────────────────────────────────────────────────
from routes.auth import auth_bp
from routes.users import users_bp
from routes.activities import activities_bp
from routes.nutrition import nutrition_bp
from routes.health_metrics import health_bp
from routes.goals import goals_bp
from routes.analytics import analytics_bp

app.register_blueprint(auth_bp,       url_prefix="/api")
app.register_blueprint(users_bp,      url_prefix="/api")
app.register_blueprint(activities_bp, url_prefix="/api")
app.register_blueprint(nutrition_bp,  url_prefix="/api")
app.register_blueprint(health_bp,     url_prefix="/api")
app.register_blueprint(goals_bp,      url_prefix="/api")
app.register_blueprint(analytics_bp,  url_prefix="/api")

# ── Health check ───────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return {"message": "Smart Health & Fitness API", "version": "1.0", "status": "running"}, 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
