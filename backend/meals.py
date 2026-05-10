# backend/meals.py

import datetime
from db import db

meal_plans_collection = db["meal_plans"]


def _serialize(plan):
    plan["_id"] = str(plan["_id"])
    if isinstance(plan.get("created_at"), datetime.datetime):
        plan["created_at"] = plan["created_at"].isoformat()
    return plan


def create_meal_plan(current_user, data):
    required_fields = ["protein", "fiber", "number_of_meals"]
    for field in required_fields:
        if field not in data:
            return {"error": f"{field} is required"}, 400

    meal_plan = {
        "user_email": current_user["email"],
        "number_of_meals": data["number_of_meals"],
        "protein": data["protein"],
        "fiber": data["fiber"],
        "created_at": datetime.datetime.utcnow(),
    }

    # Preferences
    if "budget" in data:
        meal_plan["budget"] = data["budget"]
    if "Intolerances" in data:
        meal_plan["Intolerances"] = data["Intolerances"]
    if "Diets" in data:
        meal_plan["Diets"] = data["Diets"]
    if "maxPrepTime" in data and data.get("maxPrepTime") is not None:
        try:
            meal_plan["maxPrepTime"] = int(data.get("maxPrepTime"))
        except (TypeError, ValueError):
            meal_plan["maxPrepTime"] = data.get("maxPrepTime")

    # Selected plan results
    for field in ["meals", "totalCost", "totalProtein", "totalFiber",
                  "totalCalories", "totalPrepTime", "suggestedStore",
                  "geminiRank", "geminiExplanation"]:
        if field in data:
            meal_plan[field] = data[field]

    result = meal_plans_collection.insert_one(meal_plan)
    return {"message": "Meal plan created", "meal_plan_id": str(result.inserted_id)}, 201


def get_meal_plans(current_user):
    plans = list(
        meal_plans_collection
        .find({"user_email": current_user["email"]})
        .sort("created_at", -1)
    )
    return {"meal_plans": [_serialize(p) for p in plans]}, 200
