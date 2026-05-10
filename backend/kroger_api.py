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
_product_cache = {}  # ingredient_name (lower) -> list of (size_str, regular_price)


def _get_token():
    global _token, _token_expiry
    if _token and time.time() < _token_expiry - 60:
        return _token
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
    """Return [(size_str, regular_price), ...] for up to 5 Kroger products matching the ingredient."""
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
                options.append((size, regular))
    return options


def lookup_price(ingredient_name, amount=0, unit=""):
    """Return cheapest cost to purchase `amount` `unit` of ingredient from Kroger live API.

    Returns None if the ingredient can't be found or the API is unavailable.
    """
    from prices import _parse_size, _packages_needed

    name = ingredient_name.lower()
    if name not in _product_cache:
        try:
            _product_cache[name] = _fetch_options(ingredient_name)
        except Exception:
            _product_cache[name] = []

    options = _product_cache[name]
    if not options:
        return None

    best = None
    for size_str, price in options:
        pkg_amount, pkg_unit = _parse_size(size_str)
        if pkg_amount and amount > 0:
            n = _packages_needed(amount, unit, pkg_amount, pkg_unit)
        else:
            n = 1
        cost = round(n * price, 2)
        if best is None or cost < best:
            best = cost
    return best
