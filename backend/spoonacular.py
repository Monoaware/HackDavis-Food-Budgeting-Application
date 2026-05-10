import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
BASE_URL = "https://api.spoonacular.com/recipes/complexSearch"
_FALLBACK_PATH = os.path.join(os.path.dirname(__file__), "data", "fallback_recipes.json")
_CACHE_PATH    = os.path.join(os.path.dirname(__file__), "data", "recipe_cache.json")

def _load_cache():
    try:
        with open(_CACHE_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def _save_cache(cache):
    with open(_CACHE_PATH, "w") as f:
        json.dump(cache, f)

_cache = _load_cache()


def _cache_key(meal_plan):
    return json.dumps({
        "allergens": sorted(meal_plan.get("allergens", [])),
        "diet": meal_plan.get("dietaryTags", [""])[0] if meal_plan.get("dietaryTags") else "",
        "maxPrepTime": meal_plan.get("maxPrepTime"),
        "minProtein": _min_protein_per_serving(meal_plan),
    }, sort_keys=True)


def _min_protein_per_serving(meal_plan):
    protein_goal = meal_plan.get("proteinGoal", 0)
    num_meals = meal_plan.get("numMeals", 3)
    if protein_goal > 0 and num_meals > 0:
        return round(protein_goal / num_meals * 0.5, 1)
    return None


def _extract_nutrient(nutrients, name):
    for n in nutrients:
        if n.get("name", "").lower() == name.lower():
            return round(n.get("amount", 0), 2)
    return 0.0


def _normalize_recipe(raw):
    nutrition = raw.get("nutrition", {})
    nutrients = nutrition.get("nutrients", [])
    # Spoonacular returns total nutrition for the whole recipe; divide by servings
    # to get per-serving values used for nutritional scoring.
    servings = max(raw.get("servings", 1), 1)
    # complexSearch returns ingredients under nutrition.ingredients (not extendedIngredients).
    # Amounts here are per-serving already; multiply back by servings for grocery totals.
    nutrition_ingredients = nutrition.get("ingredients", [])
    ingredients = [
        {
            "name": ing.get("name", ""),
            "amount": round(ing.get("amount", 0) * servings, 2),
            "unit": ing.get("unit", ""),
        }
        for ing in nutrition_ingredients
    ]
    return {
        "id": raw.get("id"),
        "title": raw.get("title", ""),
        "prepTime": raw.get("readyInMinutes", 0),
        "protein": round(_extract_nutrient(nutrients, "Protein") / servings, 2),
        "fiber": round(_extract_nutrient(nutrients, "Fiber") / servings, 2),
        "calories": round(_extract_nutrient(nutrients, "Calories") / servings, 2),
        "servings": servings,
        "dietTags": raw.get("diets", []),
        "allergens": [],
        "image": raw.get("image", ""),
        "sourceUrl": raw.get("sourceUrl", ""),
        "ingredients": ingredients,
        "score": 0,
    }


def _load_fallback():
    with open(_FALLBACK_PATH, "r") as f:
        return json.load(f)


def fetch_recipes(meal_plan):
    key = _cache_key(meal_plan)
    if key in _cache:
        return _cache[key]

    allergens = meal_plan.get("allergens", [])
    dietary_tags = meal_plan.get("dietaryTags", [])
    max_prep_time = meal_plan.get("maxPrepTime", None)

    params = {
        "apiKey": SPOONACULAR_API_KEY,
        "number": 15,
        "addRecipeNutrition": True,
        "addRecipeInformation": True,
    }

    if allergens:
        params["intolerances"] = ",".join(allergens)
    if dietary_tags:
        params["diet"] = dietary_tags[0]
    if max_prep_time is not None:
        params["maxReadyTime"] = max_prep_time

    min_protein = _min_protein_per_serving(meal_plan)
    if min_protein:
        params["minProtein"] = min_protein
        params["sort"] = "protein"
        params["sortDirection"] = "desc"

    try:
        response = requests.get(BASE_URL, params=params, timeout=15)
        print(f"[SPOONACULAR] Points this request: {response.headers.get('X-API-Quota-Request', '?')} | Points used today: {response.headers.get('X-API-Quota-Used', '?')}")
        response.raise_for_status()
        results = response.json().get("results", [])
        recipes = [_normalize_recipe(r) for r in results]
    except Exception as e:
        print(f"[SPOONACULAR] Falling back to local data: {e}")
        recipes = _load_fallback()

    _cache[key] = recipes
    _save_cache(_cache)
    return recipes
