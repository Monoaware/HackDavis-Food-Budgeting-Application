# =================================================================
#  We need to filter for user-specific limitations:
#  NOTE: This is just for hard-limits. We consider nutrition (such
#  as macros and micros 
# =================================================================
def is_recipe_allowed(recipe, user):
    user_allergies = user.get("allergies", [])
    recipe_allergens = recipe.get("allergens", [])

    # Avoid ALL allergens listed by the user:
    avoids_allergens = all(
        allergy not in recipe_allergens for allergy in user_allergies
    )

    # Check if the user has dietary specific requests and match them if so:
    # Users can select diet tags (e.g. "vegan", "keto", "high-protein", etc.):
    diet = user.get("diet", "none")
    
    # Recipes are given diet tags:
    recipe_diets = recipe.get("dietTags", []) 

    # Check if the user's selected dietary tag also exists for the recipe:
    matches_diet = matches_user_diet(diet, recipe_diets)

    # User can select a max-preparation time, otherwise default to basically ignoring the filter:
    max_prep_time = user.get("maxPrepTime", 999)

    # Only suggest the recipe if the recipe is within the time constraint:
    within_prep_time = recipe.get("prepTime", 999) <= max_prep_time

    return avoids_allergens and matches_diet and within_prep_time

# =================================================================
#  Check if a recipe matches a user's selected dietary plan: 
# =================================================================
def matches_user_diet(diet, recipe_diets):
    if diet == "none":
        return True
    
    return diet in recipe_diets


