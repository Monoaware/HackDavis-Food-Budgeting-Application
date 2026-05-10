import { useState, useEffect } from 'react'
import '../styles/dashboard.css'

interface Ingredient {
  name: string
  amount: number
  perServingAmount?: number
  unit: string
  product?: {
    productId: string
    brand: string
    name: string
    size: string
    unitPrice: number
    totalCost: number
  }
}

interface Meal {
  title: string
  image?: string
  servings?: number
  prepTime?: number
  protein?: number
  fiber?: number
  calories?: number
  ingredients?: Ingredient[]
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
  suggestedStore?: { name: string; estimatedCost: number; tagline?: string }
  groceryList?: Ingredient[]
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
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null)

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

  function findGroceryItem(name: string) {
    return plan!.groceryList?.find(
      g => g.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  }

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
          <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 600 }}>Meals</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
            Click a meal to see ingredients
            {plan.suggestedStore ? ` · Shopping at ${plan.suggestedStore.name}` : ''}
          </p>
          {plan.meals && plan.meals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {plan.meals.map((meal, i) => (
                <div
                  key={i}
                  onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
                  style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {meal.image && (
                      <img
                        src={meal.image}
                        alt={meal.title}
                        style={{ width: '110px', height: '110px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ padding: '1rem', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{meal.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {meal.sourceUrl && (
                            <a
                              href={meal.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: '0.8rem', color: 'var(--rust)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                            >
                              View recipe ↗
                            </a>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', userSelect: 'none' }}>
                            {expandedMeal === i ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {meal.prepTime != null && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>⏱ {meal.prepTime} min</span>}
                        {meal.calories  != null && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🔥 {Math.round(meal.calories)} cal</span>}
                        {meal.protein   != null && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>💪 {meal.protein.toFixed(1)}g protein</span>}
                        {meal.fiber     != null && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🌿 {meal.fiber.toFixed(1)}g fiber</span>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded ingredient + product details */}
                  {expandedMeal === i && meal.ingredients && meal.ingredients.length > 0 && (
                    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(250,248,243,0.5)' }}>
                      {plan.suggestedStore && (
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)' }}>
                          🛒 {plan.suggestedStore.name} · est. ${plan.suggestedStore.estimatedCost.toFixed(2)} total
                        </p>
                      )}
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                        Ingredients (per serving{meal.servings && meal.servings > 1 ? ` of ${meal.servings}` : ''})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {meal.ingredients.map((ing, j) => {
                          const displayAmt = ing.perServingAmount ?? (meal.servings && meal.servings > 1 ? +(ing.amount / meal.servings).toFixed(2) : ing.amount)
                          const groceryItem = findGroceryItem(ing.name)
                          return (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text)', flexShrink: 0 }}>
                                {displayAmt} {ing.unit} <strong>{ing.name}</strong>
                              </span>
                              {groceryItem?.product ? (
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
                                    {groceryItem.product.brand ? `${groceryItem.product.brand} · ` : ''}{groceryItem.product.name}
                                  </p>
                                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                                    {groceryItem.product.size} · <strong style={{ color: 'var(--text)' }}>${groceryItem.product.totalCost.toFixed(2)}</strong>
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No meals in this plan.</p>
          )}
        </div>

        {/* Grocery list */}
        {plan.groceryList && plan.groceryList.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 600 }}>Grocery list</h3>
            {plan.suggestedStore && (
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                Buy at {plan.suggestedStore.name} · estimated ${plan.suggestedStore.estimatedCost.toFixed(2)}
              </p>
            )}
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              {plan.groceryList.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.65rem 1rem', gap: '1rem',
                    borderBottom: i < plan.groceryList!.length - 1 ? '1px solid var(--border)' : 'none',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(250,248,243,0.3)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {item.amount} {item.unit} {item.name}
                    </span>
                    {item.product && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {item.product.brand ? `${item.product.brand} · ` : ''}{item.product.name} ({item.product.size})
                      </p>
                    )}
                  </div>
                  {item.product ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      ${item.product.totalCost.toFixed(2)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>—</span>
                  )}
                </div>
              ))}
              {/* Total row */}
              {plan.suggestedStore && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.65rem 1rem', borderTop: '2px solid var(--border)',
                  backgroundColor: 'rgba(250,248,243,0.5)',
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    ${plan.suggestedStore.estimatedCost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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
