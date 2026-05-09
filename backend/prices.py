# Approximate cost (USD) for a typical recipe-use amount of each ingredient.
# Unit-agnostic: we sum one "base cost" entry per ingredient occurrence.
# Swap this out for a real grocery API call later.
_BASE_COSTS = {
    # Proteins
    "chicken": 3.00,
    "beef": 4.00,
    "pork": 3.50,
    "turkey": 3.00,
    "salmon": 5.50,
    "tuna": 2.50,
    "shrimp": 4.50,
    "tofu": 2.00,
    "tempeh": 2.50,
    "egg": 0.30,
    "eggs": 0.30,
    "lentil": 0.60,
    "lentils": 0.60,
    "bean": 0.50,
    "beans": 0.50,
    "chickpea": 0.60,
    "chickpeas": 0.60,
    # Grains & starches
    "rice": 0.40,
    "pasta": 0.50,
    "noodle": 0.50,
    "bread": 0.40,
    "tortilla": 0.30,
    "oat": 0.40,
    "oats": 0.40,
    "quinoa": 0.90,
    "potato": 0.40,
    "sweet potato": 0.60,
    # Dairy
    "milk": 0.25,
    "cheese": 0.90,
    "yogurt": 0.70,
    "butter": 0.35,
    "cream": 0.50,
    # Vegetables
    "spinach": 0.60,
    "kale": 0.70,
    "broccoli": 0.70,
    "cauliflower": 0.80,
    "carrot": 0.25,
    "onion": 0.30,
    "garlic": 0.10,
    "tomato": 0.50,
    "pepper": 0.70,
    "bell pepper": 0.80,
    "zucchini": 0.60,
    "mushroom": 0.80,
    "lettuce": 0.40,
    "cucumber": 0.50,
    "celery": 0.30,
    "corn": 0.40,
    "pea": 0.45,
    "peas": 0.45,
    "avocado": 1.20,
    # Fruits
    "lemon": 0.30,
    "lime": 0.25,
    "apple": 0.40,
    "banana": 0.20,
    "berry": 0.90,
    "berries": 0.90,
    "orange": 0.40,
    # Pantry
    "olive oil": 0.30,
    "oil": 0.20,
    "vinegar": 0.15,
    "soy sauce": 0.15,
    "flour": 0.20,
    "sugar": 0.10,
    "salt": 0.05,
    "pepper": 0.05,
    "broth": 0.40,
    "stock": 0.40,
    "coconut milk": 0.60,
}

_DEFAULT_INGREDIENT_COST = 0.50
_MIN_COST_PER_SERVING = 1.50


def calculate_cost_per_serving(recipe):
    total = 0.0
    for ing in recipe.get("ingredients", []):
        name = ing.get("name", "").lower()
        cost = _DEFAULT_INGREDIENT_COST
        for key, price in _BASE_COSTS.items():
            if key in name:
                cost = price
                break
        total += cost
    return round(max(total, _MIN_COST_PER_SERVING), 2)
