from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from utils import serialize_doc, success, error, validate_number

goals_bp = Blueprint("goals", __name__)


# ── GET /goals ──────────────────────────────────────────────────────────────────
@goals_bp.route("/goals", methods=["GET"])
@jwt_required()
def get_goals():
    """Get the authenticated user's fitness goals."""
    user_id = get_jwt_identity()
    user = current_app.db.users.find_one({"_id": ObjectId(user_id)}, {"fitness_goals": 1})
    if not user:
        return error("User not found", 404)
    return success(serialize_doc(user.get("fitness_goals", {})))


# ── PUT /goals ──────────────────────────────────────────────────────────────────
@goals_bp.route("/goals", methods=["PUT"])
@jwt_required()
def update_goals():
    """Set or update the authenticated user's fitness goals."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    updates = {}

    if "target_weight_kg" in data:
        if not validate_number(data["target_weight_kg"], 20, 500):
            return error("target_weight_kg must be between 20 and 500", 400)
        updates["fitness_goals.target_weight_kg"] = float(data["target_weight_kg"])

    if "daily_calorie_target" in data:
        if not validate_number(data["daily_calorie_target"], 500, 10000):
            return error("daily_calorie_target must be between 500 and 10000", 400)
        updates["fitness_goals.daily_calorie_target"] = int(data["daily_calorie_target"])

    if "weekly_workout_target" in data:
        if not validate_number(data["weekly_workout_target"], 1, 21):
            return error("weekly_workout_target must be between 1 and 21", 400)
        updates["fitness_goals.weekly_workout_target"] = int(data["weekly_workout_target"])

    if "goal_type" in data:
        valid_goals = ("lose_weight", "gain_muscle", "maintain", "improve_endurance", "general_fitness")
        if data["goal_type"] not in valid_goals:
            return error(f"goal_type must be one of: {', '.join(valid_goals)}", 400)
        updates["fitness_goals.goal_type"] = data["goal_type"]

    if "target_date" in data and data["target_date"]:
        try:
            td = datetime.strptime(data["target_date"], "%Y-%m-%d")
            if td < datetime.utcnow():
                return error("target_date must be in the future", 400)
            updates["fitness_goals.target_date"] = td
        except ValueError:
            return error("target_date must be in YYYY-MM-DD format", 400)

    if not updates:
        return error("No valid fields provided. Accepted: target_weight_kg, "
                     "daily_calorie_target, weekly_workout_target, goal_type, target_date", 400)

    updates["fitness_goals.updated_at"] = datetime.utcnow()

    user_id = get_jwt_identity()
    current_app.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    user = current_app.db.users.find_one({"_id": ObjectId(user_id)}, {"fitness_goals": 1})
    return success(serialize_doc(user.get("fitness_goals", {})), "Fitness goals updated")


# ── DELETE /goals ───────────────────────────────────────────────────────────────
@goals_bp.route("/goals", methods=["DELETE"])
@jwt_required()
def delete_goals():
    """Clear the authenticated user's fitness goals."""
    user_id = get_jwt_identity()
    current_app.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"fitness_goals": {}}}
    )
    return success(message="Fitness goals cleared")
