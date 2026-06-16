from bson import ObjectId
from datetime import datetime
import re


# ── ObjectId helper ────────────────────────────────────────────────────────────
def serialize_doc(doc):
    """Recursively convert ObjectId and datetime to JSON-safe types."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            key = "_id" if k == "_id" else k
            result[key] = serialize_doc(v)
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


def parse_object_id(id_str):
    """Return ObjectId or None if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        return None


# ── Standard JSON responses ────────────────────────────────────────────────────
def success(data=None, message="Success", code=200):
    body = {"status": "success", "message": message}
    if data is not None:
        body["data"] = data
    return body, code


def error(message="An error occurred", code=400):
    return {"status": "error", "message": message}, code


# ── Input Validation ───────────────────────────────────────────────────────────
def validate_required(data: dict, fields: list) -> str | None:
    """Return error message if any required field is missing, else None."""
    missing = [f for f in fields if f not in data or data[f] in ("", None)]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    return None


def validate_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(pattern, email))


def validate_number(value, min_val=None, max_val=None) -> bool:
    try:
        n = float(value)
        if min_val is not None and n < min_val:
            return False
        if max_val is not None and n > max_val:
            return False
        return True
    except (TypeError, ValueError):
        return False


def validate_gender(value: str) -> bool:
    return value.lower() in ("male", "female", "other", "prefer not to say")


def validate_membership(value: str) -> bool:
    return value.lower() in ("free", "premium")


def validate_activity_type(value: str) -> bool:
    valid = {"running", "cycling", "swimming", "walking", "yoga", "gym",
             "football", "basketball", "tennis", "hiking", "rowing", "other"}
    return value.lower() in valid


def validate_meal_type(value: str) -> bool:
    return value.lower() in ("breakfast", "lunch", "dinner", "snack")


def parse_date(date_str: str):
    """Try to parse common date formats, return datetime or None."""
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(date_str, fmt)
        except (ValueError, TypeError):
            pass
    return None
