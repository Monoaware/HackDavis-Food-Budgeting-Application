import { useState } from 'react'
import '../styles/results.css'

export interface Meal {
  id: number
  title: string
  prepTime: number
  protein: number
  fiber: number
  calories: number
}

export interface Plan {
  meals: Meal[]
  totalCost: number
  totalProtein: number
  totalFiber: number
  totalCalories: number
  totalPrepTime: number
  estimatedCost: number
  suggestedStore?: { name: string; estimatedCost: number; description?: string }
  geminiRank: number
  geminiExplanation: string
}

interface Props {
  plans: Plan[]
  onBack: () => void
  onSelect: (plan: Plan) => Promise<void>
}

export default function ResultsPage({ plans, onBack, onSelect }: Props) {
  const sorted = [...plans].sort((a, b) => a.geminiRank - b.geminiRank)

  return (
    <div>
      <header className="results-header">
        <button className="btn-back" type="button" onClick={onBack}>
          <BackIcon />
          Edit preferences
        </button>
        <span className="results-header-title">Your meal plans</span>
      </header>

      <div className="results-body">
        <p className="results-intro">
          {sorted.length} plan{sorted.length !== 1 ? 's' : ''} ranked for you — select the one that fits best.
        </p>

        {sorted.map((plan, i) => (
          <PlanCard key={i} plan={plan} isTop={i === 0} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function PlanCard({ plan, isTop, onSelect }: { plan: Plan; isTop: boolean; onSelect: (p: Plan) => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelect() {
    setError('')
    setLoading(true)
    try {
      await onSelect(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan.')
      setLoading(false)
    }
  }

  const cost = plan.suggestedStore?.estimatedCost ?? plan.totalCost

  return (
    <div className={`result-card${isTop ? ' top-pick' : ''}`} style={{ animationDelay: `${plan.geminiRank * 0.08}s` }}>

      <div className="result-card-header">
        <div className="result-rank-row">
          <span className="result-rank">#{plan.geminiRank}</span>
          {isTop && <span className="badge-top">Best match</span>}
        </div>
        <span className="result-cost">${cost.toFixed(2)}</span>
      </div>

      {plan.geminiExplanation && (
        <div className="result-explanation">"{plan.geminiExplanation}"</div>
      )}

      <div className="result-meals">
        {plan.meals.map(meal => (
          <div key={meal.id} className="result-meal-row">
            <span className="result-meal-title">{meal.title}</span>
            <div className="result-meal-meta">
              <span>{meal.protein}g protein</span>
              <span>{meal.fiber}g fiber</span>
              <span>{meal.prepTime}m</span>
            </div>
          </div>
        ))}
      </div>

      <div className="result-totals">
        <div className="result-total-item">
          <span className="result-total-label">Total protein</span>
          <span className="result-total-value">{plan.totalProtein}g</span>
        </div>
        <div className="result-total-item">
          <span className="result-total-label">Total fiber</span>
          <span className="result-total-value">{plan.totalFiber}g</span>
        </div>
        <div className="result-total-item">
          <span className="result-total-label">Calories</span>
          <span className="result-total-value">{plan.totalCalories} kcal</span>
        </div>
        <div className="result-total-item">
          <span className="result-total-label">Prep time</span>
          <span className="result-total-value">{plan.totalPrepTime} min</span>
        </div>
      </div>

      <div className="result-card-footer">
        <div className="result-store">
          {plan.suggestedStore && (
            <>
              <span className="result-store-dot" />
              {plan.suggestedStore.name}
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          {error && <span className="form-error" style={{ marginBottom: 0 }}>{error}</span>}
          <button className="btn-select-plan" onClick={handleSelect} disabled={loading}>
            {loading ? 'Saving…' : 'Select this plan'}
          </button>
        </div>
      </div>

    </div>
  )
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}
