import os
import json
from prices import lookup_price, get_product_candidates, STORE_NAMES

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


def _rank_products_with_gemini(ingredient_candidates):
    """Batch-call Gemini to pick the most relevant product for each ingredient.

    ingredient_candidates: list of {ingredient, amount, unit, candidates: [...]}
    Returns: {ingredient_name: chosen_product_dict or None}
    """
    from google import genai

    items_with_candidates = [c for c in ingredient_candidates if c["candidates"]]
    if not items_with_candidates:
        return {}

    lines = []
    for i, item in enumerate(items_with_candidates):
        cands = "\n".join(
            f"  [{j}] {c.get('brand', '')} {c['name']} ({c['size']}) ${c['totalCost']:.2f}"
            for j, c in enumerate(item["candidates"])
        )
        lines.append(
            f"Ingredient {i}: {item['amount']} {item['unit']} {item['ingredient']}\n{cands}"
        )

    prompt = (
        "You are a grocery shopping assistant. For each cooking ingredient below, "
        "choose the best candidate index that is:\n"
        "1. A human food product appropriate for cooking (NOT pet food, cleaning supplies, "
        "cosmetics, or non-food items — reject these outright)\n"
        "2. The closest available match to what the recipe needs — if the exact form isn't "
        "available, pick the nearest substitute (e.g., if the recipe needs rotisserie chicken "
        "and only raw chicken is available, pick raw chicken; if it needs fresh basil and only "
        "dried basil is available, pick dried basil)\n"
        "3. Only return null if ALL candidates are clearly wrong categories (pet food, "
        "cleaning products, etc.) — never null just because the form differs slightly\n\n"
        "Return ONLY a JSON object mapping each ingredient index (string key) to the chosen "
        "candidate index (integer) or null.\n"
        "Example: {\"0\": 1, \"1\": null, \"2\": 0}\n\n"
        + "\n\n".join(lines)
    )

    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        choices = json.loads(response.text)
    except Exception as e:
        print(f"[GEMINI GROCERY] Ranking failed, falling back to cheapest: {e}")
        return {
            item["ingredient"]: min(item["candidates"], key=lambda c: c["totalCost"])
            for item in items_with_candidates
        }

    result = {}
    for i, item in enumerate(items_with_candidates):
        idx = choices.get(str(i))
        if idx is not None and isinstance(idx, int) and 0 <= idx < len(item["candidates"]):
            result[item["ingredient"]] = item["candidates"][idx]
        else:
            result[item["ingredient"]] = None

    return result


def suggest_store(grocery_list):
    """Return the cheapest store that stocks every ingredient, with Gemini-ranked products.

    A store is skipped if any ingredient returns None (not in catalogue or out of stock).
    Returns None if no store can fulfill the full list.
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

    # Collect all product candidates at the winning store, then let Gemini rank them.
    ingredient_candidates = []
    for item in grocery_list:
        candidates = get_product_candidates(
            item["name"], best_store, item.get("amount", 0), item.get("unit", "")
        )
        ingredient_candidates.append({
            "ingredient": item["name"],
            "amount":     item.get("amount", 0),
            "unit":       item.get("unit", ""),
            "candidates": candidates,
        })

    chosen = _rank_products_with_gemini(ingredient_candidates)
    for item in grocery_list:
        item["product"] = chosen.get(item["name"])

    return {
        "name":          best_store,
        "tagline":       _STORE_META.get(best_store, ""),
        "estimatedCost": best_cost,
    }
