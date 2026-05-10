import PasswordField from './PasswordField'

export default function LoginForm() {
  return (
    <div className="form-panel">
      <div className="form-header">
        <h1 className="form-title">Welcome back.</h1>
        <p className="form-sub">Sign in to continue planning.</p>
      </div>

      <form onSubmit={e => e.preventDefault()}>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" placeholder="you@example.com" autoComplete="email" />
        </div>

        <PasswordField id="login-password" label="Password" autoComplete="current-password" />

        <div className="forgot">
          <a href="#">Forgot password?</a>
        </div>

        <button type="submit" className="btn-submit">Sign in</button>
      </form>
    </div>
  )
}
