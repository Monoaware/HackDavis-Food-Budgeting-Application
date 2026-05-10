import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
BASE_URL = "https://api.spoonacular.com/recipes/complexSearch"
_FALLBACK_PATH = os.path.join(os.path.dirname(__file__), "data", "fallback_recipes.json")

_cache = {}


def _cache_key(user):
    return json.dumps({
        "allergens": sorted(user.get("allergens", [])),
        "diet": user.get("dietaryTags", [""])[0] if user.get("dietaryTags") else "",
        "maxPrepTime": user.get("maxPrepTime"),
    }, sort_keys=True)


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
    # Ingredient amounts are totals for the whole recipe (kept as-is for grocery shopping).
    ingredients = [
        {
            "name": ing.get("name", ""),
            "amount": ing.get("amount", 0),
            "unit": ing.get("unit", ""),
        }
        for ing in raw.get("extendedIngredients", [])
    ]
    return {
        "id": raw.get("id"),
        "title": raw.get("title", ""),
        "prepTime": raw.get("readyInMinutes", 0),
        "protein": round(_extract_nutrient(nutrients, "Protein") / servings, 2),
        "fiber": round(_extract_nutrient(nutrients, "Fiber") / servings, 2),
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


def fetch_recipes(user):
    key = _cache_key(user)
    if key in _cache:
        return _cache[key]

    allergens = user.get("allergens", [])
    dietary_tags = user.get("dietaryTags", [])
    max_prep_time = user.get("maxPrepTime", None)

    params = {
        "apiKey": SPOONACULAR_API_KEY,
        "number": 30,
        "addRecipeNutrition": True,
        "addRecipeInformation": True,
    }

    if allergens:
        params["intolerances"] = ",".join(allergens)
    if dietary_tags:
        params["diet"] = dietary_tags[0]
    if max_prep_time is not None:
        params["maxReadyTime"] = max_prep_time

    try:
        response = requests.get(BASE_URL, params=params, timeout=15)
        response.raise_for_status()
        results = response.json().get("results", [])
        recipes = [_normalize_recipe(r) for r in results]
    except Exception:
        recipes = _load_fallback()

    _cache[key] = recipes
    return recipes
