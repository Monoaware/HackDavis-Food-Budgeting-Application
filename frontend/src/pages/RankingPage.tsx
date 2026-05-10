import { useState } from 'react'
import { type Plan } from './ResultsPage'
import '../styles/results.css'

interface Props {
  plans: Plan[]
  onBack: () => void
  onRank: (query: string) => Promise<void>
}

export default function RankingPage({ plans, onBack, onRank }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onRank(query.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rank plans.')
      setLoading(false)
    }
  }

  return (
    <div>
      <header className="results-header">
        <button className="btn-back" type="button" onClick={onBack}>
          <BackIcon />
          Edit preferences
        </button>
        <span className="results-header-title">Rank your plans</span>
      </header>

      <div className="results-body">
        <p className="results-intro">
          We found {plans.length} plan{plans.length !== 1 ? 's' : ''}. Tell us how you'd like them ranked, or skip to rank by nutrition goals.
        </p>

        <div className="result-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>
            How should we rank these?
          </h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
            e.g. "quickest meals", "most protein", "lowest cost", "highest fiber"
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What matters most to you?"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn-select-plan"
              disabled={loading}
            >
              {loading ? 'Ranking…' : 'Rank plans'}
            </button>
          </form>

          {error && <p className="form-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>Preview of your plans:</p>
          {plans.map((plan, i) => (
            <div key={i} className="result-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Plan {i + 1}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                  ${(plan.suggestedStore?.estimatedCost ?? plan.totalCost ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="result-meals">
                {plan.meals.map(meal => (
                  <div key={meal.id} className="result-meal-row">
                    <span className="result-meal-title">{meal.title}</span>
                    <div className="result-meal-meta">
                      <span>{meal.protein}g protein</span>
                      <span>{meal.prepTime}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
