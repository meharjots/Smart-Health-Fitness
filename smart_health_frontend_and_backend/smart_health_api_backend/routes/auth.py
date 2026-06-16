from flask import Blueprint, request, current_app
from flask_jwt_extended import create_access_token
from datetime import datetime
from utils import (validate_required, validate_email, validate_number,
                   validate_gender, validate_membership, serialize_doc,
                   success, error)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    # Required field validation
    msg = validate_required(data, ["email", "password", "full_name", "age",
                                   "gender", "height_cm", "weight_kg"])
    if msg:
        return error(msg, 400)

    # Email format
    if not validate_email(data["email"]):
        return error("Invalid email address format", 400)

    # Numeric range validation
    if not validate_number(data["age"], 1, 120):
        return error("Age must be a number between 1 and 120", 400)
    if not validate_number(data["height_cm"], 50, 300):
        return error("Height must be between 50 and 300 cm", 400)
    if not validate_number(data["weight_kg"], 10, 500):
        return error("Weight must be between 10 and 500 kg", 400)
    if not validate_gender(data["gender"]):
        return error("Gender must be: male, female, other, or prefer not to say", 400)

    # Password strength
    if len(data["password"]) < 6:
        return error("Password must be at least 6 characters long", 400)

    db = current_app.db
    bcrypt = current_app.bcrypt

    # Duplicate email check
    if db.users.find_one({"email": data["email"].lower()}):
        return error("An account with this email already exists", 409)

    membership = data.get("membership_type", "free").lower()
    if not validate_membership(membership):
        return error("membership_type must be 'free' or 'premium'", 400)

    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user_doc = {
        "email": data["email"].lower(),
        "password": hashed_pw,
        "full_name": data["full_name"].strip(),
        "age": int(data["age"]),
        "gender": data["gender"].lower(),
        "height_cm": float(data["height_cm"]),
        "weight_kg": float(data["weight_kg"]),
        "membership_type": membership,
        "role": "user",
        "activity_logs": [],
        "nutrition_logs": [],
        "health_metrics": {},
        "fitness_goals": {},
        "created_at": datetime.utcnow(),
    }

    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token(identity=str(result.inserted_id),
                                additional_claims={"role": "user"})

    user_doc.pop("password")
    return success({"user": serialize_doc(user_doc), "access_token": token},
                   "Account created successfully", 201)


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json()
    if not data:
        return error("Request body must be JSON", 400)

    msg = validate_required(data, ["email", "password"])
    if msg:
        return error(msg, 400)

    db = current_app.db
    bcrypt = current_app.bcrypt

    user = db.users.find_one({"email": data["email"].lower()})
    if not user:
        return error("Invalid email or password", 401)

    if not bcrypt.check_password_hash(user["password"], data["password"]):
        return error("Invalid email or password", 401)

    token = create_access_token(identity=str(user["_id"]),
                                additional_claims={"role": user.get("role", "user")})

    return success({
        "access_token": token,
        "user_id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user.get("role", "user"),
    }, "Login successful")
