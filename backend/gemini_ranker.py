import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-2.0-flash")


def _build_prompt(plans, user):
    protein_goal = user.get("proteinGoal", 0)
    fiber_goal = user.get("fiberGoal", 0)

    plan_summaries = []
    for i, plan in enumerate(plans):
        plan_summaries.append({
            "planIndex": i,
            "totalProtein": plan.get("totalProtein", 0),
            "totalFiber": plan.get("totalFiber", 0),
            "totalScore": plan.get("totalScore", 0),
            "meals": [m.get("title", "") for m in plan.get("meals", [])],
        })

    return f"""You are a nutrition expert helping rank meal plans for a user.

User's daily goals:
- Protein: {protein_goal}g
- Fiber: {fiber_goal}g

Here are the candidate meal plans with their nutritional totals and pre-computed scores:
{json.dumps(plan_summaries, indent=2)}

Rank these plans from best to worst based on how well they help the user meet their daily protein and fiber goals. Consider overall nutritional balance and variety.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{{
  "ranking": [
    {{"planIndex": 0, "explanation": "..."}},
    ...
  ]
}}

The "ranking" array must contain all {len(plans)} plans ordered from best (index 0) to worst."""


def rank_meal_plans(plans, user):
    if not plans:
        return plans

    prompt = _build_prompt(plans, user)
    response = _model.generate_content(prompt)

    try:
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        ranking = data.get("ranking", [])
    except (json.JSONDecodeError, AttributeError):
        # If Gemini response can't be parsed, return plans as-is with default ranks
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

    # Append any plans that Gemini didn't include (safety net)
    included = {entry.get("planIndex") for entry in ranking}
    for i, plan in enumerate(plans):
        if i not in included:
            plan["geminiRank"] = len(ranked_plans) + 1
            plan["geminiExplanation"] = ""
            ranked_plans.append(plan)

    return ranked_plans
