from prices import lookup_price, STORE_NAMES

_STORE_META = {
    "Safeway":            "Wide selection with weekly deals",
    "Trader Joe's":       "Affordable specialty and organic foods",
    "Whole Foods Market": "Premium organic and natural foods",
    "Kroger":             "Everyday low prices with store brand savings",
    "Costco":             "Bulk buying for maximum savings",
}


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


def suggest_store(grocery_list):
    """Return the cheapest store that stocks every ingredient in the grocery list.

    A store is skipped entirely if any ingredient returns None (not in catalogue
    or fully out of stock). Returns None if no store can fulfill the full list.
    """
    best_store = None
    best_cost = float("inf")

    for store_name in STORE_NAMES:
        total = 0.0
        skip = False
        for item in grocery_list:
            price = lookup_price(item["name"], store_name, item.get("amount", 0), item.get("unit", ""))
            if price is None:
                skip = True
                break
            total += price
        if skip:
            continue
        total = round(total, 2)
        if total < best_cost:
            best_cost = total
            best_store = store_name

    if best_store is None:
        return None

    return {
        "name": best_store,
        "tagline": _STORE_META.get(best_store, ""),
        "estimatedCost": best_cost,
    }
