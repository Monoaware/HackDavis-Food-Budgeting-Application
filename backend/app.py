from flask import Flask, request, jsonify
from flask_cors import CORS
from spoonacular import fetch_recipes
from optimizer import generate_meal_plans
from grocery import consolidate_ingredients, suggest_store
from gemini_ranker import rank_meal_plans

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        user = request.get_json()

        recipes = fetch_recipes(user)
        plans = generate_meal_plans(recipes, user)

        for plan in plans:
            plan["groceryList"] = consolidate_ingredients(plan["meals"])
            plan["suggestedStore"] = suggest_store(plan)

        plans = rank_meal_plans(plans, user)

        return jsonify({"plans": plans})

    except Exception as e:
        return jsonify({
            "error": "Failed to generate recommendations.",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
