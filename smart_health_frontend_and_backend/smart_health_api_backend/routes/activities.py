from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from utils import (serialize_doc, success, error, validate_required,
                   validate_number, validate_activity_type, parse_date)

activities_bp = Blueprint("activities", __name__)


def _make_activity(data: dict) -> dict | None:
    """Build and validate an activity log sub-document."""
    msg = validate_required(data, ["activity_type", "duration_minutes", "calories_burned"])
    if msg:
        return None, msg

    if not validate_activity_type(data["activity_type"]):
        return None, ("activity_type must be one of: running, cycling, swimming, walking, "
                      "yoga, gym, football, basketball, tennis, hiking, rowing, other")

    if not validate_number(data["duration_minutes"], 1, 1440):
        return None, "duration_minutes must be between 1 and 1440"

    if not validate_number(data["calories_burned"], 0, 10000):
        return None, "calories_burned must be between 0 and 10000"

    activity_date = datetime.utcnow()
    if "activity_date" in data and data["activity_date"]:
        parsed = parse_date(data["activity_date"])
        if not parsed:
            return None, "activity_date must be in YYYY-MM-DD or DD/MM/YYYY format"
        activity_date = parsed

    return {
        "_id": ObjectId(),
        "activity_type": data["activity_type"].lower(),
        "duration_minutes": int(data["duration_minutes"]),
        "calories_burned": float(data["calories_burned"]),
        "activity_date": activity_date,
        "notes": data.get("notes", "").strip(),
    }, None


# ── POST /activities ────────────────────────────────────────────────────────────
@activities_bp.route("/activities", methods=["POST"])
@jwt_required()
def add_activity():
    """Add a new activity log entry for the authenticated user."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    activity, err = _make_activity(data)
    if err:
        return error(err, 400)

    user_id = get_jwt_identity()
    current_app.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"activity_logs": activity}}
    )
    return success(serialize_doc(activity), "Activity logged successfully", 201)


# ── GET /activities ─────────────────────────────────────────────────────────────
@activities_bp.route("/activities", methods=["GET"])
@jwt_required()
def get_activities():
    """Retrieve the authenticated user's activity logs with optional filtering & pagination."""
    user_id = get_jwt_identity()
    user = current_app.db.users.find_one({"_id": ObjectId(user_id)}, {"activity_logs": 1})
    if not user:
        return error("User not found", 404)

    logs = user.get("activity_logs", [])

    # Filtering
    activity_type = request.args.get("activity_type")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if activity_type:
        logs = [l for l in logs if l["activity_type"] == activity_type.lower()]

    if start_date:
        sd = parse_date(start_date)
        if sd:
            logs = [l for l in logs if l.get("activity_date") and l["activity_date"] >= sd]

    if end_date:
        ed = parse_date(end_date)
        if ed:
            logs = [l for l in logs if l.get("activity_date") and l["activity_date"] <= ed]

    # Sort newest first
    logs.sort(key=lambda x: x.get("activity_date", datetime.min), reverse=True)

    # Pagination
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    total = len(logs)
    paginated = logs[(page - 1) * per_page: page * per_page]

    return success({
        "activity_logs": serialize_doc(paginated),
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    })


# ── GET /activities/<id> ────────────────────────────────────────────────────────
@activities_bp.route("/activities/<activity_id>", methods=["GET"])
@jwt_required()
def get_activity(activity_id):
    """Retrieve a single activity log entry by ID."""
    try:
        oid = ObjectId(activity_id)
    except Exception:
        return error("Invalid activity ID format", 400)

    user_id = get_jwt_identity()
    user = current_app.db.users.find_one(
        {"_id": ObjectId(user_id), "activity_logs._id": oid},
        {"activity_logs.$": 1}
    )
    if not user or not user.get("activity_logs"):
        return error("Activity log not found", 404)

    return success(serialize_doc(user["activity_logs"][0]))


# ── PUT /activities/<id> ────────────────────────────────────────────────────────
@activities_bp.route("/activities/<activity_id>", methods=["PUT"])
@jwt_required()
def update_activity(activity_id):
    """Update an existing activity log entry."""
    try:
        oid = ObjectId(activity_id)
    except Exception:
        return error("Invalid activity ID format", 400)

    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    updates = {}

    if "activity_type" in data:
        if not validate_activity_type(data["activity_type"]):
            return error("Invalid activity_type value", 400)
        updates["activity_logs.$.activity_type"] = data["activity_type"].lower()

    if "duration_minutes" in data:
        if not validate_number(data["duration_minutes"], 1, 1440):
            return error("duration_minutes must be between 1 and 1440", 400)
        updates["activity_logs.$.duration_minutes"] = int(data["duration_minutes"])

    if "calories_burned" in data:
        if not validate_number(data["calories_burned"], 0, 10000):
            return error("calories_burned must be between 0 and 10000", 400)
        updates["activity_logs.$.calories_burned"] = float(data["calories_burned"])

    if "activity_date" in data:
        parsed = parse_date(data["activity_date"])
        if not parsed:
            return error("activity_date must be in YYYY-MM-DD format", 400)
        updates["activity_logs.$.activity_date"] = parsed

    if "notes" in data:
        updates["activity_logs.$.notes"] = data["notes"].strip()

    if not updates:
        return error("No valid fields provided to update", 400)

    user_id = get_jwt_identity()
    result = current_app.db.users.update_one(
        {"_id": ObjectId(user_id), "activity_logs._id": oid},
        {"$set": updates}
    )
    if result.matched_count == 0:
        return error("Activity log not found", 404)

    return success(message="Activity updated successfully")


# ── DELETE /activities/<id> ─────────────────────────────────────────────────────
@activities_bp.route("/activities/<activity_id>", methods=["DELETE"])
@jwt_required()
def delete_activity(activity_id):
    """Delete an activity log entry."""
    try:
        oid = ObjectId(activity_id)
    except Exception:
        return error("Invalid activity ID format", 400)

    user_id = get_jwt_identity()
    result = current_app.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"activity_logs": {"_id": oid}}}
    )
    if result.matched_count == 0:
        return error("Activity log not found", 404)

    return success(message="Activity deleted successfully")
