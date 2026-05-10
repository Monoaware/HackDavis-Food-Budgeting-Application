import '../styles/dashboard.css'

interface MealPlan {
  id: number
  meals: string[]
  cost: number
  store: string
  date: string
}

const MOCK_PLANS: MealPlan[] = [
  {
    id: 1,
    meals: ['Lemon Herb Chicken', 'Black Bean Tacos', 'Pasta Primavera'],
    cost: 45.20,
    store: "Trader Joe's",
    date: '2 days ago',
  },
  {
    id: 2,
    meals: ['Lentil Soup', 'Veggie Stir Fry', 'Quinoa Bowl', 'Egg Fried Rice', 'Greek Salad'],
    cost: 72.80,
    store: 'Safeway',
    date: '1 week ago',
  },
  {
    id: 3,
    meals: ['Chickpea Curry', 'Turkey Wrap', 'Tomato Basil Soup'],
    cost: 38.50,
    store: 'Kroger',
    date: '2 weeks ago',
  },
]

interface Props {
  onSignOut: () => void
  onCreatePlan: () => void
}

export default function DashboardPage({ onSignOut, onCreatePlan }: Props) {
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
          <span className="dash-nav-user">Jane Doe</span>
          <button className="btn-signout" onClick={onSignOut}>Sign out</button>
        </div>
      </nav>

      <div className="dash-hero">
        <h1 className="dash-greeting">Good morning, Jane.</h1>
        <p className="dash-sub">Ready to plan your next week?</p>
        <button className="btn-new-plan" onClick={onCreatePlan}>
          <PlusIcon />
          Create new plan
        </button>
      </div>

      <main className="dash-main">
        <h2 className="dash-section-title">Your meal plans</h2>

        {MOCK_PLANS.length === 0 ? (
          <div className="empty-state">
            <p>No plans yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="plan-grid">
            {MOCK_PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} delay={i * 0.07} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function PlanCard({ plan, delay }: { plan: MealPlan; delay: number }) {
  return (
    <div className="plan-card" style={{ animationDelay: `${delay}s` }}>
      <div className="plan-card-header">
        <span className="plan-cost">${plan.cost.toFixed(2)}</span>
        <span className="plan-date">{plan.date}</span>
      </div>

      <ul className="plan-meals">
        {plan.meals.map(meal => (
          <li key={meal}>{meal}</li>
        ))}
      </ul>

      <div className="plan-card-footer">
        <div className="plan-store">
          <span className="plan-store-dot" />
          {plan.store}
        </div>
        <button className="btn-view-plan">View</button>
      </div>
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
