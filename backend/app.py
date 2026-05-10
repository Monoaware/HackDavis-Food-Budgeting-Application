from flask import Flask, request, jsonify
from flask_cors import CORS
from spoonacular import fetch_recipes
from optimizer import generate_meal_plans
from gemini_ranker import rank_meal_plans
from grocery import consolidate_ingredients, suggest_store
from auth import signup_user, login_user, token_required
from meals import create_meal_plan, get_meal_plans, get_meal_plan, delete_meal_plan

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


@app.route("/meal-plans", methods=["GET"])
@token_required
def fetch_meal_plans(current_user):
    body, status = get_meal_plans(current_user)
    return jsonify(body), status


@app.route("/meal-plans/<meal_plan_id>", methods=["GET"])
@token_required
def fetch_meal_plan(current_user, meal_plan_id):
    body, status = get_meal_plan(current_user, meal_plan_id)
    return jsonify(body), status


@app.route("/meal-plans/<meal_plan_id>", methods=["DELETE"])
@token_required
def remove_meal_plan(current_user, meal_plan_id):
    body, status = delete_meal_plan(current_user, meal_plan_id)
    return jsonify(body), status


@app.route("/meal-plans", methods=["POST"])
@token_required
def save_meal_plan(current_user):
    data = request.get_json()
    body, status = create_meal_plan(current_user, data)
    return jsonify(body), status


@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        body = request.get_json()
        meal_plan = body.get("mealPlan", {})

        recipes = fetch_recipes(meal_plan)
        plans = generate_meal_plans(recipes, meal_plan)

        if not plans:
            return jsonify({
                "error": "No meal plans could be generated. Try adjusting your filters or increasing your budget."
            }), 422

        for plan in plans:
            grocery_list = consolidate_ingredients(plan["meals"])
            store = suggest_store(grocery_list)
            plan["groceryList"] = grocery_list
            if store:
                plan["suggestedStore"] = store
                plan["totalCost"] = store["estimatedCost"]

        return jsonify({"plans": plans})

    except Exception as e:
        return jsonify({
            "error": "Failed to generate recommendations.",
            "details": str(e)
        }), 500


@app.route("/rank", methods=["POST"])
def rank():
    try:
        body = request.get_json()
        plans = body.get("plans", [])
        ranking_query = body.get("rankingQuery", "")

        ranked = rank_meal_plans(plans, {"rankingQuery": ranking_query})
        return jsonify({"plans": ranked})

    except Exception as e:
        return jsonify({
            "error": "Failed to rank plans.",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
