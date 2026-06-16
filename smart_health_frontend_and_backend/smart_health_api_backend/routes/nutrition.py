from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from utils import (serialize_doc, success, error, validate_required,
                   validate_number, validate_meal_type, parse_date)

nutrition_bp = Blueprint("nutrition", __name__)


def _make_log(data: dict):
    msg = validate_required(data, ["meal_type", "food_name", "calories_intake"])
    if msg:
        return None, msg

    if not validate_meal_type(data["meal_type"]):
        return None, "meal_type must be: breakfast, lunch, dinner, or snack"

    if not validate_number(data["calories_intake"], 0, 10000):
        return None, "calories_intake must be between 0 and 10000"

    for macro in ("protein_grams", "carbs_grams", "fats_grams"):
        if macro in data and not validate_number(data[macro], 0, 1000):
            return None, f"{macro} must be between 0 and 1000"

    log_date = datetime.utcnow()
    if "log_date" in data and data["log_date"]:
        parsed = parse_date(data["log_date"])
        if not parsed:
            return None, "log_date must be in YYYY-MM-DD format"
        log_date = parsed

    return {
        "_id": ObjectId(),
        "meal_type": data["meal_type"].lower(),
        "food_name": data["food_name"].strip(),
        "calories_intake": float(data["calories_intake"]),
        "protein_grams": float(data.get("protein_grams", 0)),
        "carbs_grams": float(data.get("carbs_grams", 0)),
        "fats_grams": float(data.get("fats_grams", 0)),
        "log_date": log_date,
    }, None


# ── POST /nutrition ─────────────────────────────────────────────────────────────
@nutrition_bp.route("/nutrition", methods=["POST"])
@jwt_required()
def add_nutrition():
    """Add a nutrition log entry."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    log, err = _make_log(data)
    if err:
        return error(err, 400)

    user_id = get_jwt_identity()
    current_app.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"nutrition_logs": log}}
    )
    return success(serialize_doc(log), "Nutrition entry logged successfully", 201)


# ── GET /nutrition ──────────────────────────────────────────────────────────────
@nutrition_bp.route("/nutrition", methods=["GET"])
@jwt_required()
def get_nutrition():
    """Get nutrition logs with optional meal_type filter and date range pagination."""
    user_id = get_jwt_identity()
    user = current_app.db.users.find_one({"_id": ObjectId(user_id)}, {"nutrition_logs": 1})
    if not user:
        return error("User not found", 404)

    logs = user.get("nutrition_logs", [])

    meal_type = request.args.get("meal_type")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if meal_type:
        logs = [l for l in logs if l["meal_type"] == meal_type.lower()]

    if start_date:
        sd = parse_date(start_date)
        if sd:
            logs = [l for l in logs if l.get("log_date") and l["log_date"] >= sd]

    if end_date:
        ed = parse_date(end_date)
        if ed:
            logs = [l for l in logs if l.get("log_date") and l["log_date"] <= ed]

    logs.sort(key=lambda x: x.get("log_date", datetime.min), reverse=True)

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    total = len(logs)
    paginated = logs[(page - 1) * per_page: page * per_page]

    return success({
        "nutrition_logs": serialize_doc(paginated),
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    })


# ── GET /nutrition/<id> ─────────────────────────────────────────────────────────
@nutrition_bp.route("/nutrition/<log_id>", methods=["GET"])
@jwt_required()
def get_nutrition_entry(log_id):
    """Get a single nutrition log entry."""
    try:
        oid = ObjectId(log_id)
    except Exception:
        return error("Invalid log ID format", 400)

    user_id = get_jwt_identity()
    user = current_app.db.users.find_one(
        {"_id": ObjectId(user_id), "nutrition_logs._id": oid},
        {"nutrition_logs.$": 1}
    )
    if not user or not user.get("nutrition_logs"):
        return error("Nutrition log not found", 404)

    return success(serialize_doc(user["nutrition_logs"][0]))


# ── PUT /nutrition/<id> ─────────────────────────────────────────────────────────
@nutrition_bp.route("/nutrition/<log_id>", methods=["PUT"])
@jwt_required()
def update_nutrition(log_id):
    """Update a nutrition log entry."""
    try:
        oid = ObjectId(log_id)
    except Exception:
        return error("Invalid log ID format", 400)

    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    updates = {}
    if "meal_type" in data:
        if not validate_meal_type(data["meal_type"]):
            return error("meal_type must be: breakfast, lunch, dinner, or snack", 400)
        updates["nutrition_logs.$.meal_type"] = data["meal_type"].lower()

    if "food_name" in data:
        updates["nutrition_logs.$.food_name"] = data["food_name"].strip()

    if "calories_intake" in data:
        if not validate_number(data["calories_intake"], 0, 10000):
            return error("calories_intake must be between 0 and 10000", 400)
        updates["nutrition_logs.$.calories_intake"] = float(data["calories_intake"])

    for macro in ("protein_grams", "carbs_grams", "fats_grams"):
        if macro in data:
            if not validate_number(data[macro], 0, 1000):
                return error(f"{macro} must be between 0 and 1000", 400)
            updates[f"nutrition_logs.$.{macro}"] = float(data[macro])

    if "log_date" in data:
        parsed = parse_date(data["log_date"])
        if not parsed:
            return error("log_date must be in YYYY-MM-DD format", 400)
        updates["nutrition_logs.$.log_date"] = parsed

    if not updates:
        return error("No valid fields provided to update", 400)

    user_id = get_jwt_identity()
    result = current_app.db.users.update_one(
        {"_id": ObjectId(user_id), "nutrition_logs._id": oid},
        {"$set": updates}
    )
    if result.matched_count == 0:
        return error("Nutrition log not found", 404)

    return success(message="Nutrition log updated successfully")


# ── DELETE /nutrition/<id> ──────────────────────────────────────────────────────
@nutrition_bp.route("/nutrition/<log_id>", methods=["DELETE"])
@jwt_required()
def delete_nutrition(log_id):
    """Delete a nutrition log entry."""
    try:
        oid = ObjectId(log_id)
    except Exception:
        return error("Invalid log ID format", 400)

    user_id = get_jwt_identity()
    result = current_app.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"nutrition_logs": {"_id": oid}}}
    )
    if result.matched_count == 0:
        return error("Nutrition log not found", 404)

    return success(message="Nutrition log deleted successfully")
