import { useState } from 'react'
import PasswordField from './PasswordField'

interface Props {
  onSignedUp: () => void
}

export default function SignupForm({ onSignedUp }: Props) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: first, last_name: last, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed.')
      } else {
        onSignedUp()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-panel">
      <div className="form-header">
        <h1 className="form-title">Start saving today.</h1>
        <p className="form-sub">Create your free account.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row-2">
          <div className="field">
            <label htmlFor="signup-first">First name</label>
            <input
              id="signup-first"
              type="text"
              placeholder="Jane"
              autoComplete="given-name"
              value={first}
              onChange={e => setFirst(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="signup-last">Last name</label>
            <input
              id="signup-last"
              type="text"
              placeholder="Smith"
              autoComplete="family-name"
              value={last}
              onChange={e => setLast(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <PasswordField
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
