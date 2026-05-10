import { useState, useEffect } from 'react'
import '../styles/dashboard.css'

interface Meal {
  title: string
  image?: string
  servings?: number
  prepTime?: number
  ingredients?: string[]
  sourceUrl?: string
}

interface MealPlan {
  _id: string
  number_of_meals: number
  budget?: number
  Diets?: string[]
  Intolerances?: string[]
  maxPrepTime?: number
  created_at: string
  meals?: Meal[]
  totalCost?: number
  totalProtein?: number
  totalFiber?: number
  totalCalories?: number
  totalPrepTime?: number
  suggestedStore?: { name: string; estimatedCost: number }
  geminiRank?: number
  geminiExplanation?: string
}

interface Props {
  planId: string
  onBack: () => void
}

export default function MealPage({ planId, onBack }: Props) {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/meal-plans/${planId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        if (!res.ok) throw new Error('Failed to load plan')
        const data = await res.json()
        setPlan(data.meal_plan)
      } catch (err) {
        setError('Could not load plan details.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [planId])

  if (loading) return <p style={{ padding: '2rem', color: 'var(--muted)' }}>Loading…</p>
  if (error) return <p style={{ padding: '2rem', color: 'var(--error)' }}>{error}</p>
  if (!plan) return <p style={{ padding: '2rem', color: 'var(--muted)' }}>Plan not found.</p>

  const date = new Date(plan.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const tags = [...(plan.Diets ?? []), ...(plan.Intolerances ?? [])]

  return (
    <div>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--text)',
            textDecoration: 'none',
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Meal Plan Details</h1>
        <div style={{ width: '2rem' }} />
      </header>

      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Plan Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{plan.number_of_meals} meal{plan.number_of_meals !== 1 ? 's' : ''}</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>{date}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {plan.totalCost != null ? `$${plan.totalCost.toFixed(2)}` : plan.budget != null ? `$${plan.budget.toFixed(2)}` : '—'}
            </div>
            {plan.suggestedStore && (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
                Suggested: {plan.suggestedStore.name}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)' }}>Preferences</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    color: 'var(--muted)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {plan.totalCalories != null && (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Calories</p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{plan.totalCalories.toFixed(0)}</p>
            </div>
          )}
          {plan.totalProtein != null && (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Protein (g)</p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{plan.totalProtein.toFixed(1)}</p>
            </div>
          )}
          {plan.totalFiber != null && (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Fiber (g)</p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{plan.totalFiber.toFixed(1)}</p>
            </div>
          )}
          {plan.totalPrepTime != null && (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Prep Time</p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{plan.totalPrepTime} min</p>
            </div>
          )}
        </div>

        {/* Meals */}
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Meals</h3>
          {plan.meals && plan.meals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {plan.meals.map((meal, i) => (
                <div
                  key={i}
                  onClick={() => meal.sourceUrl && window.open(meal.sourceUrl, '_blank')}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: meal.sourceUrl ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (meal.sourceUrl) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                >
                  {meal.image && (
                    <img
                      src={meal.image}
                      alt={meal.title}
                      style={{
                        width: '100%',
                        height: '140px',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600 }}>{meal.title}</h4>
                    {meal.prepTime != null && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        ⏱ {meal.prepTime} min
                      </p>
                    )}
                    {meal.servings != null && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        🍽 {meal.servings} servings
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No meals in this plan.</p>
          )}
        </div>

        {/* AI Explanation */}
        {plan.geminiExplanation && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(250,248,243,0.3)', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>AI Recommendation</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text)' }}>
              {plan.geminiExplanation}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
