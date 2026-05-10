from flask import Flask, request, jsonify
from flask_cors import CORS
from spoonacular import fetch_recipes
from optimizer import generate_meal_plans
from grocery import consolidate_ingredients, suggest_store
from gemini_ranker import rank_meal_plans
from auth import signup_user, login_user

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    body, status = signup_user(
        data.get("first_name"),
        data.get("last_name"),
        data.get("email"),
        data.get("password"),
    )
    return jsonify(body), status


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    body, status = login_user(data.get("email"), data.get("password"))
    return jsonify(body), status


@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        body = request.get_json()
        meal_plan = body.get("mealPlan", {})

        recipes = fetch_recipes(meal_plan)
        plans = generate_meal_plans(recipes, meal_plan)

        fulfillable = []
        for plan in plans:
            plan["groceryList"] = consolidate_ingredients(plan["meals"])
            store = suggest_store(plan["groceryList"])
            if store is None:
                continue
            plan["suggestedStore"] = store
            plan["estimatedCost"] = store["estimatedCost"]
            fulfillable.append(plan)

        if not fulfillable:
            return jsonify({
                "error": "No grocery store carries all ingredients for any of the suggested meal plans. Try adjusting your dietary filters, increasing your budget, or selecting fewer meals."
            }), 422

        plans = rank_meal_plans(fulfillable, meal_plan)

        return jsonify({"plans": plans})

    except Exception as e:
        return jsonify({
            "error": "Failed to generate recommendations.",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
