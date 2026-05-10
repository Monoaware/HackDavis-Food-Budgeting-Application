import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

_CLIENT_ID = os.getenv("KROGER_CLIENT_ID")
_CLIENT_SECRET = os.getenv("KROGER_CLIENT_SECRET")
_BASE_URL = "https://api-ce.kroger.com/v1"
_ZIP_CODE = "45202"

_token = None
_token_expiry = 0.0
_location_id = None
# ingredient_name (lower) -> list of {productId, brand, name, size, price}
_product_cache = {}


def _get_token():
    global _token, _token_expiry
    if _token and time.time() < _token_expiry - 60:
        return _token
    print("[KROGER] Fetching new OAuth token...")
    resp = requests.post(
        f"{_BASE_URL}/connect/oauth2/token",
        data={"grant_type": "client_credentials", "scope": "product.compact"},
        auth=(_CLIENT_ID, _CLIENT_SECRET),
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    _token = data["access_token"]
    _token_expiry = time.time() + data["expires_in"]
    print("[KROGER] Token OK")
    return _token


def _get_location_id():
    global _location_id
    if _location_id:
        return _location_id
    token = _get_token()
    resp = requests.get(
        f"{_BASE_URL}/locations",
        params={"filter.zipCode.near": _ZIP_CODE, "filter.limit": 1},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    resp.raise_for_status()
    locations = resp.json().get("data", [])
    if not locations:
        raise RuntimeError(f"No Kroger locations near ZIP {_ZIP_CODE}")
    _location_id = locations[0]["locationId"]
    return _location_id


def _fetch_options(ingredient_name):
    """Return list of product dicts for up to 5 Kroger products matching the ingredient."""
    token = _get_token()
    location_id = _get_location_id()
    resp = requests.get(
        f"{_BASE_URL}/products",
        params={
            "filter.term": ingredient_name,
            "filter.locationId": location_id,
            "filter.limit": 5,
        },
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    resp.raise_for_status()
    options = []
    for product in resp.json().get("data", []):
        for item in product.get("items", []):
            price_info = item.get("price", {})
            regular = price_info.get("regular")
            size = item.get("size", "")
            if regular is not None and size:
                options.append({
                    "productId": product.get("productId", ""),
                    "brand":     product.get("brand", ""),
                    "name":      product.get("description", ""),
                    "size":      size,
                    "price":     regular,
                })
    print(f"[KROGER] '{ingredient_name}' → {len(options)} options: {[(o['size'], o['price']) for o in options]}")
    return options


def _get_options(ingredient_name):
    name = ingredient_name.lower()
    if name not in _product_cache:
        try:
            _product_cache[name] = _fetch_options(ingredient_name)
        except Exception:
            _product_cache[name] = []
    return _product_cache[name]


def lookup_price(ingredient_name, amount=0, unit=""):
    """Return cheapest cost to purchase `amount` `unit` of ingredient. None if not found."""
    from prices import _parse_size, _packages_needed

    options = _get_options(ingredient_name)
    if not options:
        return None

    best = None
    for opt in options:
        pkg_amount, pkg_unit = _parse_size(opt["size"])
        n = _packages_needed(amount, unit, pkg_amount, pkg_unit) if (pkg_amount and amount > 0) else 1
        cost = round(n * opt["price"], 2)
        if best is None or cost < best:
            best = cost
    return best


def get_product_candidates(ingredient_name, amount=0, unit=""):
    """Return all available Kroger products with costs calculated."""
    from prices import _parse_size, _packages_needed

    options = _get_options(ingredient_name)
    candidates = []
    for opt in options:
        pkg_amount, pkg_unit = _parse_size(opt["size"])
        n = _packages_needed(amount, unit, pkg_amount, pkg_unit) if (pkg_amount and amount > 0) else 1
        cost = round(n * opt["price"], 2)
        candidates.append({
            "productId": opt["productId"],
            "brand":     opt["brand"],
            "name":      opt["name"],
            "size":      opt["size"],
            "unitPrice": opt["price"],
            "totalCost": cost,
        })
    return candidates


def lookup_product(ingredient_name, amount=0, unit=""):
    """Return the cheapest product dict {productId, brand, name, size, price, totalCost}
    needed to cover `amount` `unit` of `ingredient_name`. None if not found.
    """
    from prices import _parse_size, _packages_needed

    options = _get_options(ingredient_name)
    if not options:
        return None

    best_cost = None
    best_opt = None
    for opt in options:
        pkg_amount, pkg_unit = _parse_size(opt["size"])
        n = _packages_needed(amount, unit, pkg_amount, pkg_unit) if (pkg_amount and amount > 0) else 1
        cost = round(n * opt["price"], 2)
        if best_cost is None or cost < best_cost:
            best_cost = cost
            best_opt = opt

    if best_opt is None:
        return None

    return {
        "productId": best_opt["productId"],
        "brand":     best_opt["brand"],
        "name":      best_opt["name"],
        "size":      best_opt["size"],
        "unitPrice": best_opt["price"],
        "totalCost": best_cost,
    }
