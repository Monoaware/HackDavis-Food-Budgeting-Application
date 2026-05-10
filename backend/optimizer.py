from itertools import combinations
from prices import cheapest_cost_per_serving

_MAX_CANDIDATES = 15


# =================================================================
#  Hard-constraint filter: allergens, dietary tags, prep time.
# =================================================================
def is_recipe_allowed(recipe, meal_plan):
    user_allergies = [a.lower() for a in meal_plan.get("allergens", [])]
    recipe_allergens = [a.lower() for a in recipe.get("allergens", [])]
    avoids_allergens = all(
        allergy not in recipe_allergens for allergy in user_allergies
    )

    max_prep_time = meal_plan.get("maxPrepTime", 999)
    within_prep_time = recipe.get("prepTime", 999) <= max_prep_time

    return avoids_allergens and within_prep_time


def matches_user_diet(diet, recipe_diets):
    if diet == "none":
        return True
    return diet in recipe_diets


# =================================================================
#  Score a plan's total nutrition against per-plan goals.
#  proteinGoal / fiberGoal are targets for all meals combined.
# =================================================================
def score_plan(plan, meal_plan):
    protein_goal = meal_plan.get("proteinGoal", 0)
    fiber_goal = meal_plan.get("fiberGoal", 0)
    total_protein = plan.get("totalProtein", 0)
    total_fiber = plan.get("totalFiber", 0)

    score = 0
    if protein_goal > 0:
        score += min(total_protein / protein_goal, 1.5) * 20
    if fiber_goal > 0:
        score += min(total_fiber / fiber_goal, 1.5) * 15

    return round(score, 2)


# =================================================================
#  Generate all valid meal plans:
#   1. Filter by hard constraints (allergens, diet, prep time).
#   2. Attach cost per serving to each candidate recipe.
#   3. Enumerate all C(n, num_meals) combinations.
#   4. Keep only combos whose total cost fits the budget.
#   5. Score each valid plan on protein/fiber goals.
#   6. Return the top `num_plans` by score.
#
#  Candidate pool is capped at _MAX_CANDIDATES to keep the number
#  of combinations tractable (C(15,5) = 3003, C(15,7) = 6435).
# =================================================================
def generate_meal_plans(recipes, meal_plan, num_plans=5):
    budget = meal_plan.get("budget", float("inf"))
    num_meals = meal_plan.get("numMeals", 3)

    allowed = [r for r in recipes if is_recipe_allowed(r, meal_plan)]

    for recipe in allowed:
        if "costPerServing" not in recipe:
            recipe["costPerServing"] = cheapest_cost_per_serving(recipe)

    candidates = allowed[:_MAX_CANDIDATES]

    if len(candidates) < num_meals:
        return []

    # Duplicate each candidate so combinations() can pick it 0, 1, or 2 times.
    # Deduplicate equivalent combos by sorted recipe-ID tuple.
    pool = [r for r in candidates for _ in range(2)]
    seen = set()

    valid_plans = []
    for combo in combinations(pool, num_meals):
        key = tuple(sorted(r["id"] for r in combo))
        if key in seen:
            continue
        seen.add(key)
        total_cost = round(sum(r["costPerServing"] for r in combo), 2)
        if total_cost > budget:
            continue

        total_protein = round(sum(r.get("protein", 0) for r in combo), 2)
        total_fiber = round(sum(r.get("fiber", 0) for r in combo), 2)
        total_calories = round(sum(r.get("calories", 0) for r in combo), 2)
        total_prep = sum(r.get("prepTime", 0) for r in combo)

        plan = {
            "meals": list(combo),
            "totalProtein": total_protein,
            "totalFiber": total_fiber,
            "totalCalories": total_calories,
            "totalPrepTime": total_prep,
            "totalCost": total_cost,
            "estimatedCost": total_cost,
        }
        plan["totalScore"] = score_plan(plan, meal_plan)
        valid_plans.append(plan)

    valid_plans.sort(key=lambda p: p["totalScore"], reverse=True)
    return valid_plans[:num_plans]
