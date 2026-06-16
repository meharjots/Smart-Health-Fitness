from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime, timedelta
from utils import serialize_doc, success, error

analytics_bp = Blueprint("analytics", __name__)


def _get_user(user_id):
    return current_app.db.users.find_one({"_id": ObjectId(user_id)})


# ── GET /analytics/bmi-report ───────────────────────────────────────────────────
@analytics_bp.route("/analytics/bmi-report", methods=["GET"])
@jwt_required()
def bmi_report():
    """Calculate and categorise the user's BMI."""
    user_id = get_jwt_identity()
    user = _get_user(user_id)
    if not user:
        return error("User not found", 404)

    w = user.get("weight_kg")
    h = user.get("height_cm")
    if not w or not h:
        return error("Weight and height must be set on profile to calculate BMI", 400)

    h_m = h / 100
    bmi = round(w / (h_m ** 2), 2)

    if bmi < 18.5:
        category, advice = "Underweight", "Consider increasing caloric intake and strength training."
    elif bmi < 25:
        category, advice = "Normal weight", "Great work! Maintain a balanced diet and regular exercise."
    elif bmi < 30:
        category, advice = "Overweight", "Aim for moderate caloric deficit and increased cardio."
    else:
        category, advice = "Obese", "Consult a healthcare provider for a tailored weight-loss plan."

    return success({
        "weight_kg": w,
        "height_cm": h,
        "bmi": bmi,
        "category": category,
        "advice": advice,
    })


# ── GET /analytics/calorie-balance ─────────────────────────────────────────────
@analytics_bp.route("/analytics/calorie-balance", methods=["GET"])
@jwt_required()
def calorie_balance():
    """
    Show calorie intake vs calories burned for a given date range.
    Query params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
    Defaults to the past 7 days.
    """
    user_id = get_jwt_identity()
    user = _get_user(user_id)
    if not user:
        return error("User not found", 404)

    # Date range
    today = datetime.utcnow().replace(hour=23, minute=59, second=59)
    week_ago = today - timedelta(days=6)

    start = week_ago
    end = today

    if request.args.get("start_date"):
        try:
            start = datetime.strptime(request.args["start_date"], "%Y-%m-%d")
        except ValueError:
            return error("start_date must be YYYY-MM-DD", 400)

    if request.args.get("end_date"):
        try:
            end = datetime.strptime(request.args["end_date"], "%Y-%m-%d").replace(
                hour=23, minute=59, second=59
            )
        except ValueError:
            return error("end_date must be YYYY-MM-DD", 400)

    # Filter activity logs
    activities = [
        a for a in user.get("activity_logs", [])
        if a.get("activity_date") and start <= a["activity_date"] <= end
    ]
    total_burned = sum(a.get("calories_burned", 0) for a in activities)

    # Filter nutrition logs
    nutrition = [
        n for n in user.get("nutrition_logs", [])
        if n.get("log_date") and start <= n["log_date"] <= end
    ]
    total_intake = sum(n.get("calories_intake", 0) for n in nutrition)

    net_balance = total_intake - total_burned
    goal = user.get("fitness_goals", {}).get("daily_calorie_target")

    result = {
        "period": {
            "start": start.strftime("%Y-%m-%d"),
            "end": end.strftime("%Y-%m-%d"),
        },
        "calories_consumed": round(total_intake, 1),
        "calories_burned": round(total_burned, 1),
        "net_balance": round(net_balance, 1),
        "activity_count": len(activities),
        "meals_logged": len(nutrition),
    }
    if goal:
        result["daily_calorie_target"] = goal

    return success(result)


# ── GET /analytics/weekly-progress ─────────────────────────────────────────────
@analytics_bp.route("/analytics/weekly-progress", methods=["GET"])
@jwt_required()
def weekly_progress():
    """
    Day-by-day breakdown of calories consumed, calories burned, and activity count
    for the past 7 days using an aggregation-style approach.
    """
    user_id = get_jwt_identity()
    user = _get_user(user_id)
    if not user:
        return error("User not found", 404)

    today = datetime.utcnow().date()
    days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    def day_key(dt):
        if isinstance(dt, datetime):
            return dt.date()
        return dt

    # Build daily buckets
    activity_by_day = {}
    for a in user.get("activity_logs", []):
        d = day_key(a.get("activity_date"))
        if d in days:
            if d not in activity_by_day:
                activity_by_day[d] = {"calories_burned": 0, "count": 0}
            activity_by_day[d]["calories_burned"] += a.get("calories_burned", 0)
            activity_by_day[d]["count"] += 1

    nutrition_by_day = {}
    for n in user.get("nutrition_logs", []):
        d = day_key(n.get("log_date"))
        if d in days:
            if d not in nutrition_by_day:
                nutrition_by_day[d] = {"calories_intake": 0}
            nutrition_by_day[d]["calories_intake"] += n.get("calories_intake", 0)

    weekly = []
    for d in days:
        act = activity_by_day.get(d, {"calories_burned": 0, "count": 0})
        nut = nutrition_by_day.get(d, {"calories_intake": 0})
        weekly.append({
            "date": d.strftime("%Y-%m-%d"),
            "day": d.strftime("%A"),
            "calories_consumed": round(nut["calories_intake"], 1),
            "calories_burned": round(act["calories_burned"], 1),
            "net": round(nut["calories_intake"] - act["calories_burned"], 1),
            "activities": act["count"],
        })

    return success({"weekly_breakdown": weekly})


# ── GET /analytics/goal-tracking ───────────────────────────────────────────────
@analytics_bp.route("/analytics/goal-tracking", methods=["GET"])
@jwt_required()
def goal_tracking():
    """Compare current stats against the user's fitness goals."""
    user_id = get_jwt_identity()
    user = _get_user(user_id)
    if not user:
        return error("User not found", 404)

    goals = user.get("fitness_goals", {})
    if not goals:
        return error("No fitness goals set. Use PUT /api/goals to set your goals.", 404)

    result = {"goals": serialize_doc(goals), "progress": {}}

    # Weight progress
    if "target_weight_kg" in goals:
        current = user.get("weight_kg", 0)
        target = goals["target_weight_kg"]
        diff = round(current - target, 2)
        result["progress"]["weight"] = {
            "current_kg": current,
            "target_kg": target,
            "difference_kg": diff,
            "status": "achieved" if abs(diff) <= 0.5 else ("above_target" if diff > 0 else "below_target"),
        }

    # Weekly workout progress (this week)
    today = datetime.utcnow()
    week_start = today - timedelta(days=today.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0)
    workouts_this_week = sum(
        1 for a in user.get("activity_logs", [])
        if a.get("activity_date") and a["activity_date"] >= week_start
    )
    if "weekly_workout_target" in goals:
        target_w = goals["weekly_workout_target"]
        result["progress"]["weekly_workouts"] = {
            "completed": workouts_this_week,
            "target": target_w,
            "remaining": max(0, target_w - workouts_this_week),
            "percentage": min(100, round((workouts_this_week / target_w) * 100)),
        }

    # Today's calorie progress
    today_start = today.replace(hour=0, minute=0, second=0)
    cals_today = sum(
        n.get("calories_intake", 0)
        for n in user.get("nutrition_logs", [])
        if n.get("log_date") and n["log_date"] >= today_start
    )
    if "daily_calorie_target" in goals:
        target_c = goals["daily_calorie_target"]
        result["progress"]["today_calories"] = {
            "consumed": round(cals_today, 1),
            "target": target_c,
            "remaining": max(0, round(target_c - cals_today, 1)),
            "percentage": min(100, round((cals_today / target_c) * 100)),
        }

    return success(result)


# ── GET /analytics/activity-summary ────────────────────────────────────────────
@analytics_bp.route("/analytics/activity-summary", methods=["GET"])
@jwt_required()
def activity_summary():
    """
    Aggregated activity statistics grouped by activity_type using MongoDB
    aggregation pipeline (simulated via Python for embedded sub-documents).
    """
    user_id = get_jwt_identity()

    pipeline = [
        {"$match": {"_id": ObjectId(user_id)}},
        {"$unwind": "$activity_logs"},
        {"$group": {
            "_id": "$activity_logs.activity_type",
            "total_sessions": {"$sum": 1},
            "total_duration_minutes": {"$sum": "$activity_logs.duration_minutes"},
            "total_calories_burned": {"$sum": "$activity_logs.calories_burned"},
            "avg_duration_minutes": {"$avg": "$activity_logs.duration_minutes"},
            "avg_calories_burned": {"$avg": "$activity_logs.calories_burned"},
        }},
        {"$sort": {"total_calories_burned": -1}},
    ]

    results = list(current_app.db.users.aggregate(pipeline))

    summary = []
    for r in results:
        summary.append({
            "activity_type": r["_id"],
            "total_sessions": r["total_sessions"],
            "total_duration_minutes": round(r["total_duration_minutes"], 1),
            "total_calories_burned": round(r["total_calories_burned"], 1),
            "avg_duration_minutes": round(r["avg_duration_minutes"], 1),
            "avg_calories_burned": round(r["avg_calories_burned"], 1),
        })

    return success({"activity_summary": summary, "total_activity_types": len(summary)})


# ── GET /analytics/nutrition-summary ───────────────────────────────────────────
@analytics_bp.route("/analytics/nutrition-summary", methods=["GET"])
@jwt_required()
def nutrition_summary():
    """Aggregated macro nutrition summary using MongoDB aggregation pipeline."""
    user_id = get_jwt_identity()

    pipeline = [
        {"$match": {"_id": ObjectId(user_id)}},
        {"$unwind": "$nutrition_logs"},
        {"$group": {
            "_id": "$nutrition_logs.meal_type",
            "total_meals": {"$sum": 1},
            "total_calories": {"$sum": "$nutrition_logs.calories_intake"},
            "total_protein": {"$sum": "$nutrition_logs.protein_grams"},
            "total_carbs": {"$sum": "$nutrition_logs.carbs_grams"},
            "total_fats": {"$sum": "$nutrition_logs.fats_grams"},
            "avg_calories": {"$avg": "$nutrition_logs.calories_intake"},
        }},
        {"$sort": {"total_calories": -1}},
    ]

    results = list(current_app.db.users.aggregate(pipeline))

    summary = []
    for r in results:
        summary.append({
            "meal_type": r["_id"],
            "total_meals": r["total_meals"],
            "total_calories": round(r["total_calories"], 1),
            "total_protein_g": round(r["total_protein"], 1),
            "total_carbs_g": round(r["total_carbs"], 1),
            "total_fats_g": round(r["total_fats"], 1),
            "avg_calories_per_meal": round(r["avg_calories"], 1),
        })

    return success({"nutrition_summary": summary})


# ── GET /analytics/admin/top-active-users  (admin only) ────────────────────────
@analytics_bp.route("/analytics/admin/top-active-users", methods=["GET"])
@jwt_required()
def top_active_users():
    """Admin: rank users by total calories burned using aggregation pipeline."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return error("Admin access required", 403)

    limit = int(request.args.get("limit", 10))

    pipeline = [
        {"$unwind": "$activity_logs"},
        {"$group": {
            "_id": "$_id",
            "full_name": {"$first": "$full_name"},
            "email": {"$first": "$email"},
            "membership_type": {"$first": "$membership_type"},
            "total_sessions": {"$sum": 1},
            "total_calories_burned": {"$sum": "$activity_logs.calories_burned"},
            "total_duration_minutes": {"$sum": "$activity_logs.duration_minutes"},
        }},
        {"$sort": {"total_calories_burned": -1}},
        {"$limit": limit},
    ]

    results = list(current_app.db.users.aggregate(pipeline))
    data = [{
        "user_id": str(r["_id"]),
        "full_name": r["full_name"],
        "email": r["email"],
        "membership_type": r["membership_type"],
        "total_sessions": r["total_sessions"],
        "total_calories_burned": round(r["total_calories_burned"], 1),
        "total_duration_minutes": r["total_duration_minutes"],
    } for r in results]

    return success({"top_active_users": data})
