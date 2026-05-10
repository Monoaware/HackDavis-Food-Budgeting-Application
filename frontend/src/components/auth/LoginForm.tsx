import { useState } from 'react'
import PasswordField from './PasswordField'

interface Props {
  onSuccess: (token: string) => void
  successMessage?: string
}

export default function LoginForm({ onSuccess, successMessage }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed.')
      } else {
        localStorage.setItem('token', data.token)
        onSuccess(data.token)
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
        <h1 className="form-title">Welcome back.</h1>
        <p className="form-sub">Sign in to continue planning.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <div className="forgot">
          <a href="#">Forgot password?</a>
        </div>

        {successMessage && <p className="form-success">{successMessage}</p>}
        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
