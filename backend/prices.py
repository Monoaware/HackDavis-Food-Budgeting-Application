import os
import re
import math
import json

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

_STORE_FILES = {
    "Safeway":            "safeway.json",
    "Trader Joe's":       "trader_joes.json",
    "Whole Foods Market": "whole_foods.json",
    "Kroger":             "kroger.json",
    "Costco":             "costco.json",
}

# Load each store's catalogue once at startup.
_store_catalogues = {}
for _store, _fname in _STORE_FILES.items():
    with open(os.path.join(_DATA_DIR, _fname)) as _f:
        _store_catalogues[_store] = json.load(_f)["catalogue"]

STORE_NAMES = list(_STORE_FILES.keys())

_MIN_COST_PER_SERVING = 1.50

# ── Unit normalization ────────────────────────────────────────────────────────

_UNIT_ALIASES = {
    "gallons": "gallon", "liters": "liter", "lbs": "lb", "pounds": "lb",
    "pound": "lb", "ounces": "oz", "ounce": "oz", "pints": "pint",
    "quarts": "quart", "counts": "count", "pieces": "piece",
    # volume shorthand from Spoonacular
    "cups": "cup", "c": "cup",
    "tbsp": "tablespoon", "tbs": "tablespoon", "t": "tablespoon",
    "teaspoons": "teaspoon",
    "tablespoons": "tablespoon",
    "grams": "g",
    "milliliter": "ml", "milliliters": "ml",
    # count-type shorthand
    "cloves": "clove", "clove": "clove",
    "servings": "serving",
}

def _normalize_unit(u):
    return _UNIT_ALIASES.get(u, u)


def _parse_size(size_str):
    """Parse a product size string into (total_amount, unit).

    Handles multi-packs ('8 x 15 oz cans' → (120, 'oz')),
    decimals ('0.5 gallon' → (0.5, 'gallon')),
    and two-word units ('52 fl oz' → (52, 'floz')).
    Returns (None, None) when unparseable.
    """
    s = size_str.lower().strip()
    s = re.sub(r'fl\.?\s*oz', 'floz', s)

    # Multi-pack: "N x M unit ..."
    m = re.match(r'(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*([a-z]+)', s)
    if m:
        qty = float(m.group(1)) * float(m.group(2))
        return round(qty, 4), _normalize_unit(m.group(3))

    # Standard: "N unit ..."  (extra trailing words like "pack", "can", "bag" are ignored)
    m = re.match(r'(\d+(?:\.\d+)?)\s+([a-z]+)', s)
    if m:
        return float(m.group(1)), _normalize_unit(m.group(2))

    return None, None


# ── Unit conversion tables (to common base units) ────────────────────────────

_WEIGHT_TO_OZ = {
    "oz": 1.0, "lb": 16.0, "g": 0.035274, "kg": 35.274,
}
_VOLUME_TO_FLOZ = {
    "floz": 1.0, "cup": 8.0, "tbsp": 0.5, "tablespoon": 0.5,
    "tsp": 1 / 6, "teaspoon": 1 / 6, "gallon": 128.0,
    "pint": 16.0, "quart": 32.0, "ml": 0.033814, "l": 33.814, "liter": 33.814,
}
# Units that represent countable items (eggs, cloves, slices, etc.)
_COUNT_UNITS = {
    "", "count", "piece", "pcs", "large", "medium", "small",
    "whole", "unit", "item", "clove", "slice", "egg",
    "serving", "bunch", "head", "stalk", "sprig", "pinch", "dash",
    "bag", "can", "jar", "bottle", "package", "box",
}


def _packages_needed(req_amount, req_unit, pkg_amount, pkg_unit):
    """Return how many packages of size (pkg_amount, pkg_unit) cover
    (req_amount, req_unit). Falls back to 1 when units are incompatible."""
    ru, pu = req_unit.lower(), pkg_unit.lower()

    if ru in _WEIGHT_TO_OZ and pu in _WEIGHT_TO_OZ:
        req_oz = req_amount * _WEIGHT_TO_OZ[ru]
        pkg_oz = pkg_amount * _WEIGHT_TO_OZ[pu]
        return math.ceil(req_oz / pkg_oz) if pkg_oz else 1

    if ru in _VOLUME_TO_FLOZ and pu in _VOLUME_TO_FLOZ:
        req_fl = req_amount * _VOLUME_TO_FLOZ[ru]
        pkg_fl = pkg_amount * _VOLUME_TO_FLOZ[pu]
        return math.ceil(req_fl / pkg_fl) if pkg_fl else 1

    if ru in _COUNT_UNITS and pu in _COUNT_UNITS:
        return math.ceil(req_amount / pkg_amount) if pkg_amount else 1

    # Incompatible units — assume one package suffices
    return 1


# ── Public API ────────────────────────────────────────────────────────────────

def lookup_price(ingredient_name, store_name, amount=0, unit=""):
    """Return the minimum cost to purchase `amount` `unit` of an ingredient
    at `store_name`.

    For each catalogue entry that matches the ingredient name, iterates all
    in-stock products, determines how many packages are needed to cover the
    required amount, and returns the cheapest total across all product options.
    Returns None if the ingredient is absent from the catalogue or all matching
    products are out of stock.
    """
    name = ingredient_name.lower()
    for entry in _store_catalogues.get(store_name, []):
        cat_key = entry["ingredient"].lower()
        if cat_key in name or name in cat_key:
            best = None
            for product in entry["products"]:
                if not product.get("in_stock"):
                    continue
                pkg_amount, pkg_unit = _parse_size(product["size"])
                if pkg_amount and amount > 0:
                    n = _packages_needed(amount, unit, pkg_amount, pkg_unit)
                else:
                    n = 1
                cost = round(n * product["price"], 2)
                if best is None or cost < best:
                    best = cost
            return best  # None if every matching product is out of stock
    return None


def cheapest_cost_per_serving(recipe):
    """Minimum purchase cost across all stores — used as a budget pre-filter.

    Ingredients absent from every catalogue are skipped (treated as $0) so we
    don't over-reject plans; suggest_store enforces the strict per-store check.
    """
    total = 0.0
    for ing in recipe.get("ingredients", []):
        prices = [
            lookup_price(ing.get("name", ""), s, ing.get("amount", 0), ing.get("unit", ""))
            for s in STORE_NAMES
        ]
        known = [p for p in prices if p is not None]
        if known:
            total += min(known)
    return round(max(total, _MIN_COST_PER_SERVING), 2)
