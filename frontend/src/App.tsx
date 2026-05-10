import { useState } from 'react'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  if (token) {
    // TODO: replace with PreferencesPage once built
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
        <p>Logged in. Preferences page coming soon.</p>
      </div>
    )
  }

  return <AuthPage onSuccess={setToken} />
}
