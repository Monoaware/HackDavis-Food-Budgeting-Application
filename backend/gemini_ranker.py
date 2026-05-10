import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
_MODEL = "gemini-2.5-flash"


def _build_prompt(plans, meal_plan):
    protein_goal = meal_plan.get("proteinGoal")
    fiber_goal   = meal_plan.get("fiberGoal")
    ranking_query = meal_plan.get("rankingQuery", "").strip()

    plan_summaries = []
    for i, plan in enumerate(plans):
        plan_summaries.append({
            "planIndex": i,
            "meals": [
                {
                    "title": m.get("title", ""),
                    "prepTime": m.get("prepTime", 0),
                    "protein": m.get("protein", 0),
                    "fiber": m.get("fiber", 0),
                    "calories": m.get("calories", 0),
                }
                for m in plan.get("meals", [])
            ],
            "totalProtein": plan.get("totalProtein", 0),
            "totalFiber": plan.get("totalFiber", 0),
            "totalCalories": plan.get("totalCalories", 0),
            "totalPrepTime": plan.get("totalPrepTime", 0),
            "estimatedCost": plan.get("estimatedCost", 0),
            "totalScore": plan.get("totalScore", 0),
        })

    goals = []
    if protein_goal:
        goals.append(f"- Protein: {protein_goal}g per plan")
    if fiber_goal:
        goals.append(f"- Fiber: {fiber_goal}g per plan")
    goals_section = "\n".join(goals) if goals else "- No specific nutrition goals set."

    if ranking_query:
        ranking_instruction = f'The user has a specific request: "{ranking_query}". Rank the plans primarily based on this request, using the data provided to answer it as precisely as possible.'
    elif goals:
        ranking_instruction = "Rank the plans based on how well they help the user meet their stated nutrition goals. Consider overall nutritional balance and variety."
    else:
        ranking_instruction = "The user has no specific nutrition goals. Rank the plans based on overall nutritional balance, variety, and reasonable macros."

    return f"""You are a nutrition expert helping rank meal plans for a user.

User's goals:
{goals_section}

Here are the candidate meal plans with full nutritional and timing data:
{json.dumps(plan_summaries, indent=2)}

{ranking_instruction}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{{
  "ranking": [
    {{"planIndex": 0, "explanation": "..."}},
    ...
  ]
}}

The "ranking" array must contain all {len(plans)} plans ordered from best (index 0) to worst."""


def rank_meal_plans(plans, meal_plan):
    if not plans:
        return plans

    prompt = _build_prompt(plans, meal_plan)

    try:
        response = _client.models.generate_content(model=_MODEL, contents=prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        ranking = data.get("ranking", [])
    except Exception:
        for i, plan in enumerate(plans):
            plan["geminiRank"] = i + 1
            plan["geminiExplanation"] = ""
        return plans

    ranked_plans = []
    for rank, entry in enumerate(ranking):
        idx = entry.get("planIndex")
        if idx is not None and 0 <= idx < len(plans):
            plan = plans[idx]
            plan["geminiRank"] = rank + 1
            plan["geminiExplanation"] = entry.get("explanation", "")
            ranked_plans.append(plan)

    included = {entry.get("planIndex") for entry in ranking}
    for i, plan in enumerate(plans):
        if i not in included:
            plan["geminiRank"] = len(ranked_plans) + 1
            plan["geminiExplanation"] = ""
            ranked_plans.append(plan)

    return ranked_plans
