_STORES = [
    {"name": "Aldi", "tagline": "Unbeatable prices on everyday essentials"},
    {"name": "Trader Joe's", "tagline": "Affordable specialty and organic foods"},
    {"name": "Safeway", "tagline": "Wide selection with weekly deals"},
    {"name": "Whole Foods", "tagline": "Premium organic and natural foods"},
    {"name": "Costco", "tagline": "Bulk buying for maximum savings"},
]


def consolidate_ingredients(recipes):
    merged = {}

    for recipe in recipes:
        for ing in recipe.get("ingredients", []):
            name = ing.get("name", "").strip().lower()
            amount = ing.get("amount", 0)
            unit = ing.get("unit", "")

            if not name:
                continue

            key = (name, unit.lower())
            if key in merged:
                merged[key]["amount"] = round(merged[key]["amount"] + amount, 2)
            else:
                merged[key] = {
                    "name": name,
                    "amount": round(amount, 2),
                    "unit": unit,
                    "estimatedCost": None,
                }

    return sorted(merged.values(), key=lambda x: x["name"])


def suggest_store(plan):
    """Return the single best-fit store for a plan based on total cost."""
    total_cost = plan.get("totalCost", 0)
    if total_cost < 20:
        return _STORES[0]   # Aldi
    elif total_cost < 35:
        return _STORES[1]   # Trader Joe's
    elif total_cost < 55:
        return _STORES[2]   # Safeway
    elif total_cost < 80:
        return _STORES[3]   # Whole Foods
    else:
        return _STORES[4]   # Costco
