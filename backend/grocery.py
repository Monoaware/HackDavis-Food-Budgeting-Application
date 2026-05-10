import os
import json
from prices import lookup_price, STORE_NAMES, _parse_size, _packages_needed

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
    """Find the store with the best ingredient coverage, breaking ties by lowest cost.

    Does NOT require every ingredient to be in the catalogue — partial matches are fine.
    Items not found at the chosen store will simply have no product mapping.
    Returns None only if no store stocks any ingredient at all.
    """
    best_store = None
    best_cost = float("inf")
    best_coverage = -1

    for store_name in STORE_NAMES:
        total = 0.0
        covered = 0
        for item in grocery_list:
            price = lookup_price(item["name"], store_name, item.get("amount", 0), item.get("unit", ""))
            if price is not None:
                total += price
                covered += 1

        if covered == 0:
            continue

        total = round(total, 2)
        if covered > best_coverage or (covered == best_coverage and total < best_cost):
            best_coverage = covered
            best_cost = total
            best_store = store_name

    if best_store is None:
        return None

    return {
        "name":          best_store,
        "tagline":       _STORE_META.get(best_store, ""),
        "estimatedCost": best_cost,
    }


def enrich_grocery_list(grocery_list, chosen_products):
    """Apply pre-ranked product choices to a grocery list.

    Recalculates totalCost based on each item's actual required amount so that
    different plans buying different quantities of the same ingredient stay accurate.
    chosen_products: {ingredient_name: {productId, brand, name, size, unitPrice, ...} | None}
    """
    for item in grocery_list:
        template = chosen_products.get(item["name"])
        if not template:
            item["product"] = None
            continue
        pkg_amount, pkg_unit = _parse_size(template["size"])
        n = (
            _packages_needed(item["amount"], item["unit"], pkg_amount, pkg_unit)
            if (pkg_amount and item["amount"] > 0)
            else 1
        )
        item["product"] = {**template, "totalCost": round(n * template["unitPrice"], 2)}


def rank_ingredients_with_gemini(ingredient_candidates):
    """Single Gemini call to pick the most relevant product for each unique ingredient.

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
