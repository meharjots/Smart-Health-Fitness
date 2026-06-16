"""
seed_data.py  –  Populates the smart_health_db MongoDB database with
                 realistic sample data for development and demonstration.

Usage:
    python seed_data.py

Requires: pymongo, flask-bcrypt (pip install pymongo flask-bcrypt)
"""
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from bson import ObjectId
from datetime import datetime, timedelta
import random

MONGO_URI = "mongodb://localhost:27017/smart_health_db"

client = MongoClient(MONGO_URI)
db = client.get_default_database()

# Use bcrypt independently of Flask for seeding
from flask import Flask
_app = Flask(__name__)
bcrypt = Bcrypt(_app)

# ── Clear existing data ─────────────────────────────────────────────────────────
db.users.drop()
print("Dropped existing users collection.")

ACTIVITY_TYPES = ["running", "cycling", "swimming", "walking", "yoga",
                  "gym", "football", "basketball", "tennis", "hiking"]
MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"]
FOODS = {
    "breakfast": ["Porridge with fruit", "Scrambled eggs on toast", "Greek yogurt granola", "Smoothie bowl"],
    "lunch": ["Chicken salad", "Tuna wrap", "Lentil soup", "Grilled salmon rice"],
    "dinner": ["Beef stir fry", "Pasta arrabiata", "Grilled chicken veg", "Salmon sweet potato"],
    "snack": ["Apple", "Protein bar", "Almonds", "Banana peanut butter"],
}


def random_activities(n=15):
    logs = []
    for i in range(n):
        logs.append({
            "_id": ObjectId(),
            "activity_type": random.choice(ACTIVITY_TYPES),
            "duration_minutes": random.randint(20, 120),
            "calories_burned": round(random.uniform(150, 800), 1),
            "activity_date": datetime.utcnow() - timedelta(days=random.randint(0, 60)),
            "notes": "",
        })
    return logs


def random_nutrition(n=20):
    logs = []
    for i in range(n):
        meal = random.choice(MEAL_TYPES)
        logs.append({
            "_id": ObjectId(),
            "meal_type": meal,
            "food_name": random.choice(FOODS[meal]),
            "calories_intake": round(random.uniform(200, 900), 1),
            "protein_grams": round(random.uniform(5, 50), 1),
            "carbs_grams": round(random.uniform(20, 100), 1),
            "fats_grams": round(random.uniform(5, 40), 1),
            "log_date": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
        })
    return logs


users = [
    {
        "email": "admin@smarthealth.com",
        "password": bcrypt.generate_password_hash("admin123").decode("utf-8"),
        "full_name": "Admin User",
        "age": 30,
        "gender": "other",
        "height_cm": 175.0,
        "weight_kg": 70.0,
        "membership_type": "premium",
        "role": "admin",
        "activity_logs": random_activities(5),
        "nutrition_logs": random_nutrition(5),
        "health_metrics": {"heart_rate": 65, "systolic_bp": 118, "diastolic_bp": 76, "sleep_hours": 7.5},
        "fitness_goals": {"target_weight_kg": 68.0, "daily_calorie_target": 2200, "weekly_workout_target": 5, "goal_type": "maintain"},
        "created_at": datetime.utcnow() - timedelta(days=365),
    },
    {
        "email": "alice@example.com",
        "password": bcrypt.generate_password_hash("password123").decode("utf-8"),
        "full_name": "Alice Johnson",
        "age": 28,
        "gender": "female",
        "height_cm": 165.0,
        "weight_kg": 62.0,
        "membership_type": "premium",
        "role": "user",
        "activity_logs": random_activities(20),
        "nutrition_logs": random_nutrition(25),
        "health_metrics": {"heart_rate": 70, "systolic_bp": 115, "diastolic_bp": 75, "sleep_hours": 8.0, "vo2_max": 42.0},
        "fitness_goals": {"target_weight_kg": 58.0, "daily_calorie_target": 1800, "weekly_workout_target": 4, "goal_type": "lose_weight", "target_date": datetime(2026, 6, 30)},
        "created_at": datetime.utcnow() - timedelta(days=120),
    },
    {
        "email": "bob@example.com",
        "password": bcrypt.generate_password_hash("password123").decode("utf-8"),
        "full_name": "Bob Smith",
        "age": 35,
        "gender": "male",
        "height_cm": 180.0,
        "weight_kg": 85.0,
        "membership_type": "free",
        "role": "user",
        "activity_logs": random_activities(12),
        "nutrition_logs": random_nutrition(18),
        "health_metrics": {"heart_rate": 72, "systolic_bp": 122, "diastolic_bp": 80, "sleep_hours": 6.5},
        "fitness_goals": {"target_weight_kg": 80.0, "daily_calorie_target": 2500, "weekly_workout_target": 3, "goal_type": "lose_weight"},
        "created_at": datetime.utcnow() - timedelta(days=90),
    },
    {
        "email": "carol@example.com",
        "password": bcrypt.generate_password_hash("password123").decode("utf-8"),
        "full_name": "Carol Williams",
        "age": 24,
        "gender": "female",
        "height_cm": 160.0,
        "weight_kg": 55.0,
        "membership_type": "premium",
        "role": "user",
        "activity_logs": random_activities(30),
        "nutrition_logs": random_nutrition(35),
        "health_metrics": {"heart_rate": 60, "systolic_bp": 110, "diastolic_bp": 70, "sleep_hours": 8.5, "resting_heart_rate": 55, "vo2_max": 52.0},
        "fitness_goals": {"target_weight_kg": 55.0, "daily_calorie_target": 2000, "weekly_workout_target": 6, "goal_type": "improve_endurance"},
        "created_at": datetime.utcnow() - timedelta(days=200),
    },
    {
        "email": "david@example.com",
        "password": bcrypt.generate_password_hash("password123").decode("utf-8"),
        "full_name": "David Brown",
        "age": 42,
        "gender": "male",
        "height_cm": 178.0,
        "weight_kg": 92.0,
        "membership_type": "free",
        "role": "user",
        "activity_logs": random_activities(8),
        "nutrition_logs": random_nutrition(10),
        "health_metrics": {"heart_rate": 78, "systolic_bp": 130, "diastolic_bp": 85, "sleep_hours": 6.0},
        "fitness_goals": {"target_weight_kg": 82.0, "daily_calorie_target": 2300, "weekly_workout_target": 3, "goal_type": "lose_weight"},
        "created_at": datetime.utcnow() - timedelta(days=45),
    },
]

result = db.users.insert_many(users)
print(f"Inserted {len(result.inserted_ids)} users.")

# ── Create indexes ──────────────────────────────────────────────────────────────
db.users.create_index("email", unique=True)
db.users.create_index("membership_type")
db.users.create_index("role")
print("Indexes created.")

print("\n=== Seed Credentials ===")
print("Admin:   admin@smarthealth.com  /  admin123")
print("User:    alice@example.com      /  password123")
print("User:    bob@example.com        /  password123")
print("User:    carol@example.com      /  password123")
print("User:    david@example.com      /  password123")
