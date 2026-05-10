# backend/meals.py

import datetime
from backend.db import db

meal_plans_collection = db["meal_plans"]


def create_meal_plan(current_user, data):

    required_fields = [
        "protein",
        "fiber",
        "number_of_meals"
    ]

    for field in required_fields:
        if field not in data:
            return {"error": f"{field} is required"}, 400

    meal_plan = {
        "user_email": current_user["email"],
        "protein": data["protein"],
        "fiber": data["fiber"],
        "number_of_meals": data["number_of_meals"],
        "meals": [],
        "created_at": datetime.datetime.utcnow()
    }

    # Optional fields

    if "budget" in data:
        meal_plan["budget"] = data["budget"]

    if "Intolerances" in data:
        meal_plan["Intolerances"] = data["Intolerances"]

    if "Diets" in data:
        meal_plan["Diets"] = data["Diets"]

    # Optional max prep time (in minutes)
    if "maxPrepTime" in data and data.get("maxPrepTime") is not None:
        try:
            # store as integer minutes if possible
            meal_plan["maxPrepTime"] = int(data.get("maxPrepTime"))
        except (TypeError, ValueError):
            meal_plan["maxPrepTime"] = data.get("maxPrepTime")

    result = meal_plans_collection.insert_one(meal_plan)

    return {
        "message": "Meal plan created",
        "meal_plan_id": str(result.inserted_id)
    }, 201