from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from utils import (serialize_doc, success, error, parse_object_id,
                   validate_number, validate_gender, validate_membership)

users_bp = Blueprint("users", __name__)


def get_current_user_doc():
    user_id = get_jwt_identity()
    return current_app.db.users.find_one({"_id": ObjectId(user_id)})


# ── GET /profile ────────────────────────────────────────────────────────────────
@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Retrieve the authenticated user's profile."""
    user = get_current_user_doc()
    if not user:
        return error("User not found", 404)
    user.pop("password", None)
    return success(serialize_doc(user))


# ── PUT /profile ────────────────────────────────────────────────────────────────
@users_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update the authenticated user's profile."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    allowed = {"full_name", "age", "gender", "height_cm", "weight_kg", "membership_type"}
    updates = {}

    if "full_name" in data:
        if not data["full_name"].strip():
            return error("full_name cannot be empty", 400)
        updates["full_name"] = data["full_name"].strip()

    if "age" in data:
        if not validate_number(data["age"], 1, 120):
            return error("Age must be between 1 and 120", 400)
        updates["age"] = int(data["age"])

    if "gender" in data:
        if not validate_gender(data["gender"]):
            return error("Gender must be: male, female, other, or prefer not to say", 400)
        updates["gender"] = data["gender"].lower()

    if "height_cm" in data:
        if not validate_number(data["height_cm"], 50, 300):
            return error("Height must be between 50 and 300 cm", 400)
        updates["height_cm"] = float(data["height_cm"])

    if "weight_kg" in data:
        if not validate_number(data["weight_kg"], 10, 500):
            return error("Weight must be between 10 and 500 kg", 400)
        updates["weight_kg"] = float(data["weight_kg"])

    if "membership_type" in data:
        if not validate_membership(data["membership_type"]):
            return error("membership_type must be 'free' or 'premium'", 400)
        updates["membership_type"] = data["membership_type"].lower()

    invalid = set(data.keys()) - allowed
    if invalid:
        return error(f"Fields not updatable via this endpoint: {', '.join(invalid)}", 400)

    if not updates:
        return error("No valid fields provided to update", 400)

    user_id = get_jwt_identity()
    current_app.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    user = current_app.db.users.find_one({"_id": ObjectId(user_id)})
    user.pop("password", None)
    return success(serialize_doc(user), "Profile updated successfully")


# ── DELETE /profile ─────────────────────────────────────────────────────────────
@users_bp.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_profile():
    """Permanently delete the authenticated user's account."""
    user_id = get_jwt_identity()
    result = current_app.db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        return error("User not found", 404)
    return success(message="Account deleted successfully")


# ── GET /users  (admin only) ────────────────────────────────────────────────────
@users_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    """Admin: list all users with optional pagination and filtering."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return error("Admin access required", 403)

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    membership = request.args.get("membership_type")
    gender = request.args.get("gender")
    search = request.args.get("search")  # searches full_name

    query = {}
    if membership:
        query["membership_type"] = membership.lower()
    if gender:
        query["gender"] = gender.lower()
    if search:
        query["full_name"] = {"$regex": search, "$options": "i"}

    total = current_app.db.users.count_documents(query)
    cursor = (current_app.db.users.find(query, {"password": 0})
              .skip((page - 1) * per_page)
              .limit(per_page))

    users = [serialize_doc(u) for u in cursor]
    return success({
        "users": users,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    })


# ── GET /users/<id>  (admin) ────────────────────────────────────────────────────
@users_bp.route("/users/<user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    """Admin: retrieve a specific user by ID."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return error("Admin access required", 403)

    oid = parse_object_id(user_id)
    if not oid:
        return error("Invalid user ID format", 400)

    user = current_app.db.users.find_one({"_id": oid}, {"password": 0})
    if not user:
        return error("User not found", 404)
    return success(serialize_doc(user))


# ── DELETE /users/<id>  (admin) ─────────────────────────────────────────────────
@users_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_user(user_id):
    """Admin: remove any user account."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return error("Admin access required", 403)

    oid = parse_object_id(user_id)
    if not oid:
        return error("Invalid user ID format", 400)

    result = current_app.db.users.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return error("User not found", 404)
    return success(message=f"User {user_id} deleted successfully")


# ── PUT /users/<id>/role  (admin) ───────────────────────────────────────────────
@users_bp.route("/users/<user_id>/role", methods=["PUT"])
@jwt_required()
def update_user_role(user_id):
    """Admin: change a user's role (user / admin)."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return error("Admin access required", 403)

    oid = parse_object_id(user_id)
    if not oid:
        return error("Invalid user ID format", 400)

    data = request.get_json()
    if not data or "role" not in data:
        return error("role field is required", 400)

    if data["role"] not in ("user", "admin"):
        return error("role must be 'user' or 'admin'", 400)

    result = current_app.db.users.update_one({"_id": oid}, {"$set": {"role": data["role"]}})
    if result.matched_count == 0:
        return error("User not found", 404)
    return success(message=f"Role updated to '{data['role']}'")
