import { useState } from 'react'
import '../styles/preferences.css'

const INTOLERANCES = ['Dairy', 'Egg', 'Gluten', 'Grain', 'Peanut', 'Seafood', 'Sesame', 'Shellfish', 'Soy', 'Sulfite', 'Tree Nut', 'Wheat']
const DIETS = ['Gluten Free', 'Ketogenic', 'Vegetarian', 'Lacto-Vegetarian', 'Ovo-Vegetarian', 'Vegan', 'Pescetarian', 'Paleo', 'Primal', 'Low FODMAP', 'Whole30']

export interface PlanPreferences {
  numMeals: number
  budget: string
  intolerances: string[]
  diets: string[]
  proteinGoal: string
  fiberGoal: string
}

interface Props {
  onBack: () => void
  onSubmit: (prefs: PlanPreferences) => void
}

export default function PreferencesPage({ onBack, onSubmit }: Props) {
  const [numMeals, setNumMeals] = useState(3)
  const [budget, setBudget] = useState('')
  const [intolerances, setIntolerances] = useState<string[]>([])
  const [diets, setDiets] = useState<string[]>([])
  const [protein, setProtein] = useState('')
  const [fiber, setFiber] = useState('')

  function togglePill(list: string[], item: string, setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ numMeals, budget, intolerances, diets, proteinGoal: protein, fiberGoal: fiber })
  }

  return (
    <div>
      <header className="pref-header">
        <button className="btn-back" type="button" onClick={onBack}>
          <BackIcon />
          Dashboard
        </button>
        <span className="pref-header-title">Create a new plan</span>
      </header>

      <div className="pref-body">
        <form onSubmit={handleSubmit}>

          {/* ── Plan basics ── */}
          <div className="pref-section">
            <h2 className="pref-section-title">Plan basics</h2>
            <p className="pref-section-sub">How many meals and what's your budget for the week?</p>
            <div className="row-2">
              <div className="field">
                <label>Number of meals</label>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setNumMeals(n => Math.max(1, n - 1))}
                  >−</button>
                  <span className="stepper-val">{numMeals}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setNumMeals(n => Math.min(14, n + 1))}
                  >+</button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="budget">Weekly budget</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">$</span>
                  <input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Intolerances ── */}
          <div className="pref-section">
            <h2 className="pref-section-title">Intolerances</h2>
            <p className="pref-section-sub">Select any ingredients to avoid entirely.</p>
            <div className="pill-group">
              {INTOLERANCES.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`pill${intolerances.includes(a) ? ' active' : ''}`}
                  onClick={() => togglePill(intolerances, a, setIntolerances)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dietary restrictions ── */}
          <div className="pref-section">
            <h2 className="pref-section-title">Dietary preferences</h2>
            <p className="pref-section-sub">Filter recipes to match your diet.</p>
            <div className="pill-group">
              {DIETS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`pill${diets.includes(d) ? ' active' : ''}`}
                  onClick={() => togglePill(diets, d, setDiets)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* ── Nutrition goals ── */}
          <div className="pref-section">
            <h2 className="pref-section-title">Nutrition goals <span style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></h2>
            <p className="pref-section-sub">Set daily targets to help rank your meal plans.</p>
            <div className="row-2">
              <div className="field">
                <label htmlFor="protein">Protein (g / day)</label>
                <input
                  id="protein"
                  type="number"
                  min="0"
                  placeholder="e.g. 120"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="fiber">Fiber (g / day)</label>
                <input
                  id="fiber"
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  value={fiber}
                  onChange={e => setFiber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pref-submit-row">
            <button type="submit" className="btn-submit">
              Generate meal plan →
            </button>
          </div>

        </form>
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
