import { useState } from 'react'

const DIET_SLUG: Record<string, string> = {
  'gluten free': 'glutenfree',
  'low fodmap': 'lowfodmap',
  'lacto-vegetarian': 'lacto-vegetarian',
  'ovo-vegetarian': 'ovo-vegetarian',
}
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PreferencesPage, { type PlanPreferences } from './pages/PreferencesPage'
import RankingPage from './pages/RankingPage'
import ResultsPage, { type Plan } from './pages/ResultsPage'

type Page = 'dashboard' | 'preferences' | 'ranking' | 'results'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [page, setPage] = useState<Page>('dashboard')
  const [results, setResults] = useState<Plan[]>([])
  const [lastPrefs, setLastPrefs] = useState<PlanPreferences | null>(null)

  function handleSignOut() {
    localStorage.removeItem('token')
    setToken(null)
    setPage('dashboard')
  }

  async function handlePlanSubmit(prefs: PlanPreferences) {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealPlan: {
          numMeals:     prefs.numMeals,
          budget:       prefs.budget ? parseFloat(prefs.budget) : undefined,
          allergens:    (() => { const v = prefs.intolerances.map(i => i.toLowerCase()); console.log('[DEBUG] allergens:', v); return v; })(),
          dietaryTags:  (() => { const v = prefs.diets.map(d => { const lower = d.toLowerCase(); return DIET_SLUG[lower] ?? lower }); console.log('[DEBUG] dietaryTags:', v); return v; })(),
          proteinGoal:  prefs.proteinGoal ? parseFloat(prefs.proteinGoal) : undefined,
          fiberGoal:    prefs.fiberGoal   ? parseFloat(prefs.fiberGoal)   : undefined,
          maxPrepTime:  prefs.maxPrepTime ? parseFloat(prefs.maxPrepTime) : undefined,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to generate plans.')

    setLastPrefs(prefs)
    setResults(data.plans)
    setPage('ranking')
  }

  async function handleRank(query: string) {
    const res = await fetch('/api/rank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plans: results, rankingQuery: query }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to rank plans.')
    setResults(data.plans)
    setPage('results')
  }

  async function handleSelectPlan(plan: Plan) {
    const prefs = lastPrefs!
    const body: Record<string, unknown> = {
      number_of_meals:  prefs.numMeals,
      protein:          parseFloat(prefs.proteinGoal) || 0,
      fiber:            parseFloat(prefs.fiberGoal) || 0,
      meals:            plan.meals,
      totalCost:        plan.totalCost,
      totalProtein:     plan.totalProtein,
      totalFiber:       plan.totalFiber,
      totalCalories:    plan.totalCalories,
      totalPrepTime:    plan.totalPrepTime,
      suggestedStore:   plan.suggestedStore,
      geminiRank:       plan.geminiRank,
      geminiExplanation: plan.geminiExplanation,
    }
    if (prefs.budget)              body.budget       = parseFloat(prefs.budget)
    if (prefs.intolerances.length) body.Intolerances = prefs.intolerances
    if (prefs.diets.length)        body.Diets        = prefs.diets
    if (prefs.maxPrepTime)         body.maxPrepTime  = parseFloat(prefs.maxPrepTime)

    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error('Failed to save plan.')
    setPage('dashboard')
  }

  if (!token) return <AuthPage onSuccess={setToken} />

  if (page === 'preferences') {
    return (
      <PreferencesPage
        onBack={() => setPage('dashboard')}
        onSubmit={handlePlanSubmit}
      />
    )
  }

  if (page === 'ranking') {
    return (
      <RankingPage
        plans={results}
        onBack={() => setPage('preferences')}
        onRank={handleRank}
      />
    )
  }

  if (page === 'results') {
    return (
      <ResultsPage
        plans={results}
        onBack={() => setPage('preferences')}
        onSelect={handleSelectPlan}
      />
    )
  }

  return (
    <DashboardPage
      onSignOut={handleSignOut}
      onCreatePlan={() => setPage('preferences')}
    />
  )
}
