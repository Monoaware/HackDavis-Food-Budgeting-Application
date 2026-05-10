import PasswordField from './PasswordField'

export default function SignupForm() {
  return (
    <div className="form-panel">
      <div className="form-header">
        <h1 className="form-title">Start saving today.</h1>
        <p className="form-sub">Create your free account.</p>
      </div>

      <form onSubmit={e => e.preventDefault()}>
        <div className="row-2">
          <div className="field">
            <label htmlFor="signup-first">First name</label>
            <input id="signup-first" type="text" placeholder="Jane" autoComplete="given-name" />
          </div>
          <div className="field">
            <label htmlFor="signup-last">Last name</label>
            <input id="signup-last" type="text" placeholder="Smith" autoComplete="family-name" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" placeholder="you@example.com" autoComplete="email" />
        </div>

        <PasswordField id="signup-password" label="Password" autoComplete="new-password" />

        <button type="submit" className="btn-submit">Create account</button>
      </form>
    </div>
  )
}
