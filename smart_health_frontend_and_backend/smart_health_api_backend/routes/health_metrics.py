from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from utils import serialize_doc, success, error, validate_number

health_bp = Blueprint("health_metrics", __name__)


# ── GET /health-metrics ─────────────────────────────────────────────────────────
@health_bp.route("/health-metrics", methods=["GET"])
@jwt_required()
def get_health_metrics():
    """Get the authenticated user's current health metrics."""
    user_id = get_jwt_identity()
    user = current_app.db.users.find_one(
        {"_id": ObjectId(user_id)}, {"health_metrics": 1, "weight_kg": 1, "height_cm": 1}
    )
    if not user:
        return error("User not found", 404)

    metrics = user.get("health_metrics", {})
    # Compute BMI inline
    w = user.get("weight_kg")
    h = user.get("height_cm")
    if w and h:
        h_m = h / 100
        metrics["bmi"] = round(w / (h_m ** 2), 2)

    return success(serialize_doc(metrics))


# ── PUT /health-metrics ─────────────────────────────────────────────────────────
@health_bp.route("/health-metrics", methods=["PUT"])
@jwt_required()
def update_health_metrics():
    """Update the authenticated user's health metrics."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    updates = {}

    if "heart_rate" in data:
        if not validate_number(data["heart_rate"], 20, 300):
            return error("heart_rate (bpm) must be between 20 and 300", 400)
        updates["health_metrics.heart_rate"] = int(data["heart_rate"])

    if "systolic_bp" in data:
        if not validate_number(data["systolic_bp"], 50, 300):
            return error("systolic_bp must be between 50 and 300", 400)
        updates["health_metrics.systolic_bp"] = int(data["systolic_bp"])

    if "diastolic_bp" in data:
        if not validate_number(data["diastolic_bp"], 30, 200):
            return error("diastolic_bp must be between 30 and 200", 400)
        updates["health_metrics.diastolic_bp"] = int(data["diastolic_bp"])

    if "sleep_hours" in data:
        if not validate_number(data["sleep_hours"], 0, 24):
            return error("sleep_hours must be between 0 and 24", 400)
        updates["health_metrics.sleep_hours"] = float(data["sleep_hours"])

    if "resting_heart_rate" in data:
        if not validate_number(data["resting_heart_rate"], 20, 200):
            return error("resting_heart_rate must be between 20 and 200", 400)
        updates["health_metrics.resting_heart_rate"] = int(data["resting_heart_rate"])

    if "vo2_max" in data:
        if not validate_number(data["vo2_max"], 10, 100):
            return error("vo2_max must be between 10 and 100", 400)
        updates["health_metrics.vo2_max"] = float(data["vo2_max"])

    if not updates:
        return error("No valid fields provided. Accepted: heart_rate, systolic_bp, "
                     "diastolic_bp, sleep_hours, resting_heart_rate, vo2_max", 400)

    updates["health_metrics.updated_at"] = datetime.utcnow()

    user_id = get_jwt_identity()
    current_app.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    user = current_app.db.users.find_one(
        {"_id": ObjectId(user_id)}, {"health_metrics": 1, "weight_kg": 1, "height_cm": 1}
    )
    metrics = user.get("health_metrics", {})
    w = user.get("weight_kg")
    h = user.get("height_cm")
    if w and h:
        metrics["bmi"] = round(w / ((h / 100) ** 2), 2)

    return success(serialize_doc(metrics), "Health metrics updated")
