from flask import Flask, request, jsonify
from flask_cors import CORS
from optimizer import generate_meal_plans
from grocery import consolidate_ingredients
import json

app = Flask(__name__)
CORS(app)

# Hardcoding recipes for now, integrate API later:
with open("data/recipes.json", "r") as file:
    RECIPES = json.load(file)

# HEALTH endpoint:
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# RECOMMEND endpoint:
@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        user = request.get_json()

        plans = generate_meal_plans(RECIPES, user)

        for plan in plans:
            plan["groceryList"] = consolidate_ingredients(plan["recipes"])

        return jsonify({"plans": plans})
    
    except Exception as e:
        return jsonify({
            "error": "Failed to generate recommendations.",
            "details": str(e)
        }), 500
    
if __name__ == "__main__":
    app.run(debug=True, port=5000)