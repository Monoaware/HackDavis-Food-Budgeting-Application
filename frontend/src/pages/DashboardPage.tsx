import { useEffect, useState } from 'react'
import '../styles/dashboard.css'

interface MealPlan {
  _id: string
  number_of_meals: number
  budget?: number
  totalCost?: number
  totalProtein?: number
  totalFiber?: number
  totalCalories?: number
  totalPrepTime?: number
  Diets?: string[]
  Intolerances?: string[]
  created_at: string
  meals?: Array<{ title: string; image?: string }>
}

interface Props {
  onSignOut: () => void
  onCreatePlan: () => void
}

export default function DashboardPage({ onSignOut, onCreatePlan }: Props) {
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/meal-plans', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        if (!res.ok) throw new Error('Failed to load plans')
        const data = await res.json()
        setPlans(data.meal_plans)
      } catch {
        setError('Could not load your plans.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  return (
    <div>
      <nav className="dash-nav">
        <div className="logo-mark">
          <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 6C28 6 14 7 9 18C6 25 10 30 18 28C26 26 30 14 28 6Z" fill="rgba(250,248,243,0.85)"/>
            <line x1="18" y1="28" x2="14" y2="34" stroke="rgba(250,248,243,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="logo-name">FreshBudget</span>
        </div>

        <div className="dash-nav-right">
          <button className="btn-signout" onClick={onSignOut}>Sign out</button>
        </div>
      </nav>

      <div className="dash-hero">
        <h1 className="dash-greeting">Your meal plans.</h1>
        <p className="dash-sub">Ready to plan your next week?</p>
        <button className="btn-new-plan" onClick={onCreatePlan}>
          <PlusIcon />
          Create new plan
        </button>
      </div>

      <main className="dash-main">
        <h2 className="dash-section-title">Saved plans</h2>

        {loading && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading…</p>}

        {error && <p className="form-error">{error}</p>}

        {!loading && !error && plans.length === 0 && (
          <div className="empty-state">
            <p>No plans yet. Create your first one above.</p>
          </div>
        )}

        {!loading && plans.length > 0 && (
          <div className="plan-grid">
            {plans.map((plan, i) => (
              <PlanCard key={plan._id} plan={plan} delay={i * 0.07} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function PlanCard({ plan, delay }: { plan: MealPlan; delay: number }) {
  const date = new Date(plan.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const tags = [...(plan.Diets ?? []), ...(plan.Intolerances ?? [])]

  return (
    <div className="plan-card" style={{ animationDelay: `${delay}s` }}>
      <div className="plan-card-header">
        <span className="plan-cost">
          {plan.totalCost != null ? `$${plan.totalCost.toFixed(2)}` : plan.budget != null ? `$${plan.budget.toFixed(2)}` : '—'}
        </span>
        <span className="plan-date">{date}</span>
      </div>

      <MealThumbs meals={plan.meals} />

      {plan.meals && plan.meals.length > 0 && (
        <ul className="plan-meals">
          {plan.meals.map((meal, i) => (
            <li key={i}>{meal.title}</li>
          ))}
        </ul>
      )}

      {(plan.totalProtein != null || plan.totalCalories != null || plan.totalFiber != null || plan.totalPrepTime != null) && (
        <div className="plan-stats">
          {plan.totalProtein  != null && <span>{plan.totalProtein}g protein</span>}
          {plan.totalCalories != null && <span>{plan.totalCalories} kcal</span>}
          {plan.totalFiber    != null && <span>{plan.totalFiber}g fiber</span>}
          {plan.totalPrepTime != null && <span>{plan.totalPrepTime} min prep</span>}
        </div>
      )}

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="plan-card-footer">
        <div />
        <button className="btn-view-plan">View</button>
      </div>
    </div>
  )
}

const MAX_THUMBS = 5

function MealThumbs({ meals }: { meals?: Array<{ title: string; image?: string }> }) {
  if (!meals || meals.length === 0) return null
  const withImages = meals.filter(m => m.image)
  if (withImages.length === 0) return null

  const visible = withImages.slice(0, MAX_THUMBS)
  const overflow = withImages.length - visible.length

  return (
    <div className="meal-thumbs">
      {visible.map((meal, i) => (
        <img
          key={i}
          className="meal-thumb"
          src={meal.image}
          alt={meal.title}
          title={meal.title}
        />
      ))}
      {overflow > 0 && (
        <div className="meal-thumb-overflow">+{overflow}</div>
      )}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
